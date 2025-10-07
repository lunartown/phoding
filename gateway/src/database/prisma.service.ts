import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      const resolvedError = this.resolveError(error);
      this.logger.error(
        `Failed to connect to database: ${resolvedError.message}`,
        resolvedError.stack,
      );
      throw resolvedError.original;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      const resolvedError = this.resolveError(error);
      this.logger.error(
        `Failed to disconnect from database: ${resolvedError.message}`,
        resolvedError.stack,
      );
    }
  }

  private resolveError(error: unknown): {
    message: string;
    stack?: string;
    original: Error;
  } {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack, original: error };
    }

    const serialised = this.serialiseUnknown(error);
    const fallback = new Error(serialised);
    return {
      message: serialised,
      stack: fallback.stack,
      original: fallback,
    };
  }

  private serialiseUnknown(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (
      typeof error === 'number' ||
      typeof error === 'boolean' ||
      typeof error === 'bigint'
    ) {
      return String(error);
    }

    if (typeof error === 'symbol') {
      return error.description ?? error.toString();
    }

    if (error === null || typeof error === 'undefined') {
      return 'Unknown error';
    }

    try {
      return JSON.stringify(error);
    } catch {
      return '[unserialisable error]';
    }
  }
}
