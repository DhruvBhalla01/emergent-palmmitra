import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Nav from "../components/Nav";
import { useAuth } from "../lib/AuthContext";
import { Sparkles, Plus, Lock, Copy, Gift, Crown, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import GuidanceCard from "../components/GuidanceCard";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [referral, setReferral] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const { user, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();

  const loadAll = useCallback(async () => {
    try {
      const [r, ref, s] = await Promise.all([
        api.get("/palm/reports"),
        api.get("/referral/me"),
        api.get("/subscription/status"),
      ]);
      setReports(r.data || []);
      setReferral(ref.data);
      setSub(s.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) { loadAll(); }
  }, [user, authLoading, navigate, loadAll]);

  const copyCode = () => {
    if (!referral?.code) return;
    const link = `${window.location.origin}/auth?ref=${referral.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  };

  const applyReferral = async () => {
    if (!applyCode.trim()) return;
    try {
      await api.post("/referral/apply", { code: applyCode.trim().toUpperCase() });
      toast.success("₹100 discount will be applied at checkout");
      setApplyCode("");
      const { data } = await api.get("/referral/me");
      setReferral(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to apply");
    }
  };

  const cancelSub = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    try {
      await api.post("/subscription/cancel");
      toast.success("Subscription canceled");
      const { data } = await api.get("/subscription/status");
      setSub(data);
      checkAuth();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to cancel");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const activeSub = sub?.subscription;

  return (
    <div className="min-h-screen bg-black text-white" data-testid="dashboard-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Your dashboard</p>
            <h1 className="hero-headline text-4xl sm:text-5xl">Welcome, {user.name || "friend"}.</h1>
            <p className="mt-3 text-white/60">All your reports, insights, and journeys — in one calm place.</p>
          </div>
          <Link
            to="/upload"
            data-testid="dashboard-new-report-btn"
            className="bg-[#D4AF37] text-black font-medium rounded-full px-6 py-3 hover:bg-[#F5D061] transition-colors flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> New Analysis
          </Link>
        </div>

        {/* Top row: Subscription + Referrals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {user.is_premium && <div className="md:col-span-2"><GuidanceCard /></div>}
          {/* Subscription */}
          <div className="rounded-3xl border border-white/[0.06] bg-[#0A0A0A] p-8" data-testid="subscription-card">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Subscription</p>
            </div>
            {activeSub ? (
              <>
                <p className="font-serif text-2xl">PalmMitra {activeSub.plan === "elite" ? "Elite" : "Plus"}</p>
                <p className="text-sm text-white/50 mt-1">Status: <span className={`${activeSub.status === "active" ? "text-[#D4AF37]" : "text-white/70"}`}>{activeSub.status}</span></p>
                {activeSub.current_period_end && (
                  <p className="text-xs text-white/40 mt-1">Renews {new Date(activeSub.current_period_end).toLocaleDateString()}</p>
                )}
                {activeSub.status === "active" && activeSub.plan === "plus" && (
                  <button onClick={cancelSub} data-testid="cancel-sub-btn" className="mt-6 text-xs text-white/50 hover:text-white flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5" /> Cancel subscription
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="font-serif text-2xl">Not subscribed</p>
                <p className="text-sm text-white/50 mt-2">Unlock daily guidance, unlimited reports, and AI chat with PalmMitra Plus.</p>
                <Link to="/upload" className="mt-6 inline-block text-sm text-[#D4AF37] hover:text-[#F5D061]">Explore Plus →</Link>
              </>
            )}
          </div>

          {/* Referrals */}
          <div className="rounded-3xl border border-white/[0.06] bg-[#0A0A0A] p-8" data-testid="referral-card">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-[#D4AF37]" />
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Refer friends</p>
            </div>
            <p className="text-sm text-white/60">Give ₹100 off. Earn ₹100 credit.</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 font-mono text-[#D4AF37]" data-testid="referral-code">
                {referral?.code || "—"}
              </div>
              <button onClick={copyCode} className="rounded-full bg-white text-black px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/90" data-testid="copy-ref-btn">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <div className="mt-4 flex items-center gap-6 text-xs text-white/50">
              <span><span className="text-[#D4AF37] font-medium">{referral?.referred_count ?? 0}</span> friends referred</span>
              <span><span className="text-[#D4AF37] font-medium">₹{referral?.credits_inr ?? 0}</span> credits earned</span>
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-xs text-white/40 mb-2">Have a friend's code?</p>
              <div className="flex items-center gap-2">
                <input
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="flex-1 bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none"
                  data-testid="apply-ref-input"
                />
                <button onClick={applyReferral} className="text-sm border border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-full px-4 py-2" data-testid="apply-ref-btn">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-6">Your reports</p>

        {loading ? (
          <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-[#0A0A0A] p-14 text-center">
            <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" strokeWidth={1.4} />
            <h3 className="font-serif text-2xl">Your first report awaits.</h3>
            <p className="text-white/60 mt-2 mb-8">Upload a palm image to receive your personalized AI life analysis.</p>
            <Link to="/upload" className="inline-block bg-[#D4AF37] text-black rounded-full px-8 py-3 font-medium hover:bg-[#F5D061] transition-colors">
              Analyze My Palm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <Link
                key={r.report_id}
                to={`/report/${r.report_id}`}
                data-testid={`report-card-${r.report_id}`}
                className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] hover:border-[#D4AF37]/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                      {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="font-serif text-xl">{r.report?.headline || (r.name ? `${r.name}'s report` : "Personal Report")}</p>
                    <p className="mt-2 text-sm text-white/50">Status: <span className="text-[#D4AF37]">{r.status}</span></p>
                  </div>
                  <div className="text-right">
                    {r.unlocked ? (
                      <span className="font-serif text-4xl text-[#D4AF37]">{r.report?.overall_score ?? "—"}</span>
                    ) : (
                      <Lock className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
