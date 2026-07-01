import React from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import {
  Sparkles, Brain, Heart, Briefcase, Coins, Activity,
  ShieldCheck, Zap, TrendingUp, Star, ChevronDown
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

const HERO_BG = "https://images.pexels.com/photos/21031387/pexels-photo-21031387.jpeg";
const AI_SPHERE = "https://images.pexels.com/photos/31650383/pexels-photo-31650383.jpeg";

const testimonials = [
  { name: "Ananya Rao", role: "Founder, Verve Studio", quote: "It felt like a private consultation with someone who truly understood me. The clarity was unreal.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200" },
  { name: "Kabir Malhotra", role: "Product Lead, Nexo", quote: "The recommendations for the next quarter were spot-on. I referred five friends the same week.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
  { name: "Isha Kapoor", role: "Investor", quote: "PalmMitra is what happens when AI meets craft. This is what luxury software should feel like.", img: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200" },
];

const faqs = [
  { q: "Is PalmMitra actually scientific?", a: "PalmMitra combines computer vision with large language models to synthesize your personality, decision profile, and life patterns. It is a modern guidance tool — insightful, not fortune-telling." },
  { q: "How long does the analysis take?", a: "Under a minute. Our AI reads over 40 signals from your palm images and generates a personalized report in real time." },
  { q: "Is my data private?", a: "Absolutely. Your images are processed securely and never sold or shared. You may delete your data at any time." },
  { q: "Can I get a refund?", a: "Yes. If you are not delighted with your report, request a full refund within 7 days. No questions asked." },
  { q: "What makes this different from horoscopes?", a: "Everything. There are no zodiac signs, no rituals, no mystical language. Just precise, actionable insight grounded in AI analysis of you." },
];

const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 ${className}`}>{children}</section>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white" data-testid="landing-page">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 pt-20 pb-32 sm:pt-32 sm:pb-44">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-8 fade-up">
              <Sparkles className="w-3.5 h-3.5" />
              AI Life Guidance Platform
            </div>
            <h1 className="hero-headline text-5xl sm:text-6xl lg:text-7xl fade-up" data-testid="hero-headline">
              Discover what your palm<br />reveals about <em className="text-[#D4AF37] not-italic">your future.</em>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl fade-up">
              AI-powered analysis delivering deep insights into your personality, career, relationships,
              finances, health, and life path — in under a minute.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 fade-up">
              <Link
                to="/upload"
                data-testid="hero-analyze-btn"
                className="bg-[#D4AF37] text-black font-medium rounded-full px-8 py-4 hover:bg-[#F5D061] transition-colors inline-flex items-center gap-2"
              >
                Analyze My Palm
                <span className="text-sm opacity-70">— starts at ₹299</span>
              </Link>
              <a
                href="#sample"
                data-testid="hero-sample-btn"
                className="text-white border border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-full px-8 py-4 transition-colors"
              >
                View Sample Report
              </a>
            </div>

            <div className="mt-14 flex items-center gap-6 text-sm text-white/50 fade-up">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/10" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p>Loved by 42,000+ readers worldwide</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full opacity-30 hidden lg:block pulse-glow">
          <img src={AI_SPHERE} alt="" className="w-full h-full object-cover rounded-full slow-spin" />
        </div>
      </section>

      {/* BENEFITS */}
      <Section id="benefits">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Why PalmMitra</p>
        <h2 className="hero-headline text-4xl sm:text-5xl mt-3 max-w-3xl">A private analyst, in your pocket.</h2>
        <p className="mt-4 text-white/60 max-w-2xl">Modern guidance, engineered with the precision of a boutique consultancy — and the calm of a Sunday morning.</p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "40+ Personalized Insights", body: "From decision style to hidden talents — the depth of a full personality workup." },
            { icon: ShieldCheck, title: "Private by Default", body: "Your images are analyzed and never shared. Delete anytime." },
            { icon: Zap, title: "Ready in Under a Minute", body: "State-of-the-art vision models decode your palm the instant you upload." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-8 hover:border-[#D4AF37]/40 transition-colors">
              <Icon className="w-6 h-6 text-[#D4AF37] mb-6" strokeWidth={1.4} />
              <h3 className="font-serif text-2xl mb-2">{title}</h3>
              <p className="text-white/60 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">How it works</p>
        <h2 className="hero-headline text-4xl sm:text-5xl mt-3 max-w-3xl">Three quiet steps. One remarkable report.</h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "01", t: "Upload your palm", d: "Snap or upload a clear image of one or both palms. Good lighting is enough — we handle the rest." },
            { n: "02", t: "AI analysis", d: "Our vision engine reads over 40 signals and synthesizes them into a modern life profile." },
            { n: "03", t: "Read your report", d: "A beautifully designed report you'll actually want to revisit — and share with friends." },
          ].map((s) => (
            <div key={s.n} className="p-8 rounded-3xl border border-white/[0.06] hover:border-[#D4AF37]/40 transition-colors bg-gradient-to-b from-[#0A0A0A] to-black">
              <p className="text-[#D4AF37] font-serif text-4xl mb-6">{s.n}</p>
              <h3 className="font-serif text-2xl mb-3">{s.t}</h3>
              <p className="text-white/60 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FEATURES / SAMPLE REPORT preview */}
      <Section id="features">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-10 relative overflow-hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Inside your report</p>
            <h2 className="hero-headline text-4xl sm:text-5xl mt-3">Depth without the noise.</h2>
            <p className="mt-4 text-white/60 max-w-xl">Career, love, wealth, health, timeline, hidden talents, decision style, risk profile — organized like a private strategy memo.</p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {[
                { icon: Briefcase, l: "Career" },
                { icon: Heart, l: "Love & Marriage" },
                { icon: Coins, l: "Wealth Potential" },
                { icon: Activity, l: "Health" },
                { icon: TrendingUp, l: "Lucky Years" },
                { icon: Brain, l: "Decision Style" },
              ].map(({ icon: I, l }) => (
                <div key={l} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06]">
                  <I className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.4} />
                  <span className="text-sm text-white/80">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="sample" className="md:col-span-4 bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">Sample</p>
              <h3 className="font-serif text-3xl mt-3">Overall Score</h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-7xl text-[#D4AF37]">89</span>
                <span className="text-white/40">/ 100</span>
              </div>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">A rare combination of vision and pragmatism. Your next chapter rewards long-arc bets.</p>
            </div>
            <a href="/upload" data-testid="sample-cta" className="mt-8 inline-block text-sm text-[#D4AF37] hover:text-[#F5D061]">See your own →</a>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section id="testimonials">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Praise</p>
        <h2 className="hero-headline text-4xl sm:text-5xl mt-3 max-w-3xl">Trusted by people who don't trust easily.</h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-[#0A0A0A] border border-white/[0.06] rounded-3xl p-8">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-white/80 leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-transparent border border-white/10" />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">Pricing</p>
        <h2 className="hero-headline text-4xl sm:text-5xl mt-3 max-w-3xl">Choose your depth.</h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: "AI Palm Insight", p: "₹299", suf: "one-time", d: "One complete personalized report. Everything you need to start.", cta: "Analyze My Palm", hi: false, tid: "pricing-insight" },
            { n: "PalmMitra Plus", p: "₹399", suf: "/ month", d: "Daily guidance, unlimited reports, AI chat, monthly life forecast.", cta: "Start Plus", hi: true, tid: "pricing-plus" },
            { n: "PalmMitra Elite", p: "₹4,999", suf: "one-time", d: "The complete package. Compatibility, PDF magazine, priority support.", cta: "Go Elite", hi: false, tid: "pricing-elite" },
          ].map((plan) => (
            <div
              key={plan.n}
              data-testid={plan.tid}
              className={`rounded-3xl p-10 border transition-colors ${plan.hi ? "bg-[#0A0A0A] border-[#D4AF37]/50" : "bg-[#0A0A0A] border-white/[0.06] hover:border-[#D4AF37]/30"}`}
            >
              {plan.hi && <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] mb-6">Most Popular</p>}
              <h3 className="font-serif text-2xl">{plan.n}</h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl">{plan.p}</span>
                <span className="text-white/40 text-sm">{plan.suf}</span>
              </div>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">{plan.d}</p>
              <Link
                to="/upload"
                className={`mt-8 inline-block w-full text-center rounded-full py-3.5 text-sm font-medium transition-colors ${plan.hi ? "bg-[#D4AF37] text-black hover:bg-[#F5D061]" : "border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">FAQ</p>
        <h2 className="hero-headline text-4xl sm:text-5xl mt-3 max-w-3xl">Answers, if you're wondering.</h2>

        <div className="mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, idx) => (
              <AccordionItem
                key={idx}
                value={`f${idx}`}
                className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl px-6 data-[state=open]:border-[#D4AF37]/40"
                data-testid={`faq-item-${idx}`}
              >
                <AccordionTrigger className="text-left text-base hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#0A0A0A] p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src={AI_SPHERE} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative">
            <h2 className="hero-headline text-4xl sm:text-5xl">Your future is patient.<br />Are you?</h2>
            <Link
              to="/upload"
              data-testid="cta-final-btn"
              className="inline-block mt-10 bg-[#D4AF37] text-black font-medium rounded-full px-10 py-4 hover:bg-[#F5D061] transition-colors"
            >
              Analyze My Palm — ₹299
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
