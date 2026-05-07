'use client';

import { useState, useMemo } from 'react';
import { toLocalISO, parseLocalDate } from '@/app/_shared/lib/utils/date';
import styles from './calendar.module.scss';

interface CalendarProps {
  value?: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getStartDay = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

export const Calendar = ({ value, onChange, min, max }: CalendarProps) => {
  const parsed = value ? parseLocalDate(value) : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const days = useMemo(() => {
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const startDay = getStartDay(viewYear, viewMonth);
    const cells: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let i = 1; i <= totalDays; i++) cells.push(i);

    return cells;
  }, [viewYear, viewMonth]);

  const isDisabled = (day: number) => {
    const iso = toLocalISO(new Date(viewYear, viewMonth, day));
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const iso = toLocalISO(new Date(viewYear, viewMonth, day));
    return iso === value;
  };

  const isToday = (day: number) => {
    const today = toLocalISO(new Date());
    const iso = toLocalISO(new Date(viewYear, viewMonth, day));
    return iso === today;
  };

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    const iso = toLocalISO(new Date(viewYear, viewMonth, day));
    onChange(iso);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button type="button" className={styles.navBtn} onClick={prevMonth}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18L9 12L15 6" />
          </svg>
        </button>
        <span className={styles.title}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" className={styles.navBtn} onClick={nextMonth}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18L15 12L9 6" />
          </svg>
        </button>
      </div>

      <div className={styles.weekdays}>
        {DAYS.map((d) => (
          <span key={d} className={styles.weekday}>{d}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day, i) => (
          <div key={i} className={styles.cell}>
            {day && (
              <button
                type="button"
                disabled={isDisabled(day)}
                className={[
                  styles.day,
                  isSelected(day) ? styles['day--selected'] : '',
                  isToday(day) && !isSelected(day) ? styles['day--today'] : '',
                  isDisabled(day) ? styles['day--disabled'] : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleSelect(day)}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
