'use client';

import * as React from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

export interface DataRowProps {
  label: string;
  value: string | undefined;
  onSave?: (value: string) => void;
  editable?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url';
  placeholder?: string;
  className?: string;
  valueClassName?: string;
  disabled?: boolean;
}

export function DataRow({
  label,
  value,
  onSave,
  editable = true,
  type = 'text',
  placeholder = '',
  className,
  valueClassName,
  disabled = false,
}: DataRowProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value || '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleEdit = () => {
    setEditValue(value || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave?.(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-muted/50',
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
        {label}
      </span>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-8 text-sm max-w-[200px]"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSave}
          >
            <Check className="h-3.5 w-3.5 text-status-success" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium text-foreground',
              !value && 'text-muted-foreground italic',
              valueClassName
            )}
          >
            {value || placeholder || 'Not set'}
          </span>
          {editable && !disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEdit}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
