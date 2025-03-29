import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Employee, FormMode } from "@/types";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

// Form validation schema
const employeeFormSchema = z.object({
  // 필수 필드
  username: z.string().min(2, "아이디는 최소 2자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  phone: z.string().min(8, "연락처를 입력해주세요"),
  carNumber: z.string().min(4, "차량번호는 최소 4자 이상 입력해주세요"),
  
  // 선택 필드
  email: z.string().email("유효한 이메일 주소를 입력해주세요").optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  
  isAdmin: z.boolean().default(false),
});

// Form schema for edit mode (password optional)
const employeeEditFormSchema = employeeFormSchema.extend({
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").optional().or(z.literal("")),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  mode: FormMode;
  initialData?: Employee | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EmployeeForm = ({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: EmployeeFormProps) => {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';

  // Prepare initial form values
  const defaultValues: Partial<EmployeeFormValues> = {
    username: initialData?.username || "",
    password: "", // Don't populate password for security
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    carNumber: initialData?.carNumber || "",
    position: initialData?.position || "",
    isAdmin: initialData?.isAdmin || false,
  };

  // Use appropriate schema based on mode
  const schema = mode === 'create' ? employeeFormSchema : employeeEditFormSchema;

  // Initialize form
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormValues) => {
      return apiRequest('POST', '/api/employees', data);
    },
    onSuccess: () => {
      toast({
        title: "사원 등록 완료",
        description: "새로운 사원이 등록되었습니다.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "사원 등록 실패",
        description: "사원 등록 중 오류가 발생했습니다.",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<EmployeeFormValues> }) => {
      return apiRequest('PUT', `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "사원 정보 수정 완료",
        description: "사원 정보가 수정되었습니다.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "사원 정보 수정 실패",
        description: "사원 정보 수정 중 오류가 발생했습니다.",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: EmployeeFormValues) => {
    if (mode === 'create') {
      createMutation.mutate(values);
    } else if (initialData) {
      // If password is empty in edit mode, remove it from the data
      const updateData = { ...values };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      updateMutation.mutate({
        id: initialData.id,
        data: updateData,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">아이디</FormLabel>
              <FormControl>
                <Input 
                  placeholder="아이디 입력" 
                  {...field} 
                  disabled={mode === 'edit'} 
                />
              </FormControl>
              {mode === 'edit' && (
                <FormDescription>아이디는 변경할 수 없습니다.</FormDescription>
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
              <FormLabel className={mode === 'create' ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
                {mode === 'create' ? '비밀번호' : '새 비밀번호 (변경 시에만 입력)'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={mode === 'create' ? '비밀번호 입력' : '새 비밀번호 입력'} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input placeholder="이메일 입력" {...field} />
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
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">연락처</FormLabel>
                <FormControl>
                  <Input placeholder="연락처 입력" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">차량번호</FormLabel>
                <FormControl>
                  <Input placeholder="차량번호 입력" {...field} />
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
                  <Input placeholder="직책 입력" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(isSuperAdmin || user?.role === 'admin') && (
          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>관리자 권한</FormLabel>
                  <FormDescription>
                    이 사용자에게 관리자 권한을 부여합니다.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            취소
          </Button>
          <Button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "저장 중..."
              : mode === 'create' ? "등록" : "수정"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeForm;
