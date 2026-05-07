'use client';

import React from 'react';
import { DatePicker } from '@/app/_shared/components/ui/datePicker/datePicker';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import styles from './dateSelector.module.scss';

interface DateSelectorProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

type Preset = 'today' | 'thisMonth' | 'thisYear' | 'custom';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const getPresetDate = (preset: Exclude<Preset, 'custom'>): string => {
  const now = new Date();
  if (preset === 'today') return toLocalISO(now);
  if (preset === 'thisMonth') return toLocalISO(new Date(now.getFullYear(), now.getMonth(), 1));
  return toLocalISO(new Date(now.getFullYear(), 0, 1));
};

export const DateSelector = ({
  value = '',
  onChange,
  label,
  error,
  required = false,
  className,
}: DateSelectorProps) => {
  const activePreset: Preset | null = (() => {
    if (!value) return null;
    const now = new Date();
    if (value === toLocalISO(now)) return 'today';
    if (value === toLocalISO(new Date(now.getFullYear(), now.getMonth(), 1))) return 'thisMonth';
    if (value === toLocalISO(new Date(now.getFullYear(), 0, 1))) return 'thisYear';
    return 'custom';
  })();

  const handlePreset = (preset: Preset) => {
    if (preset === 'custom') return;
    onChange(getPresetDate(preset));
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && (
        <span className={[styles.label, required ? styles['label--required'] : ''].filter(Boolean).join(' ')}>
          {label}
        </span>
      )}

      <div className={styles.presets}>
        {PRESETS.map(({ key, label: presetLabel }) => (
          <button
            key={key}
            type="button"
            className={[styles.preset, activePreset === key ? styles['preset--active'] : ''].filter(Boolean).join(' ')}
            onClick={() => handlePreset(key)}
          >
            {presetLabel}
          </button>
        ))}
      </div>

      <DatePicker
        value={value}
        onChange={onChange}
        error={error}
        required={required}
      />
    </div>
  );
};
