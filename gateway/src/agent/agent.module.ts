import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [ConfigModule, WorkspaceModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
