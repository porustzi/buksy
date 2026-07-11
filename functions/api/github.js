const REPO = 'porustzi/buksy';
const BRANCH = 'main';
const ALLOWED_PATHS = ['content/', 'public/'];

const rateMap = new Map();
function checkRate(ip, max) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > 60000) {
    rateMap.set(ip, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= (max || 30)) return false;
  entry.count++;
  return true;
}

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_PAT}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'buksy-admin',
  };
}

function json(data, status) {
  status = status || 200;
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function isAllowedPath(path) {
  if (!path || typeof path !== 'string') return false;
  return ALLOWED_PATHS.some(prefix => path.startsWith(prefix));
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    const origin = env.SITE_URL || env.URL || '*';
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRate(ip, 30)) return json({ error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { action } = body;

  try {
    switch (action) {
      case 'login':
        return json({ ok: true });

      case 'list': {
        const folder = body.folder || '';
        if (folder && !isAllowedPath(folder + '/')) return json({ error: 'Path not allowed' }, 403);
        const encodedFolder = folder ? encodePath(folder) : '';
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodedFolder}?ref=${BRANCH}`,
          { headers: ghHeaders(env) }
        );
        if (!res.ok) return json([]);
        const items = await res.json();
        return json((items || []).map(f => ({ name: f.name, path: f.path, type: f.type, sha: f.sha })));
      }

      case 'read': {
        const path = body.path;
        if (!path) return json({ error: 'path required' }, 400);
        if (!isAllowedPath(path)) return json({ error: 'Path not allowed' }, 403);
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`,
          { headers: ghHeaders(env) }
        );
        if (res.status === 404) return json(null);
        if (!res.ok) return json({ error: 'GitHub error' }, res.status);
        const data = await res.json();
        return json({ content: data.content, sha: data.sha, path: data.path });
      }

      case 'write': {
        const { path, content, message, sha } = body;
        if (!path || content === undefined) return json({ error: 'path and content required' }, 400);
        if (!isAllowedPath(path)) return json({ error: 'Path not allowed' }, 403);
        const payload = {
          message: message || 'Update ' + path,
          content: btoa(unescape(encodeURIComponent(content))),
          branch: BRANCH,
        };
        const checkRes = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`,
          { headers: ghHeaders(env) }
        );
        if (checkRes.ok) {
          const c = await checkRes.json();
          payload.sha = c.sha;
        }
        if (sha) payload.sha = sha;
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(path)}`,
          { method: 'PUT', headers: ghHeaders(env), body: JSON.stringify(payload) }
        );
        if (!res.ok) return json({ error: 'Save failed' }, res.status);
        return json({ ok: true });
      }

      case 'delete': {
        const { path } = body;
        if (!path) return json({ error: 'path required' }, 400);
        if (!isAllowedPath(path)) return json({ error: 'Path not allowed' }, 403);
        const ex = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`,
          { headers: ghHeaders(env) }
        );
        if (!ex.ok) return json({ error: 'File not found' }, 404);
        const d = await ex.json();
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(path)}`,
          {
            method: 'DELETE',
            headers: ghHeaders(env),
            body: JSON.stringify({ message: `Delete ${path}`, sha: d.sha, branch: BRANCH }),
          }
        );
        if (!res.ok) return json({ error: 'Delete failed' }, res.status);
        return json({ ok: true });
      }

      case 'upload': {
        const { name, content, folder } = body;
        if (!name || !content) return json({ error: 'name and content required' }, 400);
        const ext = name.split('.').pop();
        const base = name.slice(0, -(ext.length + 1)).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const ts = Date.now();
        const dir = folder || 'public/uploads';
        if (!isAllowedPath(dir + '/')) return json({ error: 'Path not allowed' }, 403);
        const fpath = `${dir}/${base}_${ts}.${ext}`;
        const check = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(fpath)}`,
          { headers: ghHeaders(env) }
        );
        const payload = { message: `Upload ${name}`, content, branch: BRANCH };
        if (check.ok) { const c = await check.json(); payload.sha = c.sha; }
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(fpath)}`,
          { method: 'PUT', headers: ghHeaders(env), body: JSON.stringify(payload) }
        );
        if (!res.ok) return json({ error: 'Upload failed' }, res.status);
        return json({ url: `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${fpath}`, path: fpath });
      }

      case 'contact': {
        const { name, email, subject, message, phone } = body;
        if (!name || !email || !message) return json({ error: 'name, email, message required' }, 400);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const fpath = `content/forms/${ts}.json`;
        const data = JSON.stringify({ name, phone: phone || '', email, subject: subject || '', message, date: new Date().toISOString() }, null, 2);
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/contents/${encodePath(fpath)}`,
          { method: 'PUT', headers: ghHeaders(env),
            body: JSON.stringify({ message: `Form: ${subject || 'No subject'}`, content: btoa(unescape(encodeURIComponent(data))), branch: BRANCH }) }
        );
        if (!res.ok) return json({ error: 'Failed to save' }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    return json({ error: 'Internal error' }, 500);
  }
}
