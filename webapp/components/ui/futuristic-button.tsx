/**
 * ============================================================================
 * FUTURISTIC BUTTON - Divine Interactive Button
 * ============================================================================
 * Glassmorphism button with smooth animations and glow effects
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FuturisticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Enable glow effect */
  glow?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

const FuturisticButton = React.forwardRef<
  HTMLButtonElement,
  FuturisticButtonProps
>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      glow = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/50',
      secondary:
        'bg-gradient-to-r from-secondary to-purple-600 text-secondary-foreground hover:opacity-90 shadow-lg shadow-secondary/50',
      ghost:
        'glass text-foreground hover:bg-muted/50 border border-border/50',
      danger:
        'bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:opacity-90 shadow-lg shadow-destructive/50',
      success:
        'bg-gradient-to-r from-success to-green-600 text-success-foreground hover:opacity-90 shadow-lg shadow-success/50',
    };

    const sizeClasses = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-13 px-8 text-lg',
      xl: 'h-16 px-10 text-xl',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          variantClasses[variant],
          sizeClasses[size],
          glow && 'glow-hover',
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : icon ? (
          <span className="flex items-center">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

FuturisticButton.displayName = 'FuturisticButton';

export { FuturisticButton };
