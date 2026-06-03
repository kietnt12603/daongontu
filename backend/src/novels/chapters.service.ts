import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    authorUserId: string,
    novelId: string,
    title: string,
    content: string,
    isVip: boolean,
    coinPrice: number,
  ) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author || author.status !== 'ACTIVE') {
      throw new ForbiddenException('Tài khoản tác giả chưa được kích hoạt.');
    }

    const novel = await this.prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!novel) {
      throw new NotFoundException('Truyện không tồn tại.');
    }

    if (novel.authorId !== author.id) {
      throw new ForbiddenException('Bạn không sở hữu truyện này.');
    }

    // Đếm số chương hiện tại để tự động gán chapterNumber
    const chapterCount = await this.prisma.chapter.count({
      where: { novelId },
    });

    return await this.prisma.chapter.create({
      data: {
        novelId,
        chapterNumber: chapterCount + 1,
        title,
        content,
        isVip,
        coinPrice: isVip ? coinPrice : 0,
      },
    });
  }

  async update(
    chapterId: string,
    authorUserId: string,
    data: { title?: string; content?: string; isVip?: boolean; coinPrice?: number },
  ) {
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author) {
      throw new ForbiddenException('Không có quyền chỉnh sửa.');
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: true },
    });

    if (!chapter) {
      throw new NotFoundException('Chương không tồn tại.');
    }

    if (chapter.novel.authorId !== author.id) {
      throw new ForbiddenException('Bạn không sở hữu truyện này.');
    }

    return await this.prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...data,
        coinPrice: data.isVip ? data.coinPrice : 0,
      },
    });
  }

  async findOne(chapterId: string, userId?: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          select: {
            title: true,
            authorId: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chương không tồn tại.');
    }

    // Trả về thông tin cơ bản trước
    const result = {
      id: chapter.id,
      novelId: chapter.novelId,
      novelTitle: chapter.novel.title,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      isVip: chapter.isVip,
      coinPrice: chapter.coinPrice,
      createdAt: chapter.createdAt,
      content: '',
      hasPurchased: false,
    };

    // Tìm chương tiếp theo và chương trước đó để tiện điều hướng UX
    const prevChapter = await this.prisma.chapter.findFirst({
      where: {
        novelId: chapter.novelId,
        chapterNumber: chapter.chapterNumber - 1,
      },
      select: { id: true },
    });

    const nextChapter = await this.prisma.chapter.findFirst({
      where: {
        novelId: chapter.novelId,
        chapterNumber: chapter.chapterNumber + 1,
      },
      select: { id: true },
    });

    Object.assign(result, {
      prevChapterId: prevChapter?.id || null,
      nextChapterId: nextChapter?.id || null,
    });

    // Nếu không phải chương VIP, ai cũng đọc được
    if (!chapter.isVip) {
      result.content = chapter.content;
      result.hasPurchased = true;
      return result;
    }

    // Nếu là chương VIP
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { authorProfile: true },
      });

      if (user) {
        // Nếu là ADMIN hoặc là Tác giả của chính bộ truyện này
        if (
          user.role === 'ADMIN' ||
          (user.authorProfile && user.authorProfile.id === chapter.novel.authorId)
        ) {
          result.content = chapter.content;
          result.hasPurchased = true;
          return result;
        }

        // Kiểm tra xem đã mua chưa
        const purchase = await this.prisma.purchase.findUnique({
          where: {
            userId_chapterId: {
              userId,
              chapterId,
            },
          },
        });

        if (purchase) {
          result.content = chapter.content;
          result.hasPurchased = true;
          return result;
        }
      }
    }

    // Chưa đăng nhập hoặc chưa mua
    result.content = 'Nội dung chương VIP đã được ẩn. Vui lòng mua chương này để tiếp tục đọc.';
    result.hasPurchased = false;
    return result;
  }
}
