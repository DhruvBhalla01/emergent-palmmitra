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
import hmac
import hashlib
import razorpay

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfgen import canvas as rl_canvas
import io


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


# ====================== APP CONFIG (all monetization is configurable) ======================

DEFAULT_CONFIG = {
    "config_id": "pricing",
    "membership": {"monthly_inr": 399, "yearly_inr": 3499, "yearly_savings_pct": 27},
    "report_price_inr": 299,
    "palmmatch_price_inr": 1999,
    "free_question_limit": 2,
    "member_daily_cap": 5,
    "question_tiers": [
        {"key": "quick", "label": "Quick clarification", "cost_inr": 5},
        {"key": "standard", "label": "Standard personalized advice", "cost_inr": 10},
        {"key": "deep", "label": "Deep reasoning", "cost_inr": 20},
        {"key": "complex", "label": "Complex multi-topic analysis", "cost_inr": 40},
    ],
    "wallet_packs": [
        {"key": "wallet_99", "pay_inr": 99, "credit_inr": 99, "bonus_label": ""},
        {"key": "wallet_199", "pay_inr": 199, "credit_inr": 230, "bonus_label": "+₹31 bonus"},
        {"key": "wallet_499", "pay_inr": 499, "credit_inr": 625, "bonus_label": "+₹126 bonus"},
        {"key": "wallet_999", "pay_inr": 999, "credit_inr": 1350, "bonus_label": "+₹351 bonus"},
    ],
    "promo": {"code": "PALMFRIEND", "discount_pct": 10, "active": True},
}


async def get_config() -> Dict[str, Any]:
    cfg = await db.app_config.find_one({"config_id": "pricing"}, {"_id": 0})
    if not cfg:
        await db.app_config.insert_one(dict(DEFAULT_CONFIG))
        return dict(DEFAULT_CONFIG)
    # backfill any missing keys
    merged = {**DEFAULT_CONFIG, **cfg}
    return merged


def _membership_active(u: Dict[str, Any]) -> bool:
    sub = u.get("subscription") or {}
    if sub.get("status") != "active":
        return False
    if sub.get("plan") not in ("membership", "plus", "elite"):
        return False
    end = sub.get("current_period_end")
    if end:
        try:
            e = datetime.fromisoformat(end)
            if e.tzinfo is None:
                e = e.replace(tzinfo=timezone.utc)
            if e < datetime.now(timezone.utc):
                return False
        except Exception:
            pass
    return True


def _estimate_question(msg: str, tiers: List[Dict[str, Any]]) -> Dict[str, Any]:
    text = (msg or "").lower()
    words = len(text.split())
    keywords = ["career", "job", "work", "money", "wealth", "finance", "invest", "business",
                "love", "marriage", "relationship", "partner", "spouse", "health", "family",
                "child", "future", "decision", "should i", "when will", "start"]
    topics = sum(1 for k in keywords if k in text)
    if words <= 6 and topics <= 1:
        idx, reason = 0, "A quick clarification — short and focused."
    elif topics >= 3 or words > 45:
        idx, reason = 3, "A complex, multi-topic question spanning several areas of your life."
    elif topics == 2 or words > 22:
        idx, reason = 2, "A deep question that needs careful reasoning across your report."
    else:
        idx, reason = 1, "A standard, personalized question about one area of your life."
    idx = min(idx, len(tiers) - 1)
    t = tiers[idx]
    return {"tier_key": t["key"], "label": t["label"], "cost_inr": t["cost_inr"], "reason": reason}


@api_router.get("/config")
async def public_config():
    cfg = await get_config()
    return {
        "membership": cfg["membership"],
        "report_price_inr": cfg["report_price_inr"],
        "palmmatch_price_inr": cfg["palmmatch_price_inr"],
        "free_question_limit": cfg["free_question_limit"],
        "member_daily_cap": cfg["member_daily_cap"],
        "question_tiers": cfg["question_tiers"],
        "wallet_packs": cfg["wallet_packs"],
        "promo": cfg["promo"] if cfg.get("promo", {}).get("active") else None,
    }



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

class PalmMatchRequest(BaseModel):
    palm_a_base64: Optional[str] = None
    palm_b_base64: Optional[str] = None
    name_a: Optional[str] = None
    name_b: Optional[str] = None
    relationship: Optional[str] = None  # couple | friends | family | business

class PaymentOrderRequest(BaseModel):
    report_id: Optional[str] = ""
    plan: str  # insight | membership_monthly | membership_yearly | match | wallet_* | plus | elite

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

async def _issue_session_cookie(user_id: str, response: Response) -> str:
    """Create a session_token, store it, and set httpOnly secure cookie."""
    session_token = f"pm_sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return session_token


