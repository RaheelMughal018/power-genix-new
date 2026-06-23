# Unsold Inverters Page + Sold Inverters Tweaks

**Date:** 2026-06-22
**Status:** Draft (awaiting user review)

## Summary

Two related changes to the inverter tracking modules:

1. **Sold Inverters** — add a `Total Quantity` summary card and extend the search box to also match the inverter item name.
2. **Unsold Inverters** — new page that lists produced inverter units which have not yet been sold (no active `SoldInverter` record). Mirrors the Sold Inverters layout: summary cards, filters, table, CSV export.

Both surfaces share the same mental model: a produced unit is "sold" iff a non-soft-deleted `SoldInverter` row exists with a matching `serialNumber`. Unsold = the complement.

---

## Part A — Sold Inverters Tweaks

### A1. Total Quantity card

**Backend** — `backend/src/sold-inverters/providers/sold-inverters.service.ts`, `getSummary(query)`:

- Currently returns `{ totalProductionCost, totalSaleCost, totalProfit }`.
- Add `totalQuantity: number` — count of `SoldInverter` rows matching the same `query` filters as the other aggregates (use the same WHERE clauses, including `deletedAt IS NULL` via TypeORM soft-delete default).
- Reuse the existing query-builder helper so search/customer/date filters apply identically.

**Frontend** — `web-app/app/(pages)/(dashboard)/dashboard/sold-inverters/page.tsx`:

- Render a 4th summary card "Total Quantity" to the right of "Total Profit".
- Grid changes from 3 → 4 columns at the same breakpoint.
- Reads `summary.totalQuantity` from the existing `useSoldInverters` hook (already wires `summary` to `getSummary` per memory 4033).

**API client** — `web-app/app/_shared/lib/api/client.ts`:

- Extend `SoldInverterSummary` TypeScript interface with `totalQuantity: number`.
- No change to `soldInvertersApi.getSummary()` signature — params already forwarded (memory 4029).

### A2. Search includes item name

**Backend** — same service file, `applySearch()` helper used by `findAll`, `getSummary`, and `exportCsv`:

- Current OR clause matches: `si.serialNumber`, the joined `SaleInvoiceItem` for invoice number, customer name.
- Add: `LOWER(item.name) LIKE :q` to the OR clause. `item` is already left-joined in `findAll`/`getSummary`.
- Ensure all three methods that use search apply the change consistently — confirm via single helper rather than duplicating logic.

**Frontend** — no change. Same search box.

### A3. Edge cases (Sold tweaks)

- Empty search + no filters → `totalQuantity` equals the total `SoldInverter` count (soft-delete excluded).
- Search "18KW" with no matching item → `totalQuantity` = 0, table empty, other totals = 0.
- Customer filter + search interact via AND (existing pattern). Item-name match is part of the OR group within `applySearch`.

---

## Part B — Unsold Inverters Page

### B1. Definition

An **unsold inverter** is a `ProductionUnit` where:

- The parent `ProductionBatch.status = 'completed'` (pending batches haven't produced real stock yet), AND
- No `SoldInverter` row exists with a matching `serialNumber` and `deletedAt IS NULL`.

A unit becomes unsold again automatically if its sale invoice is deleted (sale-invoice deletion soft-deletes the `SoldInverter` per `sale-invoices.service.ts:198-200`). No status flag or migration is needed.

### B2. Backend module

New module at `backend/src/unsold-inverters/` following the project convention (`backend/CLAUDE.md` — Conventions / Module structure):

```
unsold-inverters/
├── unsold-inverters.module.ts
├── unsold-inverters.controller.ts
├── unsold-inverters.controller.spec.ts
├── providers/
│   └── unsold-inverters.service/
│       ├── unsold-inverters.service.ts
│       └── unsold-inverters.service.spec.ts
└── dtos/
    └── unsold-inverter-query.dto.ts
```

No new entity. The module imports `TypeOrmModule.forFeature([ProductionUnit, SoldInverter, Item])` and uses a query builder against `ProductionUnit`.

Register the module in `app.module.ts`.

### B3. Endpoints

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/unsold-inverters` | Paginated list of unsold units |
| `GET` | `/unsold-inverters/summary` | `{ totalQuantity, totalProductionCost }` |
| `GET` | `/unsold-inverters/export/csv` | CSV stream (uses `@Res()`) |

All three accept the same `UnsoldInverterQueryDto`.

### B4. Query DTO

`UnsoldInverterQueryDto extends PaginationQueryDto`:

| Field | Type | Notes |
|-------|------|-------|
| `itemId?` | `number` | Filter by produced item (resolved via `Recipe.finalProductId`) |
| `fromDate?` | `string` (ISO) | Lower bound on `ProductionBatch.productionDate` |
| `toDate?` | `string` (ISO) | Upper bound on `ProductionBatch.productionDate` |
| `search?` | `string` | Inherited via `PaginationQueryDto` — matches serial #, batch #, item name |

Validation via `class-validator` (`@IsOptional`, `@IsInt`, `@IsDateString`).

### B5. Core query

```sql
SELECT pu.*, pb.batchNumber, pb.productionDate, item.id AS itemId, item.name AS itemName
FROM production_unit pu
JOIN production_batch pb ON pu.batchId = pb.id
JOIN recipe r            ON pb.recipeId = r.id
JOIN item                ON r.finalProductId = item.id
LEFT JOIN sold_inverter si
       ON si.serialNumber = pu.serialNumber
      AND si.deletedAt IS NULL
WHERE si.id IS NULL
  AND pb.status = 'completed'
  -- [itemId]      AND item.id = :itemId
  -- [fromDate]    AND pb.productionDate >= :fromDate
  -- [toDate]      AND pb.productionDate <= :toDate
  -- [search]      AND (pu.serialNumber ILIKE :q OR pb.batchNumber ILIKE :q OR item.name ILIKE :q)
ORDER BY pb.productionDate DESC, pu.id DESC
LIMIT :take OFFSET :skip;
```

Implemented via TypeORM `createQueryBuilder('pu')`. Conditional `andWhere` clauses applied in an `applyFilters(qb, query)` helper so list, summary, and CSV share filter logic.

### B6. Response shape — list row

```ts
{
  id: number;
  serialNumber: string;
  unitCost: number;
  batch: {
    id: number;
    batchNumber: string;
    productionDate: string; // ISO
  };
  item: {
    id: number;
    name: string;
  };
}
```

Wrapped by `DataResponseInterceptor` as `{ data: { data: [...], meta: { ... } } }` (mirrors Sold Inverters pagination wrapper).

### B7. Summary endpoint

```ts
{
  totalQuantity: number;       // COUNT(*)
  totalProductionCost: number; // SUM(pu.unitCost)
}
```

Reuses `applyFilters` with the same WHERE clauses as `findAll`.

### B8. CSV export

Columns: `Serial #`, `Item Name`, `Batch #`, `Production Date`, `Production Cost`.

Streamed via `@Res()` to bypass `DataResponseInterceptor` (per backend CLAUDE.md). Same filter DTO applied.

### B9. Frontend

**Route:** `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/page.tsx`
**Hook:** `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/useUnsoldInverters.ts`

**Sidebar:** add link "Unsold Inverters" immediately after "Sold Inverters" in the dashboard navigation config.

**API client** — add to `web-app/app/_shared/lib/api/client.ts`:

```ts
unsoldInvertersApi = {
  getAll: (params) => apiClient.get('/unsold-inverters', params),
  getSummary: (params) => apiClient.get('/unsold-inverters/summary', params),
  exportCsv: (params) => apiClient.get('/unsold-inverters/export/csv', params, { responseType: 'blob' }),
}
```

Define `UnsoldInverter`, `UnsoldInverterSummary`, `UnsoldInverterQuery` TypeScript interfaces alongside the existing sold-inverter types.

**Layout** — mirrors Sold Inverters page:

- Header: "Unsold Inverters" + subtitle "View inverter units in stock awaiting sale".
- Summary cards (2 cards, grid 2 cols on desktop): `Total Quantity`, `Total Production Cost`. Both reflect active filters.
- Filters row:
  - `Item` dropdown (label "Item", placeholder "All Items"). Options sourced from a small helper endpoint **`GET /unsold-inverters/items`** that returns `{ id, name }` for items that currently have at least one unsold unit (i.e. the same WHERE clauses as the main query, minus the user filters, `SELECT DISTINCT item.id, item.name`). Avoids picking an item and getting empty results.
  - Date-range chips (Today / This Week / This Month / This Year / Custom) — reuse the same `DateRangeChips` component used by Sold Inverters.
- Search box: placeholder `Search by serial #, batch #, item name…`.
- `Export CSV` button (right-aligned, same component).
- Table columns: `Serial #` | `Item Name` | `Batch #` | `Production Date` | `Production Cost`.
- Pagination footer (reuse existing component).

**Hook responsibilities:** owns query state (`page`, `limit`, `search`, `itemId`, `fromDate`, `toDate`), debounces `search`, fires `getAll` + `getSummary` in parallel on state change, exposes `data`, `meta`, `summary`, `loading`, `error`, and handlers for each filter/search/page change. Mirror `useSoldInverters` patterns (memory 4033).

### B10. Edge cases

- **No production data** → empty table, both cards `0`/`Rs. 0.00`, dropdown empty.
- **Batch deleted** (pending batches only, per `backend/CLAUDE.md` Production Edit/Delete) → units hard-deleted, automatically drop from this list.
- **Sale invoice deleted** → `SoldInverter` soft-deleted, unit reappears in unsold list. No additional code needed.
- **Date filter excludes everything** → both cards `0`, table empty, item dropdown still shows the global list (dropdown is filter-independent).
- **Item filter for an item with no unsold units** → would normally not be selectable since the dropdown only lists items with unsold units; if a sale happens after the dropdown loaded and the user picks a now-empty item, cards `0` and table empty.
- **Search matches batch number `BATCH-0005` but item filter excludes it** → AND between item filter and search OR group → empty result. Matches Sold Inverters behaviour.
- **CSV export with active filters** → filters apply identically (single `applyFilters` helper).
- **Concurrent sale during browsing** → page is read-only, no stale-data correctness issue; refresh shows updated state.

### B11. Out of scope

- No bulk actions (delete, transfer, mark-as-sold) — read-only registry.
- No "estimated sale price / estimated profit" cards (deferred per brainstorming Q).
- No "days in stock" column (deferred per brainstorming Q).
- No alert / notification when units sit unsold past a threshold.
- No status flag added to `ProductionUnit` (avoid migration, derive from joins).

---

## Tests

Per `backend/CLAUDE.md` testing rules, the new module gets:

- **Unit tests** for `unsold-inverters.service` covering: filter helper application, completed-batch-only constraint, unsold-only constraint (LEFT JOIN with `IS NULL`), summary aggregates, CSV stream content.
- **Controller tests** for each endpoint (HTTP layer + delegation).
- **E2E test** at `backend/test/unsold-inverters.e2e-spec.ts` covering at least: empty-state, list with active sold/unsold mix, summary correctness, item filter, date filter, search across all three fields, CSV export headers, sale-invoice-delete restores a unit to the unsold list.

Edge-case categories from `backend/CLAUDE.md` (Validation / Auth / Business logic / Database / Error handling / Boundary / Response format) reviewed before writing tests; user is asked to confirm before any test code is written.

No new tests required for Part A beyond updating the existing Sold Inverters specs to cover `totalQuantity` and the item-name search match.

---

## File-touch summary

**Backend (new):**
- `src/unsold-inverters/unsold-inverters.module.ts`
- `src/unsold-inverters/unsold-inverters.controller.ts`
- `src/unsold-inverters/unsold-inverters.controller.spec.ts`
- `src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.ts`
- `src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.spec.ts`
- `src/unsold-inverters/dtos/unsold-inverter-query.dto.ts`
- `test/unsold-inverters.e2e-spec.ts`

**Backend (edits):**
- `src/app.module.ts` — register `UnsoldInvertersModule`.
- `src/sold-inverters/providers/sold-inverters.service.ts` — add `totalQuantity` to `getSummary`; extend `applySearch` to match item name.
- `src/sold-inverters/providers/sold-inverters.service.spec.ts` (or equivalent) — cover new behaviour.

**Frontend (new):**
- `app/(pages)/(dashboard)/dashboard/unsold-inverters/page.tsx`
- `app/(pages)/(dashboard)/dashboard/unsold-inverters/useUnsoldInverters.ts`

**Frontend (edits):**
- `app/_shared/lib/api/client.ts` — add `unsoldInvertersApi`, related types, extend `SoldInverterSummary` with `totalQuantity`.
- Sidebar config — add "Unsold Inverters" nav link.
- `app/(pages)/(dashboard)/dashboard/sold-inverters/page.tsx` — render 4th `Total Quantity` card; grid 3 → 4 cols.

**Docs:**
- `CLAUDE.md` (root) — add "Unsold Inverters" row to Implemented Modules table after merge.
- `backend/CLAUDE.md` — note that "sold-vs-unsold" is derived (no status flag), if not already obvious.
