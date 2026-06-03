import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Post('deposit')
  async deposit(@Request() req, @Body('amount') amount: number) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền nạp không hợp lệ.');
    }
    return this.usersService.deposit(req.user.id, amount);
  }
}
