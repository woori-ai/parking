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
import { Employee } from "@/types";

const profileFormSchema = z.object({
  username: z.string().min(2, "아이디는 2자 이상이어야 합니다").readonly(),
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  phone: z.string().min(8, "연락처를 입력해주세요"),
  carNumber: z.string().min(4, "차량번호를 입력해주세요"),
  position: z.string().min(1, "직책을 입력해주세요"),
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

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employee details with improved caching
  const { 
    data: employeeData, 
    isLoading, 
    error, 
    isError 
  } = useQuery<Employee>({
    queryKey: [`/api/employees/${user?.id}`],
    queryFn: async () => {
      console.log(`프로필 데이터 요청 시작: 사용자 ID ${user?.id}`);
      try {
        const res = await fetch(`/api/employees/${user?.id}`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error(`데이터 요청 실패: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('프로필 데이터 요청 완료:', data);
        return data;
      } catch (err) {
        console.error('프로필 데이터 요청 오류:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5분 동안 데이터를 fresh로 간주
    cacheTime: 1000 * 60 * 30, // 30분 동안 캐시 유지
    retry: 2
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Employee>) => {
      console.log('프로필 업데이트 요청:', data);
      return apiRequest('PUT', `/api/employees/${user?.id}`, data);
    },
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 데이터 다시 가져오기
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${user?.id}`] });
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error) => {
      console.error('프로필 업데이트 오류:', error);
      toast({
        variant: "destructive",
        title: "프로필 업데이트 실패",
        description: "프로필 정보 업데이트 중 오류가 발생했습니다.",
      });
    },
  });

  // Setup form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      carNumber: "",
      position: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form values when employee data loads
  useEffect(() => {
    if (employeeData) {
      console.log('프로필 폼 데이터 설정:', employeeData);
      form.reset({
        username: employeeData.username,
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        carNumber: employeeData.carNumber || '',
        position: employeeData.position || '',
        password: "",
        confirmPassword: "",
      });
    }
  }, [employeeData, form]);

  // Handle error
  useEffect(() => {
    if (isError && error) {
      console.error('프로필 데이터 로딩 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로딩 실패",
        description: "프로필 정보를 불러오지 못했습니다. 새로고침 해주세요.",
      });
    }
  }, [isError, error, toast]);

  // Handle form submit
  const onSubmit = (data: ProfileFormValues) => {
    // Create update payload (omit confirmPassword and only include password if provided)
    const updateData: Partial<Employee> = {
      email: data.email,
      phone: data.phone,
      carNumber: data.carNumber,
      position: data.position,
    };

    if (data.password) {
      updateData.password = data.password;
    }

    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-gray-200 border-l-gray-200 border-r-gray-200 animate-spin mb-4"></div>
        <p className="text-gray-500">프로필 정보를 불러오는 중입니다...</p>
      </div>
    );
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
                name="username"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>연락처</FormLabel>
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

export default ProfilePage;
