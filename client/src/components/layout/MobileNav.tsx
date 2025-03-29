import { useContext } from "react";
import { Link, useLocation } from "wouter";
import { AuthContext } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const MobileNav = () => {
  const { user } = useContext(AuthContext);
  const [location] = useLocation();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Admin navigation items
  const adminNavItems = [
    { label: '주차', icon: 'local_parking', path: '/parking' },
    { label: '방문', icon: 'directions_car', path: '/visitors' },
    { label: '사원', icon: 'people', path: '/employees' },
    { label: '더보기', icon: 'more_horiz', path: '/more' },
  ];

  // Employee navigation items
  const employeeNavItems = [
    { label: '홈', icon: 'home', path: '/employee' },
    { label: '방문등록', icon: 'directions_car', path: '/visitor-registration' },
    { label: '내정보', icon: 'person', path: '/profile' },
    { label: '도움말', icon: 'help', path: '/help' },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
      <div className="flex justify-around">
        {navItems.map((item, index) => (
          <Link key={index} href={item.path}>
            <a className={`flex flex-col items-center py-2 px-4 ${
              location === item.path ? 'text-primary' : 'text-gray-600'
            }`}>
              <div className="relative">
                <span className="material-icons">{item.icon}</span>
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
