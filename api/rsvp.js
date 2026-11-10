// RSVP storage on Vercel Blob (free on the Hobby plan).
// POST saves a guest's reply; GET/DELETE are for /admin and need ADMIN_PASSWORD.
// Each guest is one small file: rsvps/<id>.json. Same guest again = same file, so replies update instead of duplicating.
const crypto = require('crypto');
const { put, list, get, del } = require('@vercel/blob');

const PREFIX = 'rsvps/';
const DAYS = ['Mehendi', 'Haldi', 'Wedding'];
let access = process.env.BLOB_ACCESS || 'private';

// Credentials. New Blob stores connect with BLOB_STORE_ID and Vercel's per-request OIDC token (no secret to copy).
// Older stores use a read-write key: BLOB_READ_WRITE_TOKEN, or a renamed *_READ_WRITE_TOKEN.
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN ||
  Object.entries(process.env).find(([k, v]) => /READ_WRITE_TOKEN$/.test(k) && /^vercel_blob_rw_/.test(v || ''))?.[1];
const STORE_ID = process.env.BLOB_STORE_ID;
let auth = {}; // set per request in the handler

function credentials(req) {
  if (TOKEN) return { token: TOKEN };
  const oidcToken = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  return oidcToken ? { oidcToken, storeId: STORE_ID } : {}; // {} lets the library find the token itself
} // falls back to 'public' if the store was created as public

function isAdmin(req) {
  const want = process.env.ADMIN_PASSWORD || '';
  if (!want) return false;
  const h = s => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(req.headers['x-admin-password'] || ''), h(want));
}

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const accessProblem = e => /access|private|public/i.test(String(e && e.message));

async function save(path, body) {
  const opts = () => ({ ...auth, access, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  try { await put(path, body, opts()) }
  catch (e) { if (!accessProblem(e)) throw e; access = access === 'private' ? 'public' : 'private'; await put(path, body, opts()) }
}

async function readAll() {
  const blobs = [];
  let cursor;
  do { const r = await list({ ...auth, prefix: PREFIX, cursor, limit: 1000 }); blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : null } while (cursor);
  const rows = await Promise.all(blobs.map(async b => {
    try {
      let r;
      try { r = await get(b.pathname, { ...auth, access, useCache: false }) }
      catch (e) { if (!accessProblem(e)) throw e; access = access === 'private' ? 'public' : 'private'; r = await get(b.pathname, { ...auth, access, useCache: false }) }
      return r && r.stream ? JSON.parse(await new Response(r.stream).text()) : null;
    } catch (e) { return null }
  }));
  return rows.filter(Boolean).sort((a, b) => b.at.localeCompare(a.at));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  auth = credentials(req);
  if (!TOKEN && !STORE_ID) return res.status(503).json({ error: 'Storage is not connected yet. Connect a Blob store to this project and redeploy.' });

  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = clip(b.id, 40).replace(/[^\w-]/g, '');
      const name = clip(b.name, 80);
      if (!id || !name) return res.status(400).json({ error: 'Missing name.' });
      const attending = b.attending === true || b.attending === 'Yes';
      const row = {
        id, name, attending,
        days: attending ? (Array.isArray(b.days) ? b.days : []).filter(d => DAYS.includes(d)) : [],
        message: clip(b.message, 1000),
        at: new Date().toISOString()
      };
      await save(PREFIX + id + '.json', JSON.stringify(row));
      return res.status(200).json({ ok: true });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong password.' });

    if (req.method === 'GET') return res.status(200).json({ rows: await readAll() });

    if (req.method === 'DELETE') {
      const id = clip(req.query.id, 40).replace(/[^\w-]/g, '');
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      const { blobs } = await list({ ...auth, prefix: PREFIX + id + '.json' });
      if (blobs.length) await del(blobs.map(b => b.url), { ...auth });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
