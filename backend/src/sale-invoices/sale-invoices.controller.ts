import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PdfService } from '@/common/pdf/pdf.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateSaleInvoiceDto } from './dtos/create-sale-invoice.dto';
import { SaleInvoiceQueryDto } from './dtos/sale-invoice-query.dto';
import { UpdateSaleInvoiceDto } from './dtos/update-sale-invoice.dto';
import { SaleInvoicesService } from './providers/sale-invoices.service';

@ApiTags('Sale Invoices')
@ApiBearerAuth()
@Controller('sale-invoices')
export class SaleInvoicesController {
  constructor(
    private readonly saleInvoicesService: SaleInvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Get all sale invoices (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Sale invoices retrieved successfully' })
  @Get()
  async findAll(@Query() query: SaleInvoiceQueryDto) {
    return await this.saleInvoicesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get total sale amount across all invoices' })
  @ApiResponse({ status: 200, description: 'Total sale amount' })
  @Get('total')
  async getTotal() {
    const total = await this.saleInvoicesService.getTotalSaleAmount();
    return { total };
  }

  @ApiOperation({ summary: 'Export sale invoices as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all sale invoices' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.saleInvoicesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sale-invoices.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get available serial numbers for an item (unsold inverters)' })
  @ApiResponse({ status: 200, description: 'List of available serial numbers' })
  @ApiParam({ name: 'itemId', type: Number })
  @Get('available-serials/:itemId')
  async getAvailableSerials(@Param('itemId', ParseIntPipe) itemId: number) {
    const serials = await this.saleInvoicesService.getAvailableSerials(itemId);
    return { serials };
  }

  @ApiOperation({ summary: 'Get a single sale invoice by ID' })
  @ApiResponse({ status: 200, description: 'Sale invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale invoice not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.saleInvoicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Download sale invoice as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
  ) {
    const invoice = (await this.saleInvoicesService.findOne(id))!;
    const buffer = await this.pdfService.generateInvoicePdf(
      {
        title: 'Sale Invoice',
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        partyName: invoice.customer?.name ?? '',
        partyLabel: 'Customer',
        items: invoice.items.map((li) => ({
          name: li.item?.name ?? '',
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          totalPrice: Number(li.totalPrice),
        })),
        discount: Number(invoice.discount),
        totalAmount: Number(invoice.totalAmount),
        notes: invoice.notes ?? undefined,
      },
      activeUser.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sale-invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Create a new sale invoice' })
  @ApiResponse({ status: 201, description: 'Sale invoice created successfully' })
  @ApiBody({ type: CreateSaleInvoiceDto })
  @Post()
  async create(
    @Body() dto: CreateSaleInvoiceDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.saleInvoicesService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a sale invoice (full reversal + reapply)' })
  @ApiResponse({ status: 200, description: 'Sale invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale invoice not found' })
  @ApiBody({ type: UpdateSaleInvoiceDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaleInvoiceDto,
  ) {
    return await this.saleInvoicesService.update(id, dto);
  }
}
