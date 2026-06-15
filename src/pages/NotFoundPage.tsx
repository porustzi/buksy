import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

export function NotFoundPage() {
  useSeo({ title: '404 — Сторінку не знайдено' });

  return (
    <div className="min-h-screen bg-noir pt-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center px-4"
      >
        <p className="font-mono text-blood text-8xl font-bold mb-4">404</p>
        <div className="h-px w-24 bg-blood/30 mx-auto mb-6" />
        <h1 className="font-display text-3xl md:text-4xl font-light mb-4">
          Сторінку не знайдено
        </h1>
        <p className="text-white/50 font-body max-w-md mx-auto mb-8">
          Ця сторінка не існує. Можливо, ви перейшли за неправильним посиланням.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-3">
          <ArrowLeft size={18} />
          На головну
        </Link>
      </motion.div>
    </div>
  );
}
