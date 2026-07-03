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
import { CreateRepairInvoiceDto } from './dtos/create-repair-invoice.dto';
import { RepairInvoiceQueryDto } from './dtos/repair-invoice-query.dto';
import { UpdateRepairInvoiceDto } from './dtos/update-repair-invoice.dto';
import { RepairInvoicesService } from './providers/repair-invoices.service';

@ApiTags('Repair Invoices')
@ApiBearerAuth()
@Controller('repair-invoices')
export class RepairInvoicesController {
  constructor(
    private readonly repairInvoicesService: RepairInvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Get all repair invoices (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Repair invoices retrieved successfully' })
  @Get()
  async findAll(@Query() query: RepairInvoiceQueryDto) {
    return await this.repairInvoicesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get total amount of all charged repair invoices' })
  @ApiResponse({ status: 200, description: 'Total repair amount' })
  @Get('total')
  async getTotal(@Query() query: RepairInvoiceQueryDto) {
    const total = await this.repairInvoicesService.getTotalRepairAmount(query);
    return { total };
  }

  @ApiOperation({ summary: 'Export repair invoices as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all repair invoices' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.repairInvoicesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="repair-invoices.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single repair invoice by ID' })
  @ApiResponse({ status: 200, description: 'Repair invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Repair invoice not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.repairInvoicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Download repair invoice as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
  ) {
    const invoice = (await this.repairInvoicesService.findOne(id))!;

    const extraFields: Record<string, string> = {};
    if (invoice.serialNumber) extraFields['Serial #'] = invoice.serialNumber;
    if (invoice.description) extraFields['Description'] = invoice.description;
    extraFields['Type'] = invoice.isCharged ? 'Charged' : 'Free of Charge';

    const items = invoice.items.map((li) => ({
      name: li.item?.name ?? li.customItemName ?? '',
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      totalPrice: Number(li.quantity) * Number(li.unitPrice),
    }));

    // Customer PDF shows the full amount (parts + labor) with no discount applied.
    // The internal after-discount total lives on the web view, not here.
    const partsTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const laborCost = Number(invoice.laborCost);
    const customerGrandTotal = partsTotal + laborCost;

    const buffer = await this.pdfService.generateInvoicePdf(
      {
        title: 'Repair Invoice',
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        partyName: invoice.customer?.name ?? '',
        partyLabel: 'Customer',
        items,
        totalAmount: customerGrandTotal,
        laborCost,
        extraFields,
      },
      activeUser.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="repair-invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Create a new repair invoice' })
  @ApiResponse({ status: 201, description: 'Repair invoice created successfully' })
  @ApiBody({ type: CreateRepairInvoiceDto })
  @Post()
  async create(
    @Body() dto: CreateRepairInvoiceDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.repairInvoicesService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a repair invoice (full reversal + reapply)' })
  @ApiResponse({ status: 200, description: 'Repair invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Repair invoice not found' })
  @ApiBody({ type: UpdateRepairInvoiceDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepairInvoiceDto,
  ) {
    return await this.repairInvoicesService.update(id, dto);
  }
}
