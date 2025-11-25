'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export type IntegrationStatus = 'connected' | 'not_set' | 'coming_soon';

export interface IntegrationCardProps {
  name: string;
  description?: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  onConnect?: () => void;
  onSettings?: () => void;
  className?: string;
}

const statusConfig: Record<IntegrationStatus, {
  label: string;
  dotClass: string;
  textClass: string;
}> = {
  connected: {
    label: 'Connected',
    dotClass: 'bg-status-success',
    textClass: 'text-status-success',
  },
  not_set: {
    label: 'Not Set',
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
  },
  coming_soon: {
    label: 'Coming Soon',
    dotClass: 'bg-status-info',
    textClass: 'text-status-info',
  },
};

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  onConnect,
  onSettings,
  className,
}: IntegrationCardProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'glass rounded-xl p-4 flex flex-col gap-3 transition-all',
        status !== 'coming_soon' && 'hover:border-brand-500/30',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-foreground">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
          <span className={cn('text-xs font-medium', config.textClass)}>
            {config.label}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground">{name}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-1">
        {status === 'connected' && onSettings && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onSettings}
          >
            Settings
          </Button>
        )}
        {status === 'not_set' && onConnect && (
          <Button
            variant="subtle"
            size="sm"
            className="w-full"
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
        {status === 'coming_soon' && (
          <Button
            variant="muted"
            size="sm"
            className="w-full"
            disabled
          >
            Coming Soon
          </Button>
        )}
      </div>
    </div>
  );
}
