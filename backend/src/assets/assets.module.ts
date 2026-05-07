import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { Account } from '@/accounts/entities/account.entity';
import { AssetsController } from './assets.controller';
import { AssetsService } from './providers/assets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Account])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
