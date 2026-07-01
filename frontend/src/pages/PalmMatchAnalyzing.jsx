import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { toast, Toaster } from "sonner";

const STAGES = [
  "Aligning both palms",
  "Mapping heart & emotional patterns",
  "Comparing communication signals",
  "Reading romance & passion markers",
  "Evaluating shared life goals",
  "Sensing spiritual alignment",
  "Forecasting long-term harmony",
  "Composing your compatibility report",
];

const AI_SPHERE = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/d29c00fa518a0cfb066d44b99599aeaee18583d5978225155b720cd1f00d19d5.png";

export default function PalmMatchAnalyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const state = location.state;
    if (!state || !state.palmA || !state.palmB) {
      navigate("/palmmatch", { replace: true });
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const stageTimer = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2500);
    const progressTimer = setInterval(() => setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 3)), 800);

    (async () => {
      try {
        const { data } = await api.post("/palmmatch/analyze", {
          palm_a_base64: state.palmA,
          palm_b_base64: state.palmB,
          name_a: state.nameA,
          name_b: state.nameB,
          relationship: state.relationship,
        });
        setProgress(100);
        setTimeout(() => navigate(`/palmmatch/${data.match_id}`, { replace: true }), 700);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Analysis failed. Please try again.");
        setTimeout(() => navigate("/palmmatch", { replace: true }), 1200);
      } finally {
        clearInterval(stageTimer);
        clearInterval(progressTimer);
      }
    })();

    return () => { clearInterval(stageTimer); clearInterval(progressTimer); };
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen text-white overflow-hidden relative" style={{ background: "#050505" }} data-testid="palmmatch-analyzing-page">
      <Toaster theme="dark" position="top-center" />
      <div className="absolute inset-0 opacity-30"><img src={AI_SPHERE} alt="" className="w-full h-full object-cover slow-spin" /></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/60 to-black" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-14 pulse-glow rounded-full border overflow-hidden" style={{ borderColor: "rgba(217,119,87,0.3)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-40 h-40 opacity-80">
              <g fill="none" stroke="#D97757" strokeWidth="0.6" strokeLinecap="round">
                <path d="M35 80 C 30 60, 40 45, 45 30" />
                <path d="M65 80 C 70 60, 60 45, 55 30" />
                <path d="M30 55 C 45 55, 55 55, 70 55" />
              </g>
              <g fill="#E4B248"><circle cx="50" cy="42" r="2.5" /></g>
            </svg>
          </div>
          <div className="absolute inset-x-0 h-[2px] scan-line" />
        </div>

        <p className="overline mb-3" data-testid="palmmatch-stage-label">Compatibility analysis in progress</p>
        <h1 className="hero-headline text-3xl sm:text-4xl text-center max-w-2xl mb-3 min-h-[3rem]" data-testid="palmmatch-stage-text">{STAGES[stage]}</h1>
        <p className="text-white/50 text-sm text-center max-w-md">Our AI is comparing 40+ signals across both palms. This usually takes ~2 minutes.</p>

        <div className="mt-12 w-full max-w-md">
          <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-700 ease-out" style={{ width: `${Math.min(progress, 100)}%`, background: "#D97757" }} />
          </div>
          <p className="mt-3 text-center text-xs text-white/40" data-testid="palmmatch-progress">{Math.floor(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
