import { useState, useEffect, useRef } from 'react';
import yaml from 'js-yaml';

// ============================================================
// Helpers
// ============================================================
function getToken() {
  return localStorage.getItem('buksy-admin-token') || localStorage.getItem('gh-token') || localStorage.getItem('admin-token');
}
function setToken(t: string) {
  localStorage.setItem('buksy-admin-token', t);
  localStorage.setItem('gh-token', t);
}
function clearToken() {
  localStorage.removeItem('buksy-admin-token');
  localStorage.removeItem('gh-token');
  localStorage.removeItem('admin-token');
}

function api(action: string, data: Record<string, unknown> = {}) {
  return fetch('/api/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (getToken() || '') },
    body: JSON.stringify({ action, ...data }),
  }).then((r) => {
    if (r.status === 401 || r.status === 403) { clearToken(); window.location.reload(); throw new Error('Unauthorized'); }
    if (!r.ok) throw new Error('API ' + r.status);
    return r.json();
  });
}

function utf8decode(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function parseYamlFrontmatter(text: string): Record<string, any> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return {};
  try { return (yaml.load(m[1]) as Record<string, any>) || {}; } catch { return {}; }
}
function serializeYamlFrontmatter(data: Record<string, any>): string {
  return '---\n' + yaml.dump(data, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: true }).trim() + '\n---\n';
}

const SECTIONS = [
  { id: 'products', label: 'Товари', icon: '📦', url: '/shop' },
  { id: 'homepage', label: 'Головна', icon: '🏠', url: '/', file: 'content/pages/homepage/homepage.json' },
  { id: 'about', label: 'Про нас', icon: 'ℹ️', url: '/about', file: 'content/pages/about/about.json' },
  { id: 'contact', label: 'Контакти', icon: '✉️', url: '/contact', file: 'content/pages/contact/contact.json' },
];

const CATEGORIES = [
  { id: 't-shirts', label: 'Футболки' },
  { id: 'hoodies', label: 'Худі' },
  { id: 'jackets', label: 'Куртки' },
  { id: 'pants', label: 'Штани' },
  { id: 'accessories', label: 'Аксесуари' },
  { id: 'footwear', label: 'Взуття' },
];

const btn = 'px-4 py-2 text-sm font-semibold transition-colors';
const btnPrimary = `${btn} bg-[#e53935] text-white hover:bg-[#ff504a] disabled:opacity-40`;
const btnGhost = `${btn} border border-white/15 text-white/60 hover:text-white hover:border-[#e53935]`;
const inputCls = 'w-full px-3 py-2 bg-[#1b1b1b] border border-white/10 text-white text-sm outline-none focus:border-[#e53935] rounded';
const labelCls = 'block text-[11px] uppercase tracking-wider text-white/50 mb-1';

// ============================================================
// Site status toggle
// ============================================================
function SiteStatusToggle() {
  const [closed, setClosed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then((d) => setClosed(!!d.closed)).catch(() => setClosed(false));
  }, []);

  const toggle = async () => {
    if (closed === null) return;
    setBusy(true);
    try {
      const d = await api('read', { path: 'content/settings.json' });
      let data: { closed: boolean } = { closed: false };
      try { data = JSON.parse(utf8decode(d.content)); } catch { data = { closed: false }; }
      data.closed = !closed;
      await api('write', { path: 'content/settings.json', content: JSON.stringify(data, null, 2), sha: d.sha, message: 'Toggle site' });
      setClosed(data.closed);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy || closed === null}
      className={`w-full py-2 text-xs font-semibold border transition-colors ${
        closed
          ? 'border-[#4caf50] text-[#4caf50] hover:bg-[#4caf50]/10'
          : 'border-[#e53935] text-[#e53935] hover:bg-[#e53935]/10'
      }`}
    >
      {busy ? '…' : closed ? '🔓 Відкрити сайт' : '🔒 Закрити сайт'}
    </button>
  );
}

