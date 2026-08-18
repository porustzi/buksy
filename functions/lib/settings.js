let cache = { data: null, ts: 0 };

export async function getSettings(env) {
  const now = Date.now();
  if (cache.data && now - cache.ts < 15000) return cache.data;
  try {
    const res = await fetch('https://api.github.com/repos/porustzi/buksy/contents/content/settings.json?ref=main', {
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        'User-Agent': 'buksy-settings',
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const bin = atob(String(data.content).replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const text = new TextDecoder('utf-8').decode(bytes);
      const parsed = JSON.parse(text);
      cache = { data: parsed, ts: now };
    }
  } catch (e) {
    console.error('[settings]', e.message);
  }
  return cache.data || { closed: false, deliveryCost: 0 };
}
