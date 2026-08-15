let cache = { closed: false, ts: 0 };

function json(data) {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  const { env } = context;
  const now = Date.now();
  if (now - cache.ts < 15000) return json({ closed: cache.closed });

  try {
    const res = await fetch('https://api.github.com/repos/porustzi/buksy/contents/content/settings.json?ref=main', {
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        'User-Agent': 'buksy-status',
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const bin = atob(String(data.content).replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const text = new TextDecoder('utf-8').decode(bytes);
      const settings = JSON.parse(text);
      cache = { closed: !!settings.closed, ts: now };
    }
  } catch (e) {
    console.error('[status]', e.message);
  }

  return json({ closed: cache.closed });
}
