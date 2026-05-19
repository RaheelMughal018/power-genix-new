'use client';

import { useState } from 'react';
import { DatePicker } from '@/app/_shared/components/ui/datePicker/datePicker';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import styles from './dateRangePicker.module.scss';

type Preset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangePickerProps {
  onChange: (range: { from: string; to: string } | null) => void;
  fiscalYearStart?: number;
  className?: string;
}

const getPresetRange = (preset: Preset, fiscalYearStart: number): { from: string; to: string } | null => {
  if (preset === 'custom') return null;

  const now = new Date();

  if (preset === 'today') {
    const iso = toLocalISO(now);
    return { from: iso, to: iso };
  }

  if (preset === 'thisWeek') {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6);
    return { from: toLocalISO(from), to: toLocalISO(to) };
  }

  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toLocalISO(from), to: toLocalISO(to) };
  }

  if (preset === 'thisYear') {
    const month = now.getMonth() + 1;
    const year = month >= fiscalYearStart ? now.getFullYear() : now.getFullYear() - 1;
    const from = new Date(year, fiscalYearStart - 1, 1);
    const to = new Date(year + 1, fiscalYearStart - 1, 0);
    return { from: toLocalISO(from), to: toLocalISO(to) };
  }

  return null;
};

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This Week' },
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
