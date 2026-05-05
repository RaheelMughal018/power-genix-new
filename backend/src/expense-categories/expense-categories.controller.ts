import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PaginationQueryDto } from '@/common/pagination/dtos/pagination-query.dto';
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
import { ExpenseCategoriesService } from './providers/expense-categories.service';
import { CreateExpenseCategoryDto } from './dtos/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dtos/update-expense-category.dto';

@ApiTags('Expense Categories')
@ApiBearerAuth()
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @ApiOperation({ summary: 'Get all expense categories (paginated)' })
  @ApiResponse({ status: 200, description: 'Expense categories retrieved successfully' })
  @Get()
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.expenseCategoriesService.findAll(paginationQuery);
  }

  @ApiOperation({ summary: 'Export expense categories as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all expense categories' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.expenseCategoriesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expense-categories.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single expense category by ID' })
  @ApiResponse({ status: 200, description: 'Expense category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense category not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.expenseCategoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new expense category' })
  @ApiResponse({ status: 201, description: 'Expense category created successfully' })
  @ApiBody({ type: CreateExpenseCategoryDto })
  @Post()
  async create(
    @Body() dto: CreateExpenseCategoryDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.expenseCategoriesService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update an expense category' })
  @ApiResponse({ status: 200, description: 'Expense category updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense category not found' })
  @ApiBody({ type: UpdateExpenseCategoryDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return await this.expenseCategoriesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete an expense category' })
  @ApiResponse({ status: 200, description: 'Expense category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense category not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.expenseCategoriesService.remove(id);
  }
}
