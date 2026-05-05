import { Global, Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { SettingsModule } from '@/settings/settings.module';

@Global()
@Module({
  imports: [SettingsModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
