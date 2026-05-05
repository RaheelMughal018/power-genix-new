'use client';

import { useState } from 'react';
import { DatePicker } from '@/app/_shared/components/ui/datePicker/datePicker';
import styles from './dateRangePicker.module.scss';

type Preset = 'today' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangePickerProps {
  onChange: (range: { from: string; to: string } | null) => void;
  fiscalYearStart?: number;
  className?: string;
}

const toISO = (d: Date) => d.toISOString().split('T')[0];

const getPresetRange = (preset: Preset, fiscalYearStart: number): { from: string; to: string } | null => {
  if (preset === 'custom') return null;

  const now = new Date();

  if (preset === 'today') {
    const iso = toISO(now);
    return { from: iso, to: iso };
  }

  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toISO(from), to: toISO(to) };
  }

  if (preset === 'thisYear') {
    const month = now.getMonth() + 1;
    const year = month >= fiscalYearStart ? now.getFullYear() : now.getFullYear() - 1;
    const from = new Date(year, fiscalYearStart - 1, 1);
    const to = new Date(year + 1, fiscalYearStart - 1, 0);
    return { from: toISO(from), to: toISO(to) };
  }

  return null;
};

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

export const DateRangePicker = ({
  onChange,
  fiscalYearStart = 7,
  className,
}: DateRangePickerProps) => {
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);

    if (preset !== 'custom') {
      const range = getPresetRange(preset, fiscalYearStart);
      onChange(range);
    } else {
      if (customFrom && customTo) {
        onChange({ from: customFrom, to: customTo });
      } else {
        onChange(null);
      }
    }
  };

  const handleCustomFrom = (val: string) => {
    setCustomFrom(val);
    if (val && customTo) onChange({ from: val, to: customTo });
    else onChange(null);
  };

  const handleCustomTo = (val: string) => {
    setCustomTo(val);
    if (customFrom && val) onChange({ from: customFrom, to: val });
    else onChange(null);
  };

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.presets}>
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={[styles.preset, activePreset === key ? styles['preset--active'] : ''].filter(Boolean).join(' ')}
            onClick={() => handlePreset(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activePreset === 'custom' && (
        <div className={styles.customRange}>
          <DatePicker
            label="From"
            value={customFrom}
            onChange={handleCustomFrom}
            max={customTo || undefined}
          />
          <DatePicker
            label="To"
            value={customTo}
            onChange={handleCustomTo}
            min={customFrom || undefined}
          />
        </div>
      )}
    </div>
  );
};
