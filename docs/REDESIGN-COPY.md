# Redesign copy list (branch `redesign-stages-safety`, Nov 3 2026)

Every new user-facing line on the site, for Rob's approval. Nothing here is deployed. Lines in quotes inside the stage cards are the app's own strings (checked against the app repo, read-only); everything else is a draft in Dottie's voice.

## Nav (new)
- How it works · Try it · Every stage · For parents · Safety · Privacy · Questions

## Hero (one new line)
- For first periods, everyday cycles, trying to conceive, pregnancy, the months after, and changing cycles. One app, in its own quiet voice.

## Every stage of life, one app (replaces the old "Every stage, the same quiet app" timeline)
- H2: Every stage of life, one app.
- Lede: Dottie changes what it says, not who it is. You choose the mode when you set it up, and you can change it in Settings when life changes.

First Cycles
- Tile: Cycle day 9 · Follicular · “Log a few periods and Dottie can start showing you what to expect” (app)
- For periods that started in the last couple of years.
- Predictions stay wide while Dottie learns, and it says so. Fertility features are off. Explanations assume you are new to all this, and five short reads cover the basics. All of it is free, with nothing for sale inside the mode.
- Link: For parents ↓

Everyday cycle tracking
- Tile: Cycle day 15 · Follicular · “Period likely Nov 12–18 · Based on your last 6 cycles” (app)
- For knowing where you are in your cycle, and what tends to come with it.
- Log a period in two taps. Your expected period shows as a range with what it rests on, and over time your symptoms sort themselves by phase. On the pill, ring or patch, Dottie counts from your pack schedule instead of guessing. On a hormonal IUD, implant or shot it makes no prediction at all and watches for changes instead.

Trying to conceive (Plus tag)
- Tile: Cycle day 13 · Ovulation · “An estimate for timing, not birth control.” (app)
- For when you want to time things.
- Dottie centers your fertile window, adds LH and test logging, and estimates ovulation from temperature read from Apple Health. The window appears after three logged cycles. It is an estimate for timing, not birth control.

Pregnancy
- Tile: Week 20 · Pregnant · “Week 20 · due around Mar 17” (existing site line)
- For when you are pregnant.
- A week counter, and a due date you can update if your care provider gives you a different one. Your records, a short note for each week, and the doctor visit summary. No development content and no new app. If the pregnancy ends, one line turns everything pregnancy related off, and you choose whether to resume cycle tracking now or pause for a while.
- Quote: “Take whatever time you need. Dottie will be here, exactly as you left it.” (app)

After a pregnancy
- Tile: Cycle tracking · Paused (two Settings strings, app) · “Predictions stay off until a new period is logged.” (app)
- For the months after a pregnancy, however it ended.
- Predictions stay off until you log a new period. When cycles come back, Dottie shows ranges that narrow as new ones are logged. There is no schedule your body is meant to keep.
- Quote: “Cycles coming back after a pregnancy often vary. The range narrows as new ones are logged.” (app)

Changing cycles
- Tile: Cycle day 41 · Running long · “Likely within the next 1–4 weeks.” (app)
- For perimenopause and menopause.
- When cycles vary, Dottie shows a range of weeks instead of a date, and says why. Hot flashes and the other transition symptoms have their own place in the log. A quiet counter keeps the months since your last period, and if bleeding returns after 12 months, Dottie says plainly that doctors recommend getting it checked. Plus adds dated ranges and a monthly symptoms score.
- Quote: “12 months without a recorded period.” (app)

## For parents (new section)
- H2: For parents
- Lede: If someone in your family has just started her periods, this is the part of Dottie written for her, and here is what it is and isn't.
- Ring caption: A wide band is an honest one. First Cycles keeps it wide while her cycles settle.
- What First Cycles is: A mode she turns on by choosing “My periods started recently” when she sets up Dottie, or later in Settings. Predictions stay wide while her cycles settle, and Dottie tells her that is normal where she is. Explanations assume she is new to all this.
- What it doesn't show: No fertile window, no ovulation estimates and no conception tracking. No “irregular” label, because the first years are meant to vary. The adult reading room stays out of it. She gets five short reads written for her age: what is happening in your body, the first couple of years, period products and using them safely, cramps and what helps, and what is worth mentioning to someone.
- What it costs: Nothing. Everything in First Cycles is free, and there is nothing for sale inside it. No upgrade prompts and no locked cards.
- Where her data goes: Nowhere. Dottie has no account to create and no server to send anything to. What she logs stays on her phone, encrypted.
- If she wants to talk to someone: Where an adult would be pointed to a doctor, First Cycles points to a trusted adult, school nurse, or doctor. It names no one in particular.
- Age: Dottie is for ages 13 and up.
- It's hers: First Cycles is a mode she chooses, and she can turn it off in Settings when she is ready. Dottie has no parental view. What she logs is on her phone and nowhere else.

