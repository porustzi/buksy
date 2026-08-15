import { useEdit } from './edit/EditContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function hasAdminToken() {
  return !!(localStorage.getItem('buksy-admin-token') || localStorage.getItem('gh-token'));
}

export function EditorBar() {
  const { isEditing, isSaving, startEditing, stopEditing, save } = useEdit();
  const { i18n } = useTranslation();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [authed] = useState(hasAdminToken());

  if (!authed) return null;

  const handleStart = () => {
    if (i18n.language !== 'uk') i18n.changeLanguage('uk');
    startEditing();
  };

  const handleStop = () => {
    stopEditing();
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);
    try {
      await save();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message || 'Помилка збереження');
    }
  };

  return (
    <>
      {!isEditing && (
        <button
          onClick={handleStart}
          className="fixed bottom-6 right-6 z-[9999] px-5 py-3 bg-[#e53935] text-white text-sm font-bold rounded-full shadow-lg hover:bg-[#ff504a] transition-colors"
          style={{ letterSpacing: '0.5px' }}
        >
          ✏️ Редагувати
        </button>
      )}

      {isEditing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#141414] border border-[#e53935]/40 px-5 py-3 rounded-full shadow-2xl">
          <span className="text-white/60 text-xs hidden sm:block">Клікай на текст і редагуй</span>
          {error && <span className="text-red-400 text-xs">{error}</span>}
          {saved && <span className="text-green-400 text-xs">Збережено ✓</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#e53935] text-white text-sm font-bold rounded-full disabled:opacity-50"
          >
            {isSaving ? 'Збереження…' : 'Зберегти'}
          </button>
          <button
            onClick={handleStop}
            className="px-5 py-2 border border-white/20 text-white/70 text-sm rounded-full hover:text-white"
          >
            Скасувати
          </button>
        </div>
      )}

      <style>{`
        [contenteditable='true'] {
          outline: 2px dashed rgba(229,57,53,0.6) !important;
          outline-offset: 3px;
          cursor: text;
          min-width: 1em;
          transition: outline-color 0.2s;
        }
        [contenteditable='true']:hover {
          outline-color: rgba(229,57,53,0.9) !important;
          background: rgba(229,57,53,0.06);
        }
        [contenteditable='true']:focus {
          outline: 2px solid #e53935 !important;
          background: rgba(229,57,53,0.08);
        }
        [contenteditable='true'][data-dirty='true'] {
          outline: 2px solid #4caf50 !important;
        }
      `}</style>
    </>
  );
}
