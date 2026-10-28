# thedottie.app: the plan

Status: draft for Rob's yes (Oct 28 2026). Nothing beyond this document and the icon drafts in `brand/` is built.

The one hard rule: the site collects nothing. No analytics, no cookies, no third-party scripts, fonts, CDNs or embeds. Every font and asset is self-hosted. A strict Content-Security-Policy stops the page loading anything from another domain. The only outbound links are the App Store and Apple's standard EULA.

## 1. Design direction

**Feel.** The site is the app's Today screen, widened. Calm, warm, unhurried. One phone, one story, one accent. No feature-card grids, no stock photography, no illustrations of women holding phones. The ring is the brand mark; the phone is the proof.

**Palette.** Clay is the page default, straight from `src/theme/themes.ts`:

| Role | Clay light | Clay dark |
|---|---|---|
| Page gradient (3 stops) | #F7F2E7 → #F2E9D6 → #EDDCBB | #2A2620 → #221F19 → #1A1712 |
| Card | rgba(253,251,245,0.92) | rgba(52,47,39,0.92) |
| Ink / soft ink | #37342B / #8A8271 | #F3ECDE / #B4AB97 |
| Accent fill / accent text | #AC5D3E / #8B543E | #C4795B / #DDA684 |
| Secondary (sage) | #8FA98C | #8FA98C |
| Stardust | 196,121,91 and 217,168,92 | same |

The page follows the visitor's system scheme (Automatic), and the theme switcher in section 6 recolours both the phone and the page using the real Lagoon, Orchid and Midnight tokens. Themes are colour only, never layout, exactly as in the app. The page never uses a colour that is not an app token, with two exceptions: the phone's hardware (titanium greys) and the privacy diagram's neutral lines.

**Type.** The app uses Apple's system faces: SF for everything and New York (system serif) for a few display moments (the phase word in the ring, month names, the prediction headline). Two choices, my recommendation first:

1. Recommended: self-host **Newsreader** (SIL Open Font Licence, two subsetted woff2 files, about 60 KB) for the display moments, and use the system sans stack (`-apple-system, "SF Pro Text", system-ui, sans-serif`) for body text. On an iPhone or Mac the demo phone renders in the same sans the app does; on Windows or Android it falls back to Segoe or Roboto. Zero font requests on Apple devices beyond the serif.
2. Also self-host **Inter** for body text so every platform looks identical, at the cost of two more font files.

Either way, no font ever loads from another domain.

**Layout.** Mobile-first, a single column with a 16 px gutter up to 720 px; from 960 px a two-column stage: story text on the left, the phone fixed in view on the right. Maximum content width 1200 px. Vertical rhythm on an 8 px grid. Backgrounds are the app's 3-stop gradient, never flat, never blurred.

