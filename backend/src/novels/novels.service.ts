import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NovelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorUserId: string, title: string, summary: string, coverUrl?: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author || author.status !== 'ACTIVE') {
      throw new ForbiddenException('Bạn phải là tác giả đã kích hoạt tài khoản mới có thể đăng truyện.');
    }

    return await this.prisma.novel.create({
      data: {
        authorId: author.id,
        title,
        summary,
        coverUrl: coverUrl || null,
        status: 'ONGOING',
      },
    });
  }

  async update(novelId: string, authorUserId: string, data: { title?: string; summary?: string; coverUrl?: string; status?: string }) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author) {
      throw new ForbiddenException('Không có quyền chỉnh sửa.');
    }

    const novel = await this.prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!novel) {
      throw new NotFoundException('Không tìm thấy truyện.');
    }

    if (novel.authorId !== author.id) {
      throw new ForbiddenException('Bạn không sở hữu truyện này.');
    }

    return await this.prisma.novel.update({
      where: { id: novelId },
      data,
    });
  }

  async findAll(search?: string) {
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await this.prisma.novel.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            penName: true,
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: {
        views: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const novel = await this.prisma.novel.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            penName: true,
          },
        },
        chapters: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            isVip: true,
            coinPrice: true,
            createdAt: true,
          },
          orderBy: {
            chapterNumber: 'asc',
          },
        },
      },
    });

    if (!novel) {
      throw new NotFoundException('Truyện không tồn tại.');
    }

    // Tăng lượt xem lên 1
    await this.prisma.novel.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return novel;
  }

  async findByAuthor(authorUserId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author) {
      throw new ForbiddenException('Bạn không phải là tác giả.');
    }

    return await this.prisma.novel.findMany({
      where: { authorId: author.id },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    });
  }
}