// ============================================================
// Main
// ============================================================
export function AdminPage() {
  const [authed, setAuthed] = useState<boolean>(!!getToken());
  const [section, setSection] = useState<string>('products');

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#ececec]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <aside className="w-[220px] bg-[#141414] border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="text-xl tracking-[4px] text-[#e53935] font-light">BUKSY</div>
          <div className="text-[11px] text-white/30 mt-1">Панель керування</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors border-l-2 ${
                section === s.id
                  ? 'text-white border-[#e53935] bg-[#e53935]/10'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <SiteStatusToggle />
          <button onClick={() => { clearToken(); window.location.reload(); }} className="w-full py-2 text-xs border border-white/15 text-white/50 hover:text-white">
            Вийти
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {section === 'products' ? (
          <ProductsView />
        ) : (
          <PreviewView url={SECTIONS.find((s) => s.id === section)!.url} sectionFile={SECTIONS.find((s) => s.id === section)!.file || ''} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// Login
// ============================================================
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password),
      });
      if (!res.ok) throw new Error('Невірний логін або пароль');
      const data = await res.json();
      setToken(data.token);
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0a]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <form onSubmit={submit} className="bg-[#141414] border border-white/10 p-10 w-[360px] text-center">
        <div className="text-3xl tracking-[6px] text-[#e53935] font-light mb-2">BUKSY</div>
        <div className="text-white/40 text-sm mb-8">Вхід</div>
        {error && <div className="text-[#ff6b6b] text-sm mb-4">{error}</div>}
        <input className={inputCls + ' text-center mb-3'} placeholder="Логін" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="off" />
        <input className={inputCls + ' text-center mb-4'} type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
        <button type="submit" disabled={loading} className={btnPrimary + ' w-full uppercase tracking-wider'}>
          {loading ? '...' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// Preview (Elementor-style iframe editing)
// ============================================================
function PreviewView({ url, sectionFile }: { url: string; sectionFile: string }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'BUKSY_SAVED') { setSaving(false); setStatus('Збережено ✓'); setTimeout(() => setStatus(''), 2500); }
      if (e.data?.type === 'BUKSY_SAVE_ERROR') { setSaving(false); setStatus('Помилка: ' + e.data.message); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const toggleEdit = () => {
    const next = !editing;
    setEditing(next);
    setStatus('');
    iframeRef.current?.contentWindow?.postMessage({ type: 'BUKSY_EDIT', active: next }, '*');
  };

  const save = () => {
    setSaving(true);
    setStatus('Збереження…');
    iframeRef.current?.contentWindow?.postMessage({ type: 'BUKSY_SAVE' }, '*');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#141414] flex-shrink-0">
        <div className="text-sm text-white/60">Прев'ю — клікай на текст і редагуй прямо на сайті</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">{status}</span>
          {editing && (
            <>
              <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? 'Збереження…' : 'Зберегти'}</button>
              <button onClick={toggleEdit} className={btnGhost}>Скасувати</button>
            </>
          )}
          <button onClick={toggleEdit} className={editing ? btnGhost : btnPrimary}>{editing ? 'Вийти з редагування' : '✏️ Редагувати'}</button>
        </div>
      </div>
      {sectionFile && <ImagesPanel sectionFile={sectionFile} />}
      <iframe
        ref={iframeRef}
        src={url}
        className="flex-1 w-full border-0 bg-white"
        title="preview"
        onLoad={() => {
          if (editing) iframeRef.current?.contentWindow?.postMessage({ type: 'BUKSY_EDIT', active: true }, '*');
        }}
      />
    </div>
  );
}

function findImageFields(obj: unknown, path = ''): Array<{ path: string; value: string }> {
  const results: Array<{ path: string; value: string }> = [];
  if (!obj || typeof obj !== 'object') return results;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === 'string' && /image|img|photo|photo1|photo2|photo3/i.test(k)) {
      results.push({ path: p, value: v });
    } else if (v && typeof v === 'object') {
      results.push(...findImageFields(v, p));
    }
  }
  return results;
}

