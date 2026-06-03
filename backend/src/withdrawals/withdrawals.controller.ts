import { Controller, Post, Get, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post('request')
  @UseGuards(RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  async requestWithdrawal(
    @Request() req,
    @Body('amount') amount: number,
    @Body('bankInfo') bankInfo: string,
  ) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền rút không hợp lệ.');
    }
    if (!bankInfo || bankInfo.trim() === '') {
      throw new BadRequestException('Thông tin tài khoản nhận tiền không được để trống.');
    }
    return this.withdrawalsService.requestWithdrawal(req.user.id, amount, bankInfo);
  }

  @Get('history')
  @UseGuards(RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  async getHistory(@Request() req) {
    return this.withdrawalsService.getAuthorWithdrawals(req.user.id);
  }

  // ADMIN ENDPOINTS
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getPending() {
    return this.withdrawalsService.getPendingWithdrawals();
  }

  @Post('admin/approve/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async approve(@Param('id') id: string) {
    return this.withdrawalsService.approveWithdrawal(id);
  }

  @Post('admin/reject/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async reject(@Param('id') id: string) {
    return this.withdrawalsService.rejectWithdrawal(id);
  }
}
