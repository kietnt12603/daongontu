import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Headers } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Controller('chapters')
export class ChaptersController {
  constructor(
    private readonly chaptersService: ChaptersService,
    private readonly jwtService: JwtService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'daongontusecretkeyjwt12345!',
        });
        // jwtService.verify trả về payload trực tiếp, hoặc chúng ta dùng jwtService.decode
        const payload = this.jwtService.decode(token) as any;
        if (payload && payload.sub) {
          userId = payload.sub;
        }
      } catch (err) {
        // Token không hợp lệ hoặc hết hạn, coi như chưa đăng nhập
      }
    }

    return this.chaptersService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  @Post()
  async create(
    @Request() req,
    @Body('novelId') novelId: string,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('isVip') isVip: boolean,
    @Body('coinPrice') coinPrice: number,
  ) {
    return this.chaptersService.create(req.user.id, novelId, title, content, isVip, coinPrice || 0);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { title?: string; content?: string; isVip?: boolean; coinPrice?: number },
  ) {
    return this.chaptersService.update(id, req.user.id, body);
  }
}