function ImagesPanel({ sectionFile }: { sectionFile: string }) {
  const [images, setImages] = useState<Array<{ path: string; value: string }>>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    api('read', { path: sectionFile }).then((d) => {
      if (!d) return;
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(utf8decode(d.content)); } catch { data = {}; }
      setImages(findImageFields(data));
    }).catch((e) => setError(e.message));
  }, [sectionFile, open]);

  const changeImage = (fieldPath: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(',')[1];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/jpeg/g, 'jpg');
        const fname = Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + ext;
        setBusy(fieldPath);
        api('upload', { name: fname, content: b64, folder: 'public/uploads' }).then(async (res) => {
          const saved = (res.path as string).replace(/^public/, '');
          // read current, set field, write back
          const d = await api('read', { path: sectionFile });
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(utf8decode(d.content)); } catch { data = {}; }
          setFieldByPath(data, fieldPath, saved);
          await api('write', { path: sectionFile, content: JSON.stringify(data, null, 2), sha: d.sha, message: 'Update image' });
          setImages(findImageFields(data));
          setBusy('');
        }).catch((e) => { setError(e.message); setBusy(''); });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (!open) {
    return (
      <div className="px-5 py-1.5 border-b border-white/10 bg-[#141414] flex-shrink-0">
        <button onClick={() => setOpen(true)} className="text-xs text-white/40 hover:text-white">🖼 Змінити зображення</button>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-b border-white/10 bg-[#141414] flex-shrink-0 flex items-center gap-4 overflow-x-auto">
      <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xs whitespace-nowrap">✕ Закрити</button>
      {error && <span className="text-[#ff6b6b] text-xs">{error}</span>}
      {images.length === 0 && <span className="text-white/40 text-xs">Немає зображень</span>}
      {images.map((img) => (
        <div key={img.path} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative">
            {img.value ? (
              <img src={img.value} alt="" className="w-16 h-12 object-cover rounded border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-12 flex items-center justify-center text-white/20 text-xs bg-[#1b1b1b] rounded border border-white/10">пусто</div>
            )}
          </div>
          <span className="text-[10px] text-white/40">{img.path.split('.').pop()}</span>
          <button onClick={() => changeImage(img.path)} disabled={busy === img.path} className="text-[10px] text-[#e53935] hover:underline">{busy === img.path ? '…' : 'Замінити'}</button>
        </div>
      ))}
    </div>
  );
}

function setFieldByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

// ============================================================
// Products
// ============================================================
function ProductsView() {
  const [products, setProducts] = useState<Array<{ name: string; path: string }>>([]);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    api('list', { folder: 'content/products' })
      .then((files) => {
        const list = (files || []).filter((f: { name: string }) => f.name !== '.gitkeep');
        setProducts(list.map((f: { name: string; path: string }) => ({ name: f.name, path: f.path })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  if (editingPath) {
    return <ProductEditor path={editingPath} onBack={() => { setEditingPath(null); setRefresh((r) => r + 1); }} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="text-white/50 text-sm">{products.length} товарів</div>
        <button onClick={() => setEditingPath('__new__')} className={btnPrimary}>+ Додати товар</button>
      </div>
      {loading ? (
        <div className="text-white/40 py-10 text-center">Завантаження…</div>
      ) : products.length === 0 ? (
        <div className="text-white/40 py-20 text-center">
          <div className="text-4xl mb-3">📦</div>
          Немає товарів
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.path} name={p.name} path={p.path} onEdit={() => setEditingPath(p.path)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ name, path, onEdit }: { name: string; path: string; onEdit: () => void }) {
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    api('read', { path }).then((d) => {
      if (d && d.content) setData(parseYamlFrontmatter(utf8decode(d.content)));
    }).catch(() => {});
  }, [path]);

  const img = (data?.image1 as string) || (data?.images?.[0] as string) || '';
  const nameStr = (data?.name as string) || name.replace('.md', '');
  const price = data?.price != null ? data.price : '';
  const stock = data?.stock;
  const out = stock !== undefined && stock <= 0;

  return (
    <div className="bg-[#141414] border border-white/10 overflow-hidden cursor-pointer hover:border-[#e53935]/50 group" onClick={onEdit}>
      <div className="relative">
        {img ? (
          <img src={img} alt="" className="w-full aspect-[3/4] object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full aspect-[3/4] flex items-center justify-center text-3xl text-white/20 bg-[#1b1b1b]">📷</div>
        )}
        {stock !== undefined && (
          <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold ${out ? 'bg-[#e53935]/20 text-[#e53935]' : 'bg-[#4caf50]/20 text-[#4caf50]'}`}>
            {out ? 'Немає' : stock + ' шт'}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold">{nameStr}</div>
        <div className="text-sm text-[#e53935] font-semibold">{price !== '' ? '₴' + price : '—'}</div>
      </div>
    </div>
  );
}

function ProductEditor({ path, onBack }: { path: string; onBack: () => void }) {
  const isNew = path === '__new__';
  const [data, setData] = useState<Record<string, any>>({});
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) {
      setData({
        id: String(Date.now()), name: 'Новий товар', slug: 'product-' + Date.now().toString(36), price: 0,
        category: 't-shirts', image1: '', image2: '', image3: '',
        sizes: [{ name: 'S', available: true }, { name: 'M', available: true }, { name: 'L', available: true }],
        inStock: true, stock: 1, isNew: false, isHot: false, isFeatured: false, isBestseller: false, rating: 0,
        shortDescription: '', description: '', details: [], care: [],
      });
      return;
    }
    api('read', { path }).then((d) => {
      if (!d) { setError('Файл не знайдено'); setLoading(false); return; }
      setData(parseYamlFrontmatter(utf8decode(d.content)));
      setSha(d.sha);
      setLoading(false);
    }).catch((e) => { setError(e.message); setLoading(false); });
  }, [path, isNew]);

  const set = (key: string, value: unknown) => setData((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const content = serializeYamlFrontmatter(data);
      const targetPath = isNew ? `content/products/${data.slug}.md` : path;
      await api('write', { path: targetPath, content, sha: sha || undefined, message: 'Update ' + targetPath });
      onBack();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const upload = (field: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(',')[1];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/jpeg/g, 'jpg');
        const fname = Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + ext;
        api('upload', { name: fname, content: b64, folder: 'public/uploads' }).then((res) => {
          const saved = (res.path as string).replace(/^public/, '');
          set(field, saved);
        }).catch((e) => setError(e.message));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteProduct = async () => {
    if (!confirm('Видалити товар?')) return;
    await api('delete', { path });
    onBack();
  };

  if (loading) return <div className="p-10 text-white/40">Завантаження…</div>;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className={btnGhost}>← Назад</button>
        <div className="flex gap-3">
          {!isNew && <button onClick={deleteProduct} className={btnGhost + ' !text-[#e53935] !border-[#e53935]'}>🗑 Видалити</button>}
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? 'Збереження…' : 'Зберегти'}</button>
        </div>
      </div>

      {error && <div className="text-[#ff6b6b] text-sm mb-4">{error}</div>}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4">Основне</h3>
          <div className="space-y-3">
            <div><label className={labelCls}>Назва</label><input className={inputCls} value={data.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className={labelCls}>Slug</label><input className={inputCls} value={data.slug || ''} onChange={(e) => set('slug', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Ціна ₴</label><input type="number" className={inputCls} value={data.price ?? ''} onChange={(e) => set('price', parseFloat(e.target.value))} /></div>
              <div><label className={labelCls}>Стара ціна ₴</label><input type="number" className={inputCls} value={data.originalPrice ?? ''} onChange={(e) => set('originalPrice', parseFloat(e.target.value) || undefined)} /></div>
            </div>
            <div>
              <label className={labelCls}>Категорія</label>
              <select className={inputCls} value={data.category || 't-shirts'} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Сток (шт)</label><input type="number" className={inputCls} value={data.stock ?? ''} onChange={(e) => set('stock', parseInt(e.target.value))} /></div>
            <div className="flex flex-wrap gap-4 pt-1">
              {[['inStock', 'В наявності'], ['isHot', '🔥 На головну'], ['isNew', 'Новий'], ['isFeatured', 'Обране'], ['isBestseller', 'Бестселер']].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!data[k]} onChange={(e) => set(k, e.target.checked)} /> {lbl}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4">Зображення</h3>
          <div className="space-y-3">
            {['image1', 'image2', 'image3'].map((f) => (
              <div key={f}>
                <label className={labelCls}>Фото {f.slice(-1)}</label>
                <div className="flex gap-2">
                  <input className={inputCls} value={data[f] || ''} onChange={(e) => set(f, e.target.value)} />
                  <button onClick={() => upload(f)} className={btnGhost}>📁</button>
                </div>
                {data[f] && <img src={data[f]} alt="" className="mt-2 max-w-[140px] max-h-[90px] rounded border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
            ))}
          </div>

          <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4 mt-6">Розміри</h3>
          {(data.sizes || []).map((s: { name: string; available: boolean }, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input className={inputCls + ' !w-24'} value={s.name || ''} onChange={(e) => { const sizes = [...data.sizes]; sizes[i] = { ...sizes[i], name: e.target.value }; set('sizes', sizes); }} placeholder="S/M/L" />
              <label className="flex items-center gap-1 text-xs text-white/60 cursor-pointer">
                <input type="checkbox" checked={s.available !== false} onChange={(e) => { const sizes = [...data.sizes]; sizes[i] = { ...sizes[i], available: e.target.checked }; set('sizes', sizes); }} /> є
              </label>
              <button onClick={() => set('sizes', data.sizes.filter((_: unknown, j: number) => j !== i))} className="text-white/30 hover:text-[#e53935]">✕</button>
            </div>
          ))}
          <button onClick={() => set('sizes', [...(data.sizes || []), { name: '', available: true }])} className={btnGhost + ' w-full'}>+ Розмір</button>
        </div>
      </div>

      <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4 mt-8">Короткий опис</h3>
      <textarea className={inputCls + ' min-h-[100px]'} value={data.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} />

      <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4 mt-6">Опис</h3>
      <textarea className={inputCls + ' min-h-[120px]'} value={data.description || ''} onChange={(e) => set('description', e.target.value)} />

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4">Деталі</h3>
          {(data.details || []).map((d: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className={inputCls} value={d} onChange={(e) => { const arr = [...data.details]; arr[i] = e.target.value; set('details', arr); }} />
              <button onClick={() => set('details', data.details.filter((_: unknown, j: number) => j !== i))} className="text-white/30 hover:text-[#e53935]">✕</button>
            </div>
          ))}
          <button onClick={() => set('details', [...(data.details || []), ''])} className={btnGhost + ' w-full'}>+ Деталь</button>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#e53935] font-bold mb-4">Догляд</h3>
          {(data.care || []).map((c: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className={inputCls} value={c} onChange={(e) => { const arr = [...data.care]; arr[i] = e.target.value; set('care', arr); }} />
              <button onClick={() => set('care', data.care.filter((_: unknown, j: number) => j !== i))} className="text-white/30 hover:text-[#e53935]">✕</button>
            </div>
          ))}
          <button onClick={() => set('care', [...(data.care || []), ''])} className={btnGhost + ' w-full'}>+ Догляд</button>
        </div>
      </div>
    </div>
  );
}
