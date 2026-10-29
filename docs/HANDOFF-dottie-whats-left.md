# Entry for the app repo's docs/dottie-whats-left.md

**Folded in, Oct 28 2026:** this entry is now item 127 of the app's `docs/dottie-whats-left.md` (commit `e51c4b9`), with each ask's status. Kept here as the record.

Written in the site repo on purpose: this session never writes inside ~/Documents/Dottie. Paste the block below into the app's open-items record, or ask the site session to do it with the rule lifted for that one file.

---

## Website (thedottie.app), Oct 28 2026

Site repo: ~/Documents/dottie-site, GitHub Tweetymobile/thedottie-site (public), GitHub Pages, HTTPS enforced, live. It collects nothing: no analytics, cookies, third-party scripts, fonts or embeds; a strict CSP; the only outbound links are the App Store (placeholder until approval), Apple's standard EULA and Apple's privacy policy (from the privacy text).

Done today
- Home page (ring, honesty, interactive phone recreation, life stages, themes, privacy tests, doctor summary, about note, download and FAQ), /privacy (Rob's policy, effective Oct 28 2026, with the Apple Health and doctor-report corrections), /support.
- DNS at GoDaddy points to GitHub Pages; Zoho MX, SPF and DKIM untouched and resolving.
- App icon final: the stardust ring, no text. Finished files for the asset catalog in the site repo: `brand/icon/icon-light-1024.png` (RGB), `brand/icon/icon-tinted-1024.png` (RGB), `brand/icon/icon-dark-1024.png` (RGBA, transparent background, haze dropped). SVG sources beside them.

Owed by the app side
- Install the three icon PNGs (Expo `ios.icon` with light, dark and tinted keys), then rebuild and check all three appearances on a device. Decide whether the dark icon keeps the plum haze (currently off; one flag in `brand/build-icons.mjs`).
- When App Store approval lands, send the site the App Store URL; the swap is one constant in `assets/js/site.js`.
- Anything the privacy policy promises that the app must honour: doctor report copy deleted after sharing; imported Apple Health periods included in backups, synced readings excluded; "Delete all data" clears Health readings and reminders. Worth a check against the code before submission.
