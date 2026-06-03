'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { useApp } from '../../../context/AppContext';
import { apiRequest } from '../../../utils/api';

interface ChapterDetail {
  id: string;
  novelId: string;
  novelTitle: string;
  chapterNumber: number;
  title: string;
  isVip: boolean;
  coinPrice: string;
  content: string;
  hasPurchased: boolean;
  prevChapterId: string | null;
  nextChapterId: string | null;
}

export default function Reader({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chapterId = resolvedParams.id;
  const router = useRouter();

  const { user, settings, updateSettings, refreshProfile } = useApp();
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchChapterDetail();
    // Tự động cuộn lên đầu khi chuyển chương
    window.scrollTo(0, 0);
  }, [chapterId]);

  const fetchChapterDetail = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/chapters/${chapterId}`);
      setChapter(data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết chương:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua chương VIP.');
      // Mở modal đăng nhập bằng cách click vào nút đăng nhập giả định
      const loginBtn = document.getElementById('btn-login-open');
      if (loginBtn) loginBtn.click();
      return;
    }

    setBuying(true);
    setPurchaseError('');
    try {
      await apiRequest(`/purchases/chapter/${chapterId}`, {
        method: 'POST',
      });
      // Làm mới ví tiền
      await refreshProfile();
      // Lấy lại nội dung chương đã mua thành công
      await fetchChapterDetail();
    } catch (err: any) {
      setPurchaseError(err.message || 'Giao dịch thất bại.');
    } finally {
      setBuying(false);
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

  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <span className="text-4xl block mb-2">⚠️</span>
          <h1 className="text-xl font-bold">Không tìm thấy chương</h1>
          <p className="text-xs text-gray-500 mt-1">Chương này không tồn tại hoặc đã bị xóa.</p>
          <Link href="/" className="mt-4 text-sm font-semibold text-primary hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Lựa chọn Class Font chữ đọc truyện
  const fontClass =
    settings.font === 'serif'
      ? 'font-reading-serif'
      : settings.font === 'playfair'
      ? 'font-reading-playfair'
      : settings.font === 'mono'
      ? 'font-reading-mono'
      : 'font-reading-sans';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Header />

      {/* Reader Main */}
      <main className="flex-1 w-full mx-auto relative px-4 py-8">
        
        {/* Floating Settings Bar Toggle (Desktop/Mobile Layout) */}
        <div className="max-w-3xl mx-auto flex items-center justify-between border-b border-border/60 pb-4 mb-8">
          <div>
            <Link
              href={`/novels/${chapter.novelId}`}
              className="text-xs font-bold text-primary hover:underline uppercase tracking-wide block mb-1"
            >
              ← {chapter.novelTitle}
            </Link>
            <h1 className="text-lg font-bold">
              Chương {chapter.chapterNumber}: {chapter.title}
            </h1>
          </div>

          {/* Quick Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              id="btn-settings-toggle"
              className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:border-primary transition-all cursor-pointer"
            >
              <span>⚙️ Cài Đặt Đọc</span>
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl p-4 shadow-xl z-30 animate-in fade-in slide-in-from-top-2 duration-100">
                <div className="space-y-4">
                  {/* Theme Select */}
                  <div>
                    <span className="block text-[10px] font-bold opacity-60 mb-1.5 uppercase tracking-wider">Theme Giao Diện</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'light', name: 'Sáng', bg: 'bg-[#f9f8f6] text-[#1c1917] border-[#e7e5e4]' },
                        { id: 'dark', name: 'Tối', bg: 'bg-[#121214] text-[#e4e4e7] border-[#2d2d34]' },
                        { id: 'sepia', name: 'Sepia', bg: 'bg-[#f4edd8] text-[#433422] border-[#d4c5a0]' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings({ theme: t.id as any })}
                          className={`text-xs py-1.5 rounded-lg border text-center font-semibold cursor-pointer ${t.bg} ${
                            settings.theme === t.id ? 'ring-2 ring-primary font-bold' : 'opacity-80'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Select */}
                  <div>
                    <span className="block text-[10px] font-bold opacity-60 mb-1.5 uppercase tracking-wider">Font Chữ</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'sans', name: 'Sans' },
                        { id: 'serif', name: 'Serif' },
                        { id: 'playfair', name: 'Cổ Điển' },
                        { id: 'mono', name: 'Mono' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => updateSettings({ font: f.id as any })}
                          className={`text-[10px] py-1 border border-border rounded-md font-semibold cursor-pointer ${
                            settings.font === f.id
                              ? 'bg-primary text-white border-primary font-bold'
                              : 'bg-accent/40 hover:bg-accent/80'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Adjust */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Cỡ Chữ ({settings.fontSize}px)</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })}
                        className="bg-accent hover:bg-accent/80 border border-border rounded-md w-7 h-7 flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        A-
                      </button>
                      <button
                        onClick={() => updateSettings({ fontSize: Math.min(32, settings.fontSize + 2) })}
                        className="bg-accent hover:bg-accent/80 border border-border rounded-md w-7 h-7 flex items-center justify-center font-bold text-sm cursor-pointer"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Line Height Adjust */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Giãn Dòng ({settings.lineHeight})</span>
                    <div className="flex items-center space-x-1">
                      {[1.5, 1.8, 2.0].map((lh) => (
                        <button
                          key={lh}
                          onClick={() => updateSettings({ lineHeight: lh })}
                          className={`text-[10px] font-semibold w-7 h-7 rounded-md border border-border cursor-pointer ${
                            settings.lineHeight === lh
                              ? 'bg-primary text-white border-primary font-bold'
                              : 'bg-accent hover:bg-accent/80'
                          }`}
                        >
                          {lh}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reading Canvas */}
        <section
          className={`max-w-2xl mx-auto ${fontClass} leading-relaxed transition-all`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {chapter.hasPurchased ? (
            <div className="whitespace-pre-wrap select-text selection:bg-primary/20 break-words font-medium">
              {chapter.content}
            </div>
          ) : (
            /* VIP purchase wall */
            <div className="bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center my-12 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500"></div>
              <span className="text-4xl block mb-2">🔒</span>
              <h2 className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mb-1">
                Đây là Chương Truyện VIP
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Tác giả đã giới hạn chương này. Hãy mua chương để tiếp tục đọc và ủng hộ tác phẩm.
              </p>

              <div className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 mb-6">
                <div className="text-center">
                  <span className="block text-[10px] font-bold opacity-60 uppercase tracking-wider">Giá Bán</span>
                  <span className="text-2xl font-black text-amber-500">🪙 {Number(chapter.coinPrice)} xu</span>
                </div>
              </div>

              {purchaseError && (
                <p className="text-xs text-red-500 font-bold mb-4">{purchaseError}</p>
              )}

              <div className="flex flex-col items-center justify-center gap-3">
                {user ? (
                  Number(user.coins) >= Number(chapter.coinPrice) ? (
                    <button
                      onClick={handlePurchase}
                      id="btn-purchase-chapter"
                      disabled={buying}
                      className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                    >
                      {buying ? 'Đang giao dịch...' : 'MUA NGAY'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const depositOpenBtn = document.getElementById('btn-deposit-open');
                          if (depositOpenBtn) depositOpenBtn.click();
                        }}
                        id="btn-deposit-redirect"
                        className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        NẠP XU ĐỂ ĐỌC TIẾP
                      </button>
                      <p className="text-[10px] text-gray-400">Số dư hiện tại của bạn: 🪙 {Number(user.coins).toLocaleString()} xu</p>
                    </>
                  )
                ) : (
                  <button
                    onClick={() => {
                      const loginOpenBtn = document.getElementById('btn-login-open');
                      if (loginOpenBtn) loginOpenBtn.click();
                    }}
                    id="btn-login-redirect"
                    className="w-full max-w-xs bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    ĐĂNG NHẬP ĐỂ MUA CHƯƠNG
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Reader Navigation Footer */}
        <section className="max-w-2xl mx-auto flex items-center justify-between border-t border-border/60 pt-6 mt-12 gap-4">
          <button
            onClick={() => router.push(`/chapters/${chapter.prevChapterId}`)}
            disabled={!chapter.prevChapterId}
            id="btn-prev-chapter"
            className="flex-1 bg-card hover:bg-accent border border-border disabled:opacity-40 disabled:hover:bg-card rounded-xl py-3 text-center text-xs font-bold transition-all cursor-pointer"
          >
            ← Chương Trước
          </button>
          
          <Link
            href={`/novels/${chapter.novelId}`}
            className="bg-card hover:bg-accent border border-border rounded-xl p-3 text-xs font-bold transition-all text-center flex-shrink-0"
          >
            📋 Mục Lục
          </Link>

          <button
            onClick={() => router.push(`/chapters/${chapter.nextChapterId}`)}
            disabled={!chapter.nextChapterId}
            id="btn-next-chapter"
            className="flex-1 bg-card hover:bg-accent border border-border disabled:opacity-40 disabled:hover:bg-card rounded-xl py-3 text-center text-xs font-bold transition-all cursor-pointer"
          >
            Chương Tiếp →
          </button>
        </section>

      </main>

      <footer className="border-t border-border bg-card/50 py-8 text-center text-xs opacity-60">
        <p>© 2026 Đảo Ngôn Từ. Thiết kế tối ưu cho trải nghiệm đọc truyện premium.</p>
      </footer>
    </div>
  );
}
