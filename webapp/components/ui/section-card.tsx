'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
  collapsible = true,
  action,
  className,
  contentClassName,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        'glass rounded-xl overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={() => collapsible && setIsOpen(!isOpen)}
        disabled={!collapsible}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          collapsible && 'hover:bg-muted/30 cursor-pointer',
          !collapsible && 'cursor-default'
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div
              className={cn(
                'px-4 pb-4 border-t border-border/50',
                contentClassName
              )}
            >
              <div className="pt-3">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
