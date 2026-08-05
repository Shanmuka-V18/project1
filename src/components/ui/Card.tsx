import React from 'react';
import { cn } from '@/lib/utils';
import { CardTitleText, MutedText } from './Typography';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardTitleText className={className}>{children}</CardTitleText>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <MutedText className={className}>{children}</MutedText>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>;
}
