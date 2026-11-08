'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon' | 'icon-sm' | 'icon-xs' | 'icon-lg';
}

export function CopyButton({ value, label, className, size = 'icon-xs' }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Icon = copied ? Icons.check : Icons.clipboard;

  if (label) {
    return (
      <button
        type='button'
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
        aria-label={copied ? 'Copied!' : `Copy ${label}`}
      >
        <Icon className='size-3.5 shrink-0' />
        <span>{value}</span>
      </button>
    );
  }

  return (
    <Button
      variant='ghost'
      size={size}
      type='button'
      onClick={handleCopy}
      className={cn(className)}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <Icon className={size === 'icon-xs' ? 'size-3' : 'size-4'} />
      <span className='sr-only'>{copied ? 'Copied!' : 'Copy'}</span>
    </Button>
  );
}
