# Ayushi & Rohan: wedding invitation

Static site, no build step. Deploy this folder on Vercel (drag and drop it, or `vercel --prod`).

## Before you share, change one thing
The WhatsApp preview needs the full web address of the site.
In `index.html`, replace every `https://ayushi-rohan.vercel.app` with your real Vercel URL (or your custom domain).

## RSVPs and the /admin tracker (free, one-time setup, about 2 minutes)
Guest replies are saved by a small Vercel function (`api/rsvp.js`) into **Vercel Blob**, Vercel's own storage.
It's free on the Hobby plan (no extra account, no card). You read replies at **`https://your-url/admin`** with a password.

1. In the Vercel dashboard, open this project → **Storage** → **Create** → **Blob**. Pick **Private** if it asks, then connect it to this project.
   This adds `BLOB_READ_WRITE_TOKEN` to the project automatically.
2. Project → **Settings → Environment Variables** → add `ADMIN_PASSWORD` with a password of your choice.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the function picks up both.

The admin page shows: total guests, yes / can't come, headcount for each day, every reply with its message,
search, a filter, **Download CSV** (opens in Excel or Google Sheets), and Delete for test entries.
If a guest changes their reply on the same phone, their row is updated, not duplicated.

## Google Calendar
The festivities section has one "Add to Google Calendar" box: **All 3 days** (27–29 Jan) or any single day.
Direct link to it to share on its own: `https://your-url/#calendar`.

## Optional
- Add the time (`t`) and venue (`v`) for each event in `EV`. They show on the cards and go into the calendar entries.
  Until then, each card says "Time & venue to follow".

## Privacy
/admin is also `noindex`, and replies can only be read with the password.
The site tells search engines not to list it (`noindex`), so only people who have the link can find it.

## Checking the WhatsApp preview
After deploying, paste the URL into https://www.opengraph.xyz to see the preview.
WhatsApp caches previews for each URL. If you change the image after someone has already shared the link,
share it as `https://your-url/?v=3` so WhatsApp fetches the new image.
# ayushi-rohan
