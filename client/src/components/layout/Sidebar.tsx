import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthContext } from "@/contexts/AuthContext";
import { 
  Car, Users, MessageSquare, ShieldCheck, 
  UserCheck, Settings, HelpCircle, Home,
  User, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface RegistrationData {
  length: number;
}

// 사용자 역할 타입 정의
type UserRole = 'employee' | 'admin' | 'superadmin' | 'manager' | undefined;

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user } = useContext(AuthContext);
  const [location] = useLocation();

  // Get pending registration requests count
  const { data: registrationData } = useQuery<RegistrationData>({
    queryKey: ['/api/registration-requests'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    refetchInterval: 60000, // Refetch every minute
  });

  const pendingRequestsCount = registrationData?.length || 0;

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager';
  const isSuperAdmin = user?.role === 'superadmin';

  const adminMenuItems: MenuItem[] = [
    { label: '주차 관리', icon: 'local_parking', path: '/parking', adminOnly: true },
    { label: '방문차량 관리', icon: 'directions_car', path: '/visitors', adminOnly: true },
    { label: '게시판', icon: 'dashboard', path: '/postboard' },
    { label: '사원 관리', icon: 'people', path: '/employees', adminOnly: true },
    { label: '사원 가입 신청', icon: 'how_to_reg', path: '/registration-requests', adminOnly: true, badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
    { label: '도움말', icon: 'help', path: '/help' },
  ];

  const employeeMenuItems: MenuItem[] = [
    { label: '홈', icon: 'home', path: '/employee' },
    { label: '방문차량 등록', icon: 'directions_car', path: '/visitor-registration' },
    { label: '게시판', icon: 'dashboard', path: '/postboard' },
    { label: '내 정보', icon: 'person', path: '/profile' },
    { label: '도움말', icon: 'help', path: '/help' },
  ];

  const managerMenuItems: MenuItem[] = [
    { label: '주차 관리', icon: 'local_parking', path: '/parking', adminOnly: true },
    { label: '방문차량 관리', icon: 'directions_car', path: '/visitors', adminOnly: true },
    { label: '게시판', icon: 'dashboard', path: '/postboard' },
    { label: '사원 관리', icon: 'people', path: '/employees', adminOnly: true },
    { label: '내 정보', icon: 'person', path: '/manager-profile' },
    { label: '도움말', icon: 'help', path: '/help' },
  ];

  // 사용자 역할에 따라 메뉴 아이템 선택
  let menuItems: MenuItem[] = [];
  if (isAdmin) {
    menuItems = adminMenuItems;
  } else if (isManager) {
    menuItems = managerMenuItems;
  } else {
    menuItems = employeeMenuItems;
  }

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transition-transform duration-300 ease-in-out transform md:translate-x-0 md:static md:h-auto ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } mt-16 md:mt-0`}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item, index) => {
              if (item.adminOnly && !isAdmin && !isManager) return null;
              
              return (
                <li key={index}>
                  <Link 
                    href={item.path}
                    onClick={closeSidebar}
                  >
                    <a 
                      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                        location === item.path 
                          ? "bg-primary text-white" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="material-icons mr-3 text-sm">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant="destructive"
                          className="ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          {user && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="material-icons text-gray-500">account_circle</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.username}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'employee' 
                    ? '사원' 
                    : user.role === 'admin' 
                      ? '관리자' 
                      : user.role === 'manager'
                        ? '주차 담당자'
                        : '최고관리자'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
