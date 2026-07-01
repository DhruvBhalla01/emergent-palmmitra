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
- Report page: Overall score ring, 6 category score cards, PAYWALL with blurred preview + glassmorphism unlock CTA when locked; full luxurious sectioned report when unlocked
- Payments: `/api/payment/plans`, create-order + verify (auto-unlocks in mock mode; ready for Razorpay checkout script)
- Dashboard: user greeting, subscription + referral cards, list of prior reports, new-analysis CTA
- **P1 (2026-02): PDF magazine export** — reportlab generates A4 luxury PDF with gold cover + all sections; `/api/palm/reports/{id}/pdf` served with blob download
- **P1 (2026-02): Referral system** — auto-generated PM[hex6] codes, `/api/referral/me` + `/apply`; ₹100 credit on referred user's first paid order; shareable link on dashboard
- **P1 (2026-02): AI Chat with report memory** — `/api/chat/{report_id}/message` uses GPT-5.2 with the user's report as system-context; chat history persisted in `chat_messages`; frontend `/chat/:id` page with suggestion chips
- **P1 (2026-02): Subscription lifecycle** — `subscription` field on user with plan/status/period_end/canceled_at; `/api/subscription/status` + `/cancel`; auto-activated on plus/elite payment verify; dashboard subscription card with cancel button

## Backlog (P0/P1/P2)
- **P0** Add real Razorpay API keys to `.env` (user will provide) — checkout.js already loaded
- **P1** Razorpay auto-renewal for Plus (uses Razorpay Subscriptions API)
- **P2** Daily/weekly/monthly guidance for Plus users
- **P2** Admin dashboard (users, revenue, coupons, feature flags, AI logs)
- **P2** Coupon codes at checkout
- **P2** Analytics events (funnel, heatmaps)
- **P2** Blog / SEO / SSR-ready pages
- **P2** Apple sign-in

## Phase 1 — Landing conversion redesign (2026-07-01)
- Hybrid identity: dark-luxury copper base + subtle Shastra warmth (Sanskrit eyebrows in Cormorant gold, mandala watermark). Studied production palmmitra.in for structure.
- Added: trust line, stat strip (12,400+/4.9★/2,000+/~2min), 3-step process w/ timing badges, five-truths features, SAMPLE REPORT reveal (FREE/PREMIUM tags), comparison table, testimonial stats header, countdown-urgency CTA + PALMFRIEND. Custom generated on-brand imagery.

## Phase 2 — Free-preview model (2026-07-01)
- Backend `GET /api/palm/reports/{id}`: when locked, returns 2 FULL sections (personality + love) + all category scores + overall summary; rest gated. Adds `free_sections`.
- Report.jsx locked view: overall score + summary + score grid + 2 free sections ("2 SECTIONS FREE" green badge), then blurred remainder + "12 more sections are waiting" paywall (₹299).
- Verified via API + browser screenshots.

## Next Tasks
1. **Phase 3 — PalmMatch** (two-palm compatibility, ₹4,999): `palmmatch_reports` collection, `POST /api/palmmatch/analyze` + `GET /api/palmmatch/{id}`, reprice `match` plan→₹4,999, frontend `/palmmatch` upload(A/B)→analyzing→result (compat ring + category bars + paywall), landing/nav entry.
2. Optional polish: hero "40+"→"15+ markers"; refine Nav/Footer `P` mark to copper.
3. Razorpay webhook listener; real Razorpay keys → go live.
4. Refactor high-complexity backend fns + large React components (P2).
