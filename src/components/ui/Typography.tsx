import React from 'react';
import { cn } from '@/lib/utils';

export interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement | HTMLLabelElement | HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn('text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors', className)}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn('text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 transition-colors', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardTitleText({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn('text-lg font-bold text-slate-800 dark:text-slate-200 transition-colors', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function BodyText({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-sm text-slate-700 dark:text-slate-300 leading-relaxed transition-colors', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function MutedText({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-xs text-slate-500 dark:text-slate-400 transition-colors', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function TableHeading({ children, className, ...props }: TypographyProps) {
  return (
    <span
      className={cn('text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function FormLabel({ children, className, ...props }: TypographyProps) {
  return (
    <label
      className={cn('block text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function StatLabel({ children, className, ...props }: TypographyProps) {
  return (
    <span
      className={cn('text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors', className)}
      {...props}
    >
      {children}
    </span>
  );
}
