import React from 'react';
import { cn, getStatusColor } from '../../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status';
  status?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium";

  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    status: status ? getStatusColor(status) : "bg-gray-100 text-gray-800"
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </span>
  );
}