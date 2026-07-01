# PalmMitra — Product Requirements Document

## Original Problem Statement
Build PalmMitra from scratch — a premium AI Life Guidance Platform where palm image analysis is only the entry point. Apple-level simplicity, Headspace calm, Notion polish, Stripe trust, luxury fashion aesthetics. Dark theme, gold accent, black background. Never mystical or scammy. Full journey: Landing → Upload → AI analyze → Loading experience → Report preview → Paywall → Payment → Full report → Dashboard.

## Tech Stack
- Backend: FastAPI + MongoDB (Motor)
- Frontend: React 19 + Tailwind + Shadcn UI + Framer Motion + lucide-react
- AI: OpenAI GPT-5.2 (vision + text) via EMERGENT_LLM_KEY (emergentintegrations library)
- Auth: Custom JWT (email/password) + Emergent-managed Google OAuth (cookie session)
- Payments: Razorpay integration (MOCK MODE — placeholders in .env, verify auto-unlocks)

## User Personas
1. **Curious professional** (25-40): wants premium insight, willing to pay ₹299 for quality
2. **Growth seeker**: subscribes to Plus for daily/weekly AI guidance
3. **Gifter / referrer**: shares reports with friends, drives word-of-mouth

## What's Been Implemented (2026-02)
- Landing page: Hero, Benefits, How it Works, Features, Sample, Testimonials, Pricing (4 tiers), FAQ, Footer
- Authentication: email/password (register + login with JWT), Emergent Google OAuth flow, session cookie + fallback bearer, `/api/auth/me`, `/api/auth/logout`
- Palm upload: drag-drop + camera capture, JPEG/PNG/WEBP validation, dual palm slots, name/DOB inputs, quality guidelines
- Analyzing screen: animated palm-scan SVG with gold scan line + rotating gold sphere, 12 rotating insight stages, progress bar
- AI Analysis: GPT-5.2 vision analyzes palm image(s) and returns 20+ section JSON report (personality, career, money, love, marriage, family, health, strengths, weaknesses, hidden talents, lucky years, life timeline, action plan, recommendations, summary, etc.)
- Report page: Overall score ring, 6 category score cards, PAYWALL with blurred preview + glassmorphism unlock CTA when locked; full luxurious sectioned report when unlocked (bento grid, chips, timeline)
- Payments: `/api/payment/plans`, create-order + verify (auto-unlocks in mock mode; ready for Razorpay checkout script)
- Dashboard: user greeting, upgrade banner, list of prior reports with scores, new-analysis CTA
- Design system: Playfair Display + Outfit fonts, black + #D4AF37 gold, rounded-3xl corners, generous spacing, subtle borders, no ugly gradients

## Backlog (P0/P1/P2)
- **P0** Add real Razorpay API keys to `.env` (user will provide) — checkout.js already loaded
- **P1** PDF report export (magazine-quality layout)
- **P1** Referral system: codes, credits, leaderboard, share links
- **P1** Subscription lifecycle (Plus monthly renewals, cancellation, dunning)
- **P1** AI Chat with the report as context (memory of prior reports)
- **P2** Daily/weekly/monthly guidance for Plus users
- **P2** Admin dashboard (users, revenue, coupons, feature flags, AI logs)
- **P2** Coupon codes at checkout
- **P2** Analytics events (funnel, heatmaps)
- **P2** Blog / SEO / SSR-ready pages
- **P2** Apple sign-in

## Next Tasks
1. Ship real Razorpay integration once keys are provided
2. Add PDF export (server-side rendering with reportlab or client-side with html2pdf)
3. Referral system (models + share flow)
