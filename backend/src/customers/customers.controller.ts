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
import { CustomersService } from './providers/customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { CustomerQueryDto } from './dtos/customer-query.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Get all customers (paginated, searchable)' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @Get()
  async findAll(@Query() query: CustomerQueryDto) {
    return await this.customersService.findAll(query);
  }

  @ApiOperation({ summary: 'Export customers as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all customers' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.customersService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get customer statement (sales + repairs + payments timeline)' })
  @ApiResponse({ status: 200, description: 'Customer statement data' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @Get(':id/statement')
  async getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.customersService.getStatement(id, from, to);
  }

  @ApiOperation({ summary: 'Download customer statement as PDF' })
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
    const statement = (await this.customersService.getStatement(id, from, to))!;
    const openingRow: Record<string, string | number> = {
      'Date': statement.dateRange?.from || '-',
      'Invoice #': 'Opening Balance',
      'Sale Amount': '-',
      'Repair Amount': '-',
      'Amount Received': '-',
      'Outstanding Balance': statement.footer['Opening Balance'] ?? 0,
    };
    const buffer = await this.pdfService.generateStatementPdf(
      {
        title: 'Customer Statement',
        partyName: statement.customer.name,
        dateRange: statement.dateRange,
        columns: statement.columns,
        rows: [openingRow, ...statement.rows],
        footer: statement.footer,
      },
      activeUser.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="customer-statement-${statement.customer.name}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get a single customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.customersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get customer detail with computed balances' })
  @ApiResponse({ status: 200, description: 'Customer detail with balance breakdown' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @Get(':id/detail')
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.customersService.getDetail(id, from, to);
  }

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiBody({ type: CreateCustomerDto })
  @Post()
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.customersService.create(createCustomerDto, activeUser);
  }

  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return await this.customersService.update(id, updateCustomerDto);
  }

  @ApiOperation({ summary: 'Soft delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.customersService.remove(id);
  }
}
