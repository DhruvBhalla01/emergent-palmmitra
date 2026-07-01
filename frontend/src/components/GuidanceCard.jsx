import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Sparkles } from "lucide-react";

export default function GuidanceCard() {
  const [data, setData] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | error | locked
  const [error, setError] = useState("");

  const load = async (cadence = "daily") => {
    setState("loading");
    try {
      const { data } = await api.get(`/guidance/${cadence}`);
      setData(data);
      setState("ready");
    } catch (e) {
      if (e?.response?.status === 402) setState("locked");
      else { setState("error"); setError(e?.response?.data?.detail || "Failed"); }
    }
  };

  useEffect(() => { load("daily"); }, []);

  return (
    <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-8" data-testid="guidance-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Today's Guidance · Plus</p>
      </div>
      {state === "locked" && (
        <p className="text-white/60 text-sm">Upgrade to PalmMitra Plus to receive daily AI-personalized guidance.</p>
      )}
      {state === "loading" && (
        <p className="text-white/50 text-sm">Personalizing your day...</p>
      )}
      {state === "error" && (
        <p className="text-white/50 text-sm">{error}</p>
      )}
      {state === "ready" && data && (
        <>
          <p className="font-serif text-2xl">{data.theme}</p>
          <p className="mt-3 text-white/70">{data.focus}</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Do</p>
              <ul className="space-y-1 text-sm text-white/80">{(data.do || []).map((x, i) => <li key={i}>◆ {x}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Avoid</p>
              <ul className="space-y-1 text-sm text-white/80">{(data.avoid || []).map((x, i) => <li key={i}>◇ {x}</li>)}</ul>
            </div>
          </div>
          {data.affirmation && <p className="mt-6 text-[#D4AF37] italic">"{data.affirmation}"</p>}
        </>
      )}
    </div>
  );
}
