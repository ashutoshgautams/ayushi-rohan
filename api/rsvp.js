// RSVP storage. POST saves a guest's reply; GET/DELETE are for /admin and need ADMIN_PASSWORD.
// Storage: Upstash Redis (Vercel → Storage → Upstash Redis → Connect to project). No npm packages needed.
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'rsvps';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function isAdmin(req) {
  const want = process.env.ADMIN_PASSWORD || '';
  const got = String(req.headers['x-admin-password'] || '');
  if (!want) return false;
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const DAYS = ['Mehendi', 'Haldi', 'Wedding'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'Storage is not connected yet.' });

  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = clip(b.id, 40).replace(/[^\w-]/g, '');
      const name = clip(b.name, 80);
      if (!id || !name) return res.status(400).json({ error: 'Missing name.' });
      const attending = b.attending === true || b.attending === 'Yes';
      const row = {
        id, name, attending,
        guests: attending ? Math.min(15, Math.max(1, parseInt(b.guests, 10) || 1)) : 0,
        days: attending ? (Array.isArray(b.days) ? b.days : []).filter(d => DAYS.includes(d)) : [],
        message: clip(b.message, 1000),
        at: new Date().toISOString()
      };
      await redis(['HSET', KEY, id, JSON.stringify(row)]); // same guest again = their reply is updated, not duplicated
      return res.status(200).json({ ok: true });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong password.' });

    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', KEY])) || [];
      const rows = [];
      for (let i = 1; i < flat.length; i += 2) { try { rows.push(JSON.parse(flat[i])) } catch (e) {} }
      rows.sort((a, b) => b.at.localeCompare(a.at));
      return res.status(200).json({ rows });
    }

    if (req.method === 'DELETE') {
      const id = clip(req.query.id, 40);
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      await redis(['HDEL', KEY, id]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
