'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import { apiRequest } from '../../../utils/api';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  isVip: boolean;
  coinPrice: string;
  createdAt: string;
}

interface Novel {
  id: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  status: string;
  views: number;
  rating: number;
  author: {
    id: string;
    penName: string;
  };
  chapters: Chapter[];
}

export default function NovelDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const novelId = resolvedParams.id;

  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNovelDetail();
  }, [novelId]);

  const fetchNovelDetail = async () => {
    try {
      const data = await apiRequest(`/novels/${novelId}`);
      setNovel(data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết truyện:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <span className="text-4xl block mb-2">⚠️</span>
          <h1 className="text-xl font-bold">Không tìm thấy truyện</h1>
          <p className="text-xs text-gray-500 mt-1">Truyện này không tồn tại hoặc đã bị xóa.</p>
          <Link href="/" className="mt-4 text-sm font-semibold text-primary hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Header />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
        {/* Novel Hero Card */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 mb-8 shadow-xs">
          {/* Cover */}
          <div className="relative w-36 h-48 rounded-xl bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 border border-border overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center self-center sm:self-start">
            {novel.coverUrl ? (
              <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-violet-500 font-bold opacity-60">📚</span>
            )}
            <div className="absolute top-2 right-2 bg-primary text-[10px] text-white px-2 py-0.5 rounded-sm font-bold shadow-xs">
              {novel.status === 'COMPLETED' ? 'FULL' : 'ĐANG RA'}
            </div>
          </div>

          {/* Details */}
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                {novel.title}
              </h1>
              <p className="text-sm font-semibold text-gray-500 mb-4">
                Tác giả:{' '}
                <span className="text-primary hover:underline cursor-pointer">{novel.author.penName}</span>
              </p>

              {/* Stats Grid */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 mb-6 bg-accent/50 border border-border/50 rounded-xl p-3 w-fit">
                <span className="flex items-center">👁️ {novel.views.toLocaleString()} lượt xem</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center text-amber-500">⭐ {novel.rating.toFixed(1)} điểm</span>
                <span className="text-gray-300">|</span>
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                  {novel.chapters.length} chương
                </span>
              </div>
            </div>

            {/* Read action */}
            {novel.chapters.length > 0 ? (
              <Link
                href={`/chapters/${novel.chapters[0].id}`}
                id="btn-read-first-chapter"
                className="w-full sm:w-fit bg-primary hover:bg-primary-hover text-white text-center font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer"
              >
                ĐỌC CHƯƠNG ĐẦU
              </Link>
            ) : (
              <button
                disabled
                className="w-full sm:w-fit bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed font-bold px-6 py-3 rounded-xl"
              >
                TRUYỆN CHƯA CÓ CHƯƠNG
              </button>
            )}
          </div>
        </section>

        {/* Summary Description */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">Tóm Tắt Nội Dung</h2>
          <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap">
            {novel.summary}
          </p>
        </section>

        {/* Chapters List */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">Danh Sách Chương</h2>
          {novel.chapters.length === 0 ? (
            <p className="text-sm opacity-55 text-center py-6">Tác giả chưa đăng chương nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {novel.chapters.map((chap) => (
                <Link
                  key={chap.id}
                  href={`/chapters/${chap.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-accent/20 hover:border-primary hover:bg-accent/40 transition-all text-sm font-medium"
                >
                  <span className="truncate pr-4">
                    Chương {chap.chapterNumber}: {chap.title}
                  </span>
                  
                  {/* VIP / Price badge */}
                  {chap.isVip ? (
                    <span className="flex items-center space-x-1 flex-shrink-0 text-xs font-bold text-amber-500 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <span>VIP</span>
                      <span className="text-[10px]">🪙 {Number(chap.coinPrice)}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md font-bold">
                      FREE
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-8 text-center text-xs opacity-60">
        <p>© 2026 Đảo Ngôn Từ. Thiết kế tối ưu cho trải nghiệm đọc truyện premium.</p>
      </footer>
    </div>
  );
}
