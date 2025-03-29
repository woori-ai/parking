import { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationForm } from "@/components/auth/RegistrationForm";
import LoginForm from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";

export const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [, navigate] = useLocation();

  const handleLoginSuccess = () => {
    // 이미 AuthContext에서 역할에 따라 적절한 페이지로 이동하므로 여기서는 아무 작업도 하지 않음
    // navigate("/"); // 이 코드 제거
  };

  const handleRegistrationSuccess = () => {
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {isRegistering ? (
          <RegistrationForm
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setIsRegistering(false)}
          />
        ) : (
          <>
            <LoginForm onSuccess={handleLoginSuccess} />
            <Button variant="outline" className="w-full" onClick={() => setIsRegistering(true)}>
              회원가입
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
