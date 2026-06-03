import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Kích hoạt CORS để Next.js (cổng 3000) gọi được API
  app.enableCors({
    origin: '*', // Trong thực tế nên cấu hình domain cụ thể
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Kích hoạt validation toàn cục cho các DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend API đang chạy tại: http://localhost:${port}`);
}
bootstrap();
