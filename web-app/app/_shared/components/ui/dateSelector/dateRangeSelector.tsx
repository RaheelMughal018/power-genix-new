'use client';

import React, { useState } from 'react';
import { DatePicker } from '@/app/_shared/components/ui/datePicker/datePicker';
import { toLocalISO } from '@/app/_shared/lib/utils/date';
import styles from './dateSelector.module.scss';

interface DateRangeSelectorProps {
  from?: string;
  to?: string;
  onChange: (range: { from: string; to: string } | null) => void;
  label?: string;
  fiscalYearStart?: number;
  className?: string;
}

type Preset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const getPresetRange = (preset: Exclude<Preset, 'custom'>, fiscalYearStart: number) => {
  const now = new Date();

  if (preset === 'today') {
    const iso = toLocalISO(now);
    return { from: iso, to: iso };
  }
  if (preset === 'thisWeek') {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: toLocalISO(mon), to: toLocalISO(sun) };
  }
  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toLocalISO(from), to: toLocalISO(to) };
  }
  const month = now.getMonth() + 1;
  const year = month >= fiscalYearStart ? now.getFullYear() : now.getFullYear() - 1;
  const from = new Date(year, fiscalYearStart - 1, 1);
  const to = new Date(year + 1, fiscalYearStart - 1, 0);
  return { from: toLocalISO(from), to: toLocalISO(to) };
};

export const DateRangeSelector = ({
  from = '',
  to = '',
  onChange,
  label,
  fiscalYearStart = 7,
  className,
}: DateRangeSelectorProps) => {
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      if (customFrom && customTo) onChange({ from: customFrom, to: customTo });
      else onChange(null);
      return;
    }
    onChange(getPresetRange(preset, fiscalYearStart));
  };

  const handleFromChange = (val: string) => {
    setCustomFrom(val);
    if (val && customTo) onChange({ from: val, to: customTo });
    else onChange(null);
  };

  const handleToChange = (val: string) => {
    setCustomTo(val);
    if (customFrom && val) onChange({ from: customFrom, to: val });
    else onChange(null);
  };

  const handleClear = () => {
    setActivePreset(null);
    setCustomFrom('');
    setCustomTo('');
    onChange(null);
  };

  return (
    <div className={[styles.rangeWrapper, className].filter(Boolean).join(' ')}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.toolbar}>
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

        {(activePreset || from || to) && (
          <button type="button" className={styles['clear-btn']} onClick={handleClear}>
            All
          </button>
        )}
      </div>

      {activePreset === 'custom' && (
        <div className={styles.customRange}>
          <DatePicker
            label="From"
            value={customFrom}
            onChange={handleFromChange}
            max={customTo || undefined}
          />
          <DatePicker
            label="To"
            value={customTo}
            onChange={handleToChange}
            min={customFrom || undefined}
          />
        </div>
      )}
    </div>
  );
};
