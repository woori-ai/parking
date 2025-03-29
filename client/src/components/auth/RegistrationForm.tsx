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

  const onSubmit = (data: RegistrationFormValues) => {
    registerMutation.mutate(data);
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
