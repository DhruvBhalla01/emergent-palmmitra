import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Nav from "../components/Nav";
import { useAuth } from "../lib/AuthContext";
import { Sparkles, Plus, Lock } from "lucide-react";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      (async () => {
        try {
          const { data } = await api.get("/palm/reports");
          setReports(data || []);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="dashboard-page">
      <Nav />

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

        {/* Premium banner */}
        {!user.is_premium && (
          <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-8 sm:p-10 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-2">Upgrade</p>
              <h3 className="font-serif text-2xl">Unlock daily guidance with PalmMitra Plus.</h3>
              <p className="text-white/60 mt-2 text-sm">Unlimited reports · AI chat · Monthly forecasts · Priority support.</p>
            </div>
            <Link to="/upload" className="bg-white text-black rounded-full px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors">
              See Plus — ₹399/mo
            </Link>
          </div>
        )}

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
