import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { PreviewModule } from './preview/preview.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AgentModule,
    PreviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
