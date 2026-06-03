import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        coins: true,
        createdAt: true,
        authorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    return user;
  }

  // Giả lập nạp tiền vào tài khoản
  async deposit(userId: string, amount: number) {
    if (amount <= 0) {
      throw new Error('Số xu nạp phải lớn hơn 0.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng.');
      }

      // Cập nhật số dư coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: {
            increment: amount,
          },
        },
      });

      // Tạo bản ghi giao dịch nạp tiền (DEPOSIT)
      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          status: 'SUCCESS',
        },
      });

      return {
        message: `Nạp thành công ${amount} xu.`,
        newBalance: updatedUser.coins,
      };
    });
  }
}
