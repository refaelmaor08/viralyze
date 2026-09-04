'use client';

import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}

/** Animated integer count-up. Jumps straight to the final value under prefers-reduced-motion. */
export default function CountUpNumber({ value, duration = 1.1, delay = 0.2, className }: CountUpNumberProps) {
  const [display, setDisplay] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, delay, prefersReducedMotion]);

  return <span className={className}>{display}</span>;
}
