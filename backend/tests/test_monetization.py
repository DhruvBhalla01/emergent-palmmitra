"""Backend tests for PalmMitra monetization overhaul (config, wallet, chat pricing, admin config)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://ai-life-coach-beta.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")

DEMO_EMAIL = "demo@palmmitra.com"
DEMO_PASSWORD = "demo1234"
REPORT_ID = "rpt_efc49a2be09c"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# ---------- Public config ----------
def test_public_config_shape():
    r = requests.get(f"{BASE_URL}/api/config", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["membership"]["monthly_inr"] == 399
    assert d["membership"]["yearly_inr"] == 3499
    assert d["report_price_inr"] == 299
    assert d["palmmatch_price_inr"] == 1999
    assert d["free_question_limit"] == 2
    assert d["member_daily_cap"] == 5
    assert len(d["question_tiers"]) == 4
    assert len(d["wallet_packs"]) == 4


# ---------- Wallet ----------
def test_wallet_endpoint(session):
    r = session.get(f"{BASE_URL}/api/wallet", timeout=15)
    assert r.status_code == 200
    d = r.json()
    for k in ("balance_inr", "free_remaining", "member", "wallet_packs", "question_tiers"):
        assert k in d
    assert d["member"] is False
    assert len(d["wallet_packs"]) == 4
    assert len(d["question_tiers"]) == 4


# ---------- Estimate ----------
def test_estimate_short_returns_quick(session):
    r = session.post(f"{BASE_URL}/api/chat/{REPORT_ID}/estimate", json={"message": "When?"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["estimate"]["tier_key"] == "quick"
    assert d["estimate"]["cost_inr"] == 5


def test_estimate_complex_returns_complex(session):
    long_msg = (
        "I want deep guidance on my career pivot into a new job, my money and finance investments, "
        "my marriage and relationship with my spouse, and my long-term health and family future — "
        "please analyse all these together across my report."
    )
    r = session.post(f"{BASE_URL}/api/chat/{REPORT_ID}/estimate", json={"message": long_msg}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["estimate"]["tier_key"] == "complex"
    assert d["estimate"]["cost_inr"] == 40


# ---------- Admin config ----------
def test_admin_get_and_put_config(session):
    r = session.get(f"{BASE_URL}/api/admin/config", timeout=15)
    assert r.status_code == 200
    cfg = r.json()
    original = cfg["free_question_limit"]

    modified = {**cfg, "free_question_limit": 3}
    r2 = session.put(f"{BASE_URL}/api/admin/config", json={"config": modified}, timeout=15)
    assert r2.status_code == 200
    assert r2.json()["free_question_limit"] == 3

    r3 = requests.get(f"{BASE_URL}/api/config", timeout=15)
    assert r3.json()["free_question_limit"] == 3

    # restore
    restored = {**cfg, "free_question_limit": 2}
    r4 = session.put(f"{BASE_URL}/api/admin/config", json={"config": restored}, timeout=15)
    assert r4.status_code == 200
    assert r4.json()["free_question_limit"] == 2
    _ = original  # noqa


# ---------- Chat pricing lifecycle ----------
# NOTE: This depends on demo user state (free_questions_used=0, wallet=80).
# It will consume free questions and wallet balance; only run when state is fresh.
def test_chat_pricing_lifecycle(session):
    w0 = session.get(f"{BASE_URL}/api/wallet", timeout=15).json()
    free_remaining = w0["free_remaining"]
    balance = w0["balance_inr"]

    # Only proceed if fresh state
    if free_remaining < 2 or balance < 40:
        pytest.skip(f"Demo user not fresh: free_remaining={free_remaining}, balance={balance}")

    # 2 free messages
    for i in range(2):
        r = session.post(f"{BASE_URL}/api/chat/{REPORT_ID}/message",
                         json={"message": f"Test free q{i+1}: what should I focus on?"}, timeout=90)
        assert r.status_code == 200, f"free msg {i+1} failed: {r.status_code} {r.text[:200]}"
        d = r.json()
        assert d["billing_mode"] == "free"
        assert d["charged_inr"] == 0
        assert "reply" in d and len(d["reply"]) > 0

    # 3rd without confirm -> 402 confirmation_required
    long_msg = "I need deep guidance on my career, money, marriage and health together — analyse across my report."
    r3 = session.post(f"{BASE_URL}/api/chat/{REPORT_ID}/message",
                      json={"message": long_msg, "confirm": False}, timeout=30)
    assert r3.status_code == 402
    detail = r3.json().get("detail")
    assert isinstance(detail, dict)
    assert detail.get("error") == "confirmation_required"
    assert "estimate" in detail

    # 3rd with confirm -> paid
    r4 = session.post(f"{BASE_URL}/api/chat/{REPORT_ID}/message",
                      json={"message": long_msg, "confirm": True}, timeout=90)
    assert r4.status_code == 200, f"paid msg failed: {r4.status_code} {r4.text[:200]}"
    d4 = r4.json()
    assert d4["billing_mode"] == "paid"
    assert d4["charged_inr"] > 0
    assert d4["balance_inr"] == balance - d4["charged_inr"]
