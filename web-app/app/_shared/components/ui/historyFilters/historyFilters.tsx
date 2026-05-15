'use client';

import { useState } from 'react';
import { Input } from '@/app/_shared/components/ui/input/input';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: { from: string; to: string } | null;
  onDateRangeChange: (range: { from: string; to: string } | null) => void;
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
  const hasFilter = Boolean(search) || Boolean(dateRange);

  const handleClear = () => {
    onSearchChange('');
    onDateRangeChange(null);
    setPickerKey((k) => k + 1);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="w-full sm:w-72">
        <Input
          size="sm"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <DateRangePicker key={pickerKey} onChange={onDateRangeChange} />
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
