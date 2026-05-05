import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ExpensesService } from './providers/expenses.service';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { ExpenseQueryDto } from './dtos/expense-query.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @ApiOperation({ summary: 'Get all expenses (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  @Get()
  async findAll(@Query() query: ExpenseQueryDto) {
    return await this.expensesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get total expense amount' })
  @ApiResponse({ status: 200, description: 'Total expense amount' })
  @Get('total')
  async getTotal() {
    return await this.expensesService.getTotalExpenseAmount();
  }

  @ApiOperation({ summary: 'Export expenses as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all expenses' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.expensesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.expensesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create expenses in batch' })
  @ApiResponse({ status: 201, description: 'Expenses created and accounts debited' })
  @ApiBody({ type: CreateExpenseDto })
  @Post()
  async create(
    @Body() dto: CreateExpenseDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.expensesService.createBatch(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return await this.expensesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete an expense and reverse account deduction' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.expensesService.remove(id);
  }
}
