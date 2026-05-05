'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './searchableDropdown.module.scss';

export interface SearchableDropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  required = false,
  className,
}: SearchableDropdownProps) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase();
    return o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false);
  });

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    updateMenuPosition();
    setIsOpen(true);
    setSearch('');
    setHighlighted(0);
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [disabled, updateMenuPosition]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  const select = useCallback(
    (opt: SearchableDropdownOption) => {
      onChange(opt.value);
      close();
    },
    [onChange, close]
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) close();
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updateMenuPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, updateMenuPosition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') open();
      return;
    }
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) { select(filtered[highlighted]); }
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={[styles.label, required ? styles['label--required'] : ''].filter(Boolean).join(' ')}>
          {label}
        </label>
      )}

      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className={[
          styles.trigger,
          isOpen ? styles['trigger--open'] : '',
          error ? styles['trigger--error'] : '',
          disabled ? styles['trigger--disabled'] : '',
        ].filter(Boolean).join(' ')}
        onClick={isOpen ? close : open}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? styles['trigger-value'] : styles['trigger-placeholder']}>
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel && <span className={styles.sublabel}>{selected.sublabel}</span>}
            </>
          ) : placeholder}
        </span>

        <span className={styles.icons}>
          {selected && (
            <button
              type="button"
              className={styles['clear-btn']}
              onClick={clear}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <svg
            className={[styles.chevron, isOpen ? styles['chevron--up'] : ''].filter(Boolean).join(' ')}
            width="16" height="16" viewBox="0 0 16 16" fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef} className={styles.menu} role="listbox" style={menuStyle}>
          <div className={styles['search-wrap']}>
            <svg className={styles['search-icon']} width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              className={styles['search-input']}
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlighted(0); }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.options}>
            {filtered.length === 0 ? (
              <div className={styles['no-results']}>No results found</div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={[
                    styles.option,
                    opt.value === value ? styles['option--selected'] : '',
                    i === highlighted ? styles['option--highlighted'] : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => select(opt)}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <span className={styles['option-label']}>{opt.label}</span>
                  {opt.sublabel && <span className={styles['option-sublabel']}>{opt.sublabel}</span>}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}

      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
};
