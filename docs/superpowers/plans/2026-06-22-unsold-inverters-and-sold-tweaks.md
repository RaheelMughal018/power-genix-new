# Unsold Inverters + Sold Inverters Tweaks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Unsold Inverters" page (lists produced inverter units not yet sold) and two tweaks to the existing Sold Inverters page (`Total Quantity` card + extend search to match item name).

**Architecture:**
- **Backend:** new `unsold-inverters` NestJS module that derives the unsold list via a LEFT JOIN of `ProductionUnit` against `SoldInverter` on `serialNumber` (no schema migration; status is derived). Mirrors the existing `sold-inverters` module's three endpoints (`list`, `summary`, `export/csv`) plus a small `/items` helper to drive the item filter dropdown.
- **Frontend:** new Next.js page under `dashboard/unsold-inverters/` mirroring the Sold Inverters layout, plus minor edits to the Sold Inverters page and shared API client.
- Spec: `docs/superpowers/specs/2026-06-22-unsold-inverters-and-sold-tweaks.md` (read it before starting).

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Next.js 16, React 19, Tailwind v4, Jest 30, supertest.

## Global Constraints

- **Never run `npm run build`** — use `npx tsc --noEmit` for type verification (root user rule).
- **Never commit, branch, push, or open a PR autonomously** — at every "stage" step, run `git status` + `git diff --stat`, show the user, and **stop** until they say to commit (root user rule).
- **Caveman mode in user-facing text** — drop filler, fragments OK, technical terms exact (root user rule).
- **Tests are mandatory** for every new module, controller, or provider (`backend/CLAUDE.md`).
- **Before writing test code,** present all identified edge cases grouped by category and ask the user "Are there any edge cases I'm missing?" — only proceed after confirmation (`backend/CLAUDE.md`).
- `DataResponseInterceptor` wraps ALL controller responses in `{ data: <body> }`. CSV exports use `@Res()` to bypass it.
- Path alias `@/*` → `backend/src/*`.
- Module file layout per `backend/CLAUDE.md` — providers with specs become folders, DTOs go in `dtos/`, entities in `entities/`.
- ProductionUnit has **no** `deletedAt` / `status` / `soldAt`. "Sold" is derived by serial-number join to non-deleted `SoldInverter`. Always also constrain `pb.status = 'completed'`.

---

## File Structure

### Backend — new files
- `src/unsold-inverters/unsold-inverters.module.ts`
- `src/unsold-inverters/unsold-inverters.controller.ts`
- `src/unsold-inverters/unsold-inverters.controller.spec.ts`
- `src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.ts`
- `src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.spec.ts`
- `src/unsold-inverters/dtos/unsold-inverter-query.dto.ts`
- `test/unsold-inverters.e2e-spec.ts`

### Backend — modified files
- `src/app.module.ts` — register `UnsoldInvertersModule`.
- `src/sold-inverters/providers/sold-inverters.service.ts` — extract `applyFilters` + `applySearch` helpers; apply to all three public methods; extend search to match item name; rename `count` → `totalQuantity`.
- `src/sold-inverters/sold-inverters.controller.ts` — Swagger summary tweak only (note quantity + search-aware totals).

### Frontend — new files
- `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/page.tsx`
- `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/useUnsoldInverters.ts`

### Frontend — modified files
- `web-app/app/_shared/lib/api/client.ts` — add `unsoldInvertersApi`, related TS types; rename `count` → `totalQuantity` in `SoldInverterSummary`.
- `web-app/app/(pages)/(dashboard)/dashboard/sold-inverters/page.tsx` — render 4th `Total Quantity` card; bump grid 3 → 4 cols.
- Sidebar nav config (path discovered in Task 14) — add "Unsold Inverters" link after "Sold Inverters".

### Docs
- `CLAUDE.md` (root) — add Unsold Inverters row to Implemented Modules table.
- `backend/CLAUDE.md` — short note that sold/unsold status is derived (no flag).

---

## Part A — Sold Inverters Tweaks

### Task 1: Refactor Sold Inverters service, add quantity, extend search

**Why first:** B reuses the same filter-helper pattern. Getting it right here means we copy a known-good shape into the new module.

**Files:**
- Modify: `backend/src/sold-inverters/providers/sold-inverters.service.ts`
- Modify: `backend/src/sold-inverters/sold-inverters.controller.ts:33` (Swagger summary)

**Interfaces:**
- Produces: `getSummary(query)` now returns `{ totalProductionCost: number; totalSaleCost: number; totalProfit: number; totalQuantity: number }` (field rename: `count` → `totalQuantity`).
- Produces: `findAll`, `getSummary`, `exportCsv` all honor `search`, `customerId`, `fromDate`, `toDate` identically.

- [ ] **Step 1: Read current state**

```bash
sed -n '1,200p' backend/src/sold-inverters/providers/sold-inverters.service.ts
```

Confirm `applyFilters` and `applySearch` do not yet exist and `getSummary`/`exportCsv` do not apply search.

- [ ] **Step 2: Refactor to use two private helpers + extend search + rename `count`**

Replace the body of `backend/src/sold-inverters/providers/sold-inverters.service.ts` with the version below. The helpers are factored so they can be applied to any QueryBuilder that has already left-joined `item` and `customer`.