@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    ref_code = f"PM{uuid.uuid4().hex[:6].upper()}"
    doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "auth_provider": "email",
        "is_premium": False,
        "referral_code": ref_code,
        "referral_credits_inr": 0,
        "referred_by": None,
        "subscription": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    await _issue_session_cookie(user_id, response)
    return {"user": {"user_id": user_id, "email": data.email, "name": data.name, "is_premium": False}}


@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or user.get("auth_provider") != "email":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await _issue_session_cookie(user["user_id"], response)
    return {
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
            "referral_code": f"PM{uuid.uuid4().hex[:6].upper()}",
            "referral_credits_inr": 0,
            "referred_by": None,
            "subscription": None,
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
        # Free-preview model: 2 full sections free (personality + love), rest gated
        full = doc["report"]
        preview = {
            "overall_score": full.get("overall_score"),
            "headline": full.get("headline"),
            "summary": full.get("summary"),
            "personality": full.get("personality"),
            "love": full.get("love"),
            "career": {"score": full.get("career", {}).get("score")},
            "money": {"score": full.get("money", {}).get("score")},
            "health": {"score": full.get("health", {}).get("score")},
            "leadership": {"score": full.get("leadership", {}).get("score")},
            "strengths_preview": (full.get("strengths") or [])[:2],
        }
        doc["report"] = preview
        doc["locked"] = True
        doc["free_sections"] = ["personality", "love"]
    else:
        doc["locked"] = False
    return doc


# ====================== PALMMATCH (Compatibility) ======================

PALMMATCH_SYSTEM_PROMPT = """You are PalmMitra AI, a premium AI compatibility analyst.
You analyze TWO palm images to produce a personalized, insightful compatibility report between two people.
Draw on Hasta Samudrika Shastra principles, framed through a modern, warm, non-mystical lens.
Be honest and specific, never generic. Always return VALID JSON only. No markdown, no code fences, no commentary."""

PALMMATCH_SCHEMA_INSTRUCTIONS = """
Return a JSON object with EXACTLY this schema:
{
  "headline": "<one-line premium headline about this pairing>",
  "overall_compat": <int 60-98>,
  "verdict": "<one short line, e.g. 'Soulmate Connection' or 'Grounded, growth-oriented match'>",
  "summary": "<3 sentence premium overview of the connection>",
  "categories": [
    {"name": "Emotional Bond", "score": <int 60-98>, "detail": "<2 sentences>"},
    {"name": "Communication", "score": <int 60-98>, "detail": "<2 sentences>"},
    {"name": "Romance & Passion", "score": <int 60-98>, "detail": "<2 sentences>"},
    {"name": "Life Goals", "score": <int 60-98>, "detail": "<2 sentences>"},
    {"name": "Spiritual Alignment", "score": <int 60-98>, "detail": "<2 sentences>"},
    {"name": "Long-term Harmony", "score": <int 60-98>, "detail": "<2 sentences>"}
  ],
  "strengths": ["<s1>", "<s2>", "<s3>"],
  "watch_outs": ["<w1>", "<w2>", "<w3>"],
  "remedies": ["<r1>", "<r2>", "<r3>"],
  "closing": "<2 sentence warm closing about the pair's potential>"
}
Scores are integers 60-98. Palm A is the first image, Palm B is the second. Keep language elegant, modern, warm and actionable."""


async def _generate_palmmatch(name_a: str, name_b: str, relationship: str, images: List[str]) -> Dict[str, Any]:
    session_id = f"match_{uuid.uuid4().hex[:10]}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=PALMMATCH_SYSTEM_PROMPT,
    ).with_model("openai", "gpt-5.2")

    intro = (
        f"Partner A: {name_a or 'Person A'}. Partner B: {name_b or 'Person B'}. "
        f"Relationship type: {relationship or 'couple'}.\n\n"
        "The FIRST image is Partner A's palm, the SECOND image is Partner B's palm.\n"
    )
    prompt = intro + "Analyze both palms and produce the compatibility report.\n" + PALMMATCH_SCHEMA_INSTRUCTIONS

    files = [ImageContent(image_base64=b) for b in images if b]
    msg = UserMessage(text=prompt, file_contents=files if files else None)
    text = await chat.send_message(msg)

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", cleaned)
        if m:
            return json.loads(m.group(0))
        raise


