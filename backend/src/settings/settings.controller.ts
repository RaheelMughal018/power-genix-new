import { ActiveUser } from '@/common/decorators/active-user.decorator';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateBusinessSettingsDto } from './dtos/update-business-settings.dto';
import { SettingsService } from './providers/settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @Get()
  async getSettings(@ActiveUser() activeUser: ActiveUserData) {
    return await this.settingsService.getSettings(activeUser);
  }

  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiBody({ type: UpdateProfileDto })
  @Patch('profile')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.settingsService.updateProfile(
      updateProfileDto,
      activeUser,
    );
  }

  @ApiOperation({ summary: 'Update business settings' })
  @ApiResponse({ status: 200, description: 'Business settings updated successfully' })
  @ApiBody({ type: UpdateBusinessSettingsDto })
  @Patch('business')
  async updateBusinessSettings(
    @Body() updateBusinessSettingsDto: UpdateBusinessSettingsDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.settingsService.updateBusinessSettings(
      updateBusinessSettingsDto,
      activeUser,
    );
  }

  @ApiOperation({ summary: 'Upload company logo' })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { logo: { type: 'string', format: 'binary' } },
    },
  })
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return await this.settingsService.updateLogo(
      activeUser,
      `/uploads/logos/${file.filename}`,
    );
  }
}
