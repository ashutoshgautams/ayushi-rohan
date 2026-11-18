// /family is the same page as /, but WhatsApp and other link previews read the raw HTML,
// so this serves it with the Hindi share title and image swapped in.
const SITE = 'https://ayushi-rohan.vercel.app';
const TITLE = 'शुभ विवाह · आयुषी संग रोहन · 29 जनवरी 2027';
const DESC = 'जया कर्ण एवं परिवार की ओर से सादर आमंत्रण';
const IMAGE = `${SITE}/assets/og-family.jpg?v=1`;

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const setMeta = (html, attr, key, value) =>
  html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`);

module.exports = async (req, res) => {
  try {
    const r = await fetch(`https://${req.headers.host}/`);
    if (!r.ok) throw new Error(`index ${r.status}`);
    let html = await r.text();

    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}/family$2`);
    for (const [attr, key, value] of [
      ['name', 'description', DESC],
      ['property', 'og:locale', 'hi_IN'],
      ['property', 'og:url', `${SITE}/family`],
      ['property', 'og:title', TITLE],
      ['property', 'og:description', DESC],
      ['property', 'og:image', IMAGE],
      ['property', 'og:image:secure_url', IMAGE],
      ['property', 'og:image:alt', 'आयुषी संग रोहन, 29 जनवरी 2027, सादर आमंत्रण'],
      ['name', 'twitter:title', TITLE],
      ['name', 'twitter:description', DESC],
      ['name', 'twitter:image', IMAGE],
    ]) html = setMeta(html, attr, key, value);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.status(200).send(html);
  } catch (e) {
    // Never leave a guest on an error page: the page also reads ?family as the family invite.
    res.setHeader('Location', '/?family');
    res.status(302).end();
  }
};
