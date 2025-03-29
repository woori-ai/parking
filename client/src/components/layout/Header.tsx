import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/AuthContext";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, logout } = useContext(AuthContext);
  const [, navigate] = useLocation();

  const getPageTitle = () => {
    const [location] = useLocation();
    
    const titles: Record<string, string> = {
      '/parking': '주차 관리',
      '/visitors': '방문차량 관리',
      '/employees': '사원 관리',
      '/registration-requests': '사원 가입 신청',
      '/help': '도움말',
      '/employee': '사원 홈',
      '/profile': '내 정보',
      '/visitor-registration': '방문차량 등록',
    };

    return titles[location] || '주차관리 시스템';
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-primary text-white h-16 flex items-center shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="md:hidden p-0 text-white hover:bg-primary-dark"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="md:flex items-center hidden">
              <span className="mr-2 text-sm font-medium">운영 상태</span>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm font-medium">
                {user.username} ({user.role === 'employee' ? '사원' : user.role === 'admin' ? '관리자' : '최고관리자'})
              </span>
              <Button 
                variant="ghost" 
                className="p-1 text-white hover:bg-primary-dark"
                onClick={handleLogout}
              >
                <span className="material-icons text-sm">logout</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