@api_router.post("/palmmatch/analyze")
async def analyze_palmmatch(data: PalmMatchRequest, user: User = Depends(get_current_user)):
    if not data.palm_a_base64 or not data.palm_b_base64:
        raise HTTPException(status_code=400, detail="Both palm images are required")

    images = [_strip_data_url(data.palm_a_base64), _strip_data_url(data.palm_b_base64)]
    match_id = f"mtc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    await db.palmmatch_reports.insert_one({
        "match_id": match_id,
        "user_id": user.user_id,
        "status": "processing",
        "name_a": data.name_a,
        "name_b": data.name_b,
        "relationship": data.relationship or "couple",
        "created_at": now,
        "unlocked": False,
    })

    try:
        report_json = await _generate_palmmatch(data.name_a or "Person A", data.name_b or "Person B", data.relationship or "couple", images)
    except Exception as e:
        logger.exception("PalmMatch generation failed")
        await db.palmmatch_reports.update_one({"match_id": match_id}, {"$set": {"status": "failed", "error": str(e)}})
        raise HTTPException(status_code=500, detail=f"Compatibility analysis failed: {str(e)[:200]}")

    await db.palmmatch_reports.update_one(
        {"match_id": match_id},
        {"$set": {"status": "ready", "report": report_json, "completed_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"match_id": match_id, "status": "ready"}


@api_router.get("/palmmatch/list")
async def list_palmmatch(user: User = Depends(get_current_user)):
    docs = await db.palmmatch_reports.find(
        {"user_id": user.user_id},
        {"_id": 0, "report.overall_compat": 1, "report.headline": 1, "report.verdict": 1,
         "match_id": 1, "status": 1, "created_at": 1, "unlocked": 1, "name_a": 1, "name_b": 1},
    ).sort("created_at", -1).to_list(100)
    return docs


@api_router.get("/palmmatch/{match_id}")
async def get_palmmatch(match_id: str, user: User = Depends(get_current_user)):
    doc = await db.palmmatch_reports.find_one({"match_id": match_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Match report not found")

    if not doc.get("unlocked", False) and doc.get("report"):
        # Free-preview: overall + first 2 categories full, rest gated
        full = doc["report"]
        cats = full.get("categories", []) or []
        preview_cats = []
        for i, c in enumerate(cats):
            if i < 2:
                preview_cats.append(c)
            else:
                preview_cats.append({"name": c.get("name"), "score": c.get("score")})
        preview = {
            "headline": full.get("headline"),
            "overall_compat": full.get("overall_compat"),
            "verdict": full.get("verdict"),
            "summary": full.get("summary"),
            "categories": preview_cats,
        }
        doc["report"] = preview
        doc["locked"] = True
        doc["free_sections"] = 2
    else:
        doc["locked"] = False
    return doc


# ====================== PAYMENT (Razorpay placeholder) ======================

@api_router.get("/payment/plans")
async def plans():
    cfg = await get_config()
    m = cfg["membership"]
    return {
        "insight": {"amount_inr": cfg["report_price_inr"] * 100, "name": "AI Palm Report"},
        "membership_monthly": {"amount_inr": m["monthly_inr"] * 100, "name": "PalmMitra Membership · Monthly"},
        "membership_yearly": {"amount_inr": m["yearly_inr"] * 100, "name": "PalmMitra Membership · Yearly"},
        "match": {"amount_inr": cfg["palmmatch_price_inr"] * 100, "name": "PalmMatch Compatibility"},
    }


async def _resolve_plan(plan_key: str) -> Optional[Dict[str, Any]]:
    cfg = await get_config()
    m = cfg["membership"]
    if plan_key == "insight":
        return {"amount_inr": cfg["report_price_inr"] * 100, "name": "AI Palm Report"}
    if plan_key == "membership_monthly":
        return {"amount_inr": m["monthly_inr"] * 100, "name": "PalmMitra Membership · Monthly"}
    if plan_key == "membership_yearly":
        return {"amount_inr": m["yearly_inr"] * 100, "name": "PalmMitra Membership · Yearly"}
    if plan_key == "match":
        return {"amount_inr": cfg["palmmatch_price_inr"] * 100, "name": "PalmMatch Compatibility"}
    if plan_key.startswith("wallet_"):
        for p in cfg["wallet_packs"]:
            if p["key"] == plan_key:
                return {"amount_inr": p["pay_inr"] * 100, "name": f"Wallet recharge ₹{p['pay_inr']}", "credit_inr": p["credit_inr"]}
    # legacy
    if plan_key in ("plus", "elite"):
        return {"amount_inr": (m["monthly_inr"] if plan_key == "plus" else cfg["palmmatch_price_inr"]) * 100, "name": plan_key}
    return None


@api_router.post("/payment/create-order")
async def create_order(data: PaymentOrderRequest, user: User = Depends(get_current_user)):
    plan = await _resolve_plan(data.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    razorpay_key = os.environ.get("RAZORPAY_KEY_ID", "")
    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")

    mock = not (razorpay_key and razorpay_secret)
    razorpay_order_id = None

    if not mock:
        try:
            rzp_client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
            rzp_order = rzp_client.order.create({
                "amount": plan["amount_inr"],
                "currency": "INR",
                "receipt": f"pm_{(data.report_id or 'na')[-16:]}",
                "notes": {"user_id": user.user_id, "plan": data.plan, "report_id": data.report_id or ""},
            })
            razorpay_order_id = rzp_order["id"]
        except Exception as e:
            logger.exception("Razorpay order creation failed")
            raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)[:200]}")
        order_id = razorpay_order_id
    else:
        order_id = f"order_{uuid.uuid4().hex[:14]}"

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

    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not order.get("mock") and razorpay_secret:
        if not (data.payment_id and data.signature):
            raise HTTPException(status_code=400, detail="Missing payment_id or signature")
        expected = hmac.new(
            razorpay_secret.encode(),
            f"{data.order_id}|{data.payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, data.signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

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
    # Unlock PalmMatch report (match plan uses match_id as report_id)
    if order.get("plan") == "match":
        await db.palmmatch_reports.update_one(
            {"match_id": data.report_id, "user_id": user.user_id},
            {"$set": {"unlocked": True}},
        )

    # Subscription lifecycle
    now = datetime.now(timezone.utc)
    plan_key = order["plan"]
    if plan_key in ("membership_monthly", "plus"):
        sub = {"plan": "membership", "billing": "monthly", "status": "active",
               "started_at": now.isoformat(), "current_period_end": (now + timedelta(days=30)).isoformat(), "canceled_at": None}
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True, "subscription": sub}})
    elif plan_key == "membership_yearly":
        sub = {"plan": "membership", "billing": "yearly", "status": "active",
               "started_at": now.isoformat(), "current_period_end": (now + timedelta(days=365)).isoformat(), "canceled_at": None}
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True, "subscription": sub}})
    elif plan_key == "elite":
        sub = {"plan": "elite", "status": "active", "started_at": now.isoformat(), "current_period_end": None, "canceled_at": None}
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": True, "subscription": sub}})
    elif plan_key.startswith("wallet_"):
        resolved = await _resolve_plan(plan_key)
        credit = (resolved or {}).get("credit_inr", 0)
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"wallet_balance_inr": credit}})
        await db.wallet_transactions.insert_one({
            "user_id": user.user_id, "type": "recharge", "amount_inr": credit,
            "pay_inr": order["amount_inr"] // 100, "order_id": data.order_id,
            "created_at": now.isoformat(),
        })

    # Referral credit for referrer on first paid order of the referred user
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if user_doc and user_doc.get("referred_by"):
        prior_paid = await db.payment_orders.count_documents({"user_id": user.user_id, "status": "paid"})
        if prior_paid <= 1:  # this order is the first paid one
            await db.users.update_one(
                {"user_id": user_doc["referred_by"]},
                {"$inc": {"referral_credits_inr": 100}},
            )

    return {"ok": True, "unlocked": True}


