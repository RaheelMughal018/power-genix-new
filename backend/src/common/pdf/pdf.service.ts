import { Injectable } from '@nestjs/common';
import { SettingsService } from '@/settings/providers/settings.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface InvoicePdfData {
  title: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  partyLabel: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  discount?: number;
  totalAmount: number;
  notes?: string;
  laborCost?: number;
  extraFields?: Record<string, string>;
}

export interface StatementPdfData {
  title: string;
  partyName: string;
  dateRange?: { from: string; to: string };
  columns: string[];
  rows: Array<Record<string, string | number>>;
  footer: Record<string, number>;
}

export interface ItemsListPdfData {
  name: string;
  category?: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
}

export interface RecipePdfData {
  name: string;
  finalProductName: string;
  createdBy: string;
  additionalExpense: number;
  totalCost: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    averagePrice: number;
    lineTotal: number;
  }>;
}

const COL_GRAY = '#6B7280';
const COL_DARK = '#111827';
const LINE_COLOR = '#E5E7EB';
const ACCENT = '#0d9488';
const ACCENT_LIGHT = '#f0fdfa';
const ROW_STRIPE = '#F9FAFB';

@Injectable()
export class PdfService {
  constructor(private readonly settingsService: SettingsService) {}

  async generateInvoicePdf(data: InvoicePdfData, userId: number): Promise<Buffer> {
    const settings = await this.settingsService.getSettings({ id: userId } as any);
    const business = settings?.business;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, business);
      this.drawInvoiceInfo(doc, data);
      this.drawItemsTable(doc, data);
      this.drawTotals(doc, data);

      if (data.notes) {
        doc.moveDown(1);
        doc.fontSize(9).fillColor(COL_GRAY).text('Notes:', { continued: false });
        doc.fontSize(9).fillColor(COL_DARK).text(data.notes);
      }

