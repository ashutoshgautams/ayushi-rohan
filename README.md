# Ayushi & Rohan: wedding invitation

Static site, no build step. Deploy this folder on Vercel (drag and drop it, or `vercel --prod`).

## Before you share, change one thing
The WhatsApp preview needs the full web address of the site.
In `index.html`, replace every `https://ayushi-rohan.vercel.app` with your real Vercel URL (or your custom domain).

## Optional
- In the `<script>` near the bottom of `index.html`, set `CFG.wa` to the couple's WhatsApp number
  (country code + digits, e.g. `919812345678`). RSVPs then go straight to that chat.
- Add the time (`t`) and venue (`v`) for each event in `EV` when they're ready.
  Until then, each card says "Time & venue to follow".

## Privacy
The site tells search engines not to list it (`noindex`), so only people who have the link can find it.

## Checking the WhatsApp preview
After deploying, paste the URL into https://www.opengraph.xyz to see the preview.
WhatsApp caches previews for each URL. If you change the image after someone has already shared the link,
share it as `https://your-url/?v=2` so WhatsApp fetches the new image.
# ayushi-rohan