# ====================== COUPONS ======================

class CouponValidateRequest(BaseModel):
    code: str
    plan: str


class CouponCreateRequest(BaseModel):
    code: str
    discount_inr: int = 0
    discount_pct: int = 0
    max_uses: int = 100
    active: bool = True


@api_router.post("/coupon/validate")
async def coupon_validate(data: CouponValidateRequest, user: User = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"code": data.code.strip().upper()}, {"_id": 0})
    if not coupon or not coupon.get("active"):
        raise HTTPException(status_code=404, detail="Invalid coupon")
    if coupon.get("used_count", 0) >= coupon.get("max_uses", 0):
        raise HTTPException(status_code=400, detail="Coupon exhausted")
    plan_info = await _resolve_plan(data.plan)
    if not plan_info:
        raise HTTPException(status_code=400, detail="Invalid plan")
    base = plan_info["amount_inr"]
    off = coupon.get("discount_inr", 0) + int(base * (coupon.get("discount_pct", 0) / 100))
    final = max(0, base - off)
    return {"code": coupon["code"], "discount_inr": off, "final_amount_inr": final, "base_amount_inr": base}


# ====================== ANALYTICS ======================

class EventRequest(BaseModel):
    type: str
    meta: Optional[Dict[str, Any]] = None


@api_router.post("/analytics/event")
async def track_event(data: EventRequest, request: Request):
    user_id = None
    try:
        u = await get_current_user(request)
        user_id = u.user_id
    except Exception:
        pass
    await db.events.insert_one({
        "user_id": user_id, "type": data.type, "meta": data.meta or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


# ====================== DAILY / WEEKLY GUIDANCE ======================

@api_router.get("/guidance/{cadence}")
async def guidance(cadence: str, user: User = Depends(get_current_user)):
    if cadence not in ("daily", "weekly"):
        raise HTTPException(status_code=400, detail="Invalid cadence")
    u = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not u.get("is_premium"):
        raise HTTPException(status_code=402, detail="PalmMitra Plus required")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    period = today if cadence == "daily" else datetime.now(timezone.utc).strftime("%Y-W%V")
    cached = await db.guidance_cache.find_one({"user_id": user.user_id, "cadence": cadence, "period": period}, {"_id": 0})
    if cached:
        return cached["payload"]

    latest = await db.palm_reports.find_one(
        {"user_id": user.user_id, "status": "ready", "unlocked": True},
        {"_id": 0}, sort=[("created_at", -1)],
    )
    if not latest:
        raise HTTPException(status_code=400, detail="Unlock a report first to receive guidance")

    prompt = (
        f"Return JSON with keys theme (2-4 words), focus (1 sentence), do (array of 3 short actions), avoid (array of 2 short items), affirmation (1 sentence). "
        f"Personalize this {cadence} guidance for the user based on their report. Period: {period}. "
        f"Report: {json.dumps(latest.get('report', {}))[:4000]}"
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"guide_{user.user_id}_{period}", system_message="Return only JSON. No markdown.").with_model("openai", "gpt-5.2")
    text = await chat.send_message(UserMessage(text=prompt))
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    m = re.search(r"\{[\s\S]*\}", cleaned)
    payload = json.loads(m.group(0) if m else cleaned)
    await db.guidance_cache.insert_one({
        "user_id": user.user_id, "cadence": cadence, "period": period,
        "payload": payload, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return payload


# ====================== BLOG ======================

BLOG_POSTS = [
    {"slug": "science-behind-ai-palm-reading", "title": "The Science Behind AI Palm Reading",
     "excerpt": "How computer vision and large language models turn palm patterns into modern life guidance.",
     "content": "For centuries palmistry lived in the mystical fringe. PalmMitra brings it into the age of AI.\n\n## How our engine works\nWe process each image through vision transformers to detect anatomical patterns: line curvature, mounts, phalange proportions, finger relationships. These features are then correlated with millions of behavioural signals in our language model to synthesize a modern life profile.\n\n## Why this differs from horoscopes\nHoroscopes cluster billions of people into 12 zodiac buckets. PalmMitra generates guidance uniquely from your hand — no shortcuts.\n\n## Privacy first\nYour images are analyzed and never sold. Delete them anytime.",
     "cover": "https://images.pexels.com/photos/21031387/pexels-photo-21031387.jpeg",
     "date": "2026-01-15"},
    {"slug": "5-decisions-your-palm-can-clarify", "title": "5 Decisions Your Palm Can Clarify",
     "excerpt": "From career pivots to relationship timing — how a modern palm profile helps you decide.",
     "content": "Every decision fits a pattern. Here are five moments where PalmMitra earns its keep.\n\n1. Career pivots — When your risk profile and creativity scores align, big moves are lower-risk than they feel.\n2. Relationship timing — Your compatibility and love-style profile reveal what you actually need.\n3. Money bets — Wealth potential + decision style flag when to invest and when to wait.\n4. Health resets — Your health tendencies suggest which habits pay compounding returns.\n5. Creative launches — Peak creativity years are real. Use them.",
     "cover": "https://images.pexels.com/photos/31650383/pexels-photo-31650383.jpeg",
     "date": "2026-01-22"},
    {"slug": "premium-guidance-vs-astrology-apps", "title": "Why Premium Guidance Beats Free Astrology Apps",
     "excerpt": "The hidden cost of \"free\" — and what elegant, paid AI guidance really delivers.",
     "content": "Free apps monetize your attention with ads. Premium guidance is designed to make you close the app and act.\n\n## The attention economy problem\nFree apps must maximize daily opens. Their incentives are misaligned with your growth.\n\n## Premium is aligned\nPalmMitra earns your money once, not your attention forever. That single shift changes everything.",
     "cover": "https://images.pexels.com/photos/21031387/pexels-photo-21031387.jpeg",
     "date": "2026-02-01"},
]


@api_router.get("/blog/posts")
async def blog_list():
    return [{k: v for k, v in p.items() if k != "content"} for p in BLOG_POSTS]


@api_router.get("/blog/posts/{slug}")
async def blog_post(slug: str):
    post = next((p for p in BLOG_POSTS if p["slug"] == slug), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ====================== ADMIN ======================

def _is_admin(email: str) -> bool:
    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    return email.lower() in admin_emails


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not _is_admin(user.email):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@api_router.get("/admin/stats")
async def admin_stats(user: User = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    premium_count = await db.users.count_documents({"is_premium": True})
    reports_count = await db.palm_reports.count_documents({})
    unlocked_count = await db.palm_reports.count_documents({"unlocked": True})
    orders = await db.payment_orders.find({"status": "paid"}, {"_id": 0, "amount_inr": 1}).to_list(10000)
    revenue = sum(o.get("amount_inr", 0) for o in orders) / 100
    return {
        "users": users_count, "premium_users": premium_count,
        "reports": reports_count, "unlocked_reports": unlocked_count,
        "paid_orders": len(orders), "revenue_inr": revenue,
    }


@api_router.get("/admin/config")
async def admin_get_config(user: User = Depends(require_admin)):
    return await get_config()


class ConfigUpdateRequest(BaseModel):
    config: Dict[str, Any]


@api_router.put("/admin/config")
async def admin_update_config(data: ConfigUpdateRequest, user: User = Depends(require_admin)):
    payload = {**data.config, "config_id": "pricing"}
    await db.app_config.update_one({"config_id": "pricing"}, {"$set": payload}, upsert=True)
    return await get_config()



@api_router.get("/admin/users")
async def admin_users(user: User = Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(100).to_list(100)


@api_router.get("/admin/coupons")
async def admin_list_coupons(user: User = Depends(require_admin)):
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.post("/admin/coupons")
async def admin_create_coupon(data: CouponCreateRequest, user: User = Depends(require_admin)):
    code = data.code.strip().upper()
    existing = await db.coupons.find_one({"code": code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Code exists")
    doc = {
        "code": code, "discount_inr": data.discount_inr, "discount_pct": data.discount_pct,
        "max_uses": data.max_uses, "used_count": 0, "active": data.active,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/coupons/{code}")
async def admin_delete_coupon(code: str, user: User = Depends(require_admin)):
    await db.coupons.delete_one({"code": code.upper()})
    return {"ok": True}


@api_router.get("/admin/funnel")
async def admin_funnel(user: User = Depends(require_admin)):
    pipeline = [{"$group": {"_id": "$type", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    events = await db.events.aggregate(pipeline).to_list(100)
    return [{"type": e["_id"], "count": e["count"]} for e in events]




# ====================== PDF EXPORT ======================

def _build_pdf(report: Dict[str, Any], name: str, generated_on: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2.2*cm, rightMargin=2.2*cm, topMargin=2.5*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    GOLD = HexColor("#D4AF37")

    def _p(text, size=10, color=black, leading=None, space=6, bold=False):
        style = ParagraphStyle(
            f"p{size}{bold}",
            fontName="Helvetica-Bold" if bold else "Helvetica",
            fontSize=size,
            leading=leading or size + 3,
            textColor=color,
            spaceAfter=space,
        )
        return Paragraph(text, style)

    story = []

    # COVER
    def cover(canv, docx):
        canv.saveState()
        canv.setFillColor(HexColor("#000000"))
        canv.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canv.setFillColor(GOLD)
        canv.setFont("Helvetica-Bold", 10)
        canv.drawString(2.2*cm, A4[1] - 2*cm, "PALMMITRA")
        canv.setFillColor(white)
        canv.setFont("Helvetica-Bold", 36)
        canv.drawString(2.2*cm, A4[1] - 8*cm, "Your AI Life")
        canv.drawString(2.2*cm, A4[1] - 9.6*cm, "Guidance Report")
        canv.setFillColor(GOLD)
        canv.setFont("Helvetica", 12)
        canv.drawString(2.2*cm, A4[1] - 11.5*cm, f"For {name}")
        canv.setFillColor(HexColor("#888888"))
        canv.setFont("Helvetica", 9)
        canv.drawString(2.2*cm, 2*cm, f"Generated {generated_on}  ·  palmmitra.ai")
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(0.6)
        canv.line(2.2*cm, A4[1] - 12.5*cm, 8*cm, A4[1] - 12.5*cm)
        canv.restoreState()

    story.append(Spacer(1, 0.5*cm))
    story.append(PageBreak())

    # Content pages
    story.append(_p("YOUR PALMMITRA REPORT", 8, GOLD, space=4, bold=True))
    story.append(_p(report.get("headline", ""), 20, black, leading=24, space=16, bold=True))
    story.append(_p(f"Overall Score: <b>{report.get('overall_score', '—')}/100</b>", 12, GOLD, space=18))
    story.append(_p(report.get("summary", ""), 11, HexColor("#333333"), leading=16, space=20))

    def _section(title, body):
        story.append(_p(title.upper(), 8, GOLD, space=4, bold=True))
        story.append(_p(body, 11, HexColor("#222222"), leading=15, space=14))

    def _bullets(items):
        for it in items or []:
            story.append(_p(f"•  {it}", 10, HexColor("#333333"), leading=14, space=3))
        story.append(Spacer(1, 8))

    for key, label in [("personality", "Personality"), ("career", "Career"), ("money", "Wealth"),
                        ("love", "Love"), ("marriage", "Marriage"), ("family", "Family"), ("health", "Health")]:
        sec = report.get(key, {}) or {}
        if sec.get("summary"):
            score = sec.get("score")
            title = f"{label}" + (f"  ·  {score}/100" if score is not None else "")
            _section(title, sec["summary"])

    story.append(_p("STRENGTHS", 8, GOLD, space=4, bold=True))
    _bullets(report.get("strengths"))
    story.append(_p("HIDDEN TALENTS", 8, GOLD, space=4, bold=True))
    _bullets(report.get("hidden_talents"))
    story.append(_p("OPPORTUNITIES", 8, GOLD, space=4, bold=True))
    _bullets(report.get("opportunities"))
    story.append(_p("LUCKY YEARS", 8, GOLD, space=4, bold=True))
    story.append(_p("  ".join(str(y) for y in report.get("lucky_years") or []), 14, GOLD, space=14, bold=True))

    # Timeline
    story.append(_p("LIFE TIMELINE", 8, GOLD, space=4, bold=True))
    for t in report.get("life_timeline") or []:
        story.append(_p(f"<b>{t.get('age', '')}</b> — {t.get('theme', '')}: {t.get('detail', '')}", 10, HexColor("#333333"), leading=14, space=5))

    story.append(Spacer(1, 10))
    story.append(_p("RECOMMENDATIONS", 8, GOLD, space=4, bold=True))
    _bullets(report.get("recommendations"))

    story.append(_p("ACTION PLAN", 8, GOLD, space=4, bold=True))
    for a in report.get("action_plan") or []:
        story.append(_p(f"<b>{a.get('horizon', '')}:</b> {a.get('action', '')}", 10, HexColor("#333333"), leading=14, space=5))

    story.append(Spacer(1, 20))
    story.append(_p("© PalmMitra — AI Life Guidance. This report is generated by artificial intelligence and intended as guidance, not fate.",
                    8, HexColor("#888888")))

    doc.build(story, onFirstPage=cover, onLaterPages=lambda c, d: None)
    return buf.getvalue()


@api_router.get("/palm/reports/{report_id}/pdf")
async def report_pdf(report_id: str, user: User = Depends(get_current_user)):
    doc = await db.palm_reports.find_one({"report_id": report_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    if not doc.get("unlocked"):
        raise HTTPException(status_code=402, detail="Unlock report to download PDF")

    pdf_bytes = _build_pdf(doc["report"], doc.get("name") or user.name, doc.get("created_at", "")[:10])
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=palmmitra-{report_id}.pdf"},
    )


# ====================== AI CHAT ======================

class ChatMessageRequest(BaseModel):
    message: str
    confirm: bool = False


async def _chat_context(user_id: str):
    cfg = await get_config()
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0}) or {}
    return cfg, u, _membership_active(u), cfg["free_question_limit"], u.get("free_questions_used", 0), u.get("wallet_balance_inr", 0)


async def _member_questions_today(user_id: str) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await db.chat_messages.count_documents({"user_id": user_id, "role": "user", "created_at": {"$gte": today}})


@api_router.get("/wallet")
async def get_wallet(user: User = Depends(get_current_user)):
    cfg, u, member, free_limit, free_used, balance = await _chat_context(user.user_id)
    txns = await db.wallet_transactions.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {
        "balance_inr": balance,
        "free_remaining": max(0, free_limit - free_used),
        "member": member,
        "member_daily_cap": cfg["member_daily_cap"],
        "wallet_packs": cfg["wallet_packs"],
        "question_tiers": cfg["question_tiers"],
        "transactions": txns,
    }


@api_router.get("/chat/{report_id}/messages")
async def list_chat(report_id: str, user: User = Depends(get_current_user)):
    doc = await db.palm_reports.find_one({"report_id": report_id, "user_id": user.user_id}, {"_id": 0, "unlocked": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    msgs = await db.chat_messages.find(
        {"report_id": report_id, "user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    cfg, u, member, free_limit, free_used, balance = await _chat_context(user.user_id)
    return {
        "unlocked": doc.get("unlocked", False), "messages": msgs,
        "member": member, "balance_inr": balance, "free_remaining": max(0, free_limit - free_used),
    }


@api_router.post("/chat/{report_id}/estimate")
async def estimate_chat(report_id: str, data: ChatMessageRequest, user: User = Depends(get_current_user)):
    cfg, u, member, free_limit, free_used, balance = await _chat_context(user.user_id)
    est = _estimate_question(data.message, cfg["question_tiers"])
    if member:
        cnt = await _member_questions_today(user.user_id)
        mode = "member_capped" if cnt >= cfg["member_daily_cap"] else "member"
        return {"mode": mode, "estimate": est, "balance_inr": balance, "member": True, "free_remaining": 0}
    if free_used < free_limit:
        return {"mode": "free", "estimate": est, "balance_inr": balance, "member": False, "free_remaining": free_limit - free_used}
    return {"mode": "paid", "estimate": est, "balance_inr": balance, "member": False,
            "free_remaining": 0, "need_recharge": balance < est["cost_inr"]}


async def _generate_chat_reply(report_id: str, report: Dict[str, Any], user: User) -> str:
    history = await db.chat_messages.find(
        {"report_id": report_id, "user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    sys_msg = (
        "You are PalmMitra, a warm and precise personal AI life mentor. "
        "You have exclusive, permanent memory of this user's personalized palm-derived life report (JSON below) "
        "and your entire past conversation. Never ask them to re-explain themselves. "
        "Answer grounded in their report and history. Be modern, kind, direct. Never mystical. "
        "Keep replies concise (2-6 sentences) unless asked for depth.\n\n"
        f"USER REPORT:\n{json.dumps(report.get('report', {}))[:6000]}"
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"chat_{report_id}", system_message=sys_msg).with_model("openai", "gpt-5.2")
    convo = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-12:]])
    return await chat.send_message(UserMessage(text=f"Conversation so far:\n{convo}\n\nRespond as ASSISTANT to the latest USER message."))


@api_router.post("/chat/{report_id}/message")
async def send_chat(report_id: str, data: ChatMessageRequest, user: User = Depends(get_current_user)):
    report = await db.palm_reports.find_one({"report_id": report_id, "user_id": user.user_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if not report.get("unlocked"):
        raise HTTPException(status_code=402, detail="Unlock report to chat")

    cfg, u, member, free_limit, free_used, balance = await _chat_context(user.user_id)
    est = _estimate_question(data.message, cfg["question_tiers"])
    charged = 0
    billing_mode = None

    if member:
        cnt = await _member_questions_today(user.user_id)
        if cnt >= cfg["member_daily_cap"]:
            raise HTTPException(status_code=429, detail={"error": "fair_usage", "cap": cfg["member_daily_cap"]})
        billing_mode = "member"
    elif free_used < free_limit:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"free_questions_used": 1}})
        free_used += 1
        billing_mode = "free"
    else:
        cost = est["cost_inr"]
        if balance < cost:
            raise HTTPException(status_code=402, detail={"error": "insufficient_balance", "cost_inr": cost, "balance_inr": balance, "estimate": est})
        if not data.confirm:
            raise HTTPException(status_code=402, detail={"error": "confirmation_required", "estimate": est, "balance_inr": balance})
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"wallet_balance_inr": -cost}})
        await db.wallet_transactions.insert_one({
            "user_id": user.user_id, "type": "spend", "amount_inr": -cost,
            "reason": est["label"], "created_at": datetime.now(timezone.utc).isoformat(),
        })
        charged = cost
        balance -= cost
        billing_mode = "paid"

    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_one({
        "report_id": report_id, "user_id": user.user_id,
        "role": "user", "content": data.message, "created_at": now,
    })
    reply = await _generate_chat_reply(report_id, report, user)
    await db.chat_messages.insert_one({
        "report_id": report_id, "user_id": user.user_id,
        "role": "assistant", "content": reply, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "reply": reply, "charged_inr": charged, "balance_inr": balance,
        "free_remaining": max(0, free_limit - free_used), "billing_mode": billing_mode, "member": member,
    }


# ====================== REFERRALS ======================

class ReferralApplyRequest(BaseModel):
    code: str


@api_router.get("/referral/me")
async def my_referral(user: User = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not u.get("referral_code"):
        code = f"PM{uuid.uuid4().hex[:6].upper()}"
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"referral_code": code}})
        u["referral_code"] = code
    count = await db.users.count_documents({"referred_by": user.user_id})
    return {
        "code": u["referral_code"],
        "credits_inr": u.get("referral_credits_inr", 0),
        "referred_count": count,
    }


@api_router.post("/referral/apply")
async def apply_referral(data: ReferralApplyRequest, user: User = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if u.get("referred_by"):
        raise HTTPException(status_code=400, detail="Referral already applied")
    if u.get("referral_code") == data.code.strip().upper():
        raise HTTPException(status_code=400, detail="Cannot use your own code")
    ref = await db.users.find_one({"referral_code": data.code.strip().upper()}, {"_id": 0})
    if not ref:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"referred_by": ref["user_id"]}})
    return {"ok": True, "discount_inr": 100, "message": "₹100 discount will be applied at checkout"}


# ====================== SUBSCRIPTION ======================

@api_router.get("/subscription/status")
async def subscription_status(user: User = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    sub = u.get("subscription")
    if sub and sub.get("current_period_end"):
        try:
            end = datetime.fromisoformat(sub["current_period_end"])
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if end < datetime.now(timezone.utc) and sub.get("plan") == "plus":
                sub["status"] = "expired"
                await db.users.update_one({"user_id": user.user_id}, {"$set": {"subscription.status": "expired", "is_premium": False}})
        except Exception:
            pass
    return {"is_premium": u.get("is_premium", False), "subscription": sub}


@api_router.post("/subscription/cancel")
async def cancel_subscription(user: User = Depends(get_current_user)):
    u = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    sub = u.get("subscription")
    if not sub or sub.get("status") != "active":
        raise HTTPException(status_code=400, detail="No active subscription")
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription.status": "canceled", "subscription.canceled_at": now}},
    )
    return {"ok": True, "message": "Subscription canceled. Access continues until period end."}


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
