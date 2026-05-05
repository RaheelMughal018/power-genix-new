'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar } from '@/app/_shared/components/ui/calendar/calendar';
import styles from './datePicker.module.scss';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

const formatDisplay = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DatePicker = ({
  value = '',
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  min,
  max,
  placeholder = 'Select date',
  className,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkAlignment = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setAlignRight(rect.left + 280 > window.innerWidth);
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (date: string) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={[styles.label, required ? styles['label--required'] : ''].filter(Boolean).join(' ')}>
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        className={[
          styles.trigger,
          error ? styles['trigger--error'] : '',
          disabled ? styles['trigger--disabled'] : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (disabled) return;
          if (!open) checkAlignment();
          setOpen(!open);
        }}
      >
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className={value ? styles.value : styles.placeholder}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setOpen(false);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </button>

      {open && (
        <div className={[styles.dropdown, alignRight ? styles['dropdown--right'] : ''].filter(Boolean).join(' ')}>
          <Calendar value={value} onChange={handleSelect} min={min} max={max} />
        </div>
      )}

      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
};
