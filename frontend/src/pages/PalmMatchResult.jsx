import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { api } from "../lib/api";
import { track } from "../lib/analytics";
import Nav from "../components/Nav";
import { Lock, Unlock, Share2, Heart, ShieldCheck, Zap, Star, Sparkles, AlertTriangle, Download } from "lucide-react";
import { toast, Toaster } from "sonner";

const COPPER = "#D97757";
const GOLD = "#E4B248";
const MANDALA = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/a360bd52358a34f288ee1793ba7766a06b4ce2cafc13a3aa92f0e24941218f83.png";

function CompatRing({ score, size = 200 }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const dash = (pct / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COPPER} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} style={{ filter: "drop-shadow(0 0 8px rgba(217,119,87,0.5))" }} />
      </svg>
      <div className="absolute text-center">
        <p className="hero-headline text-5xl" style={{ color: COPPER }} data-testid="compat-score">{score ?? "—"}<span className="text-2xl text-white/40">%</span></p>
        <p className="overline mt-1">Compatibility</p>
      </div>
    </div>
  );
}

function CategoryBar({ name, score, detail, locked }) {
  return (
    <div className="grid-exposure rounded-2xl p-6" data-testid={`match-cat-${name?.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/80">{name}</p>
        <p className="hero-headline text-xl" style={{ color: GOLD }}>{score ?? "—"}%</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score || 0}%`, background: COPPER }} />
      </div>
      {detail && <p className="mt-4 text-sm text-white/60 leading-relaxed">{detail}</p>}
      {locked && !detail && <p className="mt-4 text-xs font-mono" style={{ color: COPPER }}>Unlock to read →</p>}
    </div>
  );
}

