/**
 * ============================================================================
 * GLASS CARD - Futuristic Glassmorphism Component
 * ============================================================================
 * Divine card with frosted glass effect, glow, and smooth animations
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type MotionDivBase = Omit<HTMLMotionProps<'div'>, 'children'>;

export interface GlassCardProps extends MotionDivBase {
  /** Enable hover effects */
  hoverable?: boolean;
  /** Enable glow effect */
  glow?: boolean;
  /** Enable gradient border */
  gradientBorder?: boolean;
  /** Animation variant */
  variant?: 'fade' | 'slide-up' | 'scale' | 'none';
  /** Custom delay for animation */
  delay?: number;
  children?: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      children,
      hoverable = false,
      glow = false,
      gradientBorder = false,
      variant = 'fade',
      delay = 0,
      ...props
    },
    ref
  ) => {
    const variants = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      'slide-up': {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
      },
      scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      },
      none: {
        initial: {},
        animate: {},
        exit: {},
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'glass rounded-xl p-6',
          hoverable && 'glass-hover cursor-pointer',
          glow && 'glow-hover',
          gradientBorder && 'gradient-border',
          className
        )}
        {...(variant !== 'none' && {
          initial: variants[variant].initial,
          animate: variants[variant].animate,
          exit: variants[variant].exit,
          transition: {
            duration: 0.3,
            delay,
            ease: [0.4, 0, 0.2, 1],
          },
        })}
        {...props}
      >
        {children}
      </motion.div>
    ) as React.ReactElement;
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
