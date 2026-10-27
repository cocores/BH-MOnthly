# Monthly

A single-page tool for turning a pasted Jira ticket export into a monthly delivery board: a "what shipped this month" report you can review, write up, and share.

Sign-in is required — with an **@BHphoto.com email address** — before the board is shown. See **Cloud sync** below.

Paste ticket rows (tab/comma/pipe-separated, or a raw Jira multi-line export) and it builds:

- **Main board** — items grouped by release, sprint, portfolio, priority, or reporter, with per-item writeups (problem / what shipped / impact to watch) and inline editing of every cell.
- **Dashboard** — priority mix, submitted-by-you split, releases/sprints, team load, and writeup coverage as charts.
- **Updates** — a feed view of every item's writeup plus a free-text monthly summary.
- **Export** — copy a formatted report straight into Confluence (rich HTML, wiki markup, or storage format XHTML), or export Markdown, plain text, CSV, or print/PDF.

Everything runs client-side in one HTML file — no build step, no backend required. Board state lives in memory for the session; use **Save this month** to persist a board to the browser's local storage and reload it later from **Saved months**.

Also has a star-to-save-for-later feature (**Year in review**, for pulling together an end-of-year report).

### Saved months: CSV backup, restore, and loading everything at once

The **Saved months** card has:

- **Export CSV** — downloads every saved month (all rows, plus the period, month note, and save timestamp) as one CSV file, a copy that lives outside the browser entirely.
- **Import CSV** — restores saved months from a CSV exported this way. Months in the file are merged into what's already saved (matched by period), so it's safe to import even if some months are already there. This is the backup path if the browser's storage ever gets cleared and cloud sync isn't available.
- **Load selected to board** — check the box on any saved months and this button appears; it puts just those months onto the board together, grouped by month.
- **Load all to board** — puts every saved month onto the board at once, grouped by month (see **Group by month** below), so you can see everything side by side instead of one month at a time.

### Grouping the board by month

The board's grouping options (release, sprint, portfolio, priority, reporter) now include **Group by month**, which groups rows by which saved month they came from and orders the groups newest-first. It's used automatically by **Load all to board**, and can also be picked directly from the grouping dropdown.

### Year in review stays in sync

Starring an item for **Year in review** before its writeup (what we were solving / what shipped / impact to watch) is filled in no longer freezes that entry blank — editing the row afterward keeps the year-in-review entry updated with the latest text.

### Cloud sync (Firebase)

The whole app sits behind a sign-in screen (email + password, via Firebase Authentication), restricted to **@BHphoto.com** addresses — enforced both client-side (the form rejects other domains before ever calling Firebase) and by Firestore's own security rules (`firestore.rules`), so it holds even if the client-side check is bypassed. New accounts get a verification email and can't use the app until they click it.

Once signed in, everything that keeps Main board, Dashboard, and Updates populated — the current board itself (rows, period, your name, notes, grouping) — plus your **saved months** and **starred items** also sync to your own Firestore document, so they follow you to any browser or device you sign into. **Auto-save:** every 10 seconds, if anything on the board changed, the app saves it — to this browser, into **Saved months** (under the board's period, as if you'd clicked `Save this month`), and to your account when signed in. It also saves right away when you switch tabs or close the page. "Auto-saved <time>" in the Saved months card shows the last save. When the board holds several months (**Load all to board**), each row is saved back to its own month. Signing in for the first time on a browser that already has a cloud copy asks before overwriting what's in that browser. Nothing is uploaded until your cloud copy has been read, so reopening the app can't overwrite newer edits from another device; if the two copies already match, you aren't asked at all. Next to your email in the toolbar, **Saved to account** confirms each sync, and **Not saved to account** (with an explanation) shows if Firestore rejects a write — usually because `firestore.rules` hasn't been published yet.

Signing in lasts 4 hours (tracked from the moment you sign in, independent of activity — reloading the page doesn't reset it), after which you're automatically signed out and shown the login screen again. Right before that happens, whatever's currently on the board — even if you never clicked `Save this month` — is saved into **Saved months** so nothing is lost. A normal reload or new tab in the meantime doesn't ask you to sign in again.

To enable this on your own Firebase project:

1. Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.
2. Firebase Console → **Firestore Database** → **Create database**.
3. Paste `firestore.rules`'s contents into the Firestore **Rules** tab and publish.

The Firebase web config is inlined directly in `index.html` (these values are public client identifiers by Firebase's own design — the security rules above are what actually restrict access, not hiding this config).

## Running it

Open `index.html` directly in a browser, or serve it locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Using it

1. Click **Paste tickets**, fill in the period and your name, and paste rows exported from Jira.
2. Click **Build board** (or **Load sample** to see the shape first).
3. Fill in each item's writeup, add a monthly note, and use **Export** to send the report to Confluence, Markdown, CSV, or print.

## Deploying

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) publishes `index.html` to GitHub Pages on every push to `main`. Enable it under the repo's **Settings → Pages → Source: GitHub Actions**.
