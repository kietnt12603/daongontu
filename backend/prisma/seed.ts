import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Lấy connection string từ env hoặc dùng fallback cổng của npx prisma dev
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Bắt đầu dọn dẹp database...');
  await prisma.withdrawal.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.novel.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();
  console.log('Đã dọn dẹp database cũ.');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  console.log('Tạo tài khoản Admin...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@daongontu.com',
      passwordHash,
      role: 'ADMIN',
      coins: 100000,
    },
  });

  console.log('Tạo tài khoản Tác giả...');
  const authorUser = await prisma.user.create({
    data: {
      email: 'tacgia@daongontu.com',
      passwordHash,
      role: 'AUTHOR',
      coins: 500,
    },
  });

  const authorProfile = await prisma.author.create({
    data: {
      userId: authorUser.id,
      penName: 'Tiêu Đỉnh',
      bio: 'Tác giả chuyên viết tiên hiệp thế hệ mới.',
      bankInfo: 'Vietcombank - 001100223344 - TIÊU ĐỈNH',
      status: 'ACTIVE',
      commissionRate: 0.70,
    },
  });

  console.log('Tạo truyện Đấu Phá Thương Khung...');
  const novel1 = await prisma.novel.create({
    data: {
      authorId: authorProfile.id,
      title: 'Đấu Phá Thương Khung',
      summary: 'Tại nơi này thế giới tiên hiệp kỳ ảo, không có hoa lệ ma pháp, chỉ có phồn diễn đến đỉnh phong đấu khí! Câu chuyện kể về hành trình đầy gian nan của một thiếu niên từ phế vật gia tộc từng bước tu luyện đi lên đỉnh phong đấu đế thế giới.',
      coverUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=400&q=80',
      status: 'ONGOING',
      views: 1250,
      rating: 4.8,
    },
  });

  console.log('Tạo các chương cho Đấu Phá Thương Khung...');
  await prisma.chapter.create({
    data: {
      novelId: novel1.id,
      chapterNumber: 1,
      title: 'Dược Lão thức tỉnh',
      content: 'Tiêu Viêm mở to hai mắt nhìn chiếc nhẫn màu đen trên tay. Từ bên trong chiếc nhẫn, một làn khói trắng bay ra, ngưng tụ thành hình ảnh một lão giả hiền từ nhưng khí thế bất phàm.\n\n- Nhóc con, ba năm nay hấp thu đấu khí của ngươi, thật là có chút ngượng ngùng dâng hiến a... Lão giả cười híp mắt nói.\n\nTiêu Viêm phẫn nộ đứng bật dậy: "Hóa ra chính là lão gia hỏa ngươi đã biến ta từ thiên tài thành phế vật!"\n\nLão giả vội ho một tiếng: "Ta là Dược Trần, đệ nhất luyện dược sư của Đấu Khí Đại Lục. Chỉ cần ngươi đi theo ta, ta cam đoan đấu khí của ngươi sẽ hồi phục nhanh gấp mười lần!"\n\nCâu chuyện kỳ ảo về hành trình nghịch thiên cải mệnh chính thức bắt đầu từ đây...',
      isVip: false,
    },
  });

  await prisma.chapter.create({
    data: {
      novelId: novel1.id,
      chapterNumber: 2,
      title: 'Gia tộc khảo hạch',
      content: 'Quảng trường rộng lớn ngập tràn âm thanh nghị luận xôn xao. Bảng đá lớn đứng sừng sững ở trung tâm hiển thị ba chữ to màu xanh: "Đấu lực: Thất đoạn!"\n\n- Tiêu Viêm, Đấu Chi Khí: Thất đoạn! Trạng thái: Cấp cao!\n\nNgười trắc thí cất tiếng hô to, toàn trường lập tiếp tĩnh lặng như tờ. Những tiếng giễu cợt trước kia bỗng chốc biến mất, thay vào đó là những ánh mắt kinh ngạc, run rẩy và kính phục.\n\nTiêu Viêm cười nhạt, xoay người bước xuống đài, hướng về phía thiếu nữ đang mặc y phục màu tím nhạt ở góc quảng trường. Huân Nhi mỉm cười nói: "Tiêu Viêm ca ca quả nhiên là thiên tài nhất."',
      isVip: false,
    },
  });

  await prisma.chapter.create({
    data: {
      novelId: novel1.id,
      chapterNumber: 3,
      title: 'Nạp Lan Yên Nhiên thoái hôn',
      content: 'Đại sảnh gia tộc náo loạn. Nạp Lan Yên Nhiên, truyền nhân đệ nhất của Vân Lam Tông ngẩng cao đầu đầy ngạo nghễ.\n\n- Tiêu thúc thúc, hôn ước năm xưa là do hai gia tộc tự ý đính ước, nay Tiêu Viêm thực lực giảm sút, Vân Lam Tông không thể gả đệ tử nòng cốt vào đây. Yên Nhiên nguyện bồi thường tụ khí tán để hủy bỏ hôn ước này!\n\nTiêu Chiến tức giận run người, đấu khí toàn thân bùng phát làm rạn nứt bàn ghế gỗ quý.\n\nTiêu Viêm bước ra, gằn từng chữ: "Nạp Lan tiểu thư, bớt kiêu ngạo đi! Hôm nay không phải Vân Lam Tông ngươi thoái hôn, mà là Tiêu Viêm ta hưu thê!"\n\nNói xong, cậu vung bút viết giấy hưu thê và để lại lời thề ba năm quyết chiến trên đỉnh Vân Lam Sơn!',
      isVip: false,
    },
  });

  await prisma.chapter.create({
    data: {
      novelId: novel1.id,
      chapterNumber: 4,
      title: 'Luyện chế Tụ Khí Tán (Chương VIP)',
      content: 'Chương VIP: Trong sơn động yên tĩnh.\n\nDược Lão vung tay lên, chiếc đỉnh luyện dược khổng lồ xuất hiện. Ngọn lửa màu cốt trắng (Cốt Linh Lãnh Hỏa) bốc cháy rừng rực, nhiệt độ lập tức tăng vọt.\n\n- Tiêu Viêm, cẩn thận nhìn kỹ kỹ thuật khống chế lửa của ta. Đây chính là linh hồn của Luyện Dược Sư!\n\nDược Lão thả liên tiếp các loại linh dược trân quý như Tử Diệp Lan thảo, Phỉ Thúy quả vào lò, tinh luyện thành bột chất lỏng nguyên chất xanh mướt.\n\nTiêu Viêm đứng cạnh quan sát tỉ mỉ, tâm thần chấn động sâu sắc. Sau ba canh giờ đấu trí khốc liệt khống chế ngọn lửa, một luồng đan hương nồng đậm xộc ra, đan dược Tụ Khí Tán nhị phẩm đan thành công!',
      isVip: true,
      coinPrice: 5,
    },
  });

  console.log('Tạo truyện Vũ Luyện Điên Phong...');
  const novel2 = await prisma.novel.create({
    data: {
      authorId: authorProfile.id,
      title: 'Vũ Luyện Điên Phong',
      summary: 'Vũ đạo điên phong, là cô độc, là tịch mịch, là đằng đẵng truy cầu, chịu hết mọi gian khổ, trải qua mọi sinh tử cận kề. Một đệ tử quét rác ngẫu nhiên có được một cuốn hắc thư vô tự, bước lên con đường chinh phục đỉnh phong võ đạo.',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      status: 'COMPLETED',
      views: 980,
      rating: 4.6,
    },
  });

  await prisma.chapter.create({
    data: {
      novelId: novel2.id,
      chapterNumber: 1,
      title: 'Quét rác đệ tử',
      content: 'Lăng Tiêu Các, võ môn đệ nhất thiên hạ nhưng cạnh tranh vô cùng khốc liệt.\n\nDương Khai mồ hôi đầm đìa cầm cây chổi lớn quét lá rụng trên thềm đá Lăng Tiêu Các. Ba năm gia nhập tông môn, tư chất kém cỏi khiến hắn mãi chỉ là một tên sai vặt quét rác, chịu đủ mọi châm chọc.\n\n- Dương Khai, hôm nay ngươi lại thua trận đấu thử thách nữa chứ? Mấy tên đệ tử nòng cốt đi ngang qua cười cợt.\n\nDương Khai không đáp, bàn tay siết chặt cán chổi, ánh mắt hiện lên vẻ kiên cường bất khuất.',
      isVip: false,
    },
  });

  await prisma.chapter.create({
    data: {
      novelId: novel2.id,
      chapterNumber: 2,
      title: 'Hắc thư thần bí (Chương VIP)',
      content: 'Chương VIP: Đêm khuya thanh vắng trong túp lều rách nát.\n\nDương Khai vô tình đụng vào một cuốn sách màu đen cũ kỹ nằm sâu dưới gầm giường gỗ. Cuốn sách không có chữ, mặt bìa đen bóng loáng huyền bí.\n\nKhi ngón tay Dương Khai dính máu vô tình chạm vào bìa sách, cuốn sách đột nhiên tỏa ra luồng ma lực hút linh hồn của hắn vào trong. Một không gian hỗn mang rộng lớn hiện ra, trung tâm là một bộ xương vàng kim lấp lánh (Ngạo Cốt Kim Thân) cùng dòng chữ cổ bừng sáng:\n\n- Ngạo cốt bất khuất, võ luyện điên phong!',
      isVip: true,
      coinPrice: 5,
    },
  });

  console.log('Hoàn thành gieo dữ liệu (Seeding)!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
