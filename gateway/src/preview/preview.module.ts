import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';

@Module({
  imports: [ConfigModule],
  controllers: [PreviewController],
  providers: [PreviewService],
})
export class PreviewModule {}
