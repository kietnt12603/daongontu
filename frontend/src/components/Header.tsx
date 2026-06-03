'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api';

export default function Header() {
  const { user, authorProfile, login, logout, refreshProfile } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositLoading, setDepositLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.access_token, data.user);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    try {
      await apiRequest('/users/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });
      await refreshProfile();
      setShowDepositModal(false);
    } catch (err: any) {
      alert(err.message || 'Nạp tiền thất bại.');
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md shadow-xs transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-black bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-violet-500 group-hover:to-indigo-500 transition-colors">
              Đảo Ngôn Từ
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              Premium
            </span>
          </Link>

          {/* Navigation & Auth */}
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Trang Chủ
            </Link>

            {user && (
              <>
                {/* Creator Studio Link */}
                <Link
                  href="/studio"
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>Viết Truyện</span>
                  {authorProfile?.status === 'ACTIVE' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  )}
                </Link>

                {/* Admin Dashboard Link */}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
                  >
                    Quản Trị
                  </Link>
                )}
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                {/* Coin balance & Deposit button */}
                <div className="flex items-center space-x-2 bg-accent px-3 py-1.5 rounded-lg border border-border">
                  <span className="text-xs font-bold text-amber-500">🪙 {Number(user.coins).toLocaleString()} xu</span>
                  <button
                    onClick={() => setShowDepositModal(true)}
                    id="btn-deposit-open"
                    className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
                  >
                    NẠP
                  </button>
                </div>

                {/* Logout button */}
                <button
                  onClick={logout}
                  id="btn-logout"
                  className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegister(false);
                  setShowAuthModal(true);
                }}
                id="btn-login-open"
                className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                Đăng Nhập
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">
              {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">EMAIL</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="auth-email-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">MẬT KHẨU</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="auth-password-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              {authError && <p className="text-xs text-red-500 font-medium">{authError}</p>}

              <button
                type="submit"
                id="btn-auth-submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer"
              >
                {isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs">
              <span className="opacity-70">
                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              </span>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setAuthError('');
                }}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-2 text-center">Nạp Xu Thử Nghiệm</h2>
            <p className="text-xs text-center text-gray-500 mb-4">
              Đây là cổng nạp xu giả lập để phục vụ kiểm thử chức năng mua chương VIP.
            </p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">SỐ XU MUỐN NẠP</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['100', '500', '1000', '5000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val)}
                      className={`text-xs py-1.5 rounded-md border font-semibold transition-all cursor-pointer ${
                        depositAmount === val
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'border-border bg-accent text-foreground opacity-80'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  id="deposit-amount-input"
                  className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-primary text-center font-bold text-amber-500"
                />
              </div>
              <button
                type="submit"
                id="btn-deposit-submit"
                disabled={depositLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
              >
                {depositLoading ? 'Đang nạp...' : 'Xác Nhận Nạp Xu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
