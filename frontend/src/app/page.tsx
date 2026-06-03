'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { apiRequest } from '../utils/api';

interface Novel {
  id: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  status: string;
  views: number;
  rating: number;
  author: {
    penName: string;
  };
  _count: {
    chapters: number;
  };
}

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNovels();
  }, [searchQuery]);

  const fetchNovels = async () => {
    try {
      const endpoint = searchQuery ? `/novels?search=${encodeURIComponent(searchQuery)}` : '/novels';
      const data = await apiRequest(endpoint);
      setNovels(data);
    } catch (error) {
      console.error('Không thể lấy danh sách truyện:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        
        {/* Premium Banner */}
        <section className="relative rounded-3xl overflow-hidden mb-12 bg-linear-to-br from-violet-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-violet-850">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative max-w-lg z-10">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-550 mb-4 animate-pulse">
              Chào mừng bạn đến với Đảo Ngôn Từ
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Đọc Truyện Chữ Premium
              <br />
              <span className="bg-linear-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Ủng Hộ Tác Giả Việt Nam
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
              Khám phá thế giới tiểu thuyết đặc sắc, đăng ký làm tác giả để phát hành chương VIP và rút doanh thu thực tế về tài khoản.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-900/30 transition-all active:scale-95 cursor-pointer"
              >
                Trở Thành Tác Giả
              </Link>
              <a
                href="#novel-list"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl backdrop-blur-xs transition-all active:scale-95 border border-white/10"
              >
                Khám Phá Ngay
              </a>
            </div>
          </div>
        </section>

        {/* Search and Books section */}
        <section id="novel-list" className="scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Tủ Truyện Đề Cử</h2>
              <p className="text-xs text-gray-500 mt-1">Nơi tụ hội những tiểu thuyết xuất sắc nhất trên đảo.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên truyện, tác giả..."
                id="search-input"
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm pl-10 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              <span className="absolute left-3.5 top-3 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Novels Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-card border border-border rounded-2xl h-44 animate-pulse"></div>
              ))}
            </div>
          ) : novels.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-2">📚</span>
              <p className="text-sm font-semibold opacity-65">Chưa có truyện nào phù hợp với tìm kiếm của bạn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {novels.map((novel) => (
                <Link
                  key={novel.id}
                  href={`/novels/${novel.id}`}
                  className="group bg-card border border-border rounded-2xl p-4 flex hover:border-primary hover:shadow-lg transition-all duration-300"
                >
                  {/* Book Cover */}
                  <div className="relative w-24 h-32 rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 flex-shrink-0 flex items-center justify-center border border-border overflow-hidden group-hover:scale-[1.03] transition-all">
                    {novel.coverUrl ? (
                      <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-violet-500 font-bold opacity-60">📚</span>
                    )}
                    <div className="absolute top-1 right-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded-sm font-bold">
                      {novel.status === 'COMPLETED' ? 'FULL' : 'ĐANG RA'}
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="ml-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {novel.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Tác giả: {novel.author.penName}</p>
                      <p className="text-xs opacity-75 mt-2 line-clamp-2 leading-relaxed">
                        {novel.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mt-2">
                      <span className="flex items-center">👁️ {novel.views.toLocaleString()}</span>
                      <span className="flex items-center text-amber-500">⭐ {novel.rating.toFixed(1)}</span>
                      <span className="bg-accent px-2 py-0.5 rounded-md border border-border">
                        {novel._count.chapters} chương
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 text-center text-xs opacity-60">
        <p>© 2026 Đảo Ngôn Từ. Thiết kế tối ưu cho trải nghiệm đọc truyện premium.</p>
      </footer>
    </div>
  );
}
