import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async purchaseChapter(userId: string, chapterId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra xem đã mua chưa
      const existingPurchase = await tx.purchase.findUnique({
        where: {
          userId_chapterId: {
            userId,
            chapterId,
          },
        },
      });

      if (existingPurchase) {
        return { message: 'Bạn đã mua chương này rồi.', alreadyPurchased: true };
      }

      // 2. Lấy thông tin chương và truyện kèm tác giả
      const chapter = await tx.chapter.findUnique({
        where: { id: chapterId },
        include: {
          novel: {
            include: {
              author: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!chapter) {
        throw new NotFoundException('Chương truyện không tồn tại.');
      }

      if (!chapter.isVip) {
        throw new BadRequestException('Chương này là chương miễn phí, không cần mua.');
      }

      // Tác giả của bộ truyện
      const author = chapter.novel.author;
      if (author.userId === userId) {
        throw new BadRequestException('Bạn là tác giả của truyện này, không cần mua chương của chính mình.');
      }

      // 3. Lấy thông tin độc giả (số dư xu)
      const reader = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!reader) {
        throw new NotFoundException('Độc giả không tồn tại.');
      }

      const price = chapter.coinPrice;
      if (reader.coins.lessThan(price)) {
        throw new BadRequestException(`Bạn không đủ xu để mua chương này (Cần ${price} xu, hiện có ${reader.coins} xu).`);
      }

      // 4. Tính toán phần trăm hoa hồng tác giả nhận được
      const commissionRate = author.commissionRate;
      const authorShare = price.times(commissionRate);

      // 5. Trừ xu của độc giả
      const updatedReader = await tx.user.update({
        where: { id: userId },
        data: {
          coins: {
            decrement: price,
          },
        },
      });

      // 6. Cộng xu cho tác giả (vào ví User của tác giả)
      await tx.user.update({
        where: { id: author.userId },
        data: {
          coins: {
            increment: authorShare,
          },
        },
      });

      // 7. Tạo bản ghi lượt mua Purchase
      const purchase = await tx.purchase.create({
        data: {
          userId,
          chapterId,
          coinsPaid: price,
        },
      });

      // 8. Tạo lịch sử giao dịch (Transaction) cho Độc giả (Trừ tiền)
      await tx.transaction.create({
        data: {
          userId,
          amount: price.negated(),
          type: 'PURCHASE',
          status: 'SUCCESS',
        },
      });

      // 9. Tạo lịch sử giao dịch (Transaction) cho Tác giả (Cộng tiền)
      await tx.transaction.create({
        data: {
          userId: author.userId,
          amount: authorShare,
          type: 'PURCHASE',
          status: 'SUCCESS',
        },
      });

      return {
        message: 'Mua chương VIP thành công.',
        purchaseId: purchase.id,
        newBalance: updatedReader.coins,
      };
    });
  }

  // Lấy lịch sử mua truyện của người dùng
  async getPurchaseHistory(userId: string) {
    return await this.prisma.purchase.findMany({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            novel: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });
  }

  // Lấy lịch sử giao dịch coins (nạp/chi tiêu) của người dùng
  async getTransactionHistory(userId: string) {
    return await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
