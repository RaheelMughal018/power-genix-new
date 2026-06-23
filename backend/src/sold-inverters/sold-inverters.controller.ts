import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { SoldInvertersService } from './providers/sold-inverters.service';
import { SoldInverterQueryDto } from './dtos/sold-inverter-query.dto';

@ApiTags('Sold Inverters')
@ApiBearerAuth()
@Controller('sold-inverters')
export class SoldInvertersController {
  constructor(private readonly service: SoldInvertersService) {}

  @ApiOperation({ summary: 'Get all sold inverters (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Sold inverters retrieved successfully' })
  @Get()
  async findAll(@Query() query: SoldInverterQueryDto) {
    return await this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Get aggregated production cost, sale cost, profit, and quantity (honors customerId / fromDate / toDate / search filters)' })
  @ApiResponse({ status: 200, description: 'Summary totals retrieved' })
  @Get('summary')
  async getSummary(@Query() query: SoldInverterQueryDto) {
    return await this.service.getSummary(query);
  }

  @ApiOperation({ summary: 'Export sold inverters as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of sold inverters' })
  @Get('export/csv')
  async exportCsv(@Query() query: SoldInverterQueryDto, @Res() res: Response) {
    const csv = await this.service.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sold-inverters.csv"');
    res.send(csv);
  }
}
