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
import { CreateRecipeDto } from './dtos/create-recipe.dto';
import { UpdateRecipeDto } from './dtos/update-recipe.dto';
import { RecipesService } from './providers/recipes.service';

@ApiTags('Recipes')
@ApiBearerAuth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @ApiOperation({ summary: 'Get all recipes (paginated)' })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  @Get()
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.recipesService.findAll(paginationQuery);
  }

  @ApiOperation({ summary: 'Export recipes as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export of all recipes' })
  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.recipesService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recipes.csv"');
    res.send(csv);
  }

  @ApiOperation({ summary: 'Get a single recipe by ID' })
  @ApiResponse({ status: 200, description: 'Recipe retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.recipesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created successfully' })
  @ApiResponse({ status: 400, description: 'Recipe already exists for this product' })
  @ApiBody({ type: CreateRecipeDto })
  @Post()
  async create(
    @Body() createRecipeDto: CreateRecipeDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.recipesService.create(createRecipeDto, activeUser);
  }

  @ApiOperation({ summary: 'Update a recipe' })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return await this.recipesService.update(id, updateRecipeDto);
  }

  @ApiOperation({ summary: 'Soft delete a recipe' })
  @ApiResponse({ status: 200, description: 'Recipe deleted successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.recipesService.remove(id);
  }
}
