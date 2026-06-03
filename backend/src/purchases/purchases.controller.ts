import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post('chapter/:chapterId')
  async purchaseChapter(@Request() req, @Param('chapterId') chapterId: string) {
    return this.purchasesService.purchaseChapter(req.user.id, chapterId);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.purchasesService.getPurchaseHistory(req.user.id);
  }

  @Get('transactions')
  async getTransactions(@Request() req) {
    return this.purchasesService.getTransactionHistory(req.user.id);
  }
}
