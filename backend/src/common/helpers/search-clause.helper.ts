import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface SearchClauseOptions {
  text?: string[];
  numeric?: string[];
  date?: string[];
}

export function applySearch<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  term: string | undefined | null,
  opts: SearchClauseOptions,
): void {
  if (term === undefined || term === null) return;
  const raw = String(term).trim();
  if (!raw) return;

  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (opts.text?.length) {
    for (const col of opts.text) {
      const key = paramKey(col, 't');
      conditions.push(`${col} ILIKE :${key}`);
      params[key] = `%${raw}%`;
    }
  }

  const isNumeric = /^\d+(\.\d*)?$/.test(raw);
  if (isNumeric && opts.numeric?.length) {
    for (const col of opts.numeric) {
      const key = paramKey(col, 'n');
      conditions.push(`${col}::text LIKE :${key}`);
      params[key] = `${raw}%`;
    }
  }

  const isDatePrefix = /^\d{4}(-\d{1,2}(-\d{1,2})?)?$/.test(raw);
  if (isDatePrefix && opts.date?.length) {
    for (const col of opts.date) {
      const key = paramKey(col, 'd');
      conditions.push(`to_char(${col}, 'YYYY-MM-DD') LIKE :${key}`);
      params[key] = `${raw}%`;
    }
  }

  if (!conditions.length) return;
  qb.andWhere(`(${conditions.join(' OR ')})`, params);
}

function paramKey(col: string, prefix: string): string {
  return `_s${prefix}_${col.replace(/[^a-zA-Z0-9]/g, '_')}`;
}
