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
import { StockAdjustmentsService } from './providers/stock-adjustments.service';
import { CreateStockAdjustmentDto } from './dtos/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dtos/update-stock-adjustment.dto';
import { StockAdjustmentQueryDto } from './dtos/stock-adjustment-query.dto';

@ApiTags('Stock Adjustments')
@ApiBearerAuth()
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(private readonly service: StockAdjustmentsService) {}

  @ApiOperation({ summary: 'Get all stock adjustments (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Stock adjustments retrieved successfully' })
  @Get()
  async findAll(@Query() query: StockAdjustmentQueryDto) {
    return await this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get all stock adjustments for a specific item' })
  @ApiResponse({ status: 200, description: 'Item adjustment history retrieved' })
  @ApiParam({ name: 'itemId', type: Number })
  @Get('item/:itemId')
  async findByItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return await this.service.findByItem(itemId);
  }

  @ApiOperation({ summary: 'Get current stock info for an item' })
  @ApiResponse({ status: 200, description: 'Item stock info retrieved' })
  @ApiParam({ name: 'itemId', type: Number })
  @Get('item/:itemId/info')
  async getItemStockInfo(@Param('itemId', ParseIntPipe) itemId: number) {
    return await this.service.getItemStockInfo(itemId);
  }

  @ApiOperation({ summary: 'Export stock adjustments as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all stock adjustments' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.service.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stock-adjustments.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single stock adjustment by ID' })
  @ApiResponse({ status: 200, description: 'Stock adjustment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stock adjustment not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create a stock adjustment' })
  @ApiResponse({ status: 201, description: 'Stock adjustment created and stock updated' })
  @ApiBody({ type: CreateStockAdjustmentDto })
  @Post()
  async create(
    @Body() dto: CreateStockAdjustmentDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.service.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update a stock adjustment (reverses old, applies new)' })
  @ApiResponse({ status: 200, description: 'Stock adjustment updated successfully' })
  @ApiResponse({ status: 404, description: 'Stock adjustment not found' })
  @ApiBody({ type: UpdateStockAdjustmentDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockAdjustmentDto,
  ) {
    return await this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a stock adjustment and reverse its effect on stock' })
  @ApiResponse({ status: 200, description: 'Stock adjustment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Stock adjustment not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id);
  }
}
