import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PdfService } from '@/common/pdf/pdf.service';
import {
  Body,
  Controller,
  Delete,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { SuppliersService } from './providers/suppliers.service';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { SupplierQueryDto } from './dtos/supplier-query.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly pdfService: PdfService,
  ) { }

  @ApiOperation({ summary: 'Get all suppliers (paginated, searchable)' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  @Get()
  async findAll(@Query() query: SupplierQueryDto) {
    return await this.suppliersService.findAll(query);
  }

  @ApiOperation({ summary: 'Export suppliers as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all suppliers' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.suppliersService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get supplier statement (purchases + payments timeline)' })
  @ApiResponse({ status: 200, description: 'Supplier statement data' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @Get(':id/statement')
  async getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.suppliersService.getStatement(id, from, to);
  }

  // TODO : create a pdf download functionality for statement

  @ApiOperation({ summary: 'Download supplier statement as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @Get(':id/statement/pdf')
  async downloadStatementPdf(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const statement = (await this.suppliersService.getStatement(id, from, to))!;
    const openingRow: Record<string, string | number> = {
      'Date': statement.dateRange?.from || '-',
      'Invoice #': 'Opening Balance',
      'Purchase Amount': '-',
      'Return Amount': '-',
      'Amount Paid': '-',
      'Outstanding Balance': statement.footer['Opening Balance'] ?? 0,
    };
    const buffer = await this.pdfService.generateStatementPdf(
      {
        title: 'Supplier Statement',
        partyName: statement.supplier.name,
        dateRange: statement.dateRange,
        columns: statement.columns,
        rows: [openingRow, ...statement.rows],
        footer: statement.footer,
      },
      activeUser.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="supplier-statement-${statement.supplier.name}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get a single supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.suppliersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get supplier detail with computed balances' })
  @ApiResponse({ status: 200, description: 'Supplier detail with balance breakdown' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @Get(':id/detail')
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.suppliersService.getDetail(id, from, to);
  }

  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiBody({ type: CreateSupplierDto })
  @Post()
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.suppliersService.create(createSupplierDto, activeUser);
  }

  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return await this.suppliersService.update(id, updateSupplierDto);
  }

  @ApiOperation({ summary: 'Soft delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.suppliersService.remove(id);
  }
}
