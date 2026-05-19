'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

export default function GoldButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: GoldButtonProps) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-[#D4A843] to-[#F0C060] text-black font-bold hover:from-[#F0C060] hover:to-[#D4A843]',
    outline: 'border border-[#D4A843] text-[#D4A843] hover:bg-[rgba(212,168,67,0.1)]',
    ghost: 'text-[#D4A843] hover:bg-[rgba(212,168,67,0.08)]',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        'rounded-xl font-semibold transition-all duration-200 relative overflow-hidden',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        variant === 'primary' && 'shadow-lg shadow-[rgba(212,168,67,0.3)]',
        className
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="flex items-center gap-2 justify-center">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Analyzing...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