      this.drawPageFooter(doc);
      doc.end();
    });
  }

  async generateStatementPdf(data: StatementPdfData, userId: number): Promise<Buffer> {
    const settings = await this.settingsService.getSettings({ id: userId } as any);
    const business = settings?.business;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, business);
      this.drawStatementInfo(doc, data);
      this.drawStatementTable(doc, data);
      this.drawStatementFooter(doc, data);

      this.drawPageFooter(doc);
      doc.end();
    });
  }

  async generateItemsListPdf(
    items: ItemsListPdfData[],
    userId: number,
  ): Promise<Buffer> {
    const settings = await this.settingsService.getSettings({ id: userId } as any);
    const business = settings?.business;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, business);

      doc.fontSize(16).fillColor(ACCENT).font('Helvetica-Bold')
        .text('Items Inventory', { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(9).fillColor(COL_GRAY).font('Helvetica')
        .text(`${items.length} items as of ${this.fmtDate(new Date())}`, { align: 'center' });
      doc.moveDown(1);

      this.drawItemsListTable(doc, items);

      this.drawPageFooter(doc);
      doc.end();
    });
  }

  async generateRecipePdf(data: RecipePdfData, userId: number): Promise<Buffer> {
    const settings = await this.settingsService.getSettings({ id: userId } as any);
    const business = settings?.business;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc, business);
      this.drawRecipeInfo(doc, data);
      this.drawRecipeItemsTable(doc, data);
      this.drawRecipeTotals(doc, data);

      this.drawPageFooter(doc);
      doc.end();
    });
  }

  private drawRecipeInfo(doc: PDFKit.PDFDocument, data: RecipePdfData) {
    doc.fontSize(16).fillColor(ACCENT).font('Helvetica-Bold').text('Recipe', { align: 'center' });
    doc.moveDown(0.8);

    const leftX = 50;
    const rightX = 300;
    const labelW = 110;
    const infoY = doc.y;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(COL_DARK);
    doc.text('Recipe Name:', leftX, infoY, { width: labelW });
    doc.font('Helvetica').text(data.name, leftX + labelW, infoY);

    doc.font('Helvetica-Bold').text('Final Product:', leftX, infoY + 14, { width: labelW });
    doc.font('Helvetica').text(data.finalProductName, leftX + labelW, infoY + 14);

    doc.font('Helvetica-Bold').text('Created By:', rightX, infoY, { width: 80 });
    doc.font('Helvetica').text(data.createdBy, rightX + 80, infoY);

    doc.font('Helvetica-Bold').text('Date:', rightX, infoY + 14, { width: 80 });
    doc.font('Helvetica').text(this.fmtDate(new Date()), rightX + 80, infoY + 14);

    doc.moveDown(2.5);
  }

  private drawRecipeItemsTable(doc: PDFKit.PDFDocument, data: RecipePdfData) {
    const tableTop = doc.y;
    const rowHeight = 22;
    const cols = [
      { label: '#', x: 50, w: 30, align: 'left' as const },
      { label: 'Item', x: 80, w: 200, align: 'left' as const },
      { label: 'Qty', x: 280, w: 50, align: 'right' as const },
      { label: 'Unit', x: 330, w: 50, align: 'center' as const },
      { label: 'Avg Price', x: 380, w: 75, align: 'right' as const },
      { label: 'Line Total', x: 455, w: 90, align: 'right' as const },
    ];

    doc.rect(50, tableTop, 495, rowHeight).fill(ACCENT_LIGHT);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT);
    for (const col of cols) {
      doc.text(col.label, col.x + 4, tableTop + 6, { width: col.w - 4, align: col.align });
    }

    let rowY = tableTop + rowHeight;
    data.items.forEach((item, idx) => {
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }
      if (idx % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill(ROW_STRIPE);
      }
      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(COL_DARK);

      const values = [
        String(idx + 1),
        item.name,
        String(item.quantity),
        item.unit,
        this.fmt(item.averagePrice),
        this.fmt(item.lineTotal),
      ];
      cols.forEach((col, i) => {
        doc.text(values[i], col.x + 4, rowY + 6, { width: col.w - 4, align: col.align });
      });
      rowY += rowHeight;
    });
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(ACCENT).lineWidth(1).stroke();
    doc.y = rowY + 5;
  }

  private drawRecipeTotals(doc: PDFKit.PDFDocument, data: RecipePdfData) {
    const boxX = 360;
    const boxW = 185;
    let y = doc.y + 8;

    const subtotal = data.items.reduce((s, i) => s + i.lineTotal, 0);
    const rows: Array<{ label: string; value: string; bold: boolean }> = [
      { label: 'Subtotal', value: this.fmt(subtotal), bold: false },
      { label: 'Additional Expense', value: this.fmt(data.additionalExpense), bold: false },
      { label: 'Total Cost', value: this.fmt(data.totalCost), bold: true },
    ];

    const boxH = rows.length * 18 + 16;
    doc.rect(boxX, y - 6, boxW, boxH).fill(ACCENT_LIGHT);
    const x = boxX + 8;
    y += 2;

    for (const row of rows) {
      if (row.bold) {
        doc.moveTo(x, y - 2).lineTo(boxX + boxW - 8, y - 2)
          .strokeColor(ACCENT).lineWidth(0.5).stroke();
        y += 4;
      }
      doc.fontSize(9)
        .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(row.bold ? COL_DARK : COL_GRAY)
        .text(row.label, x, y, { width: 110, align: 'right' });
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(COL_DARK)
        .text(row.value, x + 115, y, { width: 60, align: 'right' });
      y += 18;
    }
    doc.y = y + 10;
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    business: { companyName?: string; companyLogo?: string; companyAddress?: string; companyPhone?: string } | undefined,
  ) {
    const startY = doc.y;

    if (business?.companyLogo) {
      const logoPath = path.join(process.cwd(), 'uploads', business.companyLogo.replace(/^\/uploads\//, ''));
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, startY, { width: 80, height: 60 });
      }
    }

    const rightX = 545;
    doc.fontSize(16).fillColor(ACCENT).font('Helvetica-Bold')
      .text(business?.companyName ?? 'Power Genix', 0, startY, { align: 'right', width: rightX });

    // Thin accent line under company name
    const nameBottomY = doc.y + 2;
    doc.moveTo(rightX - 160, nameBottomY).lineTo(rightX, nameBottomY)
      .strokeColor(ACCENT).lineWidth(1).stroke();

    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(COL_GRAY).font('Helvetica');
    if (business?.companyAddress) {
      doc.text(business.companyAddress, 0, doc.y, { align: 'right', width: rightX });
    }
    if (business?.companyPhone) {
      doc.text(business.companyPhone, 0, doc.y, { align: 'right', width: rightX });
    }

    // Main divider
    const dividerY = Math.max(startY + 70, doc.y + 10);
    doc.moveTo(50, dividerY).lineTo(545, dividerY).strokeColor(ACCENT).lineWidth(2).stroke();
    doc.moveTo(50, dividerY + 3).lineTo(545, dividerY + 3).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
    doc.y = dividerY + 14;
  }

  private drawInvoiceInfo(doc: PDFKit.PDFDocument, data: InvoicePdfData) {
    doc.fontSize(16).fillColor(ACCENT).font('Helvetica-Bold').text(data.title, { align: 'center' });
    doc.moveDown(0.8);

    const leftX = 50;
    const rightX = 300;
    const labelW = 90;

    const infoY = doc.y;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(COL_DARK);
    doc.text(`${data.partyLabel}:`, leftX, infoY, { width: labelW, continued: false });
    doc.font('Helvetica').text(data.partyName, leftX + labelW, infoY);

    if (data.extraFields) {
      let fieldY = infoY + 14;
      for (const [key, val] of Object.entries(data.extraFields)) {
        doc.font('Helvetica-Bold').text(`${key}:`, leftX, fieldY, { width: labelW });
        doc.font('Helvetica').text(val, leftX + labelW, fieldY);
        fieldY += 14;
      }
    }

    doc.font('Helvetica-Bold').text('Invoice #:', rightX, infoY, { width: 80 });
    doc.font('Helvetica').text(data.invoiceNumber, rightX + 80, infoY);

    doc.font('Helvetica-Bold').text('Date:', rightX, infoY + 14, { width: 80 });
    doc.font('Helvetica').text(this.fmtDate(data.date), rightX + 80, infoY + 14);

    doc.moveDown(2.5);
  }

  private drawItemsTable(doc: PDFKit.PDFDocument, data: InvoicePdfData) {
    const tableTop = doc.y;
    const cols = { item: 50, qty: 270, unitPrice: 340, total: 440 };
    const rowHeight = 22;

    doc.rect(50, tableTop, 495, rowHeight).fill(ACCENT_LIGHT);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT);
    doc.text('Item', cols.item + 6, tableTop + 6, { width: 210 });
    doc.text('Qty', cols.qty, tableTop + 6, { width: 60, align: 'center' });
    doc.text('Unit Price', cols.unitPrice, tableTop + 6, { width: 90, align: 'right' });
    doc.text('Total', cols.total, tableTop + 6, { width: 105, align: 'right' });

    let rowY = tableTop + rowHeight;

    data.items.forEach((item, idx) => {
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }

      if (idx % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill(ROW_STRIPE);
      }

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();

      doc.fontSize(9).font('Helvetica').fillColor(COL_DARK);
      doc.text(item.name, cols.item + 6, rowY + 6, { width: 210 });
      doc.text(String(item.quantity), cols.qty, rowY + 6, { width: 60, align: 'center' });
      doc.text(this.fmt(item.unitPrice), cols.unitPrice, rowY + 6, { width: 90, align: 'right' });
      doc.text(this.fmt(item.totalPrice), cols.total, rowY + 6, { width: 105, align: 'right' });

      rowY += rowHeight;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(ACCENT).lineWidth(1).stroke();
    doc.y = rowY + 5;
  }

  private drawTotals(doc: PDFKit.PDFDocument, data: InvoicePdfData) {
    const boxX = 360;
    const boxW = 185;
    let y = doc.y + 8;

    const rows: Array<{ label: string; value: string; bold: boolean }> = [];

    const lineTotal = data.items.reduce((s, i) => s + i.totalPrice, 0);
    rows.push({ label: 'Subtotal', value: this.fmt(lineTotal), bold: false });

    if (data.laborCost !== undefined && data.laborCost > 0) {
      rows.push({ label: 'Labor Cost', value: this.fmt(data.laborCost), bold: false });
    }

    if (data.discount) {
      rows.push({ label: 'Discount', value: `-${this.fmt(data.discount)}`, bold: false });
    }

    rows.push({ label: 'Total', value: this.fmt(data.totalAmount), bold: true });

    const boxH = rows.length * 18 + 16;
    doc.rect(boxX, y - 6, boxW, boxH).fill(ACCENT_LIGHT);

    const x = boxX + 8;
    y += 2;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.bold) {
        doc.moveTo(x, y - 2).lineTo(boxX + boxW - 8, y - 2)
          .strokeColor(ACCENT).lineWidth(0.5).stroke();
        y += 4;
      }
      doc.fontSize(9)
        .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(row.bold ? COL_DARK : COL_GRAY)
        .text(row.label, x, y, { width: 95, align: 'right' });
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(COL_DARK)
        .text(row.value, x + 100, y, { width: 60, align: 'right' });
      y += 18;
    }

    doc.y = y + 10;
  }

  private drawItemsListTable(doc: PDFKit.PDFDocument, items: ItemsListPdfData[]) {
    const tableTop = doc.y;
    const rowHeight = 20;
    const cols = [
      { label: '#', x: 50, w: 30, align: 'left' as const },
      { label: 'Name', x: 80, w: 140, align: 'left' as const },
      { label: 'Category', x: 220, w: 90, align: 'left' as const },
      { label: 'Stock', x: 310, w: 55, align: 'right' as const },
      { label: 'Min Stock', x: 365, w: 55, align: 'right' as const },
      { label: 'Cost Price', x: 420, w: 65, align: 'right' as const },
      { label: 'Sale Price', x: 485, w: 60, align: 'right' as const },
    ];

    doc.rect(50, tableTop, 495, rowHeight).fill(ACCENT_LIGHT);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT);
    for (const col of cols) {
      doc.text(col.label, col.x + 4, tableTop + 5, { width: col.w - 4, align: col.align });
    }

    let rowY = tableTop + rowHeight;

    items.forEach((item, idx) => {
      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }

      if (idx % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill(ROW_STRIPE);
      }

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(COL_DARK);

      const values = [
        String(idx + 1),
        item.name,
        item.category ?? '—',
        String(item.currentStock),
        String(item.minStock),
        this.fmt(item.costPrice),
        this.fmt(item.salePrice),
      ];

      cols.forEach((col, i) => {
        doc.text(values[i], col.x + 4, rowY + 5, { width: col.w - 4, align: col.align });
      });

      rowY += rowHeight;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(ACCENT).lineWidth(1).stroke();
    doc.y = rowY + 6;
  }

  private drawStatementInfo(doc: PDFKit.PDFDocument, data: StatementPdfData) {
    doc.fontSize(16).fillColor(ACCENT).font('Helvetica-Bold').text(data.title, { align: 'center' });
    doc.moveDown(0.6);

    const y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COL_DARK).text('Party:', 50, y, { width: 80 });
    doc.font('Helvetica').text(data.partyName, 130, y);

    if (data.dateRange) {
      doc.font('Helvetica-Bold').text('Period:', 300, y, { width: 60 });
      doc.font('Helvetica').text(`${this.fmtDate(data.dateRange.from)} – ${this.fmtDate(data.dateRange.to)}`, 360, y);
    }

    doc.moveDown(1.5);
  }

  private drawStatementTable(doc: PDFKit.PDFDocument, data: StatementPdfData) {
    const pageWidth = 495;
    const colCount = data.columns.length;
    const colW = Math.floor(pageWidth / colCount);
    const tableTop = doc.y;
    const rowHeight = 20;

    doc.rect(50, tableTop, pageWidth, rowHeight).fill(ACCENT_LIGHT);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(ACCENT);
    data.columns.forEach((col, i) => {
      const align = i === 0 ? 'left' : 'right';
      doc.text(col, 50 + i * colW + (i === 0 ? 4 : 0), tableTop + 5, { width: colW, align });
    });

    let rowY = tableTop + rowHeight;

    data.rows.forEach((row, idx) => {
      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }

      if (idx % 2 === 1) {
        doc.rect(50, rowY, pageWidth, 18).fill(ROW_STRIPE);
      }

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(COL_DARK);

      data.columns.forEach((col, i) => {
        const val = row[col];
        const isNum = typeof val === 'number';
        const align = i === 0 ? 'left' : 'right';
        const display = isNum ? this.fmt(val as number) : this.fmtDate(String(val ?? ''));
        doc.text(display, 50 + i * colW + (i === 0 ? 4 : 0), rowY + 4, { width: colW, align });
      });

      rowY += 18;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(ACCENT).lineWidth(1).stroke();
    doc.y = rowY + 6;
  }

  private drawStatementFooter(doc: PDFKit.PDFDocument, data: StatementPdfData) {
    const x = 300;
    let y = doc.y + 10;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(ACCENT).text('Summary', x, y, { width: 245, align: 'left' });
    y += 16;

    for (const [label, value] of Object.entries(data.footer)) {
      doc.font('Helvetica').fillColor(COL_GRAY).text(label + ':', x, y, { width: 160, align: 'left' });
      doc.font('Helvetica-Bold').fillColor(COL_DARK).text(this.fmt(value), x + 165, y, { width: 80, align: 'right' });
      y += 14;
    }

    doc.y = y;
  }

  private drawPageFooter(doc: PDFKit.PDFDocument) {
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      const bottomY = 780;
      doc.moveTo(50, bottomY).lineTo(545, bottomY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(COL_GRAY)
        .text('Generated by Power Genix', 50, bottomY + 4, { width: 250, align: 'left' });
      doc.text(this.fmtDate(new Date()), 300, bottomY + 4, { width: 245, align: 'right' });
    }
    doc.flushPages();
  }

  private fmt(n: number): string {
    return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private fmtDate(value: string | Date): string {
    if (typeof value === 'string') {
      const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
    }
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${value.getFullYear()}`;
  }
}
