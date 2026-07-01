import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { toast, Toaster } from "sonner";

const STAGES = [
  "Detecting palm orientation",
  "Mapping heart, head, and life patterns",
  "Analyzing personality signals",
  "Decoding career trajectory",
  "Evaluating wealth potential",
  "Reading relationship patterns",
  "Estimating health indicators",
  "Identifying hidden talents",
  "Computing lucky years",
  "Assembling your life timeline",
  "Crafting personalized recommendations",
  "Finalizing your premium report",
];

const AI_SPHERE = "https://images.pexels.com/photos/31650383/pexels-photo-31650383.jpeg";

export default function Analyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const state = location.state;
    if (!state || (!state.left && !state.right)) {
      navigate("/upload", { replace: true });
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    // Stage rotation
    const stageTimer = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 2500);

    // Progress bar (soft, capped at 95 until API returns)
    const progressTimer = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 3));
    }, 800);

    (async () => {
      try {
        const { data } = await api.post("/palm/analyze", {
          left_palm_base64: state.left,
          right_palm_base64: state.right,
          name: state.name,
          dob: state.dob,
        });
        setProgress(100);
        setTimeout(() => {
          navigate(`/report/${data.report_id}`, { replace: true });
        }, 700);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Analysis failed. Please try again.");
        setTimeout(() => navigate("/upload", { replace: true }), 1200);
      } finally {
        clearInterval(stageTimer);
        clearInterval(progressTimer);
      }
    })();

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
    };
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative" data-testid="analyzing-page">
      <Toaster theme="dark" position="top-center" />

      <div className="absolute inset-0 opacity-30">
        <img src={AI_SPHERE} alt="" className="w-full h-full object-cover slow-spin" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/60 to-black" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Palm scan visual */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-14 pulse-glow rounded-full border border-[#D4AF37]/30 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-40 h-40 opacity-80">
              <g fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeLinecap="round">
                <path d="M50 90 C 40 70, 30 60, 25 40" />
                <path d="M50 88 C 55 65, 60 50, 65 35" />
                <path d="M25 55 C 45 55, 65 55, 80 55" />
                <path d="M30 45 C 45 45, 65 45, 78 40" />
                <path d="M20 65 C 40 68, 60 68, 78 62" />
              </g>
              <g fill="#D4AF37">
                <circle cx="25" cy="40" r="1" />
                <circle cx="65" cy="35" r="1" />
                <circle cx="78" cy="40" r="1" />
                <circle cx="20" cy="65" r="1" />
              </g>
            </svg>
          </div>
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent scan-line" />
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3" data-testid="analyzing-stage-label">
          AI Analysis in progress
        </p>
        <h1 className="hero-headline text-3xl sm:text-4xl text-center max-w-2xl mb-3 min-h-[3rem]" data-testid="analyzing-stage-text">
          {STAGES[stage]}
        </h1>
        <p className="text-white/50 text-sm text-center max-w-md">
          Our vision engine is reading over 40 signals from your palm. This usually takes 20–40 seconds.
        </p>

        <div className="mt-12 w-full max-w-md">
          <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-white/40" data-testid="analyzing-progress">
            {Math.floor(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
