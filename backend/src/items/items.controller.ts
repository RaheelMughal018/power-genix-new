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
import { ItemsService } from './providers/items.service';
import { PdfService } from '@/common/pdf/pdf.service';
import { CreateItemDto } from './dtos/create-item.dto';
import { UpdateItemDto } from './dtos/update-item.dto';
import { ItemQueryDto } from './dtos/item-query.dto';

@ApiTags('Items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Get all items (paginated, with filters)' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  @Get()
  async findAll(@Query() query: ItemQueryDto) {
    return await this.itemsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get stock summary (total value, units, count)' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  @Get('summary')
  async getSummary() {
    return await this.itemsService.getSummary();
  }

  @ApiOperation({ summary: 'Get low stock raw materials (totalQuantity < minStock)' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  @Get('low-stock')
  async getLowStock() {
    return await this.itemsService.getLowStockItems();
  }

  @ApiOperation({ summary: 'Export items as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all items' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.itemsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="items.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Export items as PDF' })
  @ApiResponse({ status: 200, description: 'PDF export of all items' })
  @Get('pdf')
  async exportPdf(
    @ActiveUser() activeUser: ActiveUserData,
    @Res() res: Response,
  ) {
    const allItems = await this.itemsService.findAllForPdf();
    const pdfItems = allItems.map((item) => ({
      name: item.name,
      category: item.category?.name,
      currentStock: item.totalQuantity,
      minStock: item.minStock,
      costPrice: Number(item.averagePrice),
      salePrice: Number(item.averagePrice),
    }));
    const buffer = await this.pdfService.generateItemsListPdf(pdfItems, activeUser.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="items.pdf"');
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get a single item by ID' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.itemsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  @ApiBody({ type: CreateItemDto })
  @Post()
  async create(
    @Body() createItemDto: CreateItemDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.itemsService.create(createItemDto, activeUser);
  }

  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiBody({ type: UpdateItemDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return await this.itemsService.update(id, updateItemDto);
  }

  @ApiOperation({ summary: 'Soft delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete item with existing stock' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.itemsService.remove(id);
  }
}
