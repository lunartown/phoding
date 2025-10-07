import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect().catch((error: unknown) => {
      console.error('Failed to connect to database:', error);
      throw error;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect().catch((error: unknown) => {
      console.error('Failed to disconnect from database:', error);
    });
  }
}
