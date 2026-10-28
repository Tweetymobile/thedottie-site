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

Checked by reading the code (read-only) on Oct 28 2026. "Free" and "Plus" are the real gates (`src/entitlement/useEntitlement.ts`). The site shows only the "Shown" rows.

### Shown on the site

| Feature | Tier | Wording the site reuses | Confirmed in |
|---|---|---|---|
| Three tabs: Today · Calendar · Insights; Settings behind the gear | Free | | `app/(tabs)/_layout.tsx:22` |
| The stardust ring: cycle day, phase word, the expected-period band | Free | "The stardust is your cycle so far · the soft band is your expected period" | `src/components/StardustRing.tsx`, `src/copy/framing.ts:68` |
| Ring words | Free | "Follicular", "Ovulation", "Luteal", "Running long", "Settling", "Watching", "Pregnant"; pack: "Pack" / "Day 14 of 28" | `src/cycle/model.ts:613-619,188,2308,943` |
| Prediction as a range with its evidence | Free | "Period likely Nov 13–19" · "Based on your last 6 cycles · usually within 3 days" · "Based on 3 cycles. This will get more precise." · first prediction "based on your setup answers · sharpens as you log" | `model.ts:2600`, `src/cycle/evidence.ts:24-32`, `knowledge.ts:108` |
| Late period, calm | Free | "This can happen for many reasons: stress, illness, travel, changes in your body, and more. Dottie is simply recording it, not reading anything into it." | `model.ts:664-666` |
| Log row: two-tap trio (flow · pain · feelings), then Symptoms / More; Done collapses to a "Today:" receipt | Free | flow: Spotting, Light, Medium, Heavy, Flooding · pain 0 to 10 · feelings: Calm, Happy, Energetic, Confident, Irritable, Anxious, Sad, Stressed, Sensitive, Foggy, Overwhelmed, Motivated | `src/constants/logging.ts:18-24,123-136,192`, `src/components/daylog/DayLogSections.tsx` |
| Symptom chips (29) | Free | Cramps, Headache, Bloating, Tender breasts, Acne, Fatigue, Nausea, Back pain, Discharge, Insomnia, Cravings, Dizziness, Diarrhea, Constipation, Joint pain, Hot flashes, Low libido, Night sweats, Brain fog, Palpitations, Vaginal dryness, Anxiety, Urinary changes, and more | `logging.ts:47-77` |
| More: cervical mucus, stress, exercise, energy, medications, weight (opt-in), blood pressure (opt-in), note | Free | note placeholder "Some days need a sentence, not a checkbox." | `src/components/daylog/MoreLog.tsx` |
| "My period started" / auto-start on flow with Undo | Free | "Got it. Your predictions just updated." | `framing.ts:40`, `src/copy/pools.ts:38-70` |
| Phase notes under the ring (Rob's writing; the site quotes one or two verbatim, never edits) | Free | | `src/copy/phaseNotes.ts` |
| Calendar: logged periods, spotting, expected window (dashed), phase tints, today ring, the Key sheet | Free | "Period (logged)", "Spotting", "Expected" ("The window when your period may start."), "Follicular", "Ovulatory", "Luteal", "Symptom usually starts here" | `app/(tabs)/calendar.tsx:203-262`, `src/cycle/bands.ts:59-60` |
| Calendar: two months free, twelve with Plus | Plus | "See 12 months ahead with Plus" · "Prediction ranges widen the further ahead you look." | `src/cycle/calendarRange.ts:18-19`, `framing.ts:250-252` |
| Fertile window outline (opt-in, natural mode, needs 3 cycles, off on hormonal methods) | Free | "Fertile-window estimates are for awareness only. They should never be used as contraception…" | `settings.ts:58-59,135` |
| Insights header | Free | "Your patterns are calculated on this device and never uploaded." | `framing.ts:167` |
| Insights tabs: Overview · Trends · Symptoms · History | Free | | `app/(tabs)/insights.tsx:108-111` |
| Overview: top card, "Key numbers" (Average cycle · Full spread · Typical period), "Where you are", "Most consistent symptoms", "Doctor visit summary" | Free | "Based on your last 12 completed periods." | `insights.tsx:836-851,893,992-1032` |
| Trends: Last 6 / Last 12 / All time; "Cycle and period" chart; "Cycle spread" (Usual variation · Full spread · Typical period) | Free | "Your trends will appear after two full cycles." | `insights.tsx:1115-1163` |
| Symptoms: By frequency / By phase, counts not percentages, "When it usually happens" | Free | "12 of 12 · menstrual" | `insights.tsx:1217-1218` |
| Symptom timing and heads-ups (when a symptom usually starts, next likely window, the day-before reminder) | Plus | "Timing & heads-ups" · "This is part of Dottie's paid insights. Your logging and history are free, and so are predictions for the weeks ahead." | `insights.tsx:1348-1374`, `src/entitlement/copy.ts:15` |
| Cycle recap after each cycle | Plus | "After each cycle, Plus picks out what was different about it, from your own logs." | `src/insights/recap.ts:506`, `insights.tsx:1527` |
| Doctor visit summary PDF: At a glance, Cycle statistics, Status, Periods, Flagged cycles, Symptoms, Symptom patterns, How these estimates were made; her own note | Free | "Created on this device from your own data." · "This PDF isn't encrypted." · footer "No data left the device." | `src/doctor/report.ts:991-1025`, `framing.ts:328,358-360` |
| Doctor visit summary, fuller: Health details (typed per export, never saved), Cycle detail table, Worth discussing, Symptom timing detail | Plus | "A fuller doctor visit summary, with a cycle table, flagged patterns and a day-by-day symptom map" | `src/doctor/DoctorFlow.tsx:250-300`, `src/entitlement/paywallCopy.ts:18-29` |
| Birth control modes: natural (none, copper IUD, other) · pack (combined pill, ring, patch) · observe (mini-pill, hormonal IUD, implant, shot) | Free | pack: "Placebo days start Nov 16 · period usually on day 2" · "From your pack schedule." · observe: "No period prediction on this method. Dottie watches for changes instead." · "Bleeding days this month: 4 · last month: 4" | `src/cycle/birthControl.ts:71-86`, `model.ts:2319-2335` |
| Pack: a heads-up the evening before the usual placebo-week period (needs the daily reminder on) | Free | | `src/state/CycleStore.tsx:1261-1264`, `src/notifications/reminders.ts:77-91` |
| Pregnancy mode: week counter, due date, dating basis, weekly notes, appointment notes, questions list; cycle tracking paused | Free | "Week 20 · due around Mar 17" · "Dated from your last period. Estimates can shift after a scan." · "A week counter, your records and the Doctor visit summary, and nothing else." | `src/cycle/pregnancy.ts:193-268`, `model.ts:1945` |
| Loss flow: "I'm no longer pregnant", resume now or pause, delete pregnancy data, save a doctor summary first | Free | "Take whatever time you need. Dottie will be here, exactly as you left it." | `pregnancy.ts:283-299` |
| Postpartum: predictions stay off until a new period, then ranges until three cycles settle | Free | "Cycles coming back after a pregnancy often vary. The range narrows as new ones are logged." | `src/cycle/postpartum.ts:110-111`, `pregnancy.ts:762-763` |
| Changing cycles: the goal, ranges instead of dates, the transition log (hot flashes), the invitation, the 12-month counter, the bleeding-after-12-months notice | Free | "Your cycles have been more variable lately…" · "12 months without a recorded period." · "Bleeding after 12 months without a period is something doctors recommend getting checked promptly, even when it turns out to be nothing." | `src/cycle/invite.ts:51-57`, `src/components/FmpCounter.tsx:25`, `src/cycle/fmp.ts:561` |
| Changing cycles: dated ranges and the Monthly symptoms score | Plus | | `app/(tabs)/index.tsx:169-199`, `src/insights/TransitionCard.tsx:38` |
| First cycles: wide predictions, fertility features off, its own explanations and reading room, graduation offer | Free | "Log a few periods and Dottie can start showing you what to expect" · "a trusted adult, school nurse, or doctor" | `src/copy/firstCycles.ts:61-106`, `src/cycle/firstCycles.ts:112` |
| Trying to conceive: fertile window centred, LH and test logging, ovulation confirmed from Apple Health temperature | Plus | "Dottie is not contraception." | `src/cycle/ttc.ts:36-46`, `model.ts:2747-2761` |
| Apple Health: one-time period-history import | Free | "A one-time import from Apple Health. Days you've already logged stay as they are." | `src/health/native.ts:49-50`, `app/settings.tsx` |
| Apple Health sync, read-only: sleep, temperature, weight, blood pressure | Plus | "Reading sleep, temperature, weight, and blood pressure from Apple Health." | `native.ts:33-38`, `settings.ts:159-162` |
| Themes Clay · Lagoon · Orchid · Midnight; Automatic · Light · Dark | Free | "Pick your vibe" · "You can change this anytime in Settings." | `src/theme/themes.ts`, `settings.ts:76-78`, `src/components/AppearancePicker.tsx` |
| App lock: 4-digit PIN, Face ID, locks on background, wrong tries slow down and never wipe | Free | "Choose a 4-digit PIN" · "Use Face ID" | `settings.ts:45,237`, `src/auth/auth.ts:52-60`, `src/auth/relock.ts` |
| Decoy PIN: Believable / Blank / Custom, a second database, no tell | Free | "A decoy PIN needs a real PIN to hide behind." | `app/settings.tsx:944-947`, `auth.ts:323-360` |
| Delete all data, two taps | Free | "Delete all data?" · "Everything on this device will be permanently deleted. Because your data isn't stored on a server, it can't be recovered." · "Delete everything" | `settings.ts:60-63`, `auth.ts:266-281` |
| Encrypted backup she keeps: passphrase, scrypt, AES-256-GCM, a `.dottie` file via the share sheet; restore from Settings or the lock screen | Free | "Export encrypted backup" · "If you forget this passphrase, the file is gone." | `src/backup/ExportFlow.tsx:61,74`, `src/vault/envelope.ts:20-60` |
| Encrypted database: SQLCipher, a random 256-bit key in the Keychain, this device only, excluded from device backups | Free | | `src/db/index.ts:4-36`, `src/vault/keystore.ts:26-28`, `modules/dottie-privacy` |
| Local-only reminders with a plain lock-screen title | Free | title "Reminder" · "A quick check-in for today?" | `src/notifications/reminders.ts:20-22,127`, `plugins/withNoPushEntitlement` |
| Plus: Monthly, Yearly (7-day free trial), Buy once; Restore purchases; Family Sharing off | Plus | "Checks your App Store purchases with Apple. No Dottie account required." · "Paid or not, your data stays on this device. Plus adds insight, not collection." | `dottie.storekit`, `modules/dottie-iap/README.md`, `paywallCopy.ts:50-72` |
| Library of plain-language reads (2 free, 17 with Plus, 5 First Cycles) | Plus | | `src/library/pack.ts:136` |
| The six promises | | verbatim from Settings → About | `src/copy/settings.ts:23-30` |
| Disclaimer | | "Dottie is information only. It is not medical advice or contraception." | `settings.ts:206` |
| Reduce Motion honoured in the app | Free | | `src/ui/motion.tsx` |
| Devices | | iOS 16.4 or later; iPad is enabled in config but its layout has never been checked | `ios/Podfile:25`, `app.json`, audit note |

### In the docs but not in the code, so not shown
- Daily pill reminders; IUD, implant and shot replacement reminders (fields exist, nothing reads them).
- Manual temperature entry (temperature comes only from Apple Health).
- CSV import from other apps (deferred).
- Alternate or disguise app icons, widgets, Apple Watch, partner share.
- Mood patterns (feelings are logged, never analysed).
- Kick counter, contraction timer, Panic delete (built then removed).

### Things I noticed that are Rob's call, not mine
- The app's doctor summary sub-line says "one-page PDF"; the Plus report can run to several pages. The site will say "a PDF" and not promise a page count.
- Range-mode predictions: free users see "Likely within the next 1–4 weeks", Plus users see dates. The site shows it exactly that way.
- The app does not launch on iOS 27 yet (open item in the Dottie repo). The site says "iOS 16.4 or later" and nothing about 27.
- Phase 12 editorial review is still open, so some in-app wording the site quotes could still change; the README will say where each quote comes from so it can be re-checked.


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

GitHub repo `Tweetymobile/thedottie-site` (created, private; GitHub Pages on a free personal account needs the repo public or a paid plan, Rob decides at step 4). Pages serves from `main`, root. A `CNAME` file holds `thedottie.app`. Custom domain plus Enforce HTTPS in the repo settings once GitHub has issued the certificate. The exact GoDaddy records and the parking switch-off come with step 4, taken from GitHub's own instructions at that time. Nothing is published and the domain is not pointed until Rob says.

## 7. Open questions for Rob

1. Type: Newsreader plus system sans (recommended), or Newsreader plus Inter?
2. The hero headline. Three candidates, all in the app's voice: "Nothing you log leaves this phone." / "A cycle tracker that keeps your cycle to itself." / "Private, from first period to last." Pick one or give me the line.
3. iPad: the app's config allows iPad (`supportsTablet: true`). Should the site say "iPhone and iPad" or just "iPhone"?
4. Plus: show the Plus features with a quiet "Plus" tag exactly as Settings does, with no prices (Apple sets them)?
