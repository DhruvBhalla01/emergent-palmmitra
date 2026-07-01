import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { track } from "../lib/analytics";
import {
  Sparkles, Brain, Heart, Briefcase, Coins, Activity,
  ShieldCheck, Zap, TrendingUp, Star, ArrowUpRight, Fingerprint,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

const COPPER = "#D97757";
const GOLD = "#E4B248";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/c6d1ba3ca67adf16f29a57d3445eff22b18e94a571df753a9d71737f2d02fd6f.png";
const SMOKE = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/2dda7208bd695171871b5c5897885d5b603a43495963c69940f5de315e8de80a.png";
const AI_SPHERE = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/d29c00fa518a0cfb066d44b99599aeaee18583d5978225155b720cd1f00d19d5.png";
const REPORT_MOCKUP = "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/015fb14b2549d8f223fcbbeb1cdd335896704a39fe7c0b4ccb171930a924718f.png";

const testimonials = [
  { name: "Ananya Rao", role: "Founder, Verve Studio", quote: "It felt like a private consultation with someone who truly understood me. The clarity was unreal.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/a2201cf2e1429c43781d36cec2cfcb35aa6d531d4d9b003f1abb47814d08e09f.png" },
  { name: "Kabir Malhotra", role: "Product Lead, Nexo", quote: "The recommendations for the next quarter were spot-on. I referred five friends the same week.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/f7093c34306c5dc067c51f154a472f24b09d7786911a4b6ceba8787f2c78ca03.png" },
  { name: "Isha Kapoor", role: "Investor", quote: "PalmMitra is what happens when AI meets craft. This is what luxury software should feel like.", img: "https://static.prod-images.emergentagent.com/jobs/488b3307-4a58-4be5-9a80-986d73174ea6/images/39365bf8953cacd3fee50507d7705c33f44e6ab99a8322ab292b6242aee45f06.png" },
];

const faqs = [
  { q: "Is PalmMitra actually scientific?", a: "PalmMitra combines computer vision with large language models to synthesize your personality, decision profile, and life patterns. It is a modern guidance tool — insightful, not fortune-telling." },
  { q: "How long does the analysis take?", a: "Under a minute. Our AI reads over 40 signals from your palm images and generates a personalized report in real time." },
  { q: "Is my data private?", a: "Absolutely. Your images are processed securely and never sold or shared. You may delete your data at any time." },
  { q: "Can I get a refund?", a: "Yes. If you are not delighted with your report, request a full refund within 7 days. No questions asked." },
  { q: "What makes this different from horoscopes?", a: "Everything. There are no zodiac signs, no rituals, no mystical language. Just precise, actionable insight grounded in AI analysis of you." },
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

const Overline = ({ children }) => (
  <span className="overline inline-flex items-center gap-2">
    <span className="w-6 h-px" style={{ background: COPPER }} />
    {children}
  </span>
);

const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 ${className}`}>{children}</section>
);

export default function Landing() {
  React.useEffect(() => { track("landing_view"); }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#050505", color: "#F4F4F5" }} data-testid="landing-page">
      <div className="aura-bg" />
      <Nav />

      {/* ===================== HERO — asymmetric bento ===================== */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-[0.32]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 20% 0%, rgba(5,5,5,0.35) 0%, rgba(5,5,5,0.85) 55%, #050505 80%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-24 md:pt-28 md:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Left — editorial headline */}
            <div className="lg:col-span-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
                <div className="mb-8"><Overline>VERSION 5.2 &nbsp;/&nbsp; VISION AI</Overline></div>
              </motion.div>

              <motion.h1
                className="hero-headline text-5xl md:text-7xl lg:text-[5.5rem]"
                data-testid="hero-headline"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 0.08 }}
              >
                Discover what your palm<br />
                reveals about{" "}
                <span className="font-serif not-italic" style={{ color: COPPER, fontStyle: "italic" }}>your future.</span>
              </motion.h1>

              <motion.p
                className="mt-8 text-lg md:text-xl max-w-2xl font-light leading-relaxed"
                style={{ color: "#A1A1AA" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.2 }}
              >
                AI-powered analysis delivering deep insight into your personality, career, relationships,
                finances, health, and life path — in under a minute.
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#E88D70")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = COPPER)}
                >
                  Analyze My Palm
                  <span className="text-sm opacity-70">— starts at ₹299</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <a
                  href="#sample"
                  data-testid="hero-sample-btn"
                  className="rounded-full px-8 py-4 border transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F4F4F5" }}
                >
                  View Sample Report
                </a>
              </motion.div>

              <motion.div
                className="mt-14 flex items-center gap-5 text-sm"
                style={{ color: "#71717A" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, ease, delay: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {testimonials.map((t) => (
                    <img key={t.name} src={t.img} alt="" className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: "#050505" }} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1" style={{ color: GOLD }}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="mt-1">Loved by 42,000+ readers worldwide</p>
                </div>
              </motion.div>
            </div>

            {/* Right — glass stat bento */}
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
                    <div className="flex justify-between"><span>personality.index</span><span style={{ color: GOLD }}>0.91</span></div>
                    <div className="flex justify-between"><span>career.trajectory</span><span style={{ color: GOLD }}>rising</span></div>
                    <div className="flex justify-between"><span>risk.appetite</span><span style={{ color: GOLD }}>balanced</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== EDITORIAL RIBBON MARQUEE ===================== */}
      <div className="relative border-y overflow-hidden py-5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="marquee flex whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {["Personality", "Career Path", "Wealth Potential", "Love & Marriage", "Health Signals", "Hidden Talents", "Lucky Years", "Decision Style"].map((w) => (
                <span key={w} className="flex items-center">
                  <span className="font-serif text-2xl md:text-3xl px-8" style={{ color: "#A1A1AA" }}>{w}</span>
                  <span className="w-1 h-1 rounded-full" style={{ background: COPPER }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===================== BENEFITS — TETRIS BENTO ===================== */}
      <Section id="benefits">
        <Reveal><Overline>WHY PALMMITRA</Overline></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">A private analyst,<br />in your pocket.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Big feature cell */}
          <Reveal className="md:col-span-7">
            <div className="grid-exposure rounded-2xl p-10 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
                <img src={SMOKE} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative">
                <Brain className="w-7 h-7 mb-6" style={{ color: COPPER }} strokeWidth={1.3} />
                <h3 className="hero-headline text-3xl md:text-4xl">40+ personalized insights</h3>
                <p className="mt-4 max-w-md font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
                  From decision style to hidden talents — the depth of a full personality workup, synthesized into a report you'll actually revisit.
                </p>
              </div>
              <div className="relative mt-10 font-mono text-xs flex flex-wrap gap-2" style={{ color: "#71717A" }}>
                {["career", "love", "wealth", "health", "timeline", "risk"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>{t}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Stacked cells */}
          <div className="md:col-span-5 grid grid-cols-1 gap-6">
            {[
              { icon: ShieldCheck, title: "Private by default", body: "Your images are analyzed and never shared. Delete anytime." },
              { icon: Zap, title: "Ready in under a minute", body: "State-of-the-art vision models decode your palm the instant you upload." },
            ].map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={0.08 * (i + 1)}>
                <div className="grid-exposure rounded-2xl p-8 h-full">
                  <Icon className="w-6 h-6 mb-5" style={{ color: COPPER }} strokeWidth={1.3} />
                  <h3 className="hero-headline text-2xl">{title}</h3>
                  <p className="mt-3 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ===================== HOW IT WORKS ===================== */}
      <Section id="how">
        <Reveal><Overline>HOW IT WORKS</Overline></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Three quiet steps.<br />One remarkable report.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Upload your palm", d: "Snap or upload a clear image of one or both palms. Good lighting is enough — we handle the rest." },
            { n: "02", t: "AI analysis", d: "Our vision engine reads over 40 signals and synthesizes them into a modern life profile." },
            { n: "03", t: "Read your report", d: "A beautifully designed report you'll actually want to revisit — and share with friends." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={0.08 * i}>
              <div className="grid-exposure rounded-2xl p-8 h-full">
                <p className="font-serif text-5xl" style={{ color: COPPER }}>{s.n}</p>
                <h3 className="hero-headline text-2xl mt-6">{s.t}</h3>
                <p className="mt-3 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== INSIDE YOUR REPORT — BENTO ===================== */}
      <Section id="features">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Reveal className="md:col-span-8">
            <div className="grid-exposure rounded-2xl p-10 relative overflow-hidden h-full">
              <div className="absolute -right-24 -bottom-16 w-[46%] hidden md:block pointer-events-none">
                <img src={REPORT_MOCKUP} alt="Sample PalmMitra report" className="w-full rounded-xl opacity-90 rotate-[4deg] shadow-[0_20px_60px_rgba(0,0,0,0.6)]" />
              </div>
              <div className="relative md:max-w-md">
                <Overline>INSIDE YOUR REPORT</Overline>
                <h2 className="hero-headline text-4xl md:text-5xl mt-4">Depth without the noise.</h2>
                <p className="mt-4 font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
                  Career, love, wealth, health, timeline, hidden talents, decision style, risk profile — organized like a private strategy memo.
                </p>
                <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { icon: Briefcase, l: "Career" },
                  { icon: Heart, l: "Love & Marriage" },
                  { icon: Coins, l: "Wealth Potential" },
                  { icon: Activity, l: "Health" },
                  { icon: TrendingUp, l: "Lucky Years" },
                  { icon: Brain, l: "Decision Style" },
                ].map(({ icon: I, l }) => (
                  <div key={l} className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <I className="w-4 h-4" style={{ color: COPPER }} strokeWidth={1.4} />
                    <span className="text-sm" style={{ color: "#F4F4F5" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-4" delay={0.1}>
            <div id="sample" className="grid-exposure rounded-2xl p-8 flex flex-col justify-between h-full">
              <div>
                <p className="overline">SAMPLE</p>
                <h3 className="hero-headline text-3xl mt-4">Overall Score</h3>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-serif text-7xl not-italic" style={{ color: COPPER, fontStyle: "italic" }}>89</span>
                  <span style={{ color: "#71717A" }}>/ 100</span>
                </div>
                <p className="mt-4 text-sm font-light leading-relaxed" style={{ color: "#A1A1AA" }}>
                  A rare combination of vision and pragmatism. Your next chapter rewards long-arc bets.
                </p>
              </div>
              <a href="/upload" data-testid="sample-cta" className="mt-8 inline-flex items-center gap-1 text-sm transition-colors" style={{ color: COPPER }}>
                See your own <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===================== TESTIMONIALS ===================== */}
      <Section id="testimonials">
        <Reveal><Overline>PRAISE</Overline></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Trusted by people who<br />don't trust easily.</h2>
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

      {/* ===================== PRICING — technical grid + tracing beam ===================== */}
      <Section id="pricing">
        <Reveal><Overline>PRICING</Overline></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Choose your depth.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "AI Palm Insight", p: "₹299", suf: "one-time", d: "One complete personalized report. Everything you need to start.", cta: "Analyze My Palm", hi: false, tid: "pricing-insight" },
            { n: "PalmMitra Plus", p: "₹399", suf: "/ month", d: "Daily guidance, unlimited reports, AI chat, monthly life forecast.", cta: "Start Plus", hi: true, tid: "pricing-plus" },
            { n: "PalmMitra Elite", p: "₹4,999", suf: "one-time", d: "The complete package. Compatibility, PDF magazine, priority support.", cta: "Go Elite", hi: false, tid: "pricing-elite" },
          ].map((plan, i) => (
            <Reveal key={plan.n} delay={0.08 * i}>
              <div data-testid={plan.tid} className="relative h-full rounded-2xl p-[1px] overflow-hidden">
                {/* Tracing beam only on highlighted plan */}
                {plan.hi && (
                  <motion.div
                    aria-hidden
                    className="absolute -inset-[60%]"
                    style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${COPPER} 40deg, ${GOLD} 70deg, transparent 110deg)` }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div
                  className="relative rounded-2xl p-10 h-full flex flex-col"
                  style={{ background: "#0A0A0A", border: plan.hi ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)" }}
                >
                  {plan.hi && <p className="overline mb-6" style={{ color: COPPER }}>MOST POPULAR</p>}
                  <h3 className="hero-headline text-2xl">{plan.n}</h3>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="hero-headline text-5xl">{plan.p}</span>
                    <span className="text-sm" style={{ color: "#71717A" }}>{plan.suf}</span>
                  </div>
                  <p className="mt-4 text-sm font-light leading-relaxed flex-1" style={{ color: "#A1A1AA" }}>{plan.d}</p>
                  <Link
                    to="/upload"
                    className="mt-8 inline-block w-full text-center rounded-full py-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
                    style={plan.hi
                      ? { background: COPPER, color: "#000" }
                      : { border: "1px solid rgba(255,255,255,0.15)", color: "#F4F4F5" }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== FAQ ===================== */}
      <Section id="faq">
        <Reveal><Overline>FAQ</Overline></Reveal>
        <Reveal delay={0.05}>
          <h2 className="hero-headline text-4xl md:text-5xl mt-4 max-w-3xl">Answers, if you're wondering.</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, idx) => (
              <AccordionItem
                key={idx}
                value={`f${idx}`}
                className="grid-exposure rounded-2xl px-6"
                data-testid={`faq-item-${idx}`}
              >
                <AccordionTrigger className="text-left text-base hover:no-underline py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="font-light leading-relaxed pb-5" style={{ color: "#A1A1AA" }}>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Section>

      {/* ===================== FINAL CTA ===================== */}
      <Section>
        <Reveal>
          <div className="rounded-2xl p-14 text-center relative overflow-hidden" style={{ background: "#0A0A0A", border: "1px solid rgba(217,119,87,0.3)" }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img src={SMOKE} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative">
              <h2 className="hero-headline text-4xl md:text-6xl">Your future is patient.<br />Are you?</h2>
              <Link
                to="/upload"
                data-testid="cta-final-btn"
                className="inline-flex items-center gap-2 mt-10 rounded-full px-10 py-4 font-medium text-black transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: COPPER, boxShadow: "0 8px 40px rgba(217,119,87,0.35)" }}
              >
                Analyze My Palm — ₹299
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
