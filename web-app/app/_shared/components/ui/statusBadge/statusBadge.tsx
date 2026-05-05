'use client';

import styles from './statusBadge.module.scss';

type StatusType =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'in_stock'
  | 'out_of_stock'
  | 'low_stock'
  | 'charged'
  | 'foc'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
  in_stock: { label: 'In Stock', color: 'success' },
  out_of_stock: { label: 'Out of Stock', color: 'error' },
  low_stock: { label: 'Low Stock', color: 'warning' },
  charged: { label: 'Charged', color: 'info' },
  foc: { label: 'FOC', color: 'secondary' },
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'error' },
};

export const StatusBadge = ({ status, label, className = '' }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  const badgeClasses = [
    styles.statusBadge,
    styles[`statusBadge--${config.color}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={badgeClasses}>{displayLabel}</span>;
};
