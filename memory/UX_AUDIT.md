# PalmMitra — UI/UX Audit (2026-07-01)

## Critical bugs
1. Comparison table collapses to header-only (rows clipped) — CSS grid + React.Fragment height bug. HIGH.
2. Chat renders raw markdown `**bold**` as literal asterisks — no markdown renderer. HIGH.

## Design-system inconsistencies
3. Two accent systems: Landing/Chat/PalmMatch use copper #D97757 + gold #E4B248; Report/Dashboard/Admin/Auth use legacy #D4AF37/#F5D061. Buttons/badges differ page to page. HIGH.
4. Hero proof numbers inconsistent: "40+ signals decoded" vs "15 markers"/"2,000-word". MEDIUM.
5. Dashboard stale naming: "PalmMitra Plus / Explore Plus →" contradicts Membership model; no wallet/free-question surfacing. MEDIUM.
6. Blog imagery gold-toned, off copper system. LOW.

## UX / conversion
7. Dashboard shows failed report with no retry/delete; weak error/empty states. MEDIUM.
8. Nav: no mobile hamburger, no logged-in wallet/membership status, no active state, no sticky treatment. MEDIUM.
9. Evergreen midnight countdown "₹50 launch offer" = fake urgency + price mismatch. Trust risk. LOW-MED.
10. Upload dropzones overly tall; primary CTA below the fold. LOW.

## Accessibility
11. Muted grey text (#71717A on near-black) fails WCAG AA; tiny overline tracking; missing visible focus states; icon-only buttons lack aria-labels. MEDIUM.

## Not yet audited
- Auth, Analyzing screen, locked/free-preview Report, true Mobile/Tablet (tool rendered desktop).
- Membership benefits (Daily Guidance / Weekly Plans / Monthly Forecast) are sold but not built.
