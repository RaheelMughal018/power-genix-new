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
import { CreatePurchaseInvoiceDto } from './dtos/create-purchase-invoice.dto';
import { PurchaseInvoiceQueryDto } from './dtos/purchase-invoice-query.dto';
import { UpdatePurchaseInvoiceDto } from './dtos/update-purchase-invoice.dto';
import { PurchaseInvoicesService } from './providers/purchase-invoices.service';

@ApiTags('Purchase Invoices')
@ApiBearerAuth()
@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(
    private readonly purchaseInvoicesService: PurchaseInvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Get all purchase invoices (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Purchase invoices retrieved successfully' })
  @Get()
  async findAll(@Query() query: PurchaseInvoiceQueryDto) {
    return await this.purchaseInvoicesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get total purchase amount across all invoices' })
  @ApiResponse({ status: 200, description: 'Total purchase amount' })
  @Get('total')
  async getTotal() {
    const total = await this.purchaseInvoicesService.getTotalPurchaseAmount();
    return { total };
  }

  @ApiOperation({ summary: 'Export purchase invoices as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all purchase invoices' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.purchaseInvoicesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="purchase-invoices.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single purchase invoice by ID' })
  @ApiResponse({ status: 200, description: 'Purchase invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Purchase invoice not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.purchaseInvoicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Download purchase invoice as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
  ) {
    const invoice = (await this.purchaseInvoicesService.findOne(id))!;
    const buffer = await this.pdfService.generateInvoicePdf(
      {
        title: 'Purchase Invoice',
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        partyName: invoice.supplier?.name ?? '',
        partyLabel: 'Supplier',
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
      'Content-Disposition': `attachment; filename="purchase-invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Create a new purchase invoice' })
  @ApiResponse({ status: 201, description: 'Purchase invoice created successfully' })
  @ApiBody({ type: CreatePurchaseInvoiceDto })
  @Post()
  async create(
    @Body() dto: CreatePurchaseInvoiceDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.purchaseInvoicesService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a purchase invoice (full reversal + reapply)' })
  @ApiResponse({ status: 200, description: 'Purchase invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Purchase invoice not found' })
  @ApiBody({ type: UpdatePurchaseInvoiceDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return await this.purchaseInvoicesService.update(id, dto);
  }
}