**Motion.** Every animation has a job: the ring settles in (the app's own supernova settle-in, about 1 s), the calendar fills day by day to show a logged period becoming a prediction, the Insights line draws to show cycles lengthening, the theme switch cross-fades tokens. Nothing loops forever except the ring's slow shimmer, which stops after 10 s like the app's. `prefers-reduced-motion` removes every transition and shows the final frame. No scroll hijacking: scrolling is always native, the phone's screen swaps when a section enters view.

**Voice.** Plain, warm, second person, sentence case. No em or en dashes anywhere on the site (the app's rule). No medical promises, no clinical claims, no "forever", "always" or "ever" about the business, no prices. Copy reuses the app's own wording wherever the app has a line for it.

## 2. Pages and sections

### `/` (home), as a story

| # | Section | What it says | What the phone shows |
|---|---|---|---|
| 1 | Hero | Icon, headline, one line, "Coming soon to the App Store" (becomes the App Store badge with one constant swap). Below it the six promises from Settings → About, verbatim. | Today, Clay, cycle day 15, "Period likely Nov 13–19", ring settles in. |
| 2 | Explore the app | "Tap around." The phone becomes interactive: Today, Calendar, Insights tabs; log a symptom; see it appear in Insights. | Live demo, visitor-driven. |
| 3 | Understand your cycle | Predictions are ranges, not a date. Logged periods, the expected window, the phases, and the key. "Based on your last 6 cycles · usually within 3 days." | Calendar: October logged, November's expected window drawn as a dashed range, phase tints, the key sheet. |
| 4 | Discover your patterns | Three selectable examples (steady cycles, lengthening cycles, a symptom that always arrives before a period) drive the Insights tabs. Ends on the Doctor visit summary. | Insights: Overview, Trends, Symptoms; then the report page. |
| 5 | Different life stages | Pregnancy, postpartum, changing cycles, First cycles, birth control modes, each as the app actually does it. A selector swaps the Today screen. | Today in each mode (pregnancy weeks, "Settling", "Bleeding · Day N", pack "Period · Day N"). |
| 6 | Make it yours | Clay, Lagoon, Orchid, Midnight chips plus Automatic / Light / Dark, exactly as Settings → Appearance. The page and the phone change together. | Today, recoloured. |
| 7 | Private by design | An accurate diagram: your phone (encrypted database, key in the Keychain), app lock and Face ID, decoy PIN, delete everything in two taps, a backup file you keep. No cloud in the picture because there is none. | Lock screen with the PIN pad, then Settings → Privacy & safety. |
| 8 | Download and FAQ | App Store link (placeholder), "iPhone, iOS 16.4 or later", FAQ, links to /privacy and /support, Apple's EULA. | Today, resting. |

Footer: Privacy, Support, EULA, "Made in Canada" only if Rob wants it, no social links (nothing to link to and they would be third-party anyway).

### `/privacy`
Clear headings and a marked placeholder block for Rob's final policy text. Same shell, same CSP.

### `/support`
hello@thedottie.app as a plain mailto link, a short FAQ (backups, lost passphrase, restoring purchases, deleting data, which devices), and a line about the local-only diagnostic log she can choose to attach when she emails.

## 3. Feature inventory

Every feature the site shows, with where the repo confirms it. Free or Plus is the real gate in code. Anything the docs mention but the code does not build is listed at the end as "not shown".

<!-- INVENTORY -->

## 4. Interaction list

All of these work by touch, mouse and keyboard (Tab, Enter, Space, arrow keys for the tab bar and segmented controls, Escape closes sheets). Every interactive element has a visible focus ring in the accent colour and an accessible name. With reduced motion on, every one of these still works; only the transitions go.

Phone demo (section 2):
1. Tab bar: Today / Calendar / Insights.
2. Today: tap the ring opens the day sheet (read-only in the demo).
3. "Log how you feel" opens the log sheet: flow (Spotting, Light, Medium, Heavy), pain 0 to 10, feelings chips, Symptoms chips, Done collapses to the "Today:" receipt line.
4. Logging Light, Medium or Heavy flow starts a period: the ring switches to "Period · Day 1", the calendar paints today, the headline follows the app's rule and describes now.
5. Logging a symptom (say Cramps) adds a row to Insights → Symptoms, "1 of 1 · menstrual", so the visitor sees the link between logging and patterns.
6. Calendar: swipe or arrow between the current month and next; tap a day opens the day sheet; the Key sheet lists every state.
7. Insights: Overview / Trends / Symptoms / History tabs; Last 6 / Last 12 / All time segments.
8. Reset: a small "Start over" under the phone restores the seeded demo.

Page controls:
9. Section 4: three example chips drive the Insights data.
10. Section 5: life-stage chips swap the Today screen.
11. Section 6: theme chips and Automatic / Light / Dark.
12. Section 7: a two-step "Delete all data" demo (tap, confirm, the screen empties), and a PIN pad demo that explains the decoy PIN without pretending the site can know which PIN is which.
13. FAQ: native `<details>` disclosures, no JavaScript needed.

Everything happens in the page. No form posts anywhere, no storage of any kind (not even localStorage), nothing persists between visits.

## 5. Build and technical approach

- Plain HTML, CSS and JavaScript, no framework, no build step required to view. One optional node script optimises images (webp/avif) and subsets fonts; its output is committed so GitHub Pages serves static files only.
- One shared stylesheet and one script. Styles and scripts are external files only, so the CSP can omit `'unsafe-inline'`.
- CSP as a `<meta http-equiv="Content-Security-Policy">` (GitHub Pages cannot set headers): `default-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; manifest-src 'self'; upgrade-insecure-requests`. Verified by loading the finished site with the network panel open and by a script that lists every URL referenced from the built files.
- The phone frame is CSS and inline SVG (titanium edge, dynamic island, rounded screen), not a photograph. The ring, charts and calendar are inline SVG drawn from the same arithmetic as the app's `StardustRing` and `src/insights/charts.tsx` (ported by hand, read-only).
- Sample data is a single fictional dataset in one file so it can be changed without touching the screens.
- SEO: title, description, canonical, Open Graph and Twitter card tags with a self-hosted image, `robots.txt`, `sitemap.xml`, JSON-LD for the app (SoftwareApplication) without a price.
- Checks before shipping: phone (390 px) and desktop (1440 px) screenshots; reduced motion on; a full keyboard pass; Lighthouse on accessibility and performance; and the zero-outside-request check above.
- A README explains how to change the sample data, the themes, the copy, the App Store link, and how to re-run the checks.

## 6. Hosting

GitHub repo `Tweetymobile/thedottie-site` (private for now; GitHub Pages on a personal account needs the repo public or a paid plan, Rob decides when we get there). Pages serves from `main`, root. A `CNAME` file holds `thedottie.app`. Custom domain plus Enforce HTTPS in the repo settings once GitHub has issued the certificate. The exact GoDaddy records and the parking switch-off come with step 4, taken from GitHub's own instructions at that time. Nothing is published and the domain is not pointed until Rob says.

## 7. Open questions for Rob

1. Type: Newsreader plus system sans (recommended), or Newsreader plus Inter?
2. The hero headline. Three candidates, all in the app's voice: "Nothing you log leaves this phone." / "A cycle tracker that keeps your cycle to itself." / "Private, from first period to last." Pick one or give me the line.
3. iPad: the app's config allows iPad (`supportsTablet: true`). Should the site say "iPhone and iPad" or just "iPhone"?
4. Plus: show the Plus features with a quiet "Plus" tag exactly as Settings does, with no prices (Apple sets them)?
