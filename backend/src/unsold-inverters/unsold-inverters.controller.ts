import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UnsoldInvertersService } from './providers/unsold-inverters.service/unsold-inverters.service';
import { UnsoldInverterQueryDto } from './dtos/unsold-inverter-query.dto';

@ApiTags('Unsold Inverters')
@ApiBearerAuth()
@Controller('unsold-inverters')
export class UnsoldInvertersController {
  constructor(private readonly service: UnsoldInvertersService) {}

  @ApiOperation({ summary: 'List produced inverter units not yet sold (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Unsold inverters retrieved successfully' })
  @Get()
  async findAll(@Query() query: UnsoldInverterQueryDto) {
    return await this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Aggregated totals (quantity + production cost), honors all filters' })
  @ApiResponse({ status: 200, description: 'Summary totals retrieved' })
  @Get('summary')
  async getSummary(@Query() query: UnsoldInverterQueryDto) {
    return await this.service.getSummary(query);
  }

  @ApiOperation({ summary: 'Distinct items that currently have at least one unsold unit' })
  @ApiResponse({ status: 200, description: 'Item options retrieved' })
  @Get('items')
  async items() {
    return await this.service.listItemsWithUnsold();
  }

  @ApiOperation({ summary: 'Export filtered unsold list to CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of unsold inverters' })
  @Get('export/csv')
  async exportCsv(@Query() query: UnsoldInverterQueryDto, @Res() res: Response) {
    const buf = await this.service.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="unsold-inverters.csv"');
    res.send(buf);
  }
}
