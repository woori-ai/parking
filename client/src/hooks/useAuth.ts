import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// 사용자 타입 정의
export interface User {
  username: string;
  type: 'employee' | 'manager' | 'admin';
  isAdmin?: boolean;
}

export const useAuth = () => {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // 로그인 함수
  const login = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setLocation('/login');
  };

  return { user, loading, login, logout };
}; 