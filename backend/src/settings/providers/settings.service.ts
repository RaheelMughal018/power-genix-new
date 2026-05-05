import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UpdateBusinessSettingsDto } from '../dtos/update-business-settings.dto';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSettings(activeUser: ActiveUserData) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: activeUser.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
        business: {
          companyName: user.companyName,
          companyLogo: user.companyLogo,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          serialPrefix: user.serialPrefix,
          fiscalYearStart: user.fiscalYearStart,
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async updateProfile(
    updateProfileDto: UpdateProfileDto,
    activeUser: ActiveUserData,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: activeUser.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      Object.assign(user, updateProfileDto);
      await this.userRepository.save(user);

      return { message: 'Profile updated successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async updateBusinessSettings(
    updateBusinessSettingsDto: UpdateBusinessSettingsDto,
    activeUser: ActiveUserData,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: activeUser.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      Object.assign(user, updateBusinessSettingsDto);
      await this.userRepository.save(user);

      return { message: 'Business settings updated successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async updateLogo(activeUser: ActiveUserData, logoPath: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: activeUser.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.companyLogo = logoPath;
      await this.userRepository.save(user);

      return { message: 'Logo updated successfully', logoPath };
    } catch (error) {
      handleError(error);
    }
  }
}
