import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface EditContextValue {
  isEditing: boolean;
  isSaving: boolean;
  startEditing: () => void;
  stopEditing: () => void;
  save: () => Promise<void>;
  registerChange: (path: string, value: string) => void;
}

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const changesRef = useRef<Record<string, string>>({});

  const startEditing = useCallback(() => {
    changesRef.current = {};
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    changesRef.current = {};
    setIsEditing(false);
  }, []);

  const registerChange = useCallback((path: string, value: string) => {
    changesRef.current[path] = value;
  }, []);

  const save = useCallback(async () => {
    const list = Object.entries(changesRef.current).map(([path, value]) => ({ path, value }));
    if (!list.length) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('buksy-admin-token') || localStorage.getItem('gh-token');
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
        body: JSON.stringify({ action: 'applyChanges', changes: list }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      changesRef.current = {};
      setIsEditing(false);
      setIsSaving(false);
      window.location.reload();
    } catch (e) {
      setIsSaving(false);
      throw e;
    }
  }, []);

  return (
    <EditContext.Provider value={{ isEditing, isSaving, startEditing, stopEditing, save, registerChange }}>
      {children}
    </EditContext.Provider>
  );
}

export function useEdit() {
  const ctx = useContext(EditContext);
  if (!ctx) throw new Error('useEdit must be used within EditProvider');
  return ctx;
}
