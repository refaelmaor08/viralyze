'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
  animate?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  delay = 0,
  animate = true,
}: GlassCardProps) {
  const content = (
    <div
      className={cn(
        'glass rounded-2xl',
        hover && 'transition-all duration-300 hover:border-[rgba(212,168,67,0.3)] hover:bg-[rgba(212,168,67,0.04)] cursor-pointer',
        glow && 'gold-glow-sm',
        className
      )}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'glass rounded-2xl',
        hover && 'transition-all duration-300 hover:border-[rgba(212,168,67,0.3)] hover:bg-[rgba(212,168,67,0.04)] cursor-pointer',
        glow && 'gold-glow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