## Safety (new section; keeps the airplane and delete demos)
- H2: Safety features are free for everyone. (the app's promise line)
- Lede: Some people track because home isn't safe. These are built in, and none of them is paid.
- App lock: A 4-digit PIN or Face ID. Dottie locks the moment it leaves the screen, with no grace period. Wrong guesses slow down, and nothing is wiped.
- Decoy PIN: A second PIN for when someone else picks up your phone. It keeps what you logged private.
- No account: Nothing to sign up for and nothing to sign in to. There is no profile anywhere that says you use a period tracker.
- Delete all data: Two taps in Settings erase everything, including the keys that lock it. There is no server copy, so only a backup you saved yourself can bring it back.
- Reminders that keep quiet: Reminders are made on your phone. The lock screen shows the word “Reminder” and a plain line like “A quick check-in for today?”. Nothing on it says what you track.
- Not a medical device: Dottie is not a medical device. It offers information only, not medical advice or contraception. It doesn't diagnose, and a late day gets calm, neutral information rather than a conclusion.
- Lock-screen demo heading: On the lock screen, only this.
- Lock-screen mock: Dottie · now · Reminder · A quick check-in for today? (the app's own notification)
- Lock-screen note: The same words whichever reminder it is, and no preview of your records. The app itself asks for a PIN or Face ID before it shows anything.
- Removed: the "Two PINs, two calendars" demo and its note (it explained how the decoy works).

## What "private" means here (reworks "Private by design, and you can test it")
- H2: What “private” means here.
- Lede: Many apps are built around an account and a server. Dottie was built without either, so there is nothing to leak. This is the whole list.
- Account · None. Nothing to sign up for. Dottie doesn't know who you are.
- Cloud · None. Your records live in an encrypted database on your iPhone. A backup goes only where you send it.
- Analytics · None. No usage tracking and no crash reports. Dottie has no code that connects to the internet.
- Cookies, on this site · None. No cookies and no trackers, and it loads nothing from anyone else.
- Live line (numbers filled in by the visitor's browser): Your browser can confirm it: this page loaded N files, counted by the browser itself just now. From anywhere other than this site: 0.
- Before it fills: Counting what this page loaded…

## FAQ (two new entries)
- Can my teenager use Dottie? — Yes, from 13 up. First Cycles is the mode for periods that started recently, and all of it is free with nothing for sale inside. There is more in For parents.
- Is Dottie a medical device? — No. Dottie is not a medical device. It offers information only, not medical advice or contraception. It only knows what you log, so it can miss things. If something doesn't feel right, trust that and get it checked.

## Footer (every page) and privacy policy
- Added word for word, as asked: Dottie is not a medical device. It doesn't diagnose or treat any condition, and it isn't a replacement for care from a doctor or other health professional. Dottie only knows what you log, so it can miss things. If something doesn't feel right, trust that and get it checked, even if Dottie hasn't mentioned it. In an emergency, call your local emergency number.
- Removed from the home footer: "Dottie is information only. It is not medical advice or contraception." (now said by the paragraph above).
- Privacy policy: the same paragraph opens "Who makes Dottie" (page and `docs/privacy-policy-draft.md`). The effective date is unchanged pending Rob's call.

## Claims checked against the app (read-only), and the ones not confirmed
Confirmed in code: First Cycles is a chosen goal, free, with every Plus surface stood down and the paywall refusing to render inside it; fertility and conception off; no regularity verdict; the five reads open without a tier check; the trusted-adult pointer; the switch has no lock. App lock (4-digit PIN, Face ID, locks on background, wrong tries slow down and never wipe), decoy PIN with Believable/Blank/Custom, Delete all data in two taps, reminders titled "Reminder" with generic bodies, the "not a medical device" disclaimer, no network code. Pregnancy mode (week counter, due date update, weekly notes, records, doctor summary, loss flow with resume/pause). After a pregnancy (predictions off until a new period, then ranges). Trying to conceive is Plus (fertile window, LH and test logging, temperature from Apple Health, window after 3 cycles). Changing cycles: weeks range free, dated ranges and Monthly symptoms score Plus, transition symptoms in the log, 12-month counter, the bleeding-after-12-months notice.

Not confirmed in the app's code:
- "Ages 13 and up": it appears only in the published privacy policy (Rob's wording). The product definition says a 12+ rating was planned, and the App Store age rating is still an open item that needs Apple Developer enrolment (whats-left items 19 and 20).
