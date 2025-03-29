import React, { useEffect, useState, useMemo, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { useLocation, Route, Switch } from "wouter";

// Layouts
import MainLayout from "./components/layout/MainLayout";

// Auth pages
import { LoginPage } from "./pages/LoginPage";
import NotFound from "@/pages/not-found";

// Admin pages
import ParkingManagement from "./pages/ParkingManagement";
import VisitorManagement from "./pages/VisitorManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import RegistrationRequests from "./pages/RegistrationRequests";
import HelpPage from "./pages/HelpPage";
import PostBoard from "./pages/PostBoard";

// Employee pages
import EmployeeHome from "./pages/EmployeeHome";
import ProfilePage from "./pages/ProfilePage";
import ManagerProfilePage from "./pages/ManagerProfilePage";
import VisitorRegistration from "./pages/VisitorRegistration";

// Create a client
const queryClient = new QueryClient();

// Auth-aware router component
function AuthRoute({ component: Component, adminOnly = false, path }: { 
  component: React.ComponentType<any>, 
  adminOnly?: boolean, 
  path: string
}) {
  const [location, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [params, setParams] = useState<any>({});
  const [isPathMatch, setIsPathMatch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if the current location matches the path pattern
  useEffect(() => {
    // Simple path matching logic
    const pathParts = path.split('/');
    const locationParts = location.split('/');
    
    if (pathParts.length !== locationParts.length) {
      setIsPathMatch(false);
      return;
    }
    
    const extractedParams: Record<string, string> = {};
    let matches = true;
    
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].startsWith(':')) {
        // This is a parameter
        const paramName = pathParts[i].substring(1);
        extractedParams[paramName] = locationParts[i];
      } else if (pathParts[i] !== locationParts[i]) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      setParams(extractedParams);
      setIsPathMatch(true);
    } else {
      setIsPathMatch(false);
    }
  }, [location, path]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        console.log("Auth check started...");
        const res = await fetch('/api/session');
        
        if (res.ok) {
          const data = await res.json();
          console.log("Auth successful:", data);
          setIsAuthenticated(true);
          setUserRole(data.role);
        } else {
          console.log("Auth failed:", res.status);
          setIsAuthenticated(false);
          setUserRole(null);
          setAuthError(`Authentication failed: ${res.status}`);
          if (location !== '/login') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setUserRole(null);
        setAuthError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (location !== '/login') {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location]);

  if (isLoading || isAuthenticated === null) {
    // Loading state
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <div className="text-lg font-medium">로딩 중...</div>
        <div className="text-sm text-gray-500 mt-2">인증 상태를 확인하는 중입니다.</div>
      </div>
    );
  }

  if (authError && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-red-600">인증 오류</div>
        <div className="text-sm text-gray-600 mt-2">{authError}</div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/login')}
        >
          로그인 페이지로 이동
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location !== '/login') {
      navigate('/login');
    }
    return null;
  }

  if (adminOnly && userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'manager') {
    if (userRole === 'employee' && location !== '/employee') {
      navigate('/employee');
    } else if (location !== '/login') {
      navigate('/login');
    }
    return null;
  }

  return isPathMatch ? <Component params={params} /> : null;
}

function AppRoutes() {
  const [location, navigate] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect root to appropriate dashboard based on role
  useEffect(() => {
    const redirectToDashboard = async () => {
      // 이미 리다이렉트했거나 루트 경로가 아니면 리다이렉트하지 않음
      if (hasRedirected || location !== '/') {
        return;
      }

      try {
        const res = await fetch('/api/session');
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.role === 'employee') {
            navigate('/employee');
          } else if (data.role === 'manager') {
            navigate('/parking');
          } else if (data.role === 'admin' || data.role === 'superadmin') {
            navigate('/parking');
          }
        } else {
          // 인증되지 않은 경우 로그인으로
          navigate('/login');
        }
        
        setHasRedirected(true);
      } catch (error) {
        // 에러 발생 시 로그인으로
        navigate('/login');
        setHasRedirected(true);
      }
    };

    redirectToDashboard();
  }, [navigate, location, hasRedirected]);

  // 관리자 설정 페이지에 접근할 경우 사원 관리 페이지로 리다이렉트
  useEffect(() => {
    if (location === '/admins') {
      navigate('/employees');
    }
  }, [location, navigate]);

  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/parking">
        <AuthRoute component={ParkingManagement} adminOnly path="/parking" />
      </Route>
      <Route path="/visitors">
        <AuthRoute component={VisitorManagement} adminOnly path="/visitors" />
      </Route>
      <Route path="/postboard">
        <AuthRoute component={PostBoard} path="/postboard" />
      </Route>
      <Route path="/employees">
        <AuthRoute component={EmployeeManagement} adminOnly path="/employees" />
      </Route>
      <Route path="/registration-requests">
        <AuthRoute component={RegistrationRequests} adminOnly path="/registration-requests" />
      </Route>
      <Route path="/help">
        <AuthRoute component={HelpPage} path="/help" />
      </Route>
      
      {/* Employee routes */}
      <Route path="/employee">
        <AuthRoute component={EmployeeHome} path="/employee" />
      </Route>
      <Route path="/profile">
        <AuthRoute component={ProfilePage} path="/profile" />
      </Route>
      <Route path="/manager-profile">
        <AuthRoute component={ManagerProfilePage} path="/manager-profile" />
      </Route>
      <Route path="/visitor-registration">
        <AuthRoute component={VisitorRegistration} path="/visitor-registration" />
      </Route>
      
      {/* Home route - will redirect based on role */}
      <Route path="/">
        <div className="flex items-center justify-center min-h-screen">Redirecting to dashboard...</div>
      </Route>
      
      {/* Fallback to 404 */}
      <Route path="/:rest*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  // 로그인 페이지인지 확인
  const isLoginPage = location === '/login';
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isLoginPage ? (
          <>
            <LoginPage />
            <Toaster />
          </>
        ) : (
          <MainLayout>
            <AppRoutes />
            <Toaster />
          </MainLayout>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
