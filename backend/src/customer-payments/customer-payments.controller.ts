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
import { CustomerPaymentsService } from './providers/customer-payments.service';
import { CreateCustomerPaymentDto } from './dtos/create-customer-payment.dto';
import { UpdateCustomerPaymentDto } from './dtos/update-customer-payment.dto';
import { CustomerPaymentQueryDto } from './dtos/customer-payment-query.dto';

@ApiTags('Customer Payments')
@ApiBearerAuth()
@Controller('customer-payments')
export class CustomerPaymentsController {
  constructor(private readonly customerPaymentsService: CustomerPaymentsService) {}

  @ApiOperation({ summary: 'Get all customer payments (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Customer payments retrieved successfully' })
  @Get()
  async findAll(@Query() query: CustomerPaymentQueryDto) {
    return await this.customerPaymentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Export customer payments as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all customer payments' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.customerPaymentsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer-payments.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single customer payment by ID' })
  @ApiResponse({ status: 200, description: 'Customer payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer payment not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.customerPaymentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a customer payment and credit account' })
  @ApiResponse({ status: 201, description: 'Customer payment created and account credited' })
  @ApiBody({ type: CreateCustomerPaymentDto })
  @Post()
  async create(
    @Body() dto: CreateCustomerPaymentDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.customerPaymentsService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a customer payment (full reversal + reapply)' })
  @ApiResponse({ status: 200, description: 'Customer payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer payment not found' })
  @ApiBody({ type: UpdateCustomerPaymentDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerPaymentDto,
  ) {
    return await this.customerPaymentsService.update(id, dto);
  }
}
