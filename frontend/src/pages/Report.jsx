import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, API } from "../lib/api";
import { track } from "../lib/analytics";
import Nav from "../components/Nav";
import { Lock, Download, Share2, Sparkles, Heart, Briefcase, Coins, Activity, Brain, Star, ShieldCheck, TrendingUp, Award, Zap, MessageCircle } from "lucide-react";
import { toast, Toaster } from "sonner";

function ScoreRing({ score, size = 88, label }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const dash = (pct / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="#D4AF37" strokeWidth="3" fill="none" strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div className="-mt-14 text-center">
        <p className="font-serif text-2xl">{score ?? "—"}</p>
      </div>
      {label && <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, children, testId }) {
  return (
    <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-8 hover:border-[#D4AF37]/20 transition-colors" data-testid={testId}>
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Chips({ items, gold }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(items || []).map((x, i) => (
        <span key={i} className={`text-xs px-3 py-1.5 rounded-full border ${gold ? "border-[#D4AF37]/40 text-[#D4AF37]" : "border-white/10 text-white/80"}`}>
          {x}
        </span>
      ))}
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const { data } = await api.get(`/palm/reports/${id}`);
      setDoc(data);
    } catch (e) {
      toast.error("Report not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const unlock = async (plan = "insight") => {
    setUnlocking(true);
    track("payment_initiated", { plan, report_id: id });
    try {
      const { data: order } = await api.post("/payment/create-order", { report_id: id, plan });
      if (order.mock) {
        // Auto-verify since keys not configured yet
        await api.post("/payment/verify", { order_id: order.order_id, report_id: id });
        toast.success("Report unlocked");
        await fetchReport();
      } else {
        // Real Razorpay flow would open checkout here
        const rzp = new window.Razorpay({
          key: order.razorpay_key,
          amount: order.amount,
          currency: order.currency,
          name: "PalmMitra",
          description: order.plan?.name || "AI Palm Insight",
          order_id: order.order_id,
          handler: async (resp) => {
            await api.post("/payment/verify", {
              order_id: order.order_id,
              report_id: id,
              payment_id: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            toast.success("Payment successful");
            await fetchReport();
          },
          theme: { color: "#D4AF37" },
        });
        rzp.open();
      }
    } catch (e) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const r = doc.report || {};
  const locked = doc.locked;

  return (
    <div className="min-h-screen bg-black text-white" data-testid="report-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Your PalmMitra Report</p>
            <h1 className="hero-headline text-4xl sm:text-5xl">{r.headline || "Your personalized life analysis"}</h1>
            <p className="mt-3 text-white/50 text-sm">Generated on {new Date(doc.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-white/60 hover:text-white flex items-center gap-2 border border-white/10 rounded-full px-4 py-2" data-testid="report-share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            {!locked && (
              <>
                <Link
                  to={`/chat/${id}`}
                  data-testid="report-chat-btn"
                  className="text-sm text-white/80 hover:text-white flex items-center gap-2 border border-white/10 hover:border-[#D4AF37]/50 rounded-full px-4 py-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Ask AI
                </Link>
                <button
                  onClick={async () => {
                    try {
                      const resp = await api.get(`/palm/reports/${id}/pdf`, { responseType: "blob" });
                      const url = URL.createObjectURL(resp.data);
                      const a = document.createElement("a");
                      a.href = url; a.download = `palmmitra-${id}.pdf`; a.click();
                      URL.revokeObjectURL(url);
                    } catch (e) { toast.error("Download failed"); }
                  }}
                  className="text-sm text-black bg-[#D4AF37] hover:bg-[#F5D061] rounded-full px-4 py-2 flex items-center gap-2"
                  data-testid="report-download-btn"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Overall + Scores */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div className="md:col-span-5 bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-3xl p-10 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-4">Overall Score</p>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-8xl text-[#D4AF37]" data-testid="overall-score">{r.overall_score ?? "—"}</span>
              <span className="text-white/40">/ 100</span>
            </div>
            <p className="mt-6 text-white/70 leading-relaxed max-w-md">
              {locked ? "Unlock your full report to see the story behind this number." : (r.summary || "")}
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { k: "personality", l: "Personality", i: Brain },
              { k: "career", l: "Career", i: Briefcase },
              { k: "money", l: "Wealth", i: Coins },
              { k: "love", l: "Love", i: Heart },
              { k: "health", l: "Health", i: Activity },
              { k: "leadership", l: "Leadership", i: Award },
            ].map(({ k, l, i: I }) => (
              <div key={k} className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-start">
                <I className="w-4 h-4 text-[#D4AF37] mb-3" strokeWidth={1.4} />
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">{l}</p>
                <p className="font-serif text-3xl mt-2" data-testid={`score-${k}`}>{r[k]?.score ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PAYWALL */}
        {locked ? (
          <div className="relative mt-8">
            {/* Blurred preview underneath */}
            <div className="blur-paywall grid grid-cols-1 md:grid-cols-2 gap-6">
              {[Briefcase, Heart, Coins, Activity].map((I, idx) => (
                <div key={idx} className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-10 h-64">
                  <div className="w-40 h-4 bg-white/20 rounded mb-4" />
                  <div className="w-full h-3 bg-white/10 rounded mb-2" />
                  <div className="w-3/4 h-3 bg-white/10 rounded mb-2" />
                  <div className="w-2/3 h-3 bg-white/10 rounded" />
                </div>
              ))}
            </div>

            {/* Paywall overlay */}
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="glass rounded-3xl p-10 sm:p-14 max-w-2xl text-center relative overflow-hidden" data-testid="paywall">
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Premium Report</p>
                <h2 className="hero-headline text-3xl sm:text-4xl">Your personalized AI report is ready.</h2>
                <p className="mt-4 text-white/70 max-w-md mx-auto">
                  Unlock your complete life analysis with over 40 personalized insights — career, love, wealth, health, timeline, and hidden strengths.
                </p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {["40+ Insights", "Life Timeline", "Lucky Years", "Action Plan"].map((b) => (
                    <div key={b} className="px-3 py-2 rounded-full border border-white/10 text-white/70">{b}</div>
                  ))}
                </div>

                <button
                  onClick={() => unlock("insight")}
                  disabled={unlocking}
                  data-testid="unlock-report-btn"
                  className="mt-10 w-full sm:w-auto inline-block bg-[#D4AF37] text-black font-medium rounded-full px-10 py-4 hover:bg-[#F5D061] transition-colors disabled:opacity-50"
                >
                  {unlocking ? "Processing..." : "Unlock Full Report — ₹299"}
                </button>

                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure payment</span>
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant access</span>
                  <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 7-day refund</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <FullReport r={r} />
        )}
      </div>
    </div>
  );
}

function FullReport({ r }) {
  return (
    <div className="space-y-6 mt-8">
      {/* Personality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={Brain} title="Personality" testId="section-personality">
          <p className="text-white/80 leading-relaxed">{r.personality?.summary}</p>
          <div className="mt-6"><Chips items={r.personality?.traits} gold /></div>
        </Section>
        <Section icon={Briefcase} title="Career" testId="section-career">
          <p className="text-white/80 leading-relaxed">{r.career?.summary}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Ideal paths</p>
          <Chips items={r.career?.ideal_paths} />
          <p className="mt-4 text-sm text-white/60">Peak years: <span className="text-[#D4AF37]">{r.career?.peak_years}</span></p>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={Coins} title="Wealth" testId="section-money">
          <p className="text-white/80 leading-relaxed">{r.money?.summary}</p>
          <p className="mt-4 text-sm text-[#D4AF37]">{r.money?.wealth_potential}</p>
          <div className="mt-4"><Chips items={r.money?.lucky_streams} /></div>
        </Section>
        <Section icon={Heart} title="Love" testId="section-love">
          <p className="text-white/80 leading-relaxed">{r.love?.summary}</p>
          <p className="mt-4 text-sm text-[#D4AF37]">{r.love?.love_style}</p>
          <div className="mt-4"><Chips items={r.love?.compatibility} /></div>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={Star} title="Marriage" testId="section-marriage">
          <p className="text-white/80 leading-relaxed">{r.marriage?.summary}</p>
          <p className="mt-4 text-sm text-white/60">Likely age range: <span className="text-[#D4AF37]">{r.marriage?.likely_age_range}</span></p>
        </Section>
        <Section icon={ShieldCheck} title="Family" testId="section-family">
          <p className="text-white/80 leading-relaxed">{r.family?.summary}</p>
          <p className="mt-4 text-sm text-[#D4AF37]">{r.family?.bonds}</p>
        </Section>
      </div>

      <Section icon={Activity} title="Health" testId="section-health">
        <p className="text-white/80 leading-relaxed">{r.health?.summary}</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Strengths</p>
            <Chips items={r.health?.strengths} gold />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Watch for</p>
            <Chips items={r.health?.watch} />
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section icon={Sparkles} title="Strengths" testId="section-strengths">
          <ul className="space-y-2 text-white/80 text-sm">
            {(r.strengths || []).map((s, i) => <li key={i} className="flex gap-3"><span className="text-[#D4AF37]">◆</span>{s}</li>)}
          </ul>
        </Section>
        <Section icon={Brain} title="Weaknesses" testId="section-weaknesses">
          <ul className="space-y-2 text-white/80 text-sm">
            {(r.weaknesses || []).map((s, i) => <li key={i} className="flex gap-3"><span className="text-white/40">◇</span>{s}</li>)}
          </ul>
        </Section>
        <Section icon={Zap} title="Hidden talents" testId="section-hidden">
          <ul className="space-y-2 text-white/80 text-sm">
            {(r.hidden_talents || []).map((s, i) => <li key={i} className="flex gap-3"><span className="text-[#D4AF37]">✦</span>{s}</li>)}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section icon={TrendingUp} title="Lucky Years" testId="section-lucky">
          <div className="flex flex-wrap gap-3">
            {(r.lucky_years || []).map((y, i) => (
              <span key={i} className="font-serif text-2xl text-[#D4AF37]">{y}</span>
            ))}
          </div>
        </Section>
        <Section icon={Award} title="Opportunities" testId="section-opps">
          <ul className="space-y-2 text-white/80 text-sm">
            {(r.opportunities || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
        <Section icon={ShieldCheck} title="Challenges" testId="section-challenges">
          <ul className="space-y-2 text-white/80 text-sm">
            {(r.challenges || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      </div>

      {/* Timeline */}
      <Section icon={TrendingUp} title="Life Timeline" testId="section-timeline">
        <div className="mt-4 relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
          <div className="space-y-6">
            {(r.life_timeline || []).map((t, i) => (
              <div key={i} className="pl-10 relative">
                <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-[#D4AF37]" />
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">{t.age}</p>
                <p className="font-serif text-xl mt-1 text-[#D4AF37]">{t.theme}</p>
                <p className="text-sm text-white/70 mt-1">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Decision + leadership + creativity + risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section icon={Brain} title="Decision Style" testId="section-decision">
          <p className="text-white/80 leading-relaxed">{r.decision_style}</p>
        </Section>
        <Section icon={Award} title="Leadership" testId="section-leadership">
          <p className="text-white/80 leading-relaxed">{r.leadership?.summary}</p>
        </Section>
        <Section icon={Sparkles} title="Creativity" testId="section-creativity">
          <p className="text-white/80 leading-relaxed">{r.creativity?.summary}</p>
        </Section>
        <Section icon={ShieldCheck} title="Risk Profile" testId="section-risk">
          <p className="text-white/80 leading-relaxed">{r.risk_profile}</p>
        </Section>
      </div>

      {/* Recommendations */}
      <Section icon={Star} title="Recommendations" testId="section-recs">
        <ul className="space-y-3 text-white/80">
          {(r.recommendations || []).map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-[#D4AF37]">{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Action plan */}
      <Section icon={Zap} title="Action Plan" testId="section-actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(r.action_plan || []).map((a, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/[0.06]">
              <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-2">{a.horizon}</p>
              <p className="text-sm text-white/80">{a.action}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Summary */}
      <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-10 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Closing</p>
        <p className="font-serif text-2xl leading-relaxed max-w-3xl mx-auto">{r.summary}</p>
      </div>
    </div>
  );
}
