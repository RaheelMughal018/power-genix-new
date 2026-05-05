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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateProductionDto } from './dtos/create-production.dto';
import { UpdateProductionDto } from './dtos/update-production.dto';
import { ProductionService } from './providers/production.service';

@ApiTags('Production')
@ApiBearerAuth()
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @ApiOperation({ summary: 'Get all production batches (paginated)' })
  @ApiResponse({ status: 200, description: 'Batches retrieved successfully' })
  @Get()
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.productionService.findAll(paginationQuery);
  }

  @ApiOperation({ summary: 'Get production summary stats' })
  @ApiResponse({ status: 200, description: 'Summary retrieved' })
  @Get('summary')
  async getSummary() {
    return await this.productionService.getSummary();
  }

  @ApiOperation({ summary: 'Export production batches as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.productionService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="production.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Generate serial numbers for a new batch' })
  @ApiQuery({ name: 'quantity', type: Number, description: 'Number of serials to generate' })
  @ApiResponse({ status: 200, description: 'Serial numbers generated' })
  @Get('generate-serials')
  async generateSerials(
    @Query('quantity', ParseIntPipe) quantity: number,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.productionService.generateSerialNumbers(quantity, activeUser);
  }

  @ApiOperation({ summary: 'Get a single production batch by ID' })
  @ApiResponse({ status: 200, description: 'Batch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productionService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new production batch' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiBody({ type: CreateProductionDto })
  @Post()
  async create(
    @Body() createProductionDto: CreateProductionDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.productionService.create(createProductionDto, activeUser);
  }

  @ApiOperation({ summary: 'Complete a production batch (deducts stock)' })
  @ApiResponse({ status: 200, description: 'Batch completed or shortfall returned' })
  @ApiResponse({ status: 400, description: 'Batch not in PENDING status' })
  @ApiParam({ name: 'id', type: Number })
  @Post(':id/complete')
  async complete(@Param('id', ParseIntPipe) id: number) {
    return await this.productionService.complete(id);
  }

  @ApiOperation({ summary: 'Cancel a production batch (PENDING only)' })
  @ApiResponse({ status: 200, description: 'Batch cancelled' })
  @ApiResponse({ status: 400, description: 'Batch not in PENDING status' })
  @ApiParam({ name: 'id', type: Number })
  @Post(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return await this.productionService.cancel(id);
  }

  @ApiOperation({ summary: 'Update a production batch (PENDING only)' })
  @ApiResponse({ status: 200, description: 'Batch updated' })
  @ApiBody({ type: UpdateProductionDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductionDto: UpdateProductionDto,
  ) {
    return await this.productionService.update(id, updateProductionDto);
  }

  @ApiOperation({ summary: 'Delete a production batch (PENDING or CANCELLED only)' })
  @ApiResponse({ status: 200, description: 'Batch deleted' })
  @ApiResponse({ status: 400, description: 'Completed batches cannot be deleted' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.productionService.remove(id);
  }
}
