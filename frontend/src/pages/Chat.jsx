import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Nav from "../components/Nav";
import { Send, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";

const SUGGESTIONS = [
  "What should I focus on next quarter?",
  "Am I ready for a career change?",
  "How can I improve my relationships?",
  "What are my biggest blind spots?",
];

export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [locked, setLocked] = useState(false);
  const scrollRef = useRef();

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${id}/messages`);
      setMessages(data.messages || []);
      setLocked(!data.unlocked);
    } catch (e) {
      toast.error("Unable to load chat");
    }
  }, [id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: msg, created_at: new Date().toISOString() }]);
    try {
      const { data } = await api.post(`/chat/${id}/message`, { message: msg });
      setMessages((m) => [...m, { role: "assistant", content: data.reply, created_at: new Date().toISOString() }]);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Chat failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" data-testid="chat-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col">
        <div className="mb-6">
          <Link to={`/report/${id}`} className="text-xs text-white/40 hover:text-white/70">← Back to report</Link>
          <div className="flex items-center gap-2 mt-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">AI Chat · grounded in your report</p>
          </div>
          <h1 className="hero-headline text-3xl mt-2">Ask anything.</h1>
        </div>

        {locked ? (
          <div className="rounded-3xl border border-white/[0.06] bg-[#0A0A0A] p-10 text-center">
            <p className="text-white/70">Unlock your report to start chatting with your personal AI guide.</p>
            <Link to={`/report/${id}`} className="mt-6 inline-block bg-[#D4AF37] text-black rounded-full px-6 py-3 font-medium">Unlock Now</Link>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-6" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="text-left p-4 rounded-2xl border border-white/[0.06] hover:border-[#D4AF37]/40 text-sm text-white/80 transition-colors"
                      data-testid={`chat-suggestion-${i}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={`${m.created_at}-${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.role === "user" ? "bg-[#D4AF37] text-black" : "bg-[#0A0A0A] border border-white/[0.06] text-white/90"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-5 py-3 bg-[#0A0A0A] border border-white/[0.06]">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                      <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2 pt-4 border-t border-white/[0.06]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your career, love, decisions..."
                className="flex-1 bg-[#141414] border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:outline-none"
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                data-testid="chat-send-btn"
                className="bg-[#D4AF37] text-black rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-40 hover:bg-[#F5D061] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
