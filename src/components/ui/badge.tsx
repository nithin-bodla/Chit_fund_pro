import React from 'react';
import { MemberPaymentStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/currency';

interface BadgeProps {
  status: MemberPaymentStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: BadgeProps) {
  const colors = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}
