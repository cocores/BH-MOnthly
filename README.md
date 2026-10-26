# Monthly

A single-page tool for turning a pasted Jira ticket export into a monthly delivery board: a "what shipped this month" report you can review, write up, and share.

Sign-in is required — with an **@BHphoto.com email address** — before the board is shown. See **Cloud sync** below.

Paste ticket rows (tab/comma/pipe-separated, or a raw Jira multi-line export) and it builds:

- **Main board** — items grouped by release, sprint, portfolio, priority, or reporter, with per-item writeups (problem / what shipped / impact to watch) and inline editing of every cell.
- **Dashboard** — priority mix, submitted-by-you split, releases/sprints, team load, and writeup coverage as charts.
- **Updates** — a feed view of every item's writeup plus a free-text monthly summary.
- **Export** — copy a formatted report straight into Confluence (rich HTML, wiki markup, or storage format XHTML), or export Markdown, plain text, CSV, or print/PDF.

Everything runs client-side in one HTML file — no build step, no backend required. Board state lives in memory for the session; use **Save this month** to persist a board to the browser's local storage and reload it later from **Saved months**.

Also has a star-to-save-for-later feature (**Year in review**, for pulling together an end-of-year report) and optional shared team storage — see below.

### Saved months: CSV backup, restore, and loading everything at once

The **Saved months** card has:

- **Export CSV** — downloads every saved month (all rows, plus the period, month note, and save timestamp) as one CSV file, a copy that lives outside the browser entirely.
- **Import CSV** — restores saved months from a CSV exported this way. Months in the file are merged into what's already saved (matched by period), so it's safe to import even if some months are already there. This is the backup path if the browser's storage ever gets cleared and cloud sync isn't available.
- **Load all to board** — puts every saved month onto the board at once, grouped by month (see **Group by month** below), so you can see everything side by side instead of one month at a time.

### Grouping the board by month

The board's grouping options (release, sprint, portfolio, priority, reporter) now include **Group by month**, which groups rows by which saved month they came from and orders the groups newest-first. It's used automatically by **Load all to board**, and can also be picked directly from the grouping dropdown.

### Year in review stays in sync

Starring an item for **Year in review** before its writeup (what we were solving / what shipped / impact to watch) is filled in no longer freezes that entry blank — editing the row afterward keeps the year-in-review entry updated with the latest text.

### Sharing a board with your team

The **Saved months** card has a **Share with your team** section: agree on a code with your teammates (e.g. drop one in Slack), then:

- **Push to team** uploads the current board, your saved months, and your starred items to that code.
- **Pull from team** replaces everything in the browser with whatever was last pushed under that code.

This is a shared code, not a login — anyone who has it can read and overwrite that board, so treat it like a shared link rather than a password.

Shared storage runs on a serverless API route (`api/team.js`) backed by Vercel KV, so it only works on the Vercel deployment, not the static GitHub Pages copy. To enable it on Vercel:

1. In the Vercel dashboard, open this project → **Storage** → **Create Database** → **KV** (or connect an existing one), and link it to the project.
2. Redeploy. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically — no other config needed.

Without a KV store linked, Push/Pull show a message explaining shared storage isn't set up yet; everything else in the app works exactly the same.

### Cloud sync (Firebase)

The whole app sits behind a sign-in screen (email + password, via Firebase Authentication), restricted to **@BHphoto.com** addresses — enforced both client-side (the form rejects other domains before ever calling Firebase) and by Firestore's own security rules (`firestore.rules`), so it holds even if the client-side check is bypassed. New accounts get a verification email and can't use the app until they click it.

Once signed in, everything that keeps Main board, Dashboard, and Updates populated — the current board itself (rows, period, your name, notes, grouping) — plus your **saved months** and **starred items** also sync to your own Firestore document, so they follow you to any browser or device you sign into. The current board also saves to this browser continuously (a moment after you stop typing/editing), so a reload or reopening the tab never loses it, even without clicking `Save this month`. Signing in for the first time on a browser that already has a cloud copy asks before overwriting what's in that browser, the same way `Pull from team` does.

Signing in lasts 4 hours (tracked from the moment you sign in, independent of activity — reloading the page doesn't reset it), after which you're automatically signed out and shown the login screen again. Right before that happens, whatever's currently on the board — even if you never clicked `Save this month` — is saved into **Saved months** so nothing is lost. A normal reload or new tab in the meantime doesn't ask you to sign in again.

This is entirely separate from the team-code sharing feature above — that's unaffected and still works exactly as described.

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
