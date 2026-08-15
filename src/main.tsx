import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import i18n from './i18n/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Admin preview control via postMessage (from /admin iframe)
window.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  const api = (window as unknown as Record<string, unknown>).__buksyEdit as
    | { start: () => void; stop: () => void; save: () => Promise<void> }
    | null
    | undefined;

  if (event.data.type === 'BUKSY_EDIT') {
    if (!api) return;
    if (event.data.active) {
      if (i18n.language !== 'uk') i18n.changeLanguage('uk');
      setTimeout(() => api.start(), 50);
    } else {
      api.stop();
    }
  } else if (event.data.type === 'BUKSY_SAVE') {
    if (api) {
      api.save().then(() => {
        window.parent.postMessage({ type: 'BUKSY_SAVED' }, '*');
      }).catch((e) => {
        window.parent.postMessage({ type: 'BUKSY_SAVE_ERROR', message: (e as Error).message }, '*');
      });
    }
  }
});
