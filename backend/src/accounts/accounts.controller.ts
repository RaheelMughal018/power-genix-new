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
import { AccountsService } from './providers/accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
import { AddOpeningBalanceDto } from './dtos/add-opening-balance.dto';
import { TransferDto } from './dtos/transfer.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({ summary: 'Get all accounts (paginated)' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @Get()
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.accountsService.findAll(paginationQuery);
  }

  @ApiOperation({ summary: 'Get total current balance across all accounts' })
  @ApiResponse({ status: 200, description: 'Total balance retrieved successfully' })
  @Get('total-balance')
  async getTotalBalance() {
    return await this.accountsService.getTotalBalance();
  }

  @ApiOperation({ summary: 'Export accounts as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all accounts' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.accountsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="accounts.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get account detail with transaction history' })
  @ApiResponse({ status: 200, description: 'Account detail retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id/detail')
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.accountsService.getDetail(id);
  }

  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.accountsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiBody({ type: CreateAccountDto })
  @Post()
  async create(
    @Body() createAccountDto: CreateAccountDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.accountsService.create(createAccountDto, activeUser);
  }

  @ApiOperation({ summary: 'Transfer funds between accounts' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiBody({ type: TransferDto })
  @Post('transfer')
  async transfer(
    @Body() transferDto: TransferDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.accountsService.transfer(transferDto, activeUser);
  }

  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return await this.accountsService.update(id, updateAccountDto);
  }

  @ApiOperation({ summary: 'Soft delete an account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete account with non-zero balance' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.accountsService.remove(id);
  }

  @ApiOperation({ summary: 'Add opening balance to an account' })
  @ApiResponse({ status: 201, description: 'Opening balance added successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiBody({ type: AddOpeningBalanceDto })
  @ApiParam({ name: 'id', type: Number })
  @Post(':id/opening-balance')
  async addOpeningBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() addOpeningBalanceDto: AddOpeningBalanceDto,
  ) {
    return await this.accountsService.addOpeningBalance(id, addOpeningBalanceDto);
  }
}
