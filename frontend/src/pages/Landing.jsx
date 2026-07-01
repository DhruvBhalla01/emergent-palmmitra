import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { track } from "../lib/analytics";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import {
  Sparkles, Brain, Heart, Briefcase, Coins, Activity,
  ShieldCheck, Zap, TrendingUp, Star, ArrowUpRight, Fingerprint,
  Check, X, Clock, Lock, Unlock,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

const COPPER = "#D97757";
const GOLD = "#E4B248";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/c6d1ba3ca67adf16f29a57d3445eff22b18e94a571df753a9d71737f2d02fd6f.png";
const SMOKE = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/2dda7208bd695171871b5c5897885d5b603a43495963c69940f5de315e8de80a.png";
const AI_SPHERE = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/d29c00fa518a0cfb066d44b99599aeaee18583d5978225155b720cd1f00d19d5.png";
const REPORT_MOCKUP = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/015fb14b2549d8f223fcbbeb1cdd335896704a39fe7c0b4ccb171930a924718f.png";
const MANDALA = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/a360bd52358a34f288ee1793ba7766a06b4ce2cafc13a3aa92f0e24941218f83.png";

const testimonials = [
  { name: "Ananya Rao", role: "Founder · Verve Studio", quote: "It felt like a private consultation with someone who truly understood me. The clarity around my career pivot window was unreal.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/a2201cf2e1429c43781d36cec2cfcb35aa6d531d4d9b003f1abb47814d08e09f.png" },
  { name: "Kabir Malhotra", role: "Product Lead · Nexo", quote: "The recommendations for the next quarter were spot-on. I referred five friends the same week — best money I've spent this year.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/f7093c34306c5dc067c51f154a472f24b09d7786911a4b6ceba8787f2c78ca03.png" },
  { name: "Isha Kapoor", role: "Investor · Mumbai", quote: "I'm a skeptic by profession. The wealth-window analysis was specific enough to change how I think about the next three years.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/39365bf8953cacd3fee50507d7705c33f44e6ab99a8322ab292b6242aee45f06.png" },
];

const faqs = [
  { q: "Is this scientifically accurate or just entertainment?", a: "PalmMitra combines computer vision with large language models trained on classical Hasta Samudrika Shastra texts. It reads over 40 signals from your palm to synthesize a modern life profile — insightful and specific, never generic fortune-telling." },
  { q: "How is this different from free horoscope apps?", a: "Everything. There are no zodiac signs or birth-date predictions. Every insight is decoded from the lines, mounts and patterns unique to YOUR hand — like a fingerprint of your future." },
  { q: "How long does the analysis take?", a: "Under two minutes. Our AI reads 15+ palm markers and generates a personalized 2,000-word report in real time." },
  { q: "What happens to my palm image?", a: "Your images are processed securely, never sold or shared, and you may delete them at any time. 256-bit SSL, Razorpay-secured." },
  { q: "Can I access my report later?", a: "Yes. Every report is permanently saved at your private link and downloadable as a premium PDF whenever you want." },
];

const ease = [0.16, 1, 0.3, 1];

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, ease, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ sanskrit, children }) => (
  <div className="flex items-center gap-3 flex-wrap">
    {sanskrit && <span className="font-serif text-lg md:text-xl" style={{ color: GOLD }}>{sanskrit}</span>}
    <span className="overline inline-flex items-center gap-2">
      <span className="w-6 h-px" style={{ background: COPPER }} />
      {children}
    </span>
  </div>
);

