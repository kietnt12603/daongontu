import { Controller, Get, Post, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('authors')
@UseGuards(JwtAuthGuard)
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post('register')
  async register(
    @Request() req,
    @Body('penName') penName: string,
    @Body('bankInfo') bankInfo: string,
  ) {
    if (!penName || penName.trim() === '') {
      throw new BadRequestException('Bút danh không được để trống.');
    }
    if (!bankInfo || bankInfo.trim() === '') {
      throw new BadRequestException('Thông tin ngân hàng không được để trống.');
    }
    return this.authorsService.requestRegistration(req.user.id, penName, bankInfo);
  }

  @Get('me')
  async getMyProfile(@Request() req) {
    return this.authorsService.getProfileByUserId(req.user.id);
  }

  // ADMIN ENDPOINTS
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getPending() {
    return this.authorsService.getPendingRegistrations();
  }

  @Post('admin/approve/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async approve(@Param('id') id: string) {
    return this.authorsService.approveRegistration(id);
  }

  @Post('admin/reject/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async reject(@Param('id') id: string) {
    return this.authorsService.rejectRegistration(id);
  }
}
