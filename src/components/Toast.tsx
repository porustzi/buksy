import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;
const listeners: Set<(t: Toast) => void> = new Set();

export function createToast(message: string) {
  const toast: Toast = { id: ++toastId, message };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 2500);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 px-5 py-3 bg-ash border border-blood/30 text-white font-body text-sm shadow-lg"
          >
            <span className="w-5 h-5 rounded-full bg-blood flex items-center justify-center flex-shrink-0">
              <Check size={12} className="text-white" />
            </span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
