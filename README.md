# thedottie.app

The marketing site for Dottie, a private iOS cycle tracker. Plain HTML, CSS and JavaScript, no build step, no framework. It collects nothing: no analytics, no cookies, no storage, no third-party scripts, fonts or embeds. A strict Content-Security-Policy on every page forbids any request to another domain.

## Layout

- `index.html` the home page (hero, the ring that becomes her cycle, honesty, the interactive phone, every stage, pick your vibe, private by design, the doctor visit summary, a note from Rob about why Dottie exists, download and FAQ).
- `privacy/index.html` the privacy policy. The dashed placeholder block is where the final text goes; keep headings as `h2`.
- `support/index.html` support, with the mailto and a short FAQ.
- `assets/css/tokens.css` the app's four themes, generated from `src/theme/themes.ts` values. Regenerate by re-running the generator at the top of this file's history (`scripts/gen-tokens.py` is the script; its values are copied from the app, read-only).
- `assets/css/site.css` everything visual. Night sections use the fixed Midnight tokens (`--m-*`); day sections and the demo phone follow the visitor's theme pick.
- `assets/js/data.js` the demo's fictional dataset. Change the numbers here and the phone, the stage calendar, the charts and the honesty section follow.
- `assets/js/notes.js` Dottie's first-run warmth notes, verbatim from the app. Never edit a line; replace the whole file from the app's `src/copy/warmthNotes.ts` if the pool changes.
- `assets/js/ring.js` the hero and stage ring (the launch moment's dust field: seed 1337, 360 motes) and the note-of-the-day pick (`hashSeed('warmthNote:firstRun:' + date)`, the app's own rule).
- `assets/js/phone.js` the interactive phone: Today, Calendar, Insights and the log sheet.
- `assets/js/site.js` page behaviour: the App Store link constant, the stage, the theme switcher, the three privacy demos.
- `assets/fonts/` Fraunces, Bricolage Grotesque and Newsreader, latin subsets, with their SIL Open Font Licence files.
- `brand/` the app icon and logo. Decision (Rob, Oct 28 2026): the icon is the stardust ring only, no text, final. `icon-dottie.svg`, `icon-dottie-dark.svg` and `icon-dottie-tinted.svg` are the sources; `icon/icon-light-1024.png`, `icon/icon-dark-1024.png` and `icon/icon-tinted-1024.png` are the finished 1024 x 1024 RGB PNGs (no alpha) for the app's asset catalog. `logo-dottie*.svg` carry the wordmark for marketing only. `node brand/build-icons.mjs` regenerates all of it, plus the site's `assets/img/icon-180.png` and `favicon-32.png`.

## Updating the site as the app changes

1. **The App Store link.** In `assets/js/site.js`, set `APP_STORE_URL`. Every "Coming soon to the App Store" becomes a link that reads "Download on the App Store".
2. **Wording.** Every quoted line on the page is the app's own. Check against `src/copy/framing.ts`, `src/copy/settings.ts`, `src/cycle/model.ts`, `src/cycle/pregnancy.ts`, `src/copy/firstCycles.ts` and `src/doctor/report.ts` in the app repo before changing one. `docs/PLAN.md` lists where each feature is confirmed.
3. **Themes.** If `themes.ts` changes, regenerate `tokens.css`.
4. **The minimum iOS.** It appears in the download section, the FAQ, the support page and the JSON-LD block in `index.html`.
5. **The privacy policy.** Replace the placeholder block in `privacy/index.html`.

## Checks

```
node scripts/serve.mjs 8080        # local server at http://127.0.0.1:8080/
node scripts/shoot.mjs             # screenshots into shots/site/ at 390 and 1440, reduced motion, dark, a theme, a section tour
```

`shoot.mjs` ends by printing every request the pages made and how many left the local server. That number must be 0, and console errors must be 0.

Inline `style` attributes are forbidden by the CSP. Per-element values travel as `data-s` and are applied through the CSSOM. External scripts are the only scripts; the one inline `<script type="application/ld+json">` is a data block, not executed.

## Hosting

GitHub Pages from `main`, root, repo public. `CNAME` holds `thedottie.app`. GoDaddy DNS for the apex: four A records to 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 and four AAAA records to 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153; `www` is a CNAME to `tweetymobile.github.io`. Zoho's MX, SPF and DKIM records stay as they are. Enforce HTTPS is on (certificate issued Oct 28 2026, renews automatically). After any deploy, `node scripts/audit-live.mjs https://thedottie.app` visits every page in headless Chromium and fails if any request leaves the site, a cookie is set, or plain HTTP stops redirecting to HTTPS.

The privacy policy's effective date is in `privacy/index.html` (the lede under the title); update it whenever the policy changes.
