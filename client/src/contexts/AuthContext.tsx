import { createContext, ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 사용자 역할 타입 정의
export type UserRole = 'employee' | 'admin' | 'superadmin' | 'manager';

// 사용자 정보 타입 정의
export interface User {
  id: number;
  username: string;
  role: UserRole;
}

// 인증 컨텍스트 타입 정의
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

// 기본값으로 빈 컨텍스트 생성
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // 초기 로드 시 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.userId,
            username: data.username,
            role: data.role,
          });
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiRequest("POST", "/api/login", { username, password });
      const data = await res.json();
      
      setUser({
        id: data.id,
        username: data.username,
        role: data.role,
      });

      // Navigate based on role
      if (data.role === 'employee') {
        navigate('/employee');
      } else if (data.role === 'manager') {
        navigate('/parking'); // 주차 관리자도 주차 관리 페이지로 이동
      } else {
        navigate('/parking'); // admin과 superadmin은 주차 관리 페이지로 이동
      }

      toast({
        title: "로그인 성공",
        description: `환영합니다, ${data.username}님!`,
      });
      
      return true;
    } catch (err) {
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: "아이디와 비밀번호를 확인해주세요.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiRequest("POST", "/api/logout", {});
      setUser(null);
      navigate("/login");
      toast({
        title: "로그아웃 성공",
        description: "안전하게 로그아웃되었습니다.",
      });
    } catch (err) {
      console.error("Logout failed", err);
      toast({
        variant: "destructive",
        title: "로그아웃 실패",
        description: "다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};