export default function PalmMatchResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);

  const fetchMatch = useCallback(async () => {
    try {
      const { data } = await api.get(`/palmmatch/${id}`);
      setDoc(data);
    } catch (e) {
      toast.error("Match report not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const unlock = async () => {
    setUnlocking(true);
    track("payment_initiated", { plan: "match", report_id: id });
    try {
      const { data: order } = await api.post("/payment/create-order", { report_id: id, plan: "match" });
      if (order.mock) {
        await api.post("/payment/verify", { order_id: order.order_id, report_id: id });
        toast.success("Compatibility report unlocked");
        await fetchMatch();
      } else {
        const rzp = new window.Razorpay({
          key: order.razorpay_key, amount: order.amount, currency: order.currency,
          name: "PalmMitra", description: order.plan?.name || "PalmMatch Compatibility", order_id: order.order_id,
          handler: async (resp) => {
            await api.post("/payment/verify", { order_id: order.order_id, report_id: id, payment_id: resp.razorpay_payment_id, signature: resp.razorpay_signature });
            toast.success("Payment successful");
            await fetchMatch();
          },
          theme: { color: COPPER },
        });
        rzp.open();
      }
    } catch (e) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    track("palmmatch_share", { report_id: id });
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, skipFonts: true, backgroundColor: "#050505" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `palmmitra-match-${id}.png`, { type: "image/png" });
      const compat = doc?.report?.overall_compat;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Our PalmMitra Compatibility", text: `We're ${compat}% compatible on PalmMitra ✨` });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl; a.download = file.name; a.click();
        toast.success("Compatibility card downloaded");
      }
    } catch (e) {
      toast.error("Could not create card");
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#050505" }}><div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(217,119,87,0.3)", borderTopColor: COPPER }} /></div>;
  }

  const r = doc.report || {};
  const locked = doc.locked;
  const cats = r.categories || [];

  return (
    <div className="min-h-screen text-white" style={{ background: "#050505" }} data-testid="palmmatch-result-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="font-serif text-lg" style={{ color: GOLD }}>ॐ Yugal Rekha</span>
            <p className="text-sm text-white/50 mt-1">{doc.name_a || "Partner A"} <span style={{ color: COPPER }}>&amp;</span> {doc.name_b || "Partner B"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-white/60 hover:text-white flex items-center gap-2 border border-white/10 rounded-full px-4 py-2" data-testid="match-share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Share2 className="w-3.5 h-3.5" /> Link
            </button>
            <button
              onClick={shareCard}
              disabled={sharing}
              data-testid="match-share-card-btn"
              className="text-sm font-medium flex items-center gap-2 rounded-full px-4 py-2 text-black transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: COPPER }}
            >
              <Download className="w-3.5 h-3.5" /> {sharing ? "Creating…" : "Share Card"}
            </button>
          </div>
        </div>

        {/* Hero: ring + verdict */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center rounded-3xl p-10 mb-8" style={{ background: "#0A0A0A", border: "1px solid rgba(217,119,87,0.2)" }}>
          <div className="md:col-span-4 flex justify-center"><CompatRing score={r.overall_compat} /></div>
          <div className="md:col-span-8">
            <h1 className="hero-headline text-3xl sm:text-4xl">{r.headline || "Your compatibility reading"}</h1>
            <p className="mt-3 font-serif text-2xl" style={{ color: COPPER }}>{r.verdict}</p>
            <p className="mt-4 text-white/70 leading-relaxed">{r.summary}</p>
          </div>
        </div>

        {/* Free categories badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
            <Unlock className="w-3 h-3" /> {locked ? "2 SECTIONS FREE" : "FULL REPORT"}
          </span>
          {locked && <p className="text-xs text-white/40">See real insight before you unlock everything</p>}
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cats.map((c, i) => (
            <CategoryBar key={i} name={c.name} score={c.score} detail={c.detail} locked={locked} />
          ))}
        </div>

        {/* Locked paywall OR full extras */}
        {locked ? (
          <div className="relative mt-6">
            <div className="blur-paywall grid grid-cols-1 md:grid-cols-3 gap-6">
              {["Strengths", "Watch-outs", "Remedies"].map((t) => (
                <div key={t} className="rounded-3xl p-8 h-48" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-32 h-4 bg-white/20 rounded mb-4" />
                  <div className="w-full h-3 bg-white/10 rounded mb-2" />
                  <div className="w-3/4 h-3 bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="glass rounded-3xl p-10 sm:p-14 max-w-2xl text-center" data-testid="match-paywall">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(217,119,87,0.1)", border: "1px solid rgba(217,119,87,0.4)" }}>
                  <Lock className="w-5 h-5" style={{ color: COPPER }} />
                </div>
                <p className="overline mb-3" style={{ color: COPPER }}>Unlock Full Compatibility</p>
                <h2 className="hero-headline text-3xl sm:text-4xl">Your complete match report awaits.</h2>
                <p className="mt-4 text-white/70 max-w-md mx-auto">All six dimensions decoded, plus relationship strengths, watch-outs, personalised remedies and a beautiful shareable summary.</p>
                <button onClick={unlock} disabled={unlocking} data-testid="unlock-match-btn" className="mt-10 w-full sm:w-auto inline-block font-medium rounded-full px-10 py-4 transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: COPPER, color: "#000" }}>
                  {unlocking ? "Processing…" : "Unlock Full Report — ₹4,999"}
                </button>
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure</span>
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant</span>
                  <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 7-day refund</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="grid-exposure rounded-2xl p-8" data-testid="match-strengths">
              <Sparkles className="w-5 h-5 mb-4" style={{ color: COPPER }} />
              <p className="overline mb-4">Strengths</p>
              <ul className="space-y-2 text-sm text-white/80">{(r.strengths || []).map((s, i) => <li key={i} className="flex gap-2"><span style={{ color: COPPER }}>◆</span>{s}</li>)}</ul>
            </div>
            <div className="grid-exposure rounded-2xl p-8" data-testid="match-watchouts">
              <AlertTriangle className="w-5 h-5 mb-4" style={{ color: GOLD }} />
              <p className="overline mb-4">Watch-outs</p>
              <ul className="space-y-2 text-sm text-white/80">{(r.watch_outs || []).map((s, i) => <li key={i} className="flex gap-2"><span className="text-white/40">◇</span>{s}</li>)}</ul>
            </div>
            <div className="grid-exposure rounded-2xl p-8" data-testid="match-remedies">
              <Heart className="w-5 h-5 mb-4" style={{ color: COPPER }} />
              <p className="overline mb-4">Remedies</p>
              <ul className="space-y-2 text-sm text-white/80">{(r.remedies || []).map((s, i) => <li key={i} className="flex gap-2"><span style={{ color: COPPER }}>✦</span>{s}</li>)}</ul>
            </div>
            {r.closing && (
              <div className="md:col-span-3 rounded-3xl p-10 text-center" style={{ background: "#0A0A0A", border: "1px solid rgba(217,119,87,0.3)" }}>
                <p className="overline mb-3" style={{ color: COPPER }}>Closing</p>
                <p className="font-serif text-2xl leading-relaxed max-w-3xl mx-auto">{r.closing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Off-screen shareable card */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }} aria-hidden>
        <div
          ref={cardRef}
          data-testid="share-card"
          style={{ width: 540, background: "#050505", color: "#F4F4F5", padding: 44, position: "relative", overflow: "hidden", fontFamily: "'Manrope', sans-serif" }}
        >
          <img src={MANDALA} alt="" crossOrigin="anonymous" style={{ position: "absolute", right: -120, top: -120, width: 360, height: 360, opacity: 0.07 }} />
          <div style={{ position: "relative" }}>
            {/* brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COPPER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", color: COPPER, fontSize: 15 }}>P</span>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, letterSpacing: "0.02em" }}>PalmMitra</span>
              <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em", color: "#71717A" }}>AI COMPATIBILITY</span>
            </div>

            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: GOLD, marginBottom: 8 }}>ॐ Yugal Rekha</div>

            {/* names */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 500 }}>{doc.name_a || "Partner A"}</span>
              <span style={{ color: COPPER, fontSize: 20 }}>♥</span>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 24, fontWeight: 500 }}>{doc.name_b || "Partner B"}</span>
            </div>

            {/* big score */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: 96, lineHeight: 1, color: COPPER, letterSpacing: "-0.03em" }}>{r.overall_compat ?? "—"}</span>
              <span style={{ fontSize: 32, color: "rgba(255,255,255,0.4)" }}>%</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 26, color: GOLD, marginTop: 4 }}>{r.verdict || "A remarkable connection"}</div>

            {/* bars */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              {(r.categories || []).slice(0, 3).map((c, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#A1A1AA" }}>{c.name}</span>
                    <span style={{ color: GOLD }}>{c.score}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.score || 0}%`, background: COPPER, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* footer CTA */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#A1A1AA" }}>Reveal yours → palmmitra.in</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: COPPER }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
