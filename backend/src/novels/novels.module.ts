import { Module } from '@nestjs/common';
import { NovelsService } from './novels.service';
import { NovelsController } from './novels.controller';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'daongontusecretkeyjwt12345!',
    }),
  ],
  providers: [NovelsService, ChaptersService],
  controllers: [NovelsController, ChaptersController],
  exports: [NovelsService, ChaptersService],
})
export class NovelsModule {}
