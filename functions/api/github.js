import yaml from 'js-yaml';

const REPO = 'porustzi/buksy';
const BRANCH = 'main';
const ALLOWED_PATHS = ['content/', 'public/'];

function decodeBase64(b64) {
  const bin = atob(String(b64).replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || cur[p] === null) cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

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
        const ext = (name.split('.').pop() || 'jpg').toLowerCase();
        const base = name.slice(0, -(ext.length + 1)).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const dir = folder || 'public/uploads';
        if (!isAllowedPath(dir + '/')) return json({ error: 'Path not allowed' }, 403);
        const fpath = `${dir}/${base || Date.now()}.${ext}`;
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

      case 'applyChanges': {
        const { changes } = body;
        if (!Array.isArray(changes) || !changes.length) return json({ error: 'changes required' }, 400);

        const SECTION_FILES = {
          homepage: 'content/pages/homepage/homepage.json',
          about: 'content/pages/about/about.json',
          contact: 'content/pages/contact/contact.json',
          footer: 'content/pages/footer/footer.json',
        };

        const byFile = {};
        for (const c of changes) {
          if (!c || typeof c.path !== 'string' || typeof c.value !== 'string') continue;
          const parts = c.path.split('.');
          let file, fieldPath;
          if (parts[0] === 'product' && parts[1]) {
            file = `content/products/${parts[1]}.md`;
            fieldPath = parts.slice(2).join('.');
          } else {
            file = SECTION_FILES[parts[0]];
            if (!file) continue;
            fieldPath = parts.slice(1).join('.');
          }
          if (!file || !fieldPath || !isAllowedPath(file)) continue;
          if (!byFile[file]) byFile[file] = [];
          byFile[file].push({ fieldPath, value: c.value });
        }

        for (const [file, fields] of Object.entries(byFile)) {
          const res = await fetch(
            `https://api.github.com/repos/${REPO}/contents/${encodePath(file)}?ref=${BRANCH}`,
            { headers: ghHeaders(env) }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const current = decodeBase64(data.content);
          let next;
          if (file.endsWith('.md')) {
            const m = current.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
            let obj = {};
            let bodyText = '';
            if (m) { try { obj = yaml.load(m[1]) || {}; } catch (e) { obj = {}; } bodyText = m[2] || ''; }
            for (const f of fields) setPath(obj, f.fieldPath, f.value);
            next = '---\n' + yaml.dump(obj, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: true }).trim() + '\n---\n' + bodyText;
          } else {
            let obj = {};
            try { obj = JSON.parse(current); } catch (e) { obj = {}; }
            for (const f of fields) setPath(obj, f.fieldPath, f.value);
            next = JSON.stringify(obj, null, 2);
          }
          const putRes = await fetch(
            `https://api.github.com/repos/${REPO}/contents/${encodePath(file)}`,
            { method: 'PUT', headers: ghHeaders(env),
              body: JSON.stringify({ message: 'Edit content', content: btoa(unescape(encodeURIComponent(next))), sha: data.sha, branch: BRANCH }) }
          );
          if (!putRes.ok) return json({ error: 'Save failed for ' + file }, putRes.status);
        }

        return json({ ok: true });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    return json({ error: 'Internal error: ' + (e.message || '') }, 500);
  }
}
