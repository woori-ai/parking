import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const registrationFormSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phone: z.string().min(1, "전화번호를 입력해주세요"),
  carNumber: z.string().min(1, "차량번호를 입력해주세요"),
  position: z.string().min(1, "직책을 입력해주세요"),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

interface RegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const RegistrationForm = ({ onSuccess, onCancel }: RegistrationFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      phone: "",
      carNumber: "",
      position: "",
    },
  });

  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      console.log('Checking username:', username);
      const response = await apiRequest('GET', `/api/check-username/${username}`);
      console.log('Server response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Mutation success:', data);
      setUsernameMessage({ 
        type: data.exists ? 'error' : 'success', 
        message: data.message || (data.exists ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.')
      });
      setIsUsernameChecked(!data.exists);
      setIsCheckingUsername(false);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      const errorMessage = error?.response?.data?.message || '아이디 중복 확인 중 오류가 발생했습니다.';
      setUsernameMessage({ 
        type: 'error', 
        message: errorMessage 
      });
      setIsCheckingUsername(false);
      setIsUsernameChecked(false);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegistrationFormValues) => {
      return apiRequest('POST', '/api/register', data);
    },
    onSuccess: (data) => {
      toast({
        title: "사원 등록 완료",
        description: "등록이 완료되었습니다. 로그인 화면으로 이동합니다.",
      });
      
      setTimeout(() => {
        onSuccess();
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "가입 신청 중 오류가 발생했습니다.";
      toast({
        variant: "destructive",
        title: "가입 신청 실패",
        description: errorMessage,
      });
    },
  });

  const handleCheckUsername = async () => {
    const username = form.getValues("username");
    if (!username) {
      setUsernameMessage({ 
        type: 'error', 
        message: '아이디를 입력해주세요.' 
      });
      return;
    }
    console.log('Initiating username check for:', username);
    setIsCheckingUsername(true);
    setUsernameMessage({ type: null, message: '' });
    checkUsernameMutation.mutate(username);
  };

  const onSubmit = (data: RegistrationFormValues) => {
    if (!isUsernameChecked) {
      toast({
        variant: "destructive",
        title: "아이디 중복 확인",
        description: "아이디 중복 확인을 해주세요.",
      });
      return;
    }
    registerMutation.mutate(data);
  };

  // username이 변경되면 중복확인 상태 초기화
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("username", e.target.value);
    setIsUsernameChecked(false);
    setUsernameMessage({ type: null, message: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>사원 가입 신청</CardTitle>
        <CardDescription>
          가입 신청 후 관리자 승인이 필요합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} onChange={handleUsernameChange} />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCheckUsername}
                      disabled={isCheckingUsername}
                    >
                      {isCheckingUsername ? "확인 중..." : "중복 확인"}
                    </Button>
                  </div>
                  {usernameMessage.type && (
                    <p className={`text-sm mt-1 ${
                      usernameMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {usernameMessage.message}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전화번호</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="carNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>차량번호</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>직책</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onCancel}>
                취소
              </Button>
              <Button type="submit">신청하기</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
