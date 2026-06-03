'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../utils/api';

interface Novel {
  id: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  status: string;
  views: number;
  _count: { chapters: number };
}

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  isVip: boolean;
  coinPrice: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: string;
  bankInfo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function CreatorStudio() {
  const { user, authorProfile, refreshProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'novels' | 'withdrawals' | 'transactions'>('novels');
  
  // Registration Form
  const [penName, setPenName] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Author Data
  const [novels, setNovels] = useState<Novel[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Novel Form
  const [showNovelModal, setShowNovelModal] = useState(false);
  const [novelTitle, setNovelTitle] = useState('');
  const [novelSummary, setNovelSummary] = useState('');
  const [novelCover, setNovelCover] = useState('');
  const [novelLoading, setNovelLoading] = useState(false);

  // Chapter Form
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterIsVip, setChapterIsVip] = useState(false);
  const [chapterPrice, setChapterPrice] = useState('5');
  const [chapterLoading, setChapterLoading] = useState(false);

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, []);

  useEffect(() => {
    if (authorProfile && authorProfile.status === 'ACTIVE') {
      fetchAuthorData();
    }
  }, [authorProfile?.status, activeTab]);

  const fetchAuthorData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'novels') {
        const data = await apiRequest('/novels/author');
        setNovels(data);
      } else if (activeTab === 'withdrawals') {
        const data = await apiRequest('/withdrawals/history');
        setWithdrawals(data);
      } else if (activeTab === 'transactions') {
        const data = await apiRequest('/purchases/transactions');
        // Chỉ hiện giao dịch nhận tiền (tiền cộng dương và loại PURCHASE)
        const earned = data.filter((t: any) => parseFloat(t.amount) > 0);
        setTransactions(earned);
      }
    } catch (error) {
      console.error('Không thể lấy dữ liệu tác giả:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRegisterAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      await apiRequest('/authors/register', {
        method: 'POST',
        body: JSON.stringify({ penName, bankInfo }),
      });
      await refreshProfile();
    } catch (err: any) {
      setRegError(err.message || 'Không thể đăng ký.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    setNovelLoading(true);
    try {
      await apiRequest('/novels', {
        method: 'POST',
        body: JSON.stringify({ title: novelTitle, summary: novelSummary, coverUrl: novelCover }),
      });
      setNovelTitle('');
      setNovelSummary('');
      setNovelCover('');
      setShowNovelModal(false);
      fetchAuthorData();
    } catch (err: any) {
      alert(err.message || 'Thêm truyện thất bại.');
    } finally {
      setNovelLoading(false);
    }
  };

  const handleSelectNovel = async (novel: Novel) => {
    setSelectedNovel(novel);
    setLoadingChapters(true);
    try {
      const data = await apiRequest(`/novels/${novel.id}`);
      setChapters(data.chapters || []);
    } catch (error) {
      console.error('Lỗi khi lấy chương truyện:', error);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel) return;
    setChapterLoading(true);
    try {
      await apiRequest('/chapters', {
        method: 'POST',
        body: JSON.stringify({
          novelId: selectedNovel.id,
          title: chapterTitle,
          content: chapterContent,
          isVip: chapterIsVip,
          coinPrice: parseFloat(chapterPrice),
        }),
      });
      setChapterTitle('');
      setChapterContent('');
      setChapterIsVip(false);
      setChapterPrice('5');
      setShowChapterModal(false);
      // Reload chapters
      handleSelectNovel(selectedNovel);
    } catch (err: any) {
      alert(err.message || 'Thêm chương thất bại.');
    } finally {
      setChapterLoading(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawError('');
    try {
      const bank = withdrawBank || authorProfile?.bankInfo || '';
      await apiRequest('/withdrawals/request', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(withdrawAmount), bankInfo: bank }),
      });
      setWithdrawAmount('');
      await refreshProfile();
      fetchAuthorData();
      alert('Gửi yêu cầu rút tiền thành công!');
    } catch (err: any) {
      setWithdrawError(err.message || 'Rút tiền thất bại.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <span className="text-4xl block mb-2">🔒</span>
          <h1 className="text-xl font-bold">Yêu cầu Đăng Nhập</h1>
          <p className="text-xs text-gray-500 mt-1">Vui lòng đăng nhập tài khoản để vào Creator Studio.</p>
          <button
            onClick={() => {
              const loginBtn = document.getElementById('btn-login-open');
              if (loginBtn) loginBtn.click();
            }}
            className="mt-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-6 py-2 rounded-lg cursor-pointer"
          >
            ĐĂNG NHẬP NGAY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Header />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Dashboard Left Navigation */}
          {authorProfile?.status === 'ACTIVE' && (
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="bg-card border border-border rounded-2xl p-4 space-y-1 shadow-xs">
                <div className="p-3 border-b border-border mb-3 text-center">
                  <span className="block text-[10px] font-bold opacity-60 uppercase tracking-wider">Tác giả</span>
                  <span className="text-lg font-black text-primary">{authorProfile.penName}</span>
                </div>
                {[
                  { id: 'novels', name: '📚 Truyện của tôi' },
                  { id: 'withdrawals', name: '💸 Yêu cầu rút tiền' },
                  { id: 'transactions', name: '📈 Doanh thu xu' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedNovel(null);
                      setActiveTab(tab.id as any);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* Dashboard Main Workspace */}
          <div className="flex-grow">
            {/* 1. Register Author State */}
            {(!authorProfile || authorProfile.status === 'PENDING' || authorProfile.status === 'REJECTED') && (
              <div className="max-w-md mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md">
                {authorProfile?.status === 'PENDING' ? (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">⏳</span>
                    <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400">Yêu cầu Đăng ký Đang Chờ Duyệt</h2>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Admin đang kiểm tra thông tin tài khoản ngân hàng và bút danh của bạn. Thông thường quá trình phê duyệt diễn ra trong vòng 24 giờ.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <span className="text-4xl block mb-2">✍️</span>
                      <h2 className="text-xl font-bold">Đăng Ký Làm Tác Giả</h2>
                      <p className="text-xs text-gray-500 mt-1">Đăng truyện chữ của riêng bạn để mở chương VIP kiếm doanh thu.</p>
                      {authorProfile?.status === 'REJECTED' && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold p-3 rounded-lg mt-3">
                          Yêu cầu trước đó bị từ chối. Vui lòng cập nhật lại thông tin chuẩn xác.
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleRegisterAuthor} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 opacity-70">BÚT DANH (TÊN TÁC GIẢ)</label>
                        <input
                          type="text"
                          required
                          value={penName}
                          onChange={(e) => setPenName(e.target.value)}
                          placeholder="Ví dụ: Lão Đậu, Vô Tà..."
                          id="author-penname-input"
                          className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 opacity-70">THÔNG TIN TÀI KHOẢN NGÂN HÀNG (BANK INFO)</label>
                        <textarea
                          required
                          rows={3}
                          value={bankInfo}
                          onChange={(e) => setBankInfo(e.target.value)}
                          placeholder="Ví dụ: MB Bank - 123456789 - NGUYEN VAN A. Thông tin này phục vụ Admin chuyển khoản doanh thu cho bạn."
                          id="author-bank-input"
                          className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      {regError && <p className="text-xs text-red-500 font-bold">{regError}</p>}

                      <button
                        type="submit"
                        disabled={regLoading}
                        id="btn-author-register-submit"
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {regLoading ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Đăng Ký'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* 2. Active Author Dashboard */}
            {authorProfile?.status === 'ACTIVE' && (
              <div className="space-y-6">
                
                {/* 2.1 Tab Novels */}
                {activeTab === 'novels' && !selectedNovel && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold">Danh Sách Truyện Đã Đăng</h2>
                      <button
                        onClick={() => setShowNovelModal(true)}
                        id="btn-create-novel-open"
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        + THÊM TRUYỆN MỚI
                      </button>
                    </div>

                    {loadingData ? (
                      <div className="text-center py-12">Đang tải danh sách truyện...</div>
                    ) : novels.length === 0 ? (
                      <div className="text-center py-12 opacity-50 text-sm">Bạn chưa đăng tác phẩm nào. Hãy bấm nút phía trên để tạo tác phẩm đầu tiên!</div>
                    ) : (
                      <div className="space-y-3">
                        {novels.map((novel) => (
                          <div
                            key={novel.id}
                            className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary transition-all bg-accent/10"
                          >
                            <div className="flex items-center">
                              <div className="w-12 h-16 bg-accent border border-border rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {novel.coverUrl ? (
                                  <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg">📚</span>
                                )}
                              </div>
                              <div className="ml-4">
                                <h3 className="font-bold text-sm">{novel.title}</h3>
                                <p className="text-xs text-gray-500">👁️ {novel.views.toLocaleString()} lượt xem • {novel._count.chapters} chương</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSelectNovel(novel)}
                              className="text-xs bg-accent hover:bg-accent/80 border border-border rounded-lg px-3 py-1.5 font-bold cursor-pointer"
                            >
                              ⚙️ Quản lý chương
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2.1.1 Chapters management for a single novel */}
                {activeTab === 'novels' && selectedNovel && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setSelectedNovel(null)}
                        className="text-xs font-semibold text-gray-500 hover:text-foreground cursor-pointer"
                      >
                        ← Quay lại danh sách truyện
                      </button>
                      <button
                        onClick={() => setShowChapterModal(true)}
                        id="btn-create-chapter-open"
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        + THÊM CHƯƠNG MỚI
                      </button>
                    </div>

                    <div className="border-b border-border pb-4 mb-6">
                      <h2 className="text-lg font-black">{selectedNovel.title}</h2>
                      <p className="text-xs text-gray-500 mt-1">Danh sách quản lý và soạn thảo chương truyện.</p>
                    </div>

                    {loadingChapters ? (
                      <div className="text-center py-12">Đang tải danh sách chương...</div>
                    ) : chapters.length === 0 ? (
                      <div className="text-center py-12 opacity-50 text-sm">Truyện này chưa có chương. Hãy bấm thêm chương để xuất bản đầu tiên!</div>
                    ) : (
                      <div className="space-y-2">
                        {chapters.map((chap) => (
                          <div
                            key={chap.id}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-accent/20 text-sm font-medium"
                          >
                            <span>
                              Chương {chap.chapterNumber}: {chap.title}
                            </span>
                            {chap.isVip ? (
                              <span className="text-xs font-bold text-amber-500 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                VIP (🪙 {Number(chap.coinPrice)})
                              </span>
                            ) : (
                              <span className="text-[10px] text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md font-bold">
                                FREE
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2.2 Tab Withdrawals */}
                {activeTab === 'withdrawals' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Send Withdrawal Form */}
                    <div className="md:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xs self-start">
                      <h2 className="text-md font-bold mb-4">Tạo Lệnh Rút Tiền</h2>
                      <div className="bg-accent/40 rounded-xl p-4 border border-border mb-4 text-center">
                        <span className="block text-[10px] font-bold opacity-60 uppercase tracking-wider">Số Dư Xu Hiện Có</span>
                        <span className="text-2xl font-black text-amber-500">🪙 {Number(user.coins).toLocaleString()} xu</span>
                        <span className="block text-[9px] text-gray-500 mt-1">1 xu = 1,000 VNĐ</span>
                      </div>
                      <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold mb-1 opacity-70">SỐ XU RÚT</label>
                          <input
                            type="number"
                            required
                            min="100"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Tối thiểu 100 xu"
                            id="withdraw-amount-input"
                            className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 opacity-70">THÔNG TIN BANK NHẬN (CÓ THỂ SỬA)</label>
                          <textarea
                            required
                            rows={3}
                            value={withdrawBank}
                            onChange={(e) => setWithdrawBank(e.target.value)}
                            placeholder={authorProfile.bankInfo}
                            id="withdraw-bank-input"
                            className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                          />
                        </div>

                        {withdrawError && <p className="text-xs text-red-500 font-bold">{withdrawError}</p>}

                        <button
                          type="submit"
                          disabled={withdrawLoading}
                          id="btn-withdraw-submit"
                          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {withdrawLoading ? 'Đang gửi...' : 'GỬI YÊU CẦU RÚT'}
                        </button>
                      </form>
                    </div>

                    {/* Withdrawal History List */}
                    <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xs">
                      <h2 className="text-md font-bold mb-4">Lịch Sử Rút Tiền</h2>
                      {loadingData ? (
                        <div className="text-center py-12">Đang tải lịch sử rút tiền...</div>
                      ) : withdrawals.length === 0 ? (
                        <div className="text-center py-12 opacity-50 text-sm">Chưa có yêu cầu rút tiền nào.</div>
                      ) : (
                        <div className="space-y-3">
                          {withdrawals.map((w) => (
                            <div
                              key={w.id}
                              className="flex items-center justify-between p-4 rounded-xl border border-border bg-accent/10"
                            >
                              <div>
                                <span className="block text-xs font-bold text-amber-500">🪙 {Number(w.amount).toLocaleString()} xu ({ (Number(w.amount) * 1000).toLocaleString() } VNĐ)</span>
                                <span className="block text-[10px] text-gray-500 mt-1">Bank: {w.bankInfo}</span>
                              </div>
                              <div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    w.status === 'APPROVED'
                                      ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
                                      : w.status === 'REJECTED'
                                      ? 'border-red-500/20 bg-red-500/10 text-red-500'
                                      : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                                  }`}
                                >
                                  {w.status === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT' : w.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : 'CHỜ DUYỆT'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2.3 Tab Transactions (Earnings Log) */}
                {activeTab === 'transactions' && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
                    <h2 className="text-lg font-bold mb-4">Nhật Ký Nhận Doanh Thu (Xu)</h2>
                    <p className="text-xs text-gray-500 mb-6">Mỗi khi độc giả mua chương VIP của bạn, doanh thu (sau khi trừ chiết khấu) sẽ tự động cộng vào đây.</p>
                    
                    {loadingData ? (
                      <div className="text-center py-12">Đang tải nhật ký...</div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-12 opacity-50 text-sm">Chưa có giao dịch nhận tiền nào từ chương VIP.</div>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-accent/20"
                          >
                            <div>
                              <span className="text-xs font-semibold">Độc giả mở khóa chương truyện VIP</span>
                              <span className="block text-[9px] text-gray-500 mt-1">{new Date(t.createdAt).toLocaleString()}</span>
                            </div>
                            <span className="text-xs font-black text-green-600 dark:text-green-400">
                              +🪙 {Number(t.amount)} xu
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </main>

      {/* New Novel Modal */}
      {showNovelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowNovelModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Đăng Ký Truyện Mới</h2>
            <form onSubmit={handleCreateNovel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">TÊN TRUYỆN</label>
                <input
                  type="text"
                  required
                  value={novelTitle}
                  onChange={(e) => setNovelTitle(e.target.value)}
                  placeholder="Ví dụ: Đấu Phá Thương Khung..."
                  id="novel-title-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">ẢNH BÌA URL (TÙY CHỌN)</label>
                <input
                  type="url"
                  value={novelCover}
                  onChange={(e) => setNovelCover(e.target.value)}
                  placeholder="Link ảnh bìa: http://..."
                  id="novel-cover-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">TÓM TẮT TRUYỆN</label>
                <textarea
                  required
                  rows={4}
                  value={novelSummary}
                  onChange={(e) => setNovelSummary(e.target.value)}
                  placeholder="Tóm tắt giới thiệu tác phẩm..."
                  id="novel-summary-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={novelLoading}
                id="btn-novel-submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {novelLoading ? 'Đang tạo...' : 'Tạo Truyện'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowChapterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Thêm Chương Mới</h2>
            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">TIÊU ĐỀ CHƯƠNG</label>
                <input
                  type="text"
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Sự khởi đầu..."
                  id="chapter-title-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border border-border bg-accent/40 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={chapterIsVip}
                    onChange={(e) => setChapterIsVip(e.target.checked)}
                    id="chapter-vip-checkbox"
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded-sm"
                  />
                  <label htmlFor="chapter-vip-checkbox" className="text-sm font-semibold select-none cursor-pointer">Set làm Chương VIP</label>
                </div>
                {chapterIsVip && (
                  <div>
                    <input
                      type="number"
                      required
                      min="1"
                      value={chapterPrice}
                      onChange={(e) => setChapterPrice(e.target.value)}
                      placeholder="Giá xu"
                      id="chapter-price-input"
                      className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary font-bold text-amber-500"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">NỘI DUNG CHƯƠNG TRUYỆN</label>
                <textarea
                  required
                  rows={8}
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  placeholder="Nhập nội dung truyện chữ tại đây..."
                  id="chapter-content-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary font-reading-sans"
                />
              </div>
              <button
                type="submit"
                disabled={chapterLoading}
                id="btn-chapter-submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {chapterLoading ? 'Đang xuất bản...' : 'Xuất Bản Chương'}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-border bg-card/50 py-8 text-center text-xs opacity-60">
        <p>© 2026 Đảo Ngôn Từ. Thiết kế tối ưu cho trải nghiệm đọc truyện premium.</p>
      </footer>
    </div>
  );
}
