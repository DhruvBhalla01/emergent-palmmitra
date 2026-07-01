import React, { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { Users, IndianRupee, FileText, Ticket, TrendingUp } from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [config, setConfig] = useState(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_inr: 0, discount_pct: 0, max_uses: 100 });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      try {
        const [s, u, c, f, cfg] = await Promise.all([
          api.get("/admin/stats"), api.get("/admin/users"),
          api.get("/admin/coupons"), api.get("/admin/funnel"), api.get("/admin/config"),
        ]);
        setStats(s.data); setUsers(u.data); setCoupons(c.data); setFunnel(f.data); setConfig(cfg.data);
      } catch (e) {
        if (e?.response?.status === 403) { toast.error("Admin access required"); navigate("/dashboard"); }
      }
    })();
  }, [user, loading, navigate]);

  const saveConfig = async () => {
    setSavingCfg(true);
    try {
      const { data } = await api.put("/admin/config", { config });
      setConfig(data);
      toast.success("Pricing config saved");
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
    finally { setSavingCfg(false); }
  };

  const createCoupon = async () => {
    if (!newCoupon.code.trim()) return;
    try {
      await api.post("/admin/coupons", newCoupon);
      const { data } = await api.get("/admin/coupons");
      setCoupons(data);
      setNewCoupon({ code: "", discount_inr: 0, discount_pct: 0, max_uses: 100 });
      toast.success("Coupon created");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const deleteCoupon = async (code) => {
    await api.delete(`/admin/coupons/${code}`);
    setCoupons(coupons.filter((c) => c.code !== code));
  };

  if (!stats) return <div className="min-h-screen bg-black" />;

  const cards = [
    { l: "Users", v: stats.users, i: Users },
    { l: "Premium", v: stats.premium_users, i: TrendingUp },
    { l: "Reports", v: stats.reports, i: FileText },
    { l: "Revenue", v: `₹${stats.revenue_inr.toLocaleString()}`, i: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-page">
      <Nav />
      <Toaster theme="dark" position="top-center" />
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-3">Admin</p>
        <h1 className="hero-headline text-4xl sm:text-5xl">Operations.</h1>

        <div className="mt-8 flex gap-1 border-b border-white/[0.06]">
          {["overview", "pricing", "users", "coupons", "funnel"].map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`admin-tab-${t}`}
              className={`px-4 py-3 text-sm capitalize ${tab === t ? "text-[#D4AF37] border-b border-[#D4AF37]" : "text-white/50 hover:text-white/80"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {tab === "overview" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cards.map(({ l, v, i: I }) => (
                <div key={l} className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
                  <I className="w-4 h-4 text-[#D4AF37] mb-3" strokeWidth={1.4} />
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">{l}</p>
                  <p className="font-serif text-3xl mt-2">{v}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "pricing" && config && (
            <div className="space-y-6" data-testid="admin-pricing">
              <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Membership & one-time prices (₹)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    ["Monthly", () => config.membership.monthly_inr, (v) => setConfig({ ...config, membership: { ...config.membership, monthly_inr: v } })],
                    ["Yearly", () => config.membership.yearly_inr, (v) => setConfig({ ...config, membership: { ...config.membership, yearly_inr: v } })],
                    ["Yearly savings %", () => config.membership.yearly_savings_pct, (v) => setConfig({ ...config, membership: { ...config.membership, yearly_savings_pct: v } })],
                    ["Report price", () => config.report_price_inr, (v) => setConfig({ ...config, report_price_inr: v })],
                    ["PalmMatch price", () => config.palmmatch_price_inr, (v) => setConfig({ ...config, palmmatch_price_inr: v })],
                    ["Free questions", () => config.free_question_limit, (v) => setConfig({ ...config, free_question_limit: v })],
                    ["Member daily cap", () => config.member_daily_cap, (v) => setConfig({ ...config, member_daily_cap: v })],
                  ].map(([label, get, set]) => (
                    <label key={label} className="block">
                      <span className="text-xs text-white/40">{label}</span>
                      <input type="number" value={get()} onChange={(e) => set(Number(e.target.value))} data-testid={`cfg-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="mt-1 w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Question price tiers (₹)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {config.question_tiers.map((t, i) => (
                    <label key={t.key} className="block">
                      <span className="text-xs text-white/40">{t.label}</span>
                      <input type="number" value={t.cost_inr} onChange={(e) => { const q = [...config.question_tiers]; q[i] = { ...t, cost_inr: Number(e.target.value) }; setConfig({ ...config, question_tiers: q }); }} data-testid={`cfg-tier-${t.key}`} className="mt-1 w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A]">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Wallet recharge packs (pay ₹ → credit ₹)</p>
                <div className="space-y-3">
                  {config.wallet_packs.map((p, i) => (
                    <div key={p.key} className="grid grid-cols-3 gap-3 items-center">
                      <span className="text-sm font-mono text-white/60">{p.key}</span>
                      <input type="number" value={p.pay_inr} onChange={(e) => { const w = [...config.wallet_packs]; w[i] = { ...p, pay_inr: Number(e.target.value) }; setConfig({ ...config, wallet_packs: w }); }} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="pay" />
                      <input type="number" value={p.credit_inr} onChange={(e) => { const w = [...config.wallet_packs]; w[i] = { ...p, credit_inr: Number(e.target.value) }; setConfig({ ...config, wallet_packs: w }); }} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="credit" />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveConfig} disabled={savingCfg} data-testid="save-config-btn" className="bg-[#D4AF37] text-black rounded-full px-8 py-3 text-sm font-medium hover:bg-[#F5D061] disabled:opacity-50">
                {savingCfg ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          )}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-white/40 border-b border-white/[0.06]">
                  <tr><th className="p-4 text-left">Name</th><th className="text-left">Email</th><th className="text-left">Plan</th><th className="text-left">Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-white/[0.04]">
                      <td className="p-4">{u.name || "—"}</td>
                      <td>{u.email}</td>
                      <td>{u.is_premium ? <span className="text-[#D4AF37]">Premium</span> : "Free"}</td>
                      <td className="text-white/50">{u.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "coupons" && (
            <div>
              <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">Create coupon</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <input placeholder="CODE" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" data-testid="coupon-code-input" />
                  <input type="number" placeholder="₹ off" value={newCoupon.discount_inr / 100 || ""} onChange={(e) => setNewCoupon({ ...newCoupon, discount_inr: Number(e.target.value) * 100 })} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" placeholder="% off" value={newCoupon.discount_pct || ""} onChange={(e) => setNewCoupon({ ...newCoupon, discount_pct: Number(e.target.value) })} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" placeholder="Max uses" value={newCoupon.max_uses} onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: Number(e.target.value) })} className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={createCoupon} data-testid="create-coupon-btn" className="bg-[#D4AF37] text-black rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#F5D061]">Create</button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-white/40 border-b border-white/[0.06]">
                    <tr><th className="p-4 text-left">Code</th><th className="text-left">₹ off</th><th className="text-left">% off</th><th className="text-left">Used</th><th></th></tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.code} className="border-b border-white/[0.04]">
                        <td className="p-4 font-mono text-[#D4AF37]">{c.code}</td>
                        <td>₹{c.discount_inr / 100}</td>
                        <td>{c.discount_pct}%</td>
                        <td>{c.used_count}/{c.max_uses}</td>
                        <td><button onClick={() => deleteCoupon(c.code)} className="text-xs text-white/40 hover:text-white">Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === "funnel" && (
            <div className="space-y-2">
              {funnel.map((f) => (
                <div key={f.type} className="p-4 rounded-xl border border-white/[0.06] bg-[#0A0A0A] flex justify-between">
                  <span className="text-sm">{f.type}</span>
                  <span className="text-[#D4AF37] font-mono">{f.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