```ts
import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { SoldInverter } from '../entities/sold-inverter.entity';
import { SoldInverterQueryDto } from '../dtos/sold-inverter-query.dto';
import { SaleInvoiceItem } from '@/sale-invoices/entities/sale-invoice-item.entity';

@Injectable()
export class SoldInvertersService {
  constructor(
    @InjectRepository(SoldInverter)
    private readonly repo: Repository<SoldInverter>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: SoldInverterQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoinAndSelect('si.item', 'item')
        .leftJoinAndSelect('si.customer', 'customer')
        .leftJoinAndSelect('si.createdBy', 'createdBy')
        .orderBy('si.saleDate', 'DESC')
        .addOrderBy('si.id', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const [data, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();
      const enriched = await this.attachSaleInvoices(data);

      return {
        data: enriched,
        meta: {
          itemsPerPage: limit,
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async getSummary(query: SoldInverterQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoin('si.item', 'item')
        .leftJoin('si.customer', 'customer')
        .select('COALESCE(SUM(CAST(si.productionCost AS numeric)), 0)', 'totalProductionCost')
        .addSelect('COALESCE(SUM(CAST(si.saleCost AS numeric)), 0)', 'totalSaleCost')
        .addSelect('COALESCE(SUM(CAST(si.profit AS numeric)), 0)', 'totalProfit')
        .addSelect('COUNT(si.id)', 'totalQuantity');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const result = await qb.getRawOne<{
        totalProductionCost: string;
        totalSaleCost: string;
        totalProfit: string;
        totalQuantity: string;
      }>();

      return {
        totalProductionCost: Number(result?.totalProductionCost ?? 0),
        totalSaleCost: Number(result?.totalSaleCost ?? 0),
        totalProfit: Number(result?.totalProfit ?? 0),
        totalQuantity: Number(result?.totalQuantity ?? 0),
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv(query: SoldInverterQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoinAndSelect('si.item', 'item')
        .leftJoinAndSelect('si.customer', 'customer')
        .orderBy('si.saleDate', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const records = await qb.getMany();

      return toCsvBuffer(
        ['Serial Number', 'Item', 'Customer', 'Sale Date'],
        records.map((r) => ({
          'Serial Number': r.serialNumber,
          'Item': r.item?.name ?? '',
          'Customer': r.customer?.name ?? '',
          'Sale Date': r.saleDate,
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  private applyFilters(qb: SelectQueryBuilder<SoldInverter>, query: SoldInverterQueryDto) {
    if (query.customerId) {
      qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
    }
    if (query.fromDate) {
      qb.andWhere('si.saleDate >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('si.saleDate <= :toDate', { toDate: query.toDate });
    }
  }

  private applySearch(qb: SelectQueryBuilder<SoldInverter>, search?: string) {
    if (!search) return;
    qb.leftJoin(SaleInvoiceItem, 'sii_search', 'sii_search.serialNumber = si.serialNumber')
      .leftJoin('sii_search.invoice', 'inv_search')
      .andWhere(
        '(item.name ILIKE :search OR si.serialNumber ILIKE :search OR customer.name ILIKE :search OR inv_search.invoiceNumber ILIKE :search)',
        { search: `%${search}%` },
      );
  }

  private async attachSaleInvoices(rows: SoldInverter[]) {
    const serials = rows.map((r) => r.serialNumber).filter((s): s is string => !!s);
    if (serials.length === 0) {
      return rows.map((r) => ({ ...r, saleInvoice: null }));
    }

    const items = await this.dataSource
      .getRepository(SaleInvoiceItem)
      .createQueryBuilder('sii')
      .innerJoin('sii.invoice', 'inv')
      .select('sii.serialNumber', 'serial')
      .addSelect('inv.id', 'id')
      .addSelect('inv.invoiceNumber', 'invoiceNumber')
      .where('sii.serialNumber IN (:...serials)', { serials })
      .getRawMany<{ serial: string; id: number; invoiceNumber: string }>();

    const map = new Map<string, { id: number; invoiceNumber: string }>();
    for (const i of items) {
      map.set(i.serial, { id: Number(i.id), invoiceNumber: i.invoiceNumber });
    }

    return rows.map((r) => ({
      ...r,
      saleInvoice: r.serialNumber ? map.get(r.serialNumber) ?? null : null,
    }));
  }
}
```

Notes:
- `applySearch` introduces a left join even when search is empty? No — it returns early. Joins only added when search is present.
- `getSummary` does a plain `leftJoin` (not `leftJoinAndSelect`) so the aggregate row stays clean.
- The `item` left join in `getSummary` is unconditional now so `applySearch` can reference `item.name` safely.

- [ ] **Step 3: Update controller Swagger note**

`backend/src/sold-inverters/sold-inverters.controller.ts:33` — change the `@ApiOperation` summary for `getSummary` to: `Get aggregated production cost, sale cost, profit, and quantity (honors customerId / fromDate / toDate / search filters)`.

- [ ] **Step 4: Type-check**

