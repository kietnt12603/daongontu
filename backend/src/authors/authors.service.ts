import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestRegistration(userId: string, penName: string, bankInfo: string) {
    // Kiểm tra xem User đã có hồ sơ tác giả chưa
    const existingAuthor = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (existingAuthor) {
      if (existingAuthor.status === 'PENDING') {
        throw new BadRequestException('Yêu cầu đăng ký tác giả của bạn đang được duyệt.');
      }
      if (existingAuthor.status === 'ACTIVE') {
        throw new BadRequestException('Bạn đã là tác giả rồi.');
      }
      // Nếu bị REJECTED, cho phép cập nhật lại thông tin để gửi duyệt lại
      return await this.prisma.author.update({
        where: { userId },
        data: {
          penName,
          bankInfo,
          status: 'PENDING',
        },
      });
    }

    // Kiểm tra trùng PenName
    const existingPenName = await this.prisma.author.findUnique({
      where: { penName },
    });

    if (existingPenName) {
      throw new BadRequestException('Bút danh này đã được sử dụng.');
    }

    return await this.prisma.author.create({
      data: {
        userId,
        penName,
        bankInfo,
        status: 'PENDING',
      },
    });
  }

  async getProfileByUserId(userId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { novels: true },
        },
      },
    });

    if (!author) {
      throw new NotFoundException('Hồ sơ tác giả không tồn tại.');
    }

    return author;
  }

  // Admin: Lấy danh sách đăng ký tác giả đang chờ duyệt
  async getPendingRegistrations() {
    return await this.prisma.author.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  // Admin: Phê duyệt tác giả
  async approveRegistration(authorId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const author = await tx.author.findUnique({
        where: { id: authorId },
      });

      if (!author) {
        throw new NotFoundException('Không tìm thấy tác giả.');
      }

      if (author.status !== 'PENDING') {
        throw new BadRequestException('Tác giả không ở trạng thái chờ duyệt.');
      }

      // Cập nhật trạng thái tác giả thành ACTIVE
      const updatedAuthor = await tx.author.update({
        where: { id: authorId },
        data: { status: 'ACTIVE' },
      });

      // Nâng cấp role của User lên AUTHOR (nếu hiện tại là READER)
      const user = await tx.user.findUnique({ where: { id: author.userId } });
      if (user && user.role === 'READER') {
        await tx.user.update({
          where: { id: author.userId },
          data: { role: 'AUTHOR' },
        });
      }

      return updatedAuthor;
    });
  }

  // Admin: Từ chối tác giả
  async rejectRegistration(authorId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException('Không tìm thấy tác giả.');
    }

    if (author.status !== 'PENDING') {
      throw new BadRequestException('Tác giả không ở trạng thái chờ duyệt.');
    }

    return await this.prisma.author.update({
      where: { id: authorId },
      data: { status: 'REJECTED' },
    });
  }
}
