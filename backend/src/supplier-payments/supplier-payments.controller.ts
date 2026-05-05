import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
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
import { SupplierPaymentsService } from './providers/supplier-payments.service';
import { CreateSupplierPaymentDto } from './dtos/create-supplier-payment.dto';
import { UpdateSupplierPaymentDto } from './dtos/update-supplier-payment.dto';
import { SupplierPaymentQueryDto } from './dtos/supplier-payment-query.dto';

@ApiTags('Supplier Payments')
@ApiBearerAuth()
@Controller('supplier-payments')
export class SupplierPaymentsController {
  constructor(private readonly supplierPaymentsService: SupplierPaymentsService) {}

  @ApiOperation({ summary: 'Get all supplier payments (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Supplier payments retrieved successfully' })
  @Get()
  async findAll(@Query() query: SupplierPaymentQueryDto) {
    return await this.supplierPaymentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Export supplier payments as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all supplier payments' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.supplierPaymentsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="supplier-payments.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single supplier payment by ID' })
  @ApiResponse({ status: 200, description: 'Supplier payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier payment not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.supplierPaymentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a supplier payment and deduct from account' })
  @ApiResponse({ status: 201, description: 'Supplier payment created and account debited' })
  @ApiBody({ type: CreateSupplierPaymentDto })
  @Post()
  async create(
    @Body() dto: CreateSupplierPaymentDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.supplierPaymentsService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a supplier payment (full reversal + reapply)' })
  @ApiResponse({ status: 200, description: 'Supplier payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier payment not found' })
  @ApiBody({ type: UpdateSupplierPaymentDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierPaymentDto,
  ) {
    return await this.supplierPaymentsService.update(id, dto);
  }
}