Run:
```bash
cd backend && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 5: Stage for user review**

Run:
```bash
cd backend && git status && git diff --stat
```
Stop and wait for the user to review. **Do not commit.**

---

### Task 2: Sold Inverters tests — edge-case pause then update specs

**Files:**
- Confirm presence: `backend/src/sold-inverters/sold-inverters.controller.spec.ts` (may not exist; create if missing per `backend/CLAUDE.md`)
- Create/modify: `backend/src/sold-inverters/providers/sold-inverters.service/sold-inverters.service.spec.ts` (promote provider to folder per file-placement convention if not already)
- Modify: `backend/test/sold-inverters.e2e-spec.ts` if it exists; else create.

**Interfaces:** consumes Task 1's signatures.

- [ ] **Step 1: Discover current test files**

Run:
```bash
find backend/src/sold-inverters -name "*.spec.ts"
find backend/test -name "sold-inverters*"
```

- [ ] **Step 2: Promote provider to folder if it's still a single file**

If `backend/src/sold-inverters/providers/sold-inverters.service.ts` is a file, move it to `backend/src/sold-inverters/providers/sold-inverters.service/sold-inverters.service.ts` (per `backend/CLAUDE.md` — providers with specs become folders). Update the import in `backend/src/sold-inverters/sold-inverters.module.ts` accordingly.

- [ ] **Step 3: Present edge cases to user — PAUSE**

Show this list and ask: "Are there any edge cases I'm missing?"

> **Validation:** none new (DTO unchanged).
>
> **Auth/Authorization:** none new (covered by global guard).
>
> **Business logic:**
> - `getSummary` with no filters returns counts matching `findAll` total.
> - `getSummary` with `search='18KW'` returns totals/quantity scoped to items whose name matches.
> - `getSummary` with `customerId` returns totals scoped to that customer.
> - `getSummary` with empty result set returns all zeros (including `totalQuantity: 0`).
> - `findAll` search matches: serial #, invoice #, customer name, **item name** (new).
> - `exportCsv` honors search (was a pre-existing gap, now fixed).
>
> **Database:** soft-deleted `SoldInverter` rows excluded from all three methods (TypeORM default).
>
> **Error handling:** repo error in any of the three methods → `handleError` → thrown.
>
> **Boundary:** zero soft-deleted matches → totals zero. Single match → totals equal that row's values. Large search string → no SQL injection (parameterised).
>
> **Response format:** summary shape now `{ totalProductionCost, totalSaleCost, totalProfit, totalQuantity }`. No stray `count` field.

**Wait for the user's confirmation before proceeding to Step 4.**

- [ ] **Step 4: Write/update unit tests for the service**

Cover at minimum:
- `getSummary` returns `totalQuantity` (not `count`).
- `getSummary` applies search filter (mock QueryBuilder to assert `andWhere` call).
- `findAll` search matches item name (assert the `applySearch` join + the ILIKE OR clause is added).
- `exportCsv` applies the same filters/search as `findAll`.

Use the existing module's mocking pattern (mocked `Repository`, mocked `DataSource`).

- [ ] **Step 5: Update controller spec if affected**

If `getSummary` controller test asserted the `count` field, update it to `totalQuantity`. Otherwise no change.

- [ ] **Step 6: Update E2E spec if it exists**

If `backend/test/sold-inverters.e2e-spec.ts` exists and asserts the `count` field, update to `totalQuantity`. Add an assertion that search by item name returns the expected rows.

- [ ] **Step 7: Run tests**

```bash
cd backend && npm test -- sold-inverters
cd backend && npm run test:e2e -- sold-inverters
```
Expected: all green.

- [ ] **Step 8: Stage for user review**

```bash
cd backend && git status && git diff --stat
```
**Stop. Do not commit.**

---

### Task 3: Frontend Sold Inverters — type + 4th card

**Files:**
- Modify: `web-app/app/_shared/lib/api/client.ts` — rename `count` → `totalQuantity` in the `SoldInverterSummary` type/interface.
- Modify: `web-app/app/(pages)/(dashboard)/dashboard/sold-inverters/page.tsx` — add 4th card; grid 3 → 4 cols.
- Modify: `web-app/app/(pages)/(dashboard)/dashboard/sold-inverters/useSoldInverters.ts` if it references `summary.count`.

**Interfaces:** consumes Task 1's renamed field.

- [ ] **Step 1: Locate `SoldInverterSummary`**

Run:
```bash
grep -n "SoldInverterSummary\|totalProfit\|totalSaleCost" web-app/app/_shared/lib/api/client.ts | head -20
grep -rn "summary\.count\|summary?\.count" web-app/app/\(pages\)/\(dashboard\)/dashboard/sold-inverters/
```

- [ ] **Step 2: Rename in the type and any consumer**

Change the `count: number` field on `SoldInverterSummary` (or wherever the summary shape is typed) to `totalQuantity: number`. Update any `summary.count` reference to `summary.totalQuantity`.

- [ ] **Step 3: Add 4th card on the page**

In `web-app/app/(pages)/(dashboard)/dashboard/sold-inverters/page.tsx`:

1. Change the summary grid container's class from a 3-column grid (e.g. `grid-cols-3` or `lg:grid-cols-3`) to a 4-column equivalent on `lg`+ breakpoints. Keep mobile responsive (1 col → 2 cols → 4 cols).
2. After the existing "Total Profit" card, add the same `Card` component reused above with:
   - Label: `Total Quantity`
   - Value: `{summary?.totalQuantity ?? 0}` formatted as a plain integer (no currency prefix). Match the existing card's text styling.
3. Loading and zero-state behave the same as the other cards.

- [ ] **Step 4: Frontend type-check**

```bash
cd web-app && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 5: Eyeball the page**

```bash
cd web-app && npm run dev
```
Open `/dashboard/sold-inverters`, confirm:
- 4 cards in one row on desktop.
- `Total Quantity` reflects the row count.
- Search `<item name fragment>` (e.g. `Mark`) returns matching rows AND the 4 cards update to match.
- Search `<known invoice #>` and `<known serial #>` still work (regression).

