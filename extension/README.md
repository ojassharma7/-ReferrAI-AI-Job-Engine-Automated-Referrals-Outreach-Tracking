# ReferrAI — Job Capture (Chrome extension)

Capture a job posting from any page and find referral contacts without leaving the tab.

## What it does
- Reads the **company**, **role**, and **job description** off the current page
  (LinkedIn, Indeed, Greenhouse, Lever, and a generic fallback).
- **Find contacts** — calls your ReferrAI `/api/search` and lists recruiters and
  people in that role, with email / LinkedIn links, right in the popup.
- **Open in ReferrAI** — deep-links to the dashboard with the company + role
  pre-filled so you can tailor a resume and start an outreach sequence.

## Install (developer mode)
1. Start the web app: `cd website && npm run dev` (defaults to `http://localhost:3210`).
2. Visit `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select this `extension/` folder.
4. Open a job posting, click the ReferrAI icon.

## Pointing at a deployed app
1. In the popup, open **Settings** and set the ReferrAI URL (e.g. `https://your-app.vercel.app`).
2. Add that origin to `host_permissions` in `manifest.json`, e.g.:
   ```json
   "host_permissions": ["http://localhost:3210/*", "https://your-app.vercel.app/*"]
   ```
   then reload the extension. (The browser only allows cross-origin API calls to
   origins listed here.)

## Notes
- No icons are bundled (Chrome shows a default) — drop `icon16/48/128.png` in and
  reference them under `action.default_icon` if you want branding.
- The popup reads the active tab only when you click the icon (`activeTab`), so it
  has no background access to your browsing.
