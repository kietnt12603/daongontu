'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

interface User {
  id: string;
  email: string;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
  coins: string;
}

interface AuthorProfile {
  id: string;
  penName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

interface ReadingSettings {
  theme: 'light' | 'dark' | 'sepia';
  font: 'sans' | 'serif' | 'mono' | 'playfair';
  fontSize: number; // in pixels, e.g. 16, 18, 20, 24
  lineHeight: number; // e.g. 1.5, 1.8, 2.0
}

interface AppContextType {
  user: User | null;
  authorProfile: AuthorProfile | null;
  loading: boolean;
  settings: ReadingSettings;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateSettings: (newSettings: Partial<ReadingSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReadingSettings>({
    theme: 'light',
    font: 'sans',
    fontSize: 18,
    lineHeight: 1.8,
  });

  // Load preferences and auth state on mount
  useEffect(() => {
    // 1. Load reading settings
    const storedSettings = localStorage.getItem('reading-settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        document.documentElement.setAttribute('data-theme', parsed.theme);
      } catch (e) {}
    }

    // 2. Fetch current profile if token exists
    const token = localStorage.getItem('token');
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const data = await apiRequest('/auth/me');
      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
          coins: data.coins,
        });
        if (data.authorProfile) {
          setAuthorProfile(data.authorProfile);
        } else {
          setAuthorProfile(null);
        }
      }
    } catch (error) {
      // Token expired or invalid
      logout();
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthorProfile(null);
  };

  const updateSettings = (newSettings: Partial<ReadingSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('reading-settings', JSON.stringify(updated));
      
      // Update HTML attribute for theme background transitions
      if (newSettings.theme) {
        document.documentElement.setAttribute('data-theme', newSettings.theme);
      }
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authorProfile,
        loading,
        settings,
        login,
        logout,
        refreshProfile,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
