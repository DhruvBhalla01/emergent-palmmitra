from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import base64
import re
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
import httpx

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="PalmMitra API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ====================== MODELS ======================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str = "email"
    is_premium: bool = False
    created_at: datetime

class PalmAnalysisRequest(BaseModel):
    left_palm_base64: Optional[str] = None
    right_palm_base64: Optional[str] = None
    name: Optional[str] = None
    dob: Optional[str] = None

class PaymentOrderRequest(BaseModel):
    report_id: str
    plan: str  # "insight" | "plus" | "elite" | "match"

class PaymentVerifyRequest(BaseModel):
    report_id: str
    order_id: str
    payment_id: Optional[str] = None
    signature: Optional[str] = None


# ====================== AUTH HELPERS ======================

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(request: Request) -> User:
    # Try session_token cookie first (Emergent Google Auth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                if user_doc:
                    return User(**user_doc)

    # Fallback: Authorization: Bearer <jwt or session_token>
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        # Try session_token first
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                if user_doc:
                    return User(**user_doc)
        # Try JWT
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_doc = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
            if user_doc:
                return User(**user_doc)
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Not authenticated")


# ====================== AUTH ROUTES ======================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "auth_provider": "email",
        "is_premium": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_jwt(user_id)
    return {"token": token, "user": {"user_id": user_id, "email": data.email, "name": data.name, "is_premium": False}}


@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or user.get("auth_provider") != "email":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt(user["user_id"])
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "is_premium": user.get("is_premium", False),
        },
    }


