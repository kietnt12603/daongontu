'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../utils/api';

interface PendingAuthor {
  id: string;
  penName: string;
  bankInfo: string;
  createdAt: string;
  user: {
    email: string;
  };
}

interface PendingWithdrawal {
  id: string;
  amount: string;
  bankInfo: string;
  createdAt: string;
  author: {
    penName: string;
    user: {
      email: string;
    };
  };
}

export default function AdminDashboard() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'authors' | 'withdrawals'>('authors');
  const [pendingAuthors, setPendingAuthors] = useState<PendingAuthor[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAdminData();
    }
  }, [user?.role, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'authors') {
        const data = await apiRequest('/authors/admin/pending');
        setPendingAuthors(data);
      } else if (activeTab === 'withdrawals') {
        const data = await apiRequest('/withdrawals/admin/pending');
        setPendingWithdrawals(data);
      }
    } catch (error) {
      console.error('Không thể lấy dữ liệu quản trị:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAuthor = async (authorId: string) => {
    if (!confirm('Xác nhận phê duyệt tài khoản tác giả này?')) return;
    try {
      await apiRequest(`/authors/admin/approve/${authorId}`, { method: 'POST' });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Phê duyệt thất bại.');
    }
  };

  const handleRejectAuthor = async (authorId: string) => {
    if (!confirm('Xác nhận từ chối tài khoản tác giả này?')) return;
    try {
      await apiRequest(`/authors/admin/reject/${authorId}`, { method: 'POST' });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Từ chối thất bại.');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!confirm('Xác nhận đã chuyển khoản thành công và phê duyệt lệnh rút tiền này?')) return;
    try {
      await apiRequest(`/withdrawals/admin/approve/${withdrawalId}`, { method: 'POST' });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Phê duyệt thất bại.');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    if (!confirm('Xác nhận từ chối yêu cầu rút tiền này? Xu tạm giữ sẽ được hoàn lại cho tác giả.')) return;
    try {
      await apiRequest(`/withdrawals/admin/reject/${withdrawalId}`, { method: 'POST' });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Từ chối thất bại.');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
          <span className="text-4xl block mb-2">🚫</span>
          <h1 className="text-xl font-bold">Không Có Quyền Truy Cập</h1>
          <p className="text-xs text-gray-500 mt-1">Khu vực này chỉ dành riêng cho Quản trị viên (Admin).</p>
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
        <div className="border-b border-border pb-4 mb-8">
          <h1 className="text-2xl font-black">Bảng Điều Khiển Quản Trị (Admin)</h1>
          <p className="text-xs text-gray-500 mt-1">Duyệt đăng ký tác giả và phê duyệt lệnh thanh toán rút tiền.</p>
        </div>

        {/* Tab Select */}
        <div className="flex space-x-2 border-b border-border pb-px mb-6">
          <button
            onClick={() => setActiveTab('authors')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'authors'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            ✍️ Chờ Duyệt Tác Giả ({pendingAuthors.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-foreground'
            }`}
          >
            💸 Chờ Duyệt Rút Tiền ({pendingWithdrawals.length})
          </button>
        </div>

        {/* Content Workspace */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-xs">
          {loading ? (
            <div className="text-center py-12">Đang tải dữ liệu admin...</div>
          ) : activeTab === 'authors' ? (
            /* Pending Authors List */
            pendingAuthors.length === 0 ? (
              <p className="text-sm opacity-55 text-center py-6">Hiện không có yêu cầu đăng ký tác giả nào cần duyệt.</p>
            ) : (
              <div className="space-y-4">
                {pendingAuthors.map((author) => (
                  <div
                    key={author.id}
                    className="p-5 rounded-2xl border border-border bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-primary">{author.penName}</span>
                        <span className="text-[10px] text-gray-400">({author.user.email})</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 font-medium bg-card border border-border p-2.5 rounded-lg">
                        <span className="block text-[9px] font-bold opacity-60 uppercase mb-0.5">Tài khoản Bank:</span>
                        {author.bankInfo}
                      </p>
                      <span className="block text-[9px] text-gray-400 mt-1.5">Ngày gửi đơn: {new Date(author.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRejectAuthor(author.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApproveAuthor(author.id)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Phê Duyệt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Pending Withdrawals List */
            pendingWithdrawals.length === 0 ? (
              <p className="text-sm opacity-55 text-center py-6">Hiện không có yêu cầu rút tiền nào cần xử lý.</p>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl border border-border bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-amber-500">🪙 {Number(w.amount).toLocaleString()} xu</span>
                        <span className="text-xs font-semibold text-gray-400">({ (Number(w.amount) * 1000).toLocaleString() } VNĐ)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Tác giả: <span className="font-bold text-primary">{w.author.penName}</span> ({w.author.user.email})
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5 font-medium bg-card border border-border p-2.5 rounded-lg">
                        <span className="block text-[9px] font-bold opacity-60 uppercase mb-0.5">Tài khoản nhận:</span>
                        {w.bankInfo}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRejectWithdrawal(w.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApproveWithdrawal(w.id)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Duyệt Đã Chuyển
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 py-8 text-center text-xs opacity-60">
        <p>© 2026 Đảo Ngôn Từ. Thiết kế tối ưu cho trải nghiệm đọc truyện premium.</p>
      </footer>
    </div>
  );
}
