import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestWithdrawal(authorUserId: string, amount: number, bankInfo: string) {
    if (amount <= 0) {
      throw new BadRequestException('Số tiền rút phải lớn hơn 0.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra tài khoản tác giả
      const author = await tx.author.findUnique({
        where: { userId: authorUserId },
        include: { user: true },
      });

      if (!author || author.status !== 'ACTIVE') {
        throw new ForbiddenException('Chỉ tác giả đã hoạt động mới được phép rút tiền.');
      }

      // 2. Kiểm tra số dư tài khoản
      const user = author.user;
      if (user.coins.lessThan(amount)) {
        throw new BadRequestException(`Số dư của bạn không đủ để rút (Cần ${amount} xu, hiện có ${user.coins} xu).`);
      }

      // 3. Khấu trừ xu khỏi số dư ví của tác giả ngay lập tức (tạm giữ)
      await tx.user.update({
        where: { id: user.id },
        data: {
          coins: {
            decrement: amount,
          },
        },
      });

      // 4. Tạo yêu cầu rút tiền Withdrawal
      const withdrawal = await tx.withdrawal.create({
        data: {
          authorId: author.id,
          amount,
          bankInfo,
          status: 'PENDING',
        },
      });

      // 5. Tạo dòng giao dịch ghi chép (Transaction) ở trạng thái PENDING
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -amount,
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
      });

      return {
        message: 'Gửi yêu cầu rút tiền thành công. Số xu đã được tạm giữ để xử lý.',
        withdrawalId: withdrawal.id,
        amount: withdrawal.amount,
      };
    });
  }

  async getAuthorWithdrawals(authorUserId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author) {
      throw new ForbiddenException('Bạn không phải là tác giả.');
    }

    return await this.prisma.withdrawal.findMany({
      where: { authorId: author.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: Lấy danh sách yêu cầu rút tiền đang chờ duyệt
  async getPendingWithdrawals() {
    return await this.prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: {
        author: {
          select: {
            penName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Admin: Phê duyệt yêu cầu rút tiền
  async approveWithdrawal(withdrawalId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          author: true,
        },
      });

      if (!withdrawal) {
        throw new NotFoundException('Yêu cầu rút tiền không tồn tại.');
      }

      if (withdrawal.status !== 'PENDING') {
        throw new BadRequestException('Yêu cầu này đã được xử lý từ trước.');
      }

      // Cập nhật trạng thái Withdrawal thành APPROVED
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'APPROVED' },
      });

      // Cập nhật dòng giao dịch liên quan thành SUCCESS
      // (Tìm giao dịch âm tiền gần nhất có kiểu WITHDRAWAL của người dùng này)
      const transaction = await tx.transaction.findFirst({
        where: {
          userId: withdrawal.author.userId,
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' },
        });
      }

      return updatedWithdrawal;
    });
  }

  // Admin: Từ chối yêu cầu rút tiền (hoàn xu lại cho tác giả)
  async rejectWithdrawal(withdrawalId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          author: true,
        },
      });

      if (!withdrawal) {
        throw new NotFoundException('Yêu cầu rút tiền không tồn tại.');
      }

      if (withdrawal.status !== 'PENDING') {
        throw new BadRequestException('Yêu cầu này đã được xử lý từ trước.');
      }

      // Hoàn xu trả lại cho tài khoản tác giả
      await tx.user.update({
        where: { id: withdrawal.author.userId },
        data: {
          coins: {
            increment: withdrawal.amount,
          },
        },
      });

      // Cập nhật trạng thái Withdrawal thành REJECTED
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'REJECTED' },
      });

      // Cập nhật dòng giao dịch liên quan thành FAILED (để báo hủy rút tiền)
      const transaction = await tx.transaction.findFirst({
        where: {
          userId: withdrawal.author.userId,
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
      }

      // Tạo một giao dịch phụ báo nhận tiền hoàn trả
      await tx.transaction.create({
        data: {
          userId: withdrawal.author.userId,
          amount: withdrawal.amount,
          type: 'WITHDRAWAL',
          status: 'SUCCESS', // Hoàn tiền thành công
        },
      });

      return updatedWithdrawal;
    });
  }
}
