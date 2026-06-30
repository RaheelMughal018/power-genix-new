'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/app/_shared/components/ui/input/input';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';
import { useDebounce } from '@/app/_shared/lib/hooks/useDebounce';

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange?: { from: string; to: string } | null;
  onDateRangeChange?: (range: { from: string; to: string } | null) => void;
  searchPlaceholder?: string;
}

export const HistoryFilters = ({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  searchPlaceholder = 'Search by invoice # or notes...',
}: HistoryFiltersProps) => {
  const [pickerKey, setPickerKey] = useState(0);
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 400);
  const lastEmitted = useRef(search);

  useEffect(() => {
    if (search !== lastEmitted.current) {
      setLocalSearch(search);
      lastEmitted.current = search;
    }
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === lastEmitted.current) return;
    lastEmitted.current = debouncedSearch;
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const hasFilter = Boolean(localSearch) || Boolean(dateRange);

  const handleClear = () => {
    setLocalSearch('');
    lastEmitted.current = '';
    onSearchChange('');
    onDateRangeChange?.(null);
    setPickerKey((k) => k + 1);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="w-full sm:w-72">
        <Input
          size="sm"
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>
      {onDateRangeChange && <DateRangePicker key={pickerKey} onChange={onDateRangeChange} />}
      {hasFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-(--color-primary) hover:underline cursor-pointer px-2 py-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