const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 ${className}`}>{children}</section>
);

function Countdown() {
  const [t, setT] = React.useState({ h: 0, m: 0, s: 0 });
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end - now);
      setT({
        h: Math.floor(diff / 3.6e6),
        m: Math.floor((diff % 3.6e6) / 6e4),
        s: Math.floor((diff % 6e4) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center justify-center gap-3 font-mono" data-testid="countdown-timer">
      {[["HRS", t.h], ["MIN", t.m], ["SEC", t.s]].map(([l, v]) => (
        <div key={l} className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl" style={{ color: GOLD }}>{pad(v)}</span>
          <span className="text-[0.6rem] tracking-[0.2em]" style={{ color: "#71717A" }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

const compareRows = [
  "Personalised to YOUR palm",
  "Specific years & dates revealed",
  "Career + love + wealth in one report",
  "Grounded in ancient Indian Shastra",
  "Downloadable premium PDF",
  "AI computer-vision analysis",
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cfg, setCfg] = React.useState(null);
  const [billing, setBilling] = React.useState("yearly");
  const [checkingOut, setCheckingOut] = React.useState(false);

  React.useEffect(() => {
    track("landing_view");
    api.get("/config").then((r) => setCfg(r.data)).catch(() => {});
  }, []);

  const monthly = cfg?.membership?.monthly_inr ?? 399;
  const yearly = cfg?.membership?.yearly_inr ?? 3499;
  const savings = cfg?.membership?.yearly_savings_pct ?? 27;
  const reportPrice = cfg?.report_price_inr ?? 299;

  const startMembership = async () => {
    track("membership_checkout_start", { billing });
    if (!user) { navigate("/auth"); return; }
    setCheckingOut(true);
    try {
      const plan = billing === "yearly" ? "membership_yearly" : "membership_monthly";
      const { data: order } = await api.post("/payment/create-order", { plan, report_id: "" });
      if (order.mock) {
        await api.post("/payment/verify", { order_id: order.order_id });
        navigate("/dashboard");
      } else {
        const rzp = new window.Razorpay({
          key: order.razorpay_key, amount: order.amount, currency: order.currency,
          name: "PalmMitra", description: order.plan?.name || "PalmMitra Membership", order_id: order.order_id,
          handler: async (resp) => {
            await api.post("/payment/verify", { order_id: order.order_id, payment_id: resp.razorpay_payment_id, signature: resp.razorpay_signature });
            navigate("/dashboard");
          },
          theme: { color: COPPER },
        });
        rzp.open();
      }
    } catch (e) { /* toast handled globally */ }
    finally { setCheckingOut(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#050505", color: "#F4F4F5" }} data-testid="landing-page">
      <div className="aura-bg" />
      <Nav />

      {/* ===================== HERO ===================== */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-[0.32]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 20% 0%, rgba(5,5,5,0.35) 0%, rgba(5,5,5,0.85) 55%, #050505 80%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-20 md:pt-24 md:pb-32">
          {/* mini trust line */}
          <motion.div
            className="flex items-center gap-2 text-xs font-mono mb-8"
            style={{ color: "#A1A1AA" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease }}
          >
            <span style={{ color: GOLD }}>12,400+ readings</span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1">4.9<Star className="w-3 h-3 fill-current" style={{ color: GOLD }} /> avg</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
                <span className="font-serif text-xl md:text-2xl" style={{ color: GOLD }}>ॐ Bhavishya Darshan</span>
                <span className="overline ml-3">VISION AI · v5.2</span>
              </motion.div>

              <motion.h1
                className="hero-headline text-5xl md:text-7xl lg:text-[5.5rem] mt-6"
                data-testid="hero-headline"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 0.08 }}
              >
                Your palm holds a<br />
                <span className="font-serif not-italic" style={{ color: COPPER, fontStyle: "italic" }}>2,000-word story</span><br />
                about your life.
              </motion.h1>

              <motion.p
                className="mt-8 text-lg md:text-xl max-w-2xl font-light leading-relaxed"
                style={{ color: "#A1A1AA" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.2 }}
              >
                Upload one photo — get a personalised report decoding your career turning points,
                love timeline, wealth windows, health and life path in under two minutes.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-start gap-4"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.3 }}
              >
                <Link
                  to="/upload"
                  data-testid="hero-analyze-btn"
                  className="group inline-flex items-center gap-2 rounded-full px-8 py-4 font-medium text-black transition-all duration-300 ease-out hover:-translate-y-0.5"
                  style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
                >
                  Scan My Palm — Free
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <a
                  href="#sample"
                  data-testid="hero-sample-btn"
                  className="rounded-full px-8 py-4 border transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F4F4F5" }}
                >
                  See Sample Report
                </a>
              </motion.div>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono"
                style={{ color: "#71717A" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, ease, delay: 0.45 }}
              >
                <span>Results in 2 min</span><span className="opacity-40">·</span>
                <span>100% private</span><span className="opacity-40">·</span>
                <span>Free preview</span><span className="opacity-40">·</span>
                <span>Full report ₹299</span>
              </motion.div>
            </div>

            {/* Glass stat bento */}
            <motion.div
              className="lg:col-span-4 relative"
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease, delay: 0.35 }}
            >
              <div className="relative rounded-2xl glass p-8 overflow-hidden">
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full pulse-glow opacity-40">
                  <img src={AI_SPHERE} alt="" className="w-full h-full object-cover rounded-full slow-spin" />
                </div>
                <div className="relative">
                  <Fingerprint className="w-6 h-6 mb-6" style={{ color: COPPER }} strokeWidth={1.3} />
                  <p className="overline">Signals decoded</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="hero-headline text-6xl" style={{ color: "#F4F4F5" }}>40+</span>
                  </div>
                  <div className="divider-gold my-6" />
                  <div className="font-mono text-xs space-y-2" style={{ color: "#A1A1AA" }}>
                    <div className="flex justify-between"><span>career.pivot</span><span style={{ color: GOLD }}>age 28–31</span></div>
                    <div className="flex justify-between"><span>wealth.window</span><span style={{ color: GOLD }}>2026–2028</span></div>
                    <div className="flex justify-between"><span>love.timeline</span><span style={{ color: GOLD }}>mapped</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== TRUST / STAT STRIP ===================== */}
      <div className="relative border-y" style={{ borderColor: "rgba(255,255,255,0.08)" }} data-testid="stat-strip">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { v: "12,400+", l: "Readings delivered" },
            { v: "4.9★", l: "From 2,100+ reviews" },
            { v: "2,000+", l: "Words per report" },
            { v: "~2 min", l: "Full analysis time" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 0.06}>
              <div className="text-center md:text-left">
                <p className="hero-headline text-3xl md:text-4xl" style={{ color: "#F4F4F5" }}>{s.v}</p>
                <p className="text-sm mt-1" style={{ color: "#71717A" }}>{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ===================== EDITORIAL MARQUEE ===================== */}
      <div className="relative overflow-hidden py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="marquee flex whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {["Career Path", "Wealth Windows", "Love & Marriage", "Health Signals", "Hidden Talents", "Lucky Years", "Life Timeline", "Spiritual Remedies"].map((w) => (
                <span key={w} className="flex items-center">
                  <span className="font-serif text-2xl md:text-3xl px-8" style={{ color: "#A1A1AA" }}>{w}</span>
                  <span className="w-1 h-1 rounded-full" style={{ background: COPPER }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===================== HOW IT WORKS ===================== */}
      <Section id="how">
        <Reveal><Eyebrow sanskrit="ॐ Margadarshan">HOW IT WORKS</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">From photo to destiny<br />in three quiet steps.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "01", badge: "< 30 sec", t: "Photograph your palm", d: "Snap a clear photo of your dominant hand — no filters, no editing. Works on any smartphone camera." },
            { n: "02", badge: "~ 90 sec", t: "AI reads 15+ markers", d: "Our vision engine identifies your Life, Heart, Fate, Head, Marriage & Sun lines — plus all 7 mounts — trained on ancient Shastra." },
            { n: "03", badge: "Instant", t: "Get your destiny report", d: "A 2,000-word personalised report lands instantly — career, love, wealth, life phases and spiritual path." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={0.08 * i}>
              <div className="grid-exposure rounded-2xl p-8 h-full">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-5xl" style={{ color: COPPER }}>{s.n}</p>
                  <span className="font-mono text-xs px-3 py-1 rounded-full border inline-flex items-center gap-1.5" style={{ borderColor: "rgba(255,255,255,0.1)", color: GOLD }}>
                    <Clock className="w-3 h-3" />{s.badge}
                  </span>
                </div>
                <h3 className="hero-headline text-2xl mt-6">{s.t}</h3>
                <p className="mt-3 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== FIVE TRUTHS (features) ===================== */}
      <Section id="features">
        <Reveal><Eyebrow sanskrit="ॐ Gyan Shakti">WHAT YOUR PALM REVEALS</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Five truths written<br />in your palm.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-2xl font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
            Not birth-date predictions. Insights decoded from the lines, mounts and patterns unique to YOUR hand — like a fingerprint of your future.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6">
          <Reveal className="md:col-span-7">
            <div className="grid-exposure rounded-2xl p-10 h-full relative overflow-hidden">
              <div className="absolute -right-24 -bottom-16 w-[46%] hidden md:block pointer-events-none">
                <img src={REPORT_MOCKUP} alt="Sample PalmMitra report" className="w-full rounded-xl opacity-90 rotate-[4deg] shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
              </div>
              <div className="relative md:max-w-md">
                <span className="font-mono text-[0.65rem] px-2 py-1 rounded-full" style={{ background: "rgba(217,119,87,0.12)", color: COPPER }}>MOST SOUGHT AFTER</span>
                <Briefcase className="w-7 h-7 mt-6 mb-4" style={{ color: COPPER }} strokeWidth={1.3} />
                <h3 className="hero-headline text-3xl md:text-4xl">Know your next breakthrough year before it arrives</h3>
                <p className="mt-4 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
                  Your Fate & Sun lines pinpoint professional turning points, the industries built for you, and the exact years when career leaps are written in your palm.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="md:col-span-5 grid grid-cols-1 gap-6">
            {[
              { icon: Heart, t: "See when deep love forms", d: "Your Heart & Marriage lines reveal the age window for your most significant relationships and the depth you need in a partner." },
              { icon: Coins, t: "Discover your richest years", d: "The Mount of Venus and Sun line pinpoint your financial growth windows and the actions that accelerate wealth on your path." },
            ].map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={0.08 * (i + 1)}>
                <div className="grid-exposure rounded-2xl p-8 h-full">
                  <Icon className="w-6 h-6 mb-5" style={{ color: COPPER }} strokeWidth={1.3} />
                  <h3 className="hero-headline text-2xl">{t}</h3>
                  <p className="mt-3 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: TrendingUp, t: "The 3 years that will change your life", d: "A personalised Lucky Periods Timeline maps your highest-potential windows for career moves, relationships and investments." },
            { icon: Sparkles, t: "Daily practices aligned with your destiny", d: "Targeted spiritual remedies chosen for your palm patterns — removing obstacles and amplifying the energies already in your hands." },
          ].map(({ icon: Icon, t, d }, i) => (
            <Reveal key={t} delay={0.08 * i}>
              <div className="grid-exposure rounded-2xl p-8 h-full">
                <Icon className="w-6 h-6 mb-5" style={{ color: COPPER }} strokeWidth={1.3} />
                <h3 className="hero-headline text-2xl">{t}</h3>
                <p className="mt-3 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== PALMMATCH ===================== */}
      <Section id="palmmatch">
        <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden" style={{ background: "#0A0A0A", border: "1px solid rgba(217,119,87,0.2)" }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[420px] h-[420px] opacity-[0.06] pointer-events-none hidden md:block">
            <img src={MANDALA} alt="" className="w-full h-full slow-spin" />
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <div className="flex items-center gap-3">
                <span className="font-serif text-lg md:text-xl" style={{ color: GOLD }}>ॐ Yugal Rekha</span>
                <span className="overline">NEW · COMPATIBILITY</span>
              </div>
              <h2 className="hero-headline text-4xl md:text-5xl mt-4">Introducing PalmMatch.</h2>
              <p className="mt-4 max-w-xl font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
                Upload two palms. Discover your compatibility, emotional bond, and destiny alignment — powered by ancient Hast Rekha Shastra and modern AI. For couples, friends, siblings & business partners.
              </p>
              <Link
                to="/palmmatch"
                data-testid="palmmatch-cta"
                className="inline-flex items-center gap-2 mt-8 rounded-full px-8 py-4 font-medium text-black transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
              >
                Try PalmMatch — Free <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="md:col-span-5">
              <div className="grid-exposure rounded-2xl p-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border flex items-center justify-center font-serif text-lg" style={{ borderColor: "rgba(217,119,87,0.4)", color: GOLD }}>A</div>
                  <Heart className="w-5 h-5 fill-current" style={{ color: COPPER }} />
                  <div className="w-12 h-12 rounded-full border flex items-center justify-center font-serif text-lg" style={{ borderColor: "rgba(217,119,87,0.4)", color: GOLD }}>B</div>
                </div>
                <p className="hero-headline text-6xl" style={{ color: COPPER }}>87<span className="text-2xl text-white/40">%</span></p>
                <p className="overline mt-1">Overall Compatibility</p>
                <div className="mt-6 space-y-3 text-left">
                  {[["Emotional Bond", 88], ["Communication", 74], ["Spiritual Alignment", 79]].map(([l, v]) => (
                    <div key={l}>
                      <div className="flex justify-between text-xs mb-1"><span style={{ color: "#A1A1AA" }}>{l}</span><span style={{ color: GOLD }}>{v}%</span></div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${v}%`, background: COPPER }} /></div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-[0.65rem] font-mono" style={{ color: "#71717A" }}>*Sample — your results are personalised</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ===================== SAMPLE REPORT REVEAL (free/premium) ===================== */}
      <Section id="sample">
        <div className="absolute right-0 top-10 w-[420px] h-[420px] opacity-[0.05] pointer-events-none hidden md:block">
          <img src={MANDALA} alt="" className="w-full h-full slow-spin" />
        </div>
        <Reveal><Eyebrow sanskrit="ॐ Drishtant">SAMPLE REPORT</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">This is what your report reveals.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-2xl font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
            Two sections are always free. See real insight before you spend anything.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { tag: "FREE", free: true, t: "Life Line Analysis", d: "Strong, deep vitality line with a notable branch at age 34–36 suggesting a major life shift — a career change, relocation, or relationship that redefines your path." },
            { tag: "FREE", free: true, t: "Heart Line Meaning", d: "A deep, curved heart line reveals intense emotional depth and loyalty. You love completely once committed. A significant relationship forms between ages 28 and 33." },
            { tag: "PREMIUM", free: false, t: "Fate Line Direction", d: "Career success predicted after age 28 with momentum building in 2026–2028. Your fate line forks near the Mount of Saturn indicating a pivotal choice between two compelling paths…" },
            { tag: "PREMIUM", free: false, t: "Mount of Jupiter", d: "Leadership qualities present — ambition runs strong. The mount elevation indicates a rise to authority before age 40, particularly in fields where you inspire and direct others…" },
          ].map((s, i) => (
            <Reveal key={s.t} delay={0.06 * i}>
              <div className="grid-exposure rounded-2xl p-8 h-full relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="hero-headline text-2xl">{s.t}</h3>
                  <span
                    className="font-mono text-[0.6rem] px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={s.free
                      ? { background: "rgba(16,185,129,0.12)", color: "#10B981" }
                      : { background: "rgba(217,119,87,0.14)", color: COPPER }}
                  >
                    {s.free ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{s.tag}
                  </span>
                </div>
                <p className={`font-light leading-relaxed ${s.free ? "" : "blur-[3px] select-none"}`} style={{ color: "#A1A1AA" }}>{s.d}</p>
                {!s.free && (
                  <div className="absolute inset-x-0 bottom-0 pt-16 pb-6 px-8 flex items-end justify-center" style={{ background: "linear-gradient(to top, #0A0A0A 30%, transparent)" }}>
                    <span className="text-xs font-mono" style={{ color: COPPER }}>Unlock to read →</span>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/upload"
              data-testid="sample-cta"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-medium text-black transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
            >
              Unlock My Full Reading <ArrowUpRight className="w-4 h-4" />
            </Link>
            <span className="text-sm font-mono" style={{ color: "#71717A" }}>2 sections free · Full report ₹299 · PDF included</span>
          </div>
        </Reveal>
      </Section>

      {/* ===================== TESTIMONIALS ===================== */}
      <Section id="testimonials">
        <Reveal><Eyebrow sanskrit="ॐ Jana Vani">PRAISE</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-4">
            <h2 className="hero-headline text-4xl md:text-5xl max-w-2xl">Real people.<br />Real revelations.</h2>
            <div className="flex items-center gap-8">
              {[["4.9", "Avg rating"], ["2,100+", "Reviews"], ["98%", "Satisfaction"]].map(([v, l]) => (
                <div key={l}>
                  <p className="hero-headline text-3xl" style={{ color: GOLD }}>{v}</p>
                  <p className="text-xs" style={{ color: "#71717A" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={0.08 * i}>
              <div className="grid-exposure rounded-2xl p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-6" style={{ color: GOLD }}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="font-serif text-2xl leading-snug" style={{ color: "#F4F4F5" }}>"{t.quote}"</p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: "rgba(217,119,87,0.4)" }} />
                  <div>
                    <p className="text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: "#71717A" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== COMPARISON TABLE ===================== */}
      <Section id="compare">
        <Reveal><Eyebrow sanskrit="ॐ Viveka Darshan">WHY PALMMITRA</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Not all readings are<br />created equal.</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 overflow-x-auto" data-testid="comparison-table">
            <div className="min-w-[640px] grid grid-cols-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* header row */}
              <div className="p-6" style={{ background: "rgba(255,255,255,0.015)" }}>
                <p className="text-sm" style={{ color: "#71717A" }}>Compare</p>
              </div>
              {[
                { t: "Horoscope App", s: "Generic · birth-date", hi: false },
                { t: "PalmMitra AI", s: "YOUR palm · YOUR destiny", hi: true },
                { t: "Manual Palmist", s: "Offline · subjective", hi: false },
              ].map((c) => (
                <div key={c.t} className="p-6 text-center relative" style={{ background: c.hi ? "rgba(217,119,87,0.08)" : "rgba(255,255,255,0.015)" }}>
                  {c.hi && <span className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[0.55rem] px-2 py-0.5 rounded-full" style={{ background: COPPER, color: "#000" }}>BEST CHOICE</span>}
                  <p className="hero-headline text-lg mt-2" style={{ color: c.hi ? COPPER : "#F4F4F5" }}>{c.t}</p>
                  <p className="text-xs mt-1" style={{ color: "#71717A" }}>{c.s}</p>
                </div>
              ))}
              {/* feature rows */}
              {compareRows.map((row, ri) => (
                <React.Fragment key={row}>
                  <div className="p-5 text-sm flex items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#A1A1AA" }}>{row}</div>
                  {[false, true, ri < 4].map((val, ci) => (
                    <div key={ci} className="p-5 flex items-center justify-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: ci === 1 ? "rgba(217,119,87,0.05)" : "transparent" }}>
                      {val ? <Check className="w-5 h-5" style={{ color: ci === 1 ? COPPER : "#10B981" }} /> : <X className="w-5 h-5" style={{ color: "#3f3f46" }} />}
                    </div>
                  ))}
                </React.Fragment>
              ))}
              {/* price row */}
              <div className="p-5 text-sm flex items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#F4F4F5" }}>Price</div>
              {[
                { p: "Free", s: "generic" },
                { p: "₹299", s: "free preview" },
                { p: "₹500–5,000", s: "per session" },
              ].map((c, ci) => (
                <div key={ci} className="p-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: ci === 1 ? "rgba(217,119,87,0.05)" : "transparent" }}>
                  <p className="hero-headline text-xl" style={{ color: ci === 1 ? COPPER : "#F4F4F5" }}>{c.p}</p>
                  <p className="text-xs" style={{ color: "#71717A" }}>{c.s}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ===================== PRICING (membership-first) ===================== */}
      <Section id="pricing">
        <Reveal><Eyebrow sanskrit="ॐ Sampatti Yoga">MEMBERSHIP</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Less a purchase.<br />More a companion for life.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-2xl font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
            Begin with a single reading — or step into an ongoing relationship with an AI that remembers you, understands your journey, and guides you whenever life feels uncertain.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Entry — one-time report (secondary) */}
          <Reveal className="md:col-span-4">
            <div data-testid="pricing-report" className="rounded-2xl p-8 h-full flex flex-col" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="overline">Begin your journey</p>
              <h3 className="hero-headline text-2xl mt-4">AI Palm Report</h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="hero-headline text-4xl">₹{reportPrice}</span>
                <span className="text-sm" style={{ color: "#71717A" }}>one-time</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm flex-1" style={{ color: "#A1A1AA" }}>
                {["Full 14-section personalised report", "2 complimentary AI questions", "Beautiful downloadable PDF", "A first taste of your journey"].map((f) => (
                  <li key={f} className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#71717A" }} />{f}</li>
                ))}
              </ul>
              <Link to="/upload" data-testid="pricing-report-cta" className="mt-8 inline-block w-full text-center rounded-full py-3.5 text-sm border transition-all hover:-translate-y-0.5" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F4F4F5" }}>
                Get My Report
              </Link>
            </div>
          </Reveal>

          {/* Membership — dominant */}
          <Reveal className="md:col-span-8" delay={0.08}>
            <div data-testid="pricing-membership" className="relative h-full rounded-3xl p-[1.5px] overflow-hidden">
              <motion.div aria-hidden className="absolute -inset-[55%]" style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${COPPER} 45deg, ${GOLD} 80deg, transparent 120deg)` }} animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} />
              <div className="relative rounded-3xl p-10 h-full flex flex-col md:flex-row gap-10" style={{ background: "#0A0A0A" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="overline" style={{ color: COPPER }}>PALMMITRA MEMBERSHIP</span>
                    <span className="text-[0.6rem] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(228,178,72,0.15)", color: GOLD }}>MOST CHOSEN</span>
                  </div>
                  <h3 className="hero-headline text-3xl md:text-4xl mt-4">Your personal AI life mentor.</h3>

                  {/* billing toggle */}
                  <div className="mt-7 inline-flex items-center rounded-full p-1 border" style={{ borderColor: "rgba(255,255,255,0.1)" }} data-testid="billing-toggle">
                    {[["monthly", "Monthly"], ["yearly", "Yearly"]].map(([k, l]) => (
                      <button key={k} onClick={() => setBilling(k)} data-testid={`billing-${k}`} className="px-5 py-2 rounded-full text-sm transition-all" style={billing === k ? { background: COPPER, color: "#000" } : { color: "#A1A1AA" }}>
                        {l}{k === "yearly" && <span className="ml-1 text-[0.65rem]" style={{ color: billing === k ? "#000" : GOLD }}>Save {savings}%</span>}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="hero-headline text-6xl">₹{billing === "yearly" ? Math.round(yearly / 12) : monthly}</span>
                    <span className="text-sm" style={{ color: "#71717A" }}>/ month</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "#71717A" }}>
                    {billing === "yearly" ? `Billed ₹${yearly}/year · ~3 months free` : `Billed monthly · cancel anytime`}
                  </p>

                  <button onClick={startMembership} disabled={checkingOut} data-testid="membership-cta" className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-medium text-black transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}>
                    {checkingOut ? "Starting…" : "Become a Member"} <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <p className="mt-3 text-xs" style={{ color: "#71717A" }}>Cancel anytime · 7-day money-back guarantee</p>
                </div>

                <div className="md:w-72 md:border-l md:pl-10" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <p className="overline mb-5">What you feel</p>
                  <ul className="space-y-3.5 text-sm" style={{ color: "#D4D4D8" }}>
                    {[
                      "Guidance whenever life feels uncertain",
                      "Ask unlimited questions unique to your palm",
                      "An AI that remembers you & every reading",
                      "Daily nudges · weekly plans · monthly forecast",
                      "Priority, faster answers + every new tool first",
                      "Premium member badge",
                    ].map((f) => (
                      <li key={f} className="flex gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: COPPER }} />{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===================== FAQ ===================== */}
      <Section id="faq">
        <Reveal><Eyebrow sanskrit="ॐ Prashna Samadhan">FAQ</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Your questions, honestly answered.</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, idx) => (
              <AccordionItem key={idx} value={`f${idx}`} className="grid-exposure rounded-2xl px-6" data-testid={`faq-item-${idx}`}>
                <AccordionTrigger className="text-left text-base hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="font-light leading-relaxed pb-5" style={{ color: "#A1A1AA" }}>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Section>

      {/* ===================== FINAL CTA + COUNTDOWN ===================== */}
      <Section>
        <Reveal>
          <div className="rounded-2xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "#0A0A0A", border: "1px solid rgba(217,119,87,0.3)" }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img src={SMOKE} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-[0.05] pointer-events-none">
              <img src={MANDALA} alt="" className="w-full h-full slow-spin" />
            </div>
            <div className="relative">
              <span className="font-serif text-xl" style={{ color: GOLD }}>ॐ Kaal Chakra</span>
              <h2 className="hero-headline text-4xl md:text-6xl mt-4">Your destiny won't wait.<br />Neither should you.</h2>
              <p className="mt-4 text-sm font-mono" style={{ color: "#A1A1AA" }}>₹50 launch offer expires in — use code <span style={{ color: GOLD }}>PALMFRIEND</span></p>
              <div className="mt-6"><Countdown /></div>
              <Link
                to="/upload"
                data-testid="cta-final-btn"
                className="inline-flex items-center gap-2 mt-10 rounded-full px-10 py-4 font-medium text-black transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
              >
                Scan My Palm — Free
                <Sparkles className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ===================== MASSIVE FOOTER WORDMARK ===================== */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-8 select-none pointer-events-none">
        <motion.h2
          className="hero-headline leading-none"
          style={{ fontSize: "clamp(3rem, 15vw, 14rem)", color: "#0F0F0F", WebkitTextStroke: "1px rgba(217,119,87,0.25)" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
        >
          PalmMitra
        </motion.h2>
      </div>

      <Footer />
    </div>
  );
}
