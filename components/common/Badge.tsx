import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'slate', size = 'sm', className }: BadgeProps) {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-sm font-semibold',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border ring-1",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