Stop the dev server after eyeball check (Ctrl+C).

- [ ] **Step 6: Stage for user review**

```bash
cd web-app && git status && git diff --stat
```
**Stop. Do not commit.**

---

## Part B — Unsold Inverters

### Task 4: Backend scaffold + register

**Files:**
- Create: `backend/src/unsold-inverters/unsold-inverters.module.ts`
- Create: `backend/src/unsold-inverters/unsold-inverters.controller.ts`
- Create: `backend/src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.ts`
- Create: `backend/src/unsold-inverters/dtos/unsold-inverter-query.dto.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:** produces empty methods returning typed stubs so later tasks fill them in.

- [ ] **Step 1: DTO**

Create `backend/src/unsold-inverters/dtos/unsold-inverter-query.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';

export class UnsoldInverterQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by produced item ID (recipe.finalProductId)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  itemId?: number;

  @ApiPropertyOptional({ description: 'From production date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To production date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
```

- [ ] **Step 2: Service shell**

Create `backend/src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductionUnit } from '@/production/entities/production-unit.entity';
import { UnsoldInverterQueryDto } from '../../dtos/unsold-inverter-query.dto';
import { ProductionStatus } from '@/production/enums/production-status.enum';

@Injectable()
export class UnsoldInvertersService {
  constructor(
    @InjectRepository(ProductionUnit)
    private readonly repo: Repository<ProductionUnit>,
  ) {}

  async findAll(query: UnsoldInverterQueryDto) {
    return { data: [], meta: { itemsPerPage: query.limit ?? 10, totalItems: 0, currentPage: query.page ?? 1, totalPages: 0 } };
  }

  async getSummary(_query: UnsoldInverterQueryDto) {
    return { totalQuantity: 0, totalProductionCost: 0 };
  }

  async listItemsWithUnsold(): Promise<Array<{ id: number; name: string }>> {
    return [];
  }

  async exportCsv(_query: UnsoldInverterQueryDto): Promise<Buffer> {
    return Buffer.from('');
  }

  private baseQuery(): SelectQueryBuilder<ProductionUnit> {
    return this.repo
      .createQueryBuilder('pu')
      .innerJoin('pu.batch', 'pb')
      .innerJoin('recipe', 'r', 'r.id = pb.recipeId')
      .innerJoin('item', 'item', 'item.id = r.finalProductId')
      .leftJoin(
        'sold_inverter',
        'si',
        'si.serialNumber = pu.serialNumber AND si.deletedAt IS NULL',
      )
      .where('si.id IS NULL')
      .andWhere('pb.status = :completed', { completed: ProductionStatus.COMPLETED });
  }

  private applyFilters(qb: SelectQueryBuilder<ProductionUnit>, query: UnsoldInverterQueryDto) {
    if (query.itemId) qb.andWhere('item.id = :itemId', { itemId: query.itemId });
    if (query.fromDate) qb.andWhere('pb.productionDate >= :fromDate', { fromDate: query.fromDate });
    if (query.toDate) qb.andWhere('pb.productionDate <= :toDate', { toDate: query.toDate });
  }

  private applySearch(qb: SelectQueryBuilder<ProductionUnit>, search?: string) {
    if (!search) return;
    qb.andWhere(
      '(pu.serialNumber ILIKE :q OR pb.batchNumber ILIKE :q OR item.name ILIKE :q)',
      { q: `%${search}%` },
    );
  }
}
```

Notes:
- `ProductionStatus` enum is at `@/production/enums/production-status.enum` — confirm path during the task; if it's `production-status.enum.ts` adjust accordingly.
- Raw table names `recipe`, `item`, `sold_inverter` used because we don't want to drag those entities through TypeORM relations on `ProductionUnit` (it has none). Snake-case if the DB convention differs — verify with `psql \d` or by inspecting `Item` / `Recipe` / `SoldInverter` `@Entity()` decorators.

- [ ] **Step 3: Controller shell**

Create `backend/src/unsold-inverters/unsold-inverters.controller.ts`:

```ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnsoldInvertersService } from './providers/unsold-inverters.service/unsold-inverters.service';
import { UnsoldInverterQueryDto } from './dtos/unsold-inverter-query.dto';

@ApiTags('Unsold Inverters')
@ApiBearerAuth()
@Controller('unsold-inverters')
export class UnsoldInvertersController {
  constructor(private readonly service: UnsoldInvertersService) {}

