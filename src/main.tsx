import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ============================================================
// Edit mode for admin preview (click-to-edit like Elementor)
// ============================================================
let editModeActive = false;

const EDITABLE_SELECTOR = 'h1, h2, h3, h4, p, a, span, li, blockquote, figcaption, button, label, td, th';

function applyEditMode() {
  document.querySelectorAll(EDITABLE_SELECTOR).forEach((el) => {
    const hasChildren = Array.from(el.childNodes).some((n) => n.nodeType === 1);
    if (hasChildren) return;
    const text = (el.textContent || '').trim();
    if (!text || text.length < 2) return;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('buksy-editable');
    el.addEventListener('input', onEditableInput);
  });
}

function clearEditMode() {
  document.querySelectorAll('.buksy-editable').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.classList.remove('buksy-editable');
    el.removeEventListener('input', onEditableInput);
  });
}

function onEditableInput(e) {
  const el = e.target;
  el.dataset.edited = 'true';
}

function onBlur(e) {
  const el = e.target;
  if (el.dataset.edited) {
    const text = (el.textContent || '').trim();
    const tag = el.tagName.toLowerCase();
    const cls = el.className;
    window.parent.postMessage({ type: 'BUKSY_TEXT_CHANGED', tag, cls, text }, '*');
    delete el.dataset.edited;
  }
}

document.addEventListener('blur', onBlur, true);

window.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'BUKSY_EDIT_MODE') {
    if (event.data.active) {
      editModeActive = true;
      document.body.style.cursor = 'text';
      applyEditMode();
    } else {
      editModeActive = false;
      document.body.style.cursor = '';
      clearEditMode();
    }
  }
});
