import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private static getAdapter() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/daongontu?schema=public';
    const pool = new Pool({ connectionString });
    return new PrismaPg(pool);
  }

  constructor() {
    super({
      adapter: PrismaService.getAdapter(),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Đã kết nối thành công tới database PostgreSQL qua Prisma ORM.');
    } catch (error) {
      this.logger.error('LỖI: Không thể kết nối tới PostgreSQL database. Hãy chắc chắn rằng database của bạn đang chạy và cấu hình DATABASE_URL trong file .env chính xác.', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
