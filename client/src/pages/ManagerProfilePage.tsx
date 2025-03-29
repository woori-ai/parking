import { useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { ManagerWork } from "@/types";

const managerProfileFormSchema = z.object({
  employeeId: z.string().min(2, "아이디는 2자 이상이어야 합니다").readonly(),
  phone: z.string().min(8, "연락처를 입력해주세요"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && !data.confirmPassword) return false;
  if (!data.password && data.confirmPassword) return false;
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) return false;
  return true;
}, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type ManagerProfileFormValues = z.infer<typeof managerProfileFormSchema>;

const ManagerProfilePage = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Setup form
  const form = useForm<ManagerProfileFormValues>({
    resolver: zodResolver(managerProfileFormSchema),
    defaultValues: {
      employeeId: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Fetch manager details
  const { data: managerData, isLoading } = useQuery<ManagerWork>({
    queryKey: [`/api/manager-works/${user?.id}`],
    enabled: !!user && user.role === 'manager',
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ManagerWork>) => {
      return apiRequest('PUT', `/api/manager-works/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/manager-works/${user?.id}`] });
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "프로필 업데이트 실패",
        description: "프로필 정보 업데이트 중 오류가 발생했습니다.",
      });
    },
  });

  // Update form values when manager data loads
  useEffect(() => {
    if (managerData) {
      form.reset({
        employeeId: managerData.employeeId,
        phone: managerData.phone || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [managerData, form]);

  // Handle form submit
  const onSubmit = (data: ManagerProfileFormValues) => {
    // Create update payload (omit confirmPassword and only include password if provided)
    const updateData: Partial<ManagerWork> = {
      phone: data.phone,
    };

    if (data.password) {
      updateData.password = data.password;
    }

    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>내 프로필</CardTitle>
          <CardDescription>내 계정 정보를 확인하고 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>아이디</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>아이디는 변경할 수 없습니다.</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">비밀번호 변경</h3>
                <p className="text-sm text-muted-foreground">비밀번호를 변경하려면 새 비밀번호를 입력하세요.</p>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>새 비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>새 비밀번호 확인</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerProfilePage; 