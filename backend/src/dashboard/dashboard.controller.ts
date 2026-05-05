import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './providers/dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Get dashboard summary with optional date filter' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'YYYY-MM-DD' })
  @Get()
  async getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return await this.dashboardService.getSummary(from, to);
  }

  @ApiOperation({ summary: 'Get monthly chart data for date range' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'YYYY-MM-DD' })
  @Get('charts')
  async getCharts(@Query('from') from?: string, @Query('to') to?: string) {
    return await this.dashboardService.getCharts(from, to);
  }
}
