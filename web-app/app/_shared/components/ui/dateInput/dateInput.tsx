'use client';

import { DatePicker } from '@/app/_shared/components/ui/datePicker/datePicker';

interface DateInputProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

export const DateInput = ({
  value = '',
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  min,
  max,
  className,
}: DateInputProps) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      label={label}
      error={error}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      className={className}
    />
  );
};
