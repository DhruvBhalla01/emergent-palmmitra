import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Nav from "../components/Nav";
import { Send, Sparkles, Wallet, Crown, Zap, X, ArrowUpRight, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

const COPPER = "#D97757";
const GOLD = "#E4B248";

const SUGGESTIONS = [
  "What should I focus on this year?",
  "Am I ready for a career change?",
  "When is my best window for love?",
  "What are my biggest blind spots?",
];

function Typewriter({ text }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const step = Math.max(1, Math.round(text.length / 90));
    const id = setInterval(() => {
      i += step;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text]);
  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{shown}</p>;
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [locked, setLocked] = useState(false);
  const [member, setMember] = useState(false);
  const [balance, setBalance] = useState(0);
  const [freeLeft, setFreeLeft] = useState(0);
  const [packs, setPacks] = useState([]);
  const [modal, setModal] = useState(null); // {type:'confirm'|'gate', estimate, pending}
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef();
  const newIdRef = useRef(null);

  const loadWallet = useCallback(async () => {
    try { const { data } = await api.get("/wallet"); setPacks(data.wallet_packs || []); } catch (e) {}
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${id}/messages`);
      setMessages(data.messages || []);
      setLocked(!data.unlocked);
      setMember(!!data.member);
      setBalance(data.balance_inr || 0);
      setFreeLeft(data.free_remaining || 0);
    } catch (e) { toast.error("Unable to load chat"); }
  }, [id]);

  useEffect(() => { fetchMessages(); loadWallet(); }, [fetchMessages, loadWallet]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  const deliver = async (msg, confirm) => {
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: msg, created_at: new Date().toISOString() }]);
    try {
      const { data } = await api.post(`/chat/${id}/message`, { message: msg, confirm });
      newIdRef.current = data.reply;
      setMessages((m) => [...m, { role: "assistant", content: data.reply, created_at: new Date().toISOString(), _new: true }]);
      setBalance(data.balance_inr ?? balance);
      setFreeLeft(data.free_remaining ?? freeLeft);
      if (data.charged_inr > 0) toast.success(`₹${data.charged_inr} deducted · Balance ₹${data.balance_inr}`);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setMessages((m) => m.filter((x) => !(x.role === "user" && x.content === msg && !x._done)));
      if (d?.error === "fair_usage") toast.error(`Daily fair-usage limit (${d.cap}) reached. Resets tomorrow.`);
      else toast.error(typeof d === "string" ? d : "Message failed");
    } finally { setSending(false); }
  };

  const onSubmit = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending || busy) return;
    setInput("");
    setBusy(true);
    try {
      const { data: est } = await api.post(`/chat/${id}/estimate`, { message: msg });
      if (est.mode === "free" || est.mode === "member") {
        await deliver(msg, false);
      } else if (est.mode === "member_capped") {
        toast.error("Daily fair-usage limit reached. Resets tomorrow.");
      } else if (est.mode === "paid") {
        if (est.need_recharge) setModal({ type: "gate", estimate: est.estimate, pending: msg });
        else setModal({ type: "confirm", estimate: est.estimate, pending: msg, balance: est.balance_inr });
      }
    } catch (e) { toast.error("Something went wrong"); }
    finally { setBusy(false); }
  };

  const confirmPay = async () => {
    const msg = modal.pending;
    setModal(null);
    await deliver(msg, true);
  };

  const recharge = async (pack) => {
    setBusy(true);
    try {
      const { data: order } = await api.post("/payment/create-order", { plan: pack.key, report_id: "" });
      const finish = async () => { await loadWalletAfter(); toast.success("Wallet recharged"); };
      if (order.mock) {
        await api.post("/payment/verify", { order_id: order.order_id });
        await finish();
      } else {
        const rzp = new window.Razorpay({
          key: order.razorpay_key, amount: order.amount, currency: order.currency,
          name: "PalmMitra", description: `Wallet ₹${pack.pay_inr}`, order_id: order.order_id,
          handler: async (resp) => { await api.post("/payment/verify", { order_id: order.order_id, payment_id: resp.razorpay_payment_id, signature: resp.razorpay_signature }); await finish(); },
          theme: { color: COPPER },
        });
        rzp.open();
      }
    } catch (e) { toast.error("Recharge failed"); }
    finally { setBusy(false); }
  };

  const loadWalletAfter = async () => {
    const { data } = await api.get("/wallet");
    setBalance(data.balance_inr || 0);
    setFreeLeft(data.free_remaining || 0);
    setModal(null);
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#050505" }} data-testid="chat-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/report/${id}`} className="text-xs text-white/40 hover:text-white/70">← Back to report</Link>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: COPPER }} />
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: COPPER }}>Your Personal AI Palm Guide</p>
            </div>
            {member ? (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(228,178,72,0.12)", color: GOLD }} data-testid="member-badge">
                <Crown className="w-3.5 h-3.5" /> Member
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {freeLeft > 0 && <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }} data-testid="free-questions-pill">{freeLeft} free left</span>}
                <button onClick={() => setModal({ type: "gate", estimate: null })} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30" data-testid="wallet-pill">
                  <Wallet className="w-3.5 h-3.5" style={{ color: COPPER }} /> ₹{balance}
                </button>
              </div>
            )}
          </div>
          <h1 className="hero-headline text-3xl mt-3">I remember everything about your reading.</h1>
        </div>

        {locked ? (
          <div className="rounded-3xl border border-white/[0.06] p-10 text-center" style={{ background: "#0A0A0A" }}>
            <p className="text-white/70">Unlock your report to begin the conversation with your personal AI guide.</p>
            <Link to={`/report/${id}`} className="mt-6 inline-block text-black rounded-full px-6 py-3 font-medium" style={{ background: COPPER }}>Unlock Now</Link>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-6" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => onSubmit(s)} className="text-left p-4 rounded-2xl border border-white/[0.06] hover:border-[#D97757]/50 text-sm text-white/80 transition-colors" data-testid={`chat-suggestion-${i}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={`${m.created_at}-${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.role === "user" ? "text-black" : "border border-white/[0.06] text-white/90"}`} style={m.role === "user" ? { background: COPPER } : { background: "#0A0A0A" }}>
                    {m.role === "assistant" && m._new ? <Typewriter text={m.content} /> : <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-5 py-3 border border-white/[0.06]" style={{ background: "#0A0A0A" }}>
                    <div className="flex gap-1.5">
                      {[0, 0.15, 0.3].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COPPER, animationDelay: `${d}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex gap-2 pt-4 border-t border-white/[0.06]">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your career, love, decisions..." className="flex-1 bg-[#141414] border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 focus:border-[#D97757] focus:outline-none" data-testid="chat-input" />
              <button type="submit" disabled={sending || busy || !input.trim()} data-testid="chat-send-btn" className="text-black rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-40 transition-colors" style={{ background: COPPER }}>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Modal: confirm charge OR gate/recharge */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setModal(null)}>
          <div className="glass rounded-3xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()} data-testid="chat-modal">
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>

            {modal.type === "confirm" ? (
              <>
                <Zap className="w-6 h-6 mb-4" style={{ color: COPPER }} />
                <h3 className="hero-headline text-2xl">Confirm this question</h3>
                <p className="mt-3 text-sm text-white/70">{modal.estimate.reason}</p>
                <div className="mt-6 rounded-2xl border border-white/10 p-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">{modal.estimate.label}</span><span style={{ color: GOLD }}>₹{modal.estimate.cost_inr}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Balance after</span><span>₹{modal.balance - modal.estimate.cost_inr}</span></div>
                </div>
                <button onClick={confirmPay} data-testid="confirm-pay-btn" className="mt-6 w-full text-black rounded-full py-3.5 font-medium" style={{ background: COPPER }}>Ask · ₹{modal.estimate.cost_inr}</button>
                <button onClick={() => setModal({ type: "gate", estimate: modal.estimate })} className="mt-3 w-full text-xs text-white/50 hover:text-white">Or become a Member for unlimited questions →</button>
              </>
            ) : (
              <>
                <Crown className="w-6 h-6 mb-4" style={{ color: GOLD }} />
                <h3 className="hero-headline text-2xl">Keep the guidance going</h3>
                <p className="mt-3 text-sm text-white/70">You've used your free questions. Choose how you'd like to continue.</p>

                {/* Primary: membership */}
                <button onClick={() => navigate("/#pricing")} data-testid="gate-upgrade-btn" className="mt-6 w-full rounded-2xl p-5 text-left text-black transition-transform hover:-translate-y-0.5" style={{ background: COPPER }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2"><Crown className="w-4 h-4" /> Become a Member</p>
                      <p className="text-xs opacity-80 mt-1">Unlimited guidance · memory · daily insights</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </button>

                {/* Secondary: recharge */}
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/40">Or recharge wallet</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {packs.map((p) => (
                    <button key={p.key} onClick={() => recharge(p)} disabled={busy} data-testid={`recharge-${p.key}`} className="rounded-xl border border-white/10 hover:border-[#D97757]/50 p-4 text-left transition-colors">
                      <p className="hero-headline text-xl">₹{p.pay_inr}</p>
                      {p.bonus_label ? <p className="text-[0.65rem] mt-0.5" style={{ color: "#10B981" }}>{p.bonus_label}</p> : <p className="text-[0.65rem] mt-0.5 text-white/40">get ₹{p.credit_inr}</p>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
