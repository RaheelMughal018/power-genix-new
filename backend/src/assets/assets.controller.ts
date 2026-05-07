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
import { AssetsService } from './providers/assets.service';
import { CreateAssetDto } from './dtos/create-asset.dto';
import { UpdateAssetDto } from './dtos/update-asset.dto';
import { AssetQueryDto } from './dtos/asset-query.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @ApiOperation({ summary: 'Get all assets (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  @Get()
  async findAll(@Query() query: AssetQueryDto) {
    return await this.assetsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get total asset amount' })
  @ApiResponse({ status: 200, description: 'Total asset amount' })
  @Get('total')
  async getTotal() {
    return await this.assetsService.getTotalAssetAmount();
  }

  @ApiOperation({ summary: 'Export assets as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all assets' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.assetsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.assetsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create an asset and deduct from account' })
  @ApiResponse({ status: 201, description: 'Asset created and account debited' })
  @ApiBody({ type: CreateAssetDto })
  @Post()
  async create(
    @Body() dto: CreateAssetDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.assetsService.create(dto, activeUser);
  }

  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiBody({ type: UpdateAssetDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
  ) {
    return await this.assetsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete an asset and refund account balance' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.assetsService.remove(id);
  }
}
