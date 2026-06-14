import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LogoAnimationProps {
  onComplete: () => void;
}

export function LogoAnimation({ onComplete }: LogoAnimationProps) {
  const [phase, setPhase] = useState<'reveal' | 'pulse' | 'fade'>('reveal');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('pulse'), 800),
      setTimeout(() => setPhase('fade'), 1600),
      setTimeout(() => onComplete(), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-noir flex items-center justify-center"
        >
          <div className="relative">
            {/* Animated rings */}
            {phase === 'pulse' && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.2,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 border border-blood/30 rounded-full"
                    style={{ width: 120, height: 120 }}
                  />
                ))}
              </>
            )}

            {/* Logo SVG */}
            <motion.div
              initial={{ scale: 0.8, rotateY: 90, opacity: 0 }}
              animate={{
                scale: 1,
                rotateY: 0,
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              <svg viewBox="0 0 120 120" className="w-[120px] h-[120px]">
                {/* Outer circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#B10006"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
                {/* Inner glow circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#B10006"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                />
                {/* Cipher symbol */}
                <motion.path
                  d="M36 60 L48 42 L60 72 L72 42 L84 60"
                  fill="none"
                  stroke="#B10006"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
                />
              </svg>

              {/* Glow effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute inset-0 bg-blood/20 blur-xl"
              />
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span
                className="font-heading text-2xl tracking-[0.4em] text-blood"
                style={{ textShadow: '0 0 20px rgba(177, 0, 6, 0.5)' }}
              >
                CIPHER
              </span>
            </motion.div>
          </div>

          {/* Corner accents */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute top-8 right-8 w-32 h-32"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M0 0 L100 0 L100 100" fill="none" stroke="#B10006" strokeWidth="1" />
            </svg>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute bottom-8 left-8 w-32 h-32"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100 100 L0 100 L0 0" fill="none" stroke="#B10006" strokeWidth="1" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