@api_router.post("/auth/session")
async def emergent_session(request: Request, response: Response):
    """Exchange Emergent session_id for a session_token cookie."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    async with httpx.AsyncClient(timeout=15.0) as hx:
        r = await hx.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()

    user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name", ""),
            "picture": data.get("picture"),
            "auth_provider": "google",
            "is_premium": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user.copy())
    else:
        user_id = user["user_id"]

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": data["session_token"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=data["session_token"],
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {
        "user": {
            "user_id": user_id,
            "email": user["email"],
            "name": user.get("name", ""),
            "picture": user.get("picture"),
            "is_premium": user.get("is_premium", False),
        },
        "session_token": data["session_token"],
    }


@api_router.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ====================== PALM ANALYSIS ======================

def _strip_data_url(b64: str) -> str:
    if b64.startswith("data:"):
        m = re.match(r"data:image/[^;]+;base64,(.*)", b64)
        if m:
            return m.group(1)
    return b64


SYSTEM_PROMPT = """You are PalmMitra AI, a premium AI Life Guidance analyst.
You analyze palm images to produce a personalized, insightful, positive-but-honest life guidance report.
Never sound mystical or scammy. Sound like a modern AI assistant with wisdom.
Always return VALID JSON only. No markdown, no code fences, no commentary."""

REPORT_SCHEMA_INSTRUCTIONS = """
Return a JSON object with EXACTLY this schema:
{
  "overall_score": <int 60-98>,
  "headline": "<one-line premium headline about the person>",
  "personality": {"score": <int>, "summary": "<2 sentences>", "traits": ["trait1","trait2","trait3","trait4","trait5"]},
  "career": {"score": <int>, "summary": "<2 sentences>", "ideal_paths": ["path1","path2","path3"], "peak_years": "<age range>"},
  "money": {"score": <int>, "summary": "<2 sentences>", "wealth_potential": "<one line>", "lucky_streams": ["s1","s2","s3"]},
  "love": {"score": <int>, "summary": "<2 sentences>", "love_style": "<one line>", "compatibility": ["type1","type2"]},
  "marriage": {"summary": "<2 sentences>", "likely_age_range": "<range>", "quality": "<one line>"},
  "family": {"summary": "<2 sentences>", "bonds": "<one line>"},
  "health": {"score": <int>, "summary": "<2 sentences>", "watch": ["area1","area2"], "strengths": ["s1","s2"]},
  "strengths": ["s1","s2","s3","s4","s5"],
  "weaknesses": ["w1","w2","w3"],
  "lucky_years": [<int>,<int>,<int>,<int>],
  "challenges": ["c1","c2","c3"],
  "opportunities": ["o1","o2","o3"],
  "hidden_talents": ["t1","t2","t3"],
  "decision_style": "<one paragraph>",
  "leadership": {"score": <int>, "summary": "<one paragraph>"},
  "creativity": {"score": <int>, "summary": "<one paragraph>"},
  "risk_profile": "<one paragraph>",
  "life_timeline": [
    {"age": "20-25", "theme": "<theme>", "detail": "<one line>"},
    {"age": "25-30", "theme": "<theme>", "detail": "<one line>"},
    {"age": "30-35", "theme": "<theme>", "detail": "<one line>"},
    {"age": "35-45", "theme": "<theme>", "detail": "<one line>"},
    {"age": "45-60", "theme": "<theme>", "detail": "<one line>"},
    {"age": "60+", "theme": "<theme>", "detail": "<one line>"}
  ],
  "recommendations": ["r1","r2","r3","r4","r5"],
  "action_plan": [
    {"horizon": "This Week", "action": "<action>"},
    {"horizon": "This Month", "action": "<action>"},
    {"horizon": "This Quarter", "action": "<action>"},
    {"horizon": "This Year", "action": "<action>"}
  ],
  "summary": "<3 sentence premium closing paragraph>"
}
Scores are integers 60-98. Keep language elegant, modern, actionable. Never mention 'palm lines' as mystical; frame everything as AI-derived life pattern insights."""


async def _generate_report(name: str, dob: str, image_b64_list: List[str]) -> Dict[str, Any]:
    session_id = f"palm_{uuid.uuid4().hex[:10]}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("openai", "gpt-5.2")

    intro = f"Person name: {name or 'Anonymous'}. DOB: {dob or 'unknown'}.\n\n"
    prompt = intro + "Analyze the attached palm image(s) and produce the report.\n" + REPORT_SCHEMA_INSTRUCTIONS

    files = [ImageContent(image_base64=b) for b in image_b64_list if b]
    msg = UserMessage(text=prompt, file_contents=files if files else None)

    text = await chat.send_message(msg)

    # Strip code fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # try to extract JSON block
        m = re.search(r"\{[\s\S]*\}", cleaned)
        if m:
            return json.loads(m.group(0))
        raise


@api_router.post("/palm/analyze")
async def analyze_palm(data: PalmAnalysisRequest, user: User = Depends(get_current_user)):
    if not data.left_palm_base64 and not data.right_palm_base64:
        raise HTTPException(status_code=400, detail="At least one palm image required")

    images = []
    if data.left_palm_base64:
        images.append(_strip_data_url(data.left_palm_base64))
    if data.right_palm_base64:
        images.append(_strip_data_url(data.right_palm_base64))

    report_id = f"rpt_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    # Save initial doc
    await db.palm_reports.insert_one({
        "report_id": report_id,
        "user_id": user.user_id,
        "status": "processing",
        "name": data.name,
        "dob": data.dob,
        "created_at": now,
        "unlocked": False,
    })

    try:
        report_json = await _generate_report(data.name or user.name, data.dob or "", images)
    except Exception as e:
        logger.exception("AI generation failed")
        await db.palm_reports.update_one(
            {"report_id": report_id},
            {"$set": {"status": "failed", "error": str(e)}},
        )
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)[:200]}")

    await db.palm_reports.update_one(
        {"report_id": report_id},
        {"$set": {"status": "ready", "report": report_json, "completed_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"report_id": report_id, "status": "ready"}


@api_router.get("/palm/reports")
async def list_reports(user: User = Depends(get_current_user)):
    docs = await db.palm_reports.find(
        {"user_id": user.user_id},
        {"_id": 0, "report.summary": 1, "report.overall_score": 1, "report.headline": 1,
         "report_id": 1, "status": 1, "created_at": 1, "unlocked": 1, "name": 1},
    ).sort("created_at", -1).to_list(100)
    return docs


@api_router.get("/palm/reports/{report_id}")
async def get_report(report_id: str, user: User = Depends(get_current_user)):
    doc = await db.palm_reports.find_one({"report_id": report_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    if not doc.get("unlocked", False) and doc.get("report"):
        # Return only preview scores when locked
        full = doc["report"]
        preview = {
            "overall_score": full.get("overall_score"),
            "headline": full.get("headline"),
            "personality": {"score": full.get("personality", {}).get("score")},
            "career": {"score": full.get("career", {}).get("score")},
            "money": {"score": full.get("money", {}).get("score")},
            "love": {"score": full.get("love", {}).get("score")},
            "health": {"score": full.get("health", {}).get("score")},
            "strengths_preview": (full.get("strengths") or [])[:2],
        }
        doc["report"] = preview
        doc["locked"] = True
    else:
        doc["locked"] = False
    return doc


# ====================== PAYMENT (Razorpay placeholder) ======================

PLAN_PRICES = {
    "insight": {"amount_inr": 29900, "usd": 999, "name": "AI Palm Insight"},   # ₹299
    "match": {"amount_inr": 99900, "usd": 2499, "name": "PalmMatch Compatibility"},  # ₹999
    "plus": {"amount_inr": 39900, "usd": 999, "name": "PalmMitra Plus Monthly"},   # ₹399
    "elite": {"amount_inr": 499900, "usd": 14900, "name": "PalmMitra Elite"},  # ₹4999
}


@api_router.get("/payment/plans")
async def plans():
    return PLAN_PRICES


@api_router.post("/payment/create-order")
async def create_order(data: PaymentOrderRequest, user: User = Depends(get_current_user)):
    plan = PLAN_PRICES.get(data.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    razorpay_key = os.environ.get("RAZORPAY_KEY_ID", "")
    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")

    order_id = f"order_{uuid.uuid4().hex[:14]}"

    # If Razorpay keys not configured, create a mock order.
    mock = not (razorpay_key and razorpay_secret)

    doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        "report_id": data.report_id,
        "plan": data.plan,
        "amount_inr": plan["amount_inr"],
        "status": "created",
        "mock": mock,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_orders.insert_one(doc)

    return {
        "order_id": order_id,
        "amount": plan["amount_inr"],
        "currency": "INR",
        "plan": plan,
        "razorpay_key": razorpay_key or None,
        "mock": mock,
    }


@api_router.post("/payment/verify")
async def verify_payment(data: PaymentVerifyRequest, user: User = Depends(get_current_user)):
    order = await db.payment_orders.find_one({"order_id": data.order_id, "user_id": user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If Razorpay keys are configured, verify signature (placeholder logic).
    # For now, if mock=True or signature provided, mark as paid.
    await db.payment_orders.update_one(
        {"order_id": data.order_id},
        {"$set": {"status": "paid", "payment_id": data.payment_id, "signature": data.signature,
                  "paid_at": datetime.now(timezone.utc).isoformat()}},
    )

    # Unlock report
    await db.palm_reports.update_one(
        {"report_id": data.report_id, "user_id": user.user_id},
        {"$set": {"unlocked": True}},
    )

    # Update user premium status if plus/elite
    if order["plan"] in ("plus", "elite"):
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True}})

    return {"ok": True, "unlocked": True}


# ====================== HEALTH ======================

@api_router.get("/")
async def root():
    return {"service": "PalmMitra API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