  @Get()
  @ApiOperation({ summary: 'List produced inverter units not yet sold (paginated, filterable)' })
  findAll(@Query() query: UnsoldInverterQueryDto) {
    return this.service.findAll(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aggregated totals (quantity + production cost), honors all filters' })
  getSummary(@Query() query: UnsoldInverterQueryDto) {
    return this.service.getSummary(query);
  }

  @Get('items')
  @ApiOperation({ summary: 'Distinct items that currently have at least one unsold unit' })
  items() {
    return this.service.listItemsWithUnsold();
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export filtered unsold list to CSV' })
  async exportCsv(@Query() query: UnsoldInverterQueryDto, @Res() res: Response) {
    const buf = await this.service.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="unsold-inverters.csv"');
    res.send(buf);
  }
}
```

- [ ] **Step 4: Module**

Create `backend/src/unsold-inverters/unsold-inverters.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnsoldInvertersController } from './unsold-inverters.controller';
import { UnsoldInvertersService } from './providers/unsold-inverters.service/unsold-inverters.service';
import { ProductionUnit } from '@/production/entities/production-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionUnit])],
  controllers: [UnsoldInvertersController],
  providers: [UnsoldInvertersService],
})
export class UnsoldInvertersModule {}
```

- [ ] **Step 5: Register in `app.module.ts`**

Add `UnsoldInvertersModule` to the `imports` array of `backend/src/app.module.ts` (placed alphabetically next to `SoldInvertersModule` for tidiness).

- [ ] **Step 6: Type-check**

```bash
cd backend && npx tsc --noEmit
```
Fix any path / enum-name mismatches surfaced.

- [ ] **Step 7: Smoke test endpoints exist**

```bash
cd backend && npm run start:dev
# in another shell
curl -s -H "Authorization: Bearer <valid-token>" http://localhost:3000/unsold-inverters | jq
curl -s -H "Authorization: Bearer <valid-token>" http://localhost:3000/unsold-inverters/summary | jq
curl -s -H "Authorization: Bearer <valid-token>" http://localhost:3000/unsold-inverters/items | jq
```
Expected: all return JSON wrapped by `DataResponseInterceptor` with the stub shapes. Stop the server (Ctrl+C).

- [ ] **Step 8: Stage for user review**

```bash
cd backend && git status && git diff --stat
```
**Stop. Do not commit.**

---

### Task 5: Backend `findAll` real query

**Files:** modify `backend/src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.ts`

**Interfaces:**
- Produces: `findAll` returns `{ data: UnsoldRow[], meta: PaginationMeta }` where:
  ```ts
  type UnsoldRow = {
    id: number;
    serialNumber: string;
    unitCost: number;
    batch: { id: number; batchNumber: string; productionDate: string };
    item: { id: number; name: string };
  };
  ```

- [ ] **Step 1: Implement**

Replace the `findAll` body:

```ts
async findAll(query: UnsoldInverterQueryDto) {
  try {
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;

    const qb = this.baseQuery()
      .select([
        'pu.id            AS pu_id',
        'pu.serialNumber  AS pu_serialNumber',
        'pu.unitCost      AS pu_unitCost',
        'pb.id            AS pb_id',
        'pb.batchNumber   AS pb_batchNumber',
        'pb.productionDate AS pb_productionDate',
        'item.id          AS item_id',
        'item.name        AS item_name',
      ])
      .orderBy('pb.productionDate', 'DESC')
      .addOrderBy('pu.id', 'DESC');

    this.applyFilters(qb, query);
    this.applySearch(qb, query.search);

    const countQb = this.baseQuery();
    this.applyFilters(countQb, query);
    this.applySearch(countQb, query.search);

    const [rows, totalItems] = await Promise.all([
      qb.offset(skip).limit(limit).getRawMany<{
        pu_id: number;
        pu_serialNumber: string;
        pu_unitCost: string;
        pb_id: number;
        pb_batchNumber: string;
        pb_productionDate: string;
        item_id: number;
        item_name: string;
      }>(),
      countQb.select('COUNT(pu.id)', 'count').getRawOne<{ count: string }>().then((r) => Number(r?.count ?? 0)),
    ]);

    const data = rows.map((r) => ({
      id: Number(r.pu_id),
      serialNumber: r.pu_serialNumber,
      unitCost: Number(r.pu_unitCost),
      batch: { id: Number(r.pb_id), batchNumber: r.pb_batchNumber, productionDate: r.pb_productionDate },
      item: { id: Number(r.item_id), name: r.item_name },
    }));

    return {
      data,
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

Add the `handleError` import at the top: `import { handleError } from '@/common/error-handlers/error.handler';`.

Notes:
- Using `getRawMany` + `offset/limit` instead of `getMany` because we left-join `sold_inverter` as a non-entity table (no `OneToMany` from `ProductionUnit` to `SoldInverter`).
- Count is computed via a parallel query (cheap; same WHERE).

- [ ] **Step 2: Type-check**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Manual verify with curl**

Start dev server, hit `/unsold-inverters` and `/unsold-inverters?search=<something>` and `/unsold-inverters?itemId=<id>`. Confirm row shapes match the typed contract.

- [ ] **Step 4: Stage for user review** — same `git status && git diff --stat` pattern.

---

### Task 6: Backend `getSummary` real query

**Files:** same service file.

- [ ] **Step 1: Implement**

```ts
async getSummary(query: UnsoldInverterQueryDto) {
  try {
    const qb = this.baseQuery()
      .select('COUNT(pu.id)', 'totalQuantity')
      .addSelect('COALESCE(SUM(CAST(pu.unitCost AS numeric)), 0)', 'totalProductionCost');

    this.applyFilters(qb, query);
    this.applySearch(qb, query.search);

    const result = await qb.getRawOne<{ totalQuantity: string; totalProductionCost: string }>();
    return {
      totalQuantity: Number(result?.totalQuantity ?? 0),
      totalProductionCost: Number(result?.totalProductionCost ?? 0),
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

- [ ] **Step 2: Type-check + curl smoke**

```bash
cd backend && npx tsc --noEmit
```
Hit `/unsold-inverters/summary` with various filters; confirm numbers match what `findAll` returns for the same filters.

- [ ] **Step 3: Stage** — same pattern.

---

### Task 7: Backend `/items` helper endpoint

**Files:** same service file.

- [ ] **Step 1: Implement**

```ts
async listItemsWithUnsold(): Promise<Array<{ id: number; name: string }>> {
  try {
    const qb = this.baseQuery()
      .select('DISTINCT item.id', 'id')
      .addSelect('item.name', 'name')
      .orderBy('item.name', 'ASC');

    const rows = await qb.getRawMany<{ id: number; name: string }>();
    return rows.map((r) => ({ id: Number(r.id), name: r.name }));
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

- [ ] **Step 2: Type-check + curl smoke**

Hit `/unsold-inverters/items`. Should return one entry per distinct produced inverter item that currently has any unsold unit.

- [ ] **Step 3: Stage.**

---

### Task 8: Backend `/export/csv`

**Files:** same service file.

- [ ] **Step 1: Implement**

```ts
async exportCsv(query: UnsoldInverterQueryDto): Promise<Buffer> {
  try {
    const qb = this.baseQuery()
      .select([
        'pu.serialNumber  AS serialNumber',
        'item.name        AS itemName',
        'pb.batchNumber   AS batchNumber',
        'pb.productionDate AS productionDate',
        'pu.unitCost      AS unitCost',
      ])
      .orderBy('pb.productionDate', 'DESC')
      .addOrderBy('pu.id', 'DESC');

    this.applyFilters(qb, query);
    this.applySearch(qb, query.search);

    const rows = await qb.getRawMany<{
      serialNumber: string;
      itemName: string;
      batchNumber: string;
      productionDate: string;
      unitCost: string;
    }>();

    return toCsvBuffer(
      ['Serial Number', 'Item Name', 'Batch Number', 'Production Date', 'Production Cost'],
      rows.map((r) => ({
        'Serial Number': r.serialNumber,
        'Item Name': r.itemName,
        'Batch Number': r.batchNumber,
        'Production Date': r.productionDate,
        'Production Cost': r.unitCost,
      })),
    );
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

Add the import: `import { toCsvBuffer } from '@/common/helpers/csv.helper';`.

- [ ] **Step 2: Type-check + curl smoke**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3000/unsold-inverters/export/csv?fromDate=2026-01-01" -o /tmp/unsold.csv
head /tmp/unsold.csv
```
Confirm the header row + a few data rows.

- [ ] **Step 3: Stage.**

---

### Task 9: Backend tests — edge-case pause + unit/controller specs

**Files:**
- Create: `backend/src/unsold-inverters/providers/unsold-inverters.service/unsold-inverters.service.spec.ts`
- Create: `backend/src/unsold-inverters/unsold-inverters.controller.spec.ts`

- [ ] **Step 1: Present edge cases to user — PAUSE**

Show this list and ask: "Are there any edge cases I'm missing?"

> **Validation:**
> - `itemId` is integer-positive (else 400).
> - `fromDate` / `toDate` are valid ISO dates (else 400).
> - `page` / `limit` are positive (inherited).
>
> **Auth/Authorization:** unauthenticated request → 401 (global guard).
>
> **Business logic:**
> - With no production units at all → empty list, summary `{ totalQuantity: 0, totalProductionCost: 0 }`, items dropdown empty.
> - Unit sold (matching active `SoldInverter`) → excluded from list, summary, items, csv.
> - Sold then sale invoice soft-deleted (deletedAt set) → unit re-appears in all four endpoints.
> - Batch in `pending` status → its units NEVER appear (even if no sold record exists).
> - Item filter with no unsold units → empty results (cards 0, table empty).
> - Date filter (fromDate, toDate, both) → restricts on `pb.productionDate`.
> - Search by serial #, batch #, item name → matches each via ILIKE.
>
> **Database:**
> - Soft-deleted SoldInverter join condition correctly excludes them.
> - JOIN against raw `sold_inverter` table works regardless of TypeORM cache.
>
> **Error handling:** repo error → `handleError` → throw.
>
> **Boundary:** `limit=0`/negative rejected by DTO. Very large limit OK. Search with special chars (`%`, `_`) does not crash (still parameterised; will match those literal chars within the value).
>
> **Response format:**
> - List wrapped by `DataResponseInterceptor` (`{ data: { data: [...], meta: {...} } }`).
> - Summary wrapped (`{ data: { totalQuantity, totalProductionCost } }`).
> - Items wrapped (`{ data: [{ id, name }] }`).
> - CSV stream uses `@Res()` → NOT wrapped, content-type `text/csv`, content-disposition attachment.

**Wait for the user's confirmation.**

- [ ] **Step 2: Write service spec**

Mock the `Repository<ProductionUnit>` with a mock `createQueryBuilder` that returns a chainable spy. Use the same mock-QueryBuilder pattern used in `sold-inverters.service.spec.ts` (read that file first to match style).

Cover, at minimum:
- `findAll` with no filters returns mapped rows + meta.
- `findAll` adds the right joins (`baseQuery` spy: assertions on `innerJoin`, `leftJoin`, `where`, `andWhere`).
- `findAll` applies `itemId`/`fromDate`/`toDate`/`search` only when provided.
- `getSummary` returns numeric `totalQuantity` and `totalProductionCost`.
- `listItemsWithUnsold` returns a deduped list mapped to `{ id, name }`.
- `exportCsv` calls `toCsvBuffer` with the right header and row mapping.
- Each method catches via `handleError` on repo throw.

- [ ] **Step 3: Write controller spec**

Mock `UnsoldInvertersService`. Assert each route delegates to the corresponding service method with the query DTO. For `exportCsv`, mock `res.setHeader` + `res.send` and assert the buffer is sent.

- [ ] **Step 4: Run**

```bash
cd backend && npm test -- unsold-inverters
```
All green.

- [ ] **Step 5: Stage.**

---

### Task 10: Backend E2E

**Files:** create `backend/test/unsold-inverters.e2e-spec.ts`

**Interfaces:** consumes all four endpoints.

- [ ] **Step 1: Read an existing e2e for shape**

```bash
ls backend/test/
```
Open the most similar one (likely `sold-inverters.e2e-spec.ts` if it exists, otherwise `production.e2e-spec.ts`). Copy its bootstrap pattern (Nest test app + DB seeding).

- [ ] **Step 2: Write E2E covering**

- Empty DB → list empty, summary zeros, items empty.
- Seed 2 completed batches with 3 units each (6 total). Sell 2 of them via a real sale invoice. Expect:
  - `GET /unsold-inverters` → 4 rows, correct shape.
  - `GET /unsold-inverters/summary` → `totalQuantity: 4`, `totalProductionCost` = sum of the 4 `unitCost`s.
  - `GET /unsold-inverters/items` → distinct items of the 4 unsold units.
  - `GET /unsold-inverters/export/csv` → header line + 4 data lines.
- Soft-delete one of the two sale invoices → unsold count goes to 5.
- Filter by `itemId` → only matching unsold units.
- Filter by `fromDate`/`toDate` → restricts by batch production date.
- Search by serial fragment, batch fragment, item-name fragment → each returns expected subset.
- A `pending` batch's units NEVER appear regardless of filters.

- [ ] **Step 3: Run**

```bash
cd backend && npm run test:e2e -- unsold-inverters
```

- [ ] **Step 4: Stage.**

---

### Task 11: Frontend API client + types

**Files:** modify `web-app/app/_shared/lib/api/client.ts`

- [ ] **Step 1: Add types**

Add (alongside the existing sold-inverter types):

```ts
export interface UnsoldInverter {
  id: number;
  serialNumber: string;
  unitCost: number;
  batch: { id: number; batchNumber: string; productionDate: string };
  item: { id: number; name: string };
}

export interface UnsoldInverterSummary {
  totalQuantity: number;
  totalProductionCost: number;
}

export interface UnsoldInverterQuery {
  page?: number;
  limit?: number;
  search?: string;
  itemId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface UnsoldInverterItemOption {
  id: number;
  name: string;
}
```

- [ ] **Step 2: Add the API client object**

```ts
export const unsoldInvertersApi = {
  getAll: (params?: UnsoldInverterQuery) =>
    apiClient.get<{ data: UnsoldInverter[]; meta: PaginationMeta }>('/unsold-inverters', { params }),
  getSummary: (params?: UnsoldInverterQuery) =>
    apiClient.get<UnsoldInverterSummary>('/unsold-inverters/summary', { params }),
  getItems: () =>
    apiClient.get<UnsoldInverterItemOption[]>('/unsold-inverters/items'),
  exportCsv: (params?: UnsoldInverterQuery) =>
    apiClient.get<Blob>('/unsold-inverters/export/csv', { params, responseType: 'blob' }),
};
```

(Match the exact call/return wrapping pattern used by `soldInvertersApi` in the same file — if the existing helper unwraps `{ data }`, do the same here.)

- [ ] **Step 3: Type-check**

```bash
cd web-app && npx tsc --noEmit
```

- [ ] **Step 4: Stage.**

---

### Task 12: Frontend hook `useUnsoldInverters`

**Files:** create `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/useUnsoldInverters.ts`

**Interfaces:**
- Produces:
  ```ts
  {
    data: UnsoldInverter[];
    meta: PaginationMeta | null;
    summary: UnsoldInverterSummary | null;
    itemOptions: UnsoldInverterItemOption[];
    loading: boolean;
    error: string | null;
    // state
    page: number; limit: number; search: string;
    itemId: number | null; fromDate: string | null; toDate: string | null;
    // handlers
    setPage(p: number): void;
    setLimit(n: number): void;
    handleSearchChange(v: string): void;
    setItemId(id: number | null): void;
    setDateRange(from: string | null, to: string | null): void;
    handleExportCsv(): Promise<void>;
    refresh(): Promise<void>;
  }
  ```

- [ ] **Step 1: Read the existing sold inverters hook for shape**

```bash
sed -n '1,200p' web-app/app/\(pages\)/\(dashboard\)/dashboard/sold-inverters/useSoldInverters.ts
```

Mirror it. Debounce `search` (300ms — match whatever Sold uses). Wire summary refetch to fire alongside list refetch with the same filters. Fetch `itemOptions` once on mount.

- [ ] **Step 2: Implement** following the Sold hook's structure but consuming `unsoldInvertersApi`. Use `useEffect` deps that include all filter fields.

- [ ] **Step 3: Type-check.** Stage.

---

### Task 13: Frontend page UI

**Files:** create `web-app/app/(pages)/(dashboard)/dashboard/unsold-inverters/page.tsx`

- [ ] **Step 1: Read the sold inverters page for shared components**

```bash
sed -n '1,300p' web-app/app/\(pages\)/\(dashboard\)/dashboard/sold-inverters/page.tsx
```

Note the imports for `Card`, `DataTable`, `SearchInput`, `DateRangeChips`, `ExportCsvButton`, etc. We reuse exactly those.

- [ ] **Step 2: Build the page**

Sections (top to bottom), mirroring Sold:

1. Page header — title `Unsold Inverters`, subtitle `View inverter units in stock awaiting sale`.
2. Summary cards row — `grid grid-cols-1 sm:grid-cols-2 gap-4`:
   - Card 1: label `Total Quantity`, value `summary?.totalQuantity ?? 0` (integer).
   - Card 2: label `Total Production Cost`, value formatted with `Rs.` prefix using the existing currency helper (look for `formatCurrency` or similar in the shared utils).
3. Filter row — `flex flex-wrap items-center gap-3`:
   - `Item` dropdown (label "Item", placeholder "All Items"), options = `itemOptions`. On change → `setItemId(id | null)`.
   - `DateRangeChips` (Today / This Week / This Month / This Year / Custom). On change → `setDateRange(from, to)`.
   - `Clear all` button (resets itemId + dates).
4. Search box + Export CSV row — same row as Sold:
   - `SearchInput` placeholder `Search by serial #, batch #, item name…` → `handleSearchChange`.
   - `ExportCsvButton` onClick → `handleExportCsv()`.
5. `DataTable` columns: `Serial #` | `Item Name` | `Batch #` | `Production Date` | `Production Cost`.
   - Production Date: format with the existing date helper used in Sold.
   - Production Cost: format with `Rs.` prefix.
6. Pagination footer — reuse the same pagination component used by Sold, wired to `page`, `setPage`, `meta`.

Loading/empty/error states mirror Sold's behaviour (use the same skeleton/empty-state components).

- [ ] **Step 3: Type-check + eyeball**

```bash
cd web-app && npx tsc --noEmit
cd web-app && npm run dev
```
Open `/dashboard/unsold-inverters`. Confirm:
- Cards reflect filters.
- Item dropdown shows produced items only.
- Search across serial/batch/item works.
- Export CSV downloads with filters applied.
- Stop dev server.

- [ ] **Step 4: Stage.**

---

### Task 14: Sidebar nav link

**Files:** discover, then modify.

- [ ] **Step 1: Find the nav config**

```bash
grep -rn "Sold Inverters\|sold-inverters" web-app/app --include="*.ts" --include="*.tsx" | grep -i "nav\|sidebar\|menu" | head
```

If that yields nothing, search broader for the string `Sold Inverters` in components named like `Sidebar*`, `Nav*`, `Menu*`.

- [ ] **Step 2: Add the link**

Immediately after the `Sold Inverters` entry, add an `Unsold Inverters` entry with `href: '/dashboard/unsold-inverters'`. Reuse whatever icon convention the file already uses (best match: `BoxesIcon`, `PackageIcon`, or whatever the closest "in-stock" icon is in the icon library already imported).

- [ ] **Step 3: Eyeball + stage.**

---

### Task 15: Docs

**Files:** modify `CLAUDE.md` (root), `backend/CLAUDE.md`.

- [ ] **Step 1: Root `CLAUDE.md`**

In the "Implemented Modules" table, add a row after the `Sold Inverters` row:

```
| Unsold Inverters | `unsold-inverters/` | `unsold-inverters/` | Produced units not yet sold (read-only registry) |
```

- [ ] **Step 2: `backend/CLAUDE.md`**

Append a short note under an appropriate heading (e.g. near `Sold Inverters` or in a new short paragraph):

> **Sold vs Unsold derivation.** A `ProductionUnit` is considered "sold" iff a non-soft-deleted `SoldInverter` row exists with a matching `serialNumber`. No status flag is stored on the unit. The `unsold-inverters` module derives the unsold list via `ProductionUnit LEFT JOIN SoldInverter ON serialNumber WHERE sold_inverter.id IS NULL AND production_batch.status = 'completed'`.

- [ ] **Step 3: Stage** — final.

---

## Self-Review

**Spec coverage:**
- Part A — Total Quantity card → Tasks 1, 3. Item-name search → Tasks 1, 3 (regression test). ✅
- Part B — module/endpoints/query → Tasks 4–8. Tests → Tasks 9–10. Frontend → 11–13. Sidebar → 14. Docs → 15. ✅
- "Sold-vs-unsold derived (no flag)" — documented in Task 15. ✅
- CSV on Unsold → Task 8. ✅
- Item dropdown sources from items with current unsold units → Task 7. ✅
- Soft-deleted SoldInverter restores unit to list → E2E in Task 10. ✅

**Placeholders scan:** none — every step has actual code or actual command.

**Type consistency:**
- `totalQuantity` field name used identically in backend (Tasks 1, 6, 9), backend response shape, frontend types (Task 11), frontend cards (Tasks 3, 13). ✅
- `UnsoldInverter` row shape defined once in Task 5, mirrored in frontend types Task 11 (same field names + nesting). ✅
- Hook return signature in Task 12 matches handlers used in page Task 13. ✅

**Open assumption to verify on first execution (Task 4 Step 2):**
- `ProductionStatus` enum path/name — if it lives elsewhere, fix the import. The `COMPLETED` value is referenced from `backend/CLAUDE.md` ("Only `pending` batches can be edited or deleted") so a `COMPLETED`/`PENDING` enum is known to exist; exact location to confirm.
- DB table names (`recipe`, `item`, `sold_inverter`) match TypeORM's default snake-case / pluralization in this project — Recipe entity uses `@Entity()` with no override; TypeORM will derive the table name. Verify via `\dt` if curl smoke errors.
