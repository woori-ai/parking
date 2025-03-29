import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ManagerWork, FormMode, Employee } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const managerFormSchema = z.object({
  // 주차 담당자 이름(텍스트로 직접 입력)
  employeeId: z.string().min(1, "담당자 이름을 입력해주세요"),
  // 비밀번호와 전화번호 추가
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  phone: z.string().min(1, "전화번호를 입력해주세요"),
  // 근무 상태, 날짜, 시간
  isWorking: z.boolean().optional().default(false),
  workCheck: z.boolean().optional().default(false),
  workDate: z.string().min(1, "근무 날짜를 입력해주세요"),
  workTime: z.string().min(1, "근무 시간을 입력해주세요"),
});

type ManagerFormValues = z.infer<typeof managerFormSchema>;

const ManagerManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerWork | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch manager works
  const { 
    data: managers, 
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery<ManagerWork[]>({
    queryKey: ['/api/manager-works'],
    queryFn: async () => {
      console.log('주차 담당자 데이터 요청 시작');
      const res = await fetch('/api/manager-works', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('주차 담당자 데이터 요청 완료:', data);
      return data;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000
  });
  
  // Fetch employees for name mapping
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      console.log('직원 데이터 요청 시작');
      const res = await fetch('/api/employees', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('직원 데이터 요청 완료:', data);
      return data;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000
  });
  
  // Function to find employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id.toString() === employeeId);
    return employee ? employee.username : employeeId;
  };

  // Add debug logging
  useEffect(() => {
    console.log("Manager List Query State:", {
      isLoading,
      isFetching,
      isError,
      error,
      managersLoaded: managers ? managers.length : 0
    });

    // Handle error in the same useEffect
    if (isError) {
      console.error('주차 담당자 데이터 로딩 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로딩 실패",
        description: "주차 담당자 데이터를 불러오지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [isLoading, isFetching, isError, error, managers, toast]);

  // Create manager work mutation
  const createMutation = useMutation({
    mutationFn: (data: ManagerFormValues) => {
      return apiRequest('POST', '/api/manager-works', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager-works'] });
      toast({
        title: "주차 담당자 등록 완료",
        description: "주차 담당자가 성공적으로 등록되었습니다.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "주차 담당자 등록 실패",
        description: "주차 담당자 등록 중 오류가 발생했습니다.",
      });
    },
  });

  // Update manager work mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ManagerFormValues> }) => {
      return apiRequest('PUT', `/api/manager-works/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager-works'] });
      toast({
        title: "주차 담당자 정보 수정 완료",
        description: "주차 담당자 정보가 성공적으로 수정되었습니다.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "주차 담당자 정보 수정 실패",
        description: "주차 담당자 정보 수정 중 오류가 발생했습니다.",
      });
    },
  });

  // Delete manager work mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/manager-works/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager-works'] });
      toast({
        title: "주차 담당자 삭제 완료",
        description: "주차 담당자가 성공적으로 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "주차 담당자 삭제 실패",
        description: "주차 담당자 삭제 중 오류가 발생했습니다.",
      });
    },
  });

  // Setup form
  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      employeeId: "",
      password: "",
      phone: "",
      isWorking: false,
      workCheck: false,
      workDate: new Date().toISOString().split('T')[0],
      workTime: "09:00",
    },
  });

  // Handle opening the create form
  const handleAddNew = () => {
    form.reset({
      employeeId: "",
      password: "",
      phone: "",
      isWorking: false,
      workCheck: false,
      workDate: new Date().toISOString().split('T')[0],
      workTime: "09:00",
    });
    setFormMode('create');
    setEditingManager(null);
    setIsDialogOpen(true);
  };

  // Handle opening the edit form
  const handleEdit = (manager: ManagerWork) => {
    form.reset({
      employeeId: manager.employeeId.toString(),
      password: manager.password || "",  // 비밀번호 필드 추가
      phone: manager.phone || "",        // 전화번호 필드 추가
      isWorking: !!manager.isWorking, // 강제 boolean 타입 변환
      workCheck: !!manager.workCheck, // 강제 boolean 타입 변환
      workDate: manager.workDate,
      workTime: manager.workTime,
    });
    setFormMode('edit');
    setEditingManager(manager);
    setIsDialogOpen(true);
  };

  // Handle toggling work status
  const handleToggleWorkStatus = (manager: ManagerWork) => {
    updateMutation.mutate({
      id: manager.id,
      data: { isWorking: manager.isWorking ? false : true },
    });
  };

  // Handle deleting a manager work
  const handleDelete = (id: number) => {
    if (window.confirm("정말로 이 주차 담당자를 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle form submit
  const onSubmit = (data: ManagerFormValues) => {
    if (formMode === 'create') {
      createMutation.mutate(data);
    } else if (editingManager) {
      updateMutation.mutate({
        id: editingManager.id,
        data: data,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>주차 담당자 관리</CardTitle>
            <Button onClick={handleAddNew} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> 주차 담당자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="text-center py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              <div>로딩 중...</div>
              <div className="text-xs text-gray-500 mt-1">
                isLoading: {isLoading ? 'true' : 'false'}, 
                isFetching: {isFetching ? 'true' : 'false'}
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <div className="text-lg font-medium">데이터를 불러오는 중 오류가 발생했습니다.</div>
              <div className="text-sm mt-2">{error instanceof Error ? error.message : '알 수 없는 오류'}</div>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/manager-works'] })}
              >
                다시 시도
              </button>
            </div>
          ) : managers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 주차 담당자가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>담당자 이름</TableHead>
                    <TableHead>근무일</TableHead>
                    <TableHead>근무시간</TableHead>
                    <TableHead>근무 상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers?.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell className="font-medium">{getEmployeeName(manager.employeeId)}</TableCell>
                      <TableCell>{manager.workDate}</TableCell>
                      <TableCell>{manager.workTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!!manager.isWorking}
                            onCheckedChange={() => handleToggleWorkStatus(manager)}
                          />
                          <span>{manager.isWorking ? "근무중" : "퇴근"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(manager)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(manager.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '주차 담당자 추가' : '주차 담당자 정보 수정'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당자 이름</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="주차 담당자 이름 입력" 
                        {...field}
                      />
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
                      <Input 
                        type="password" 
                        placeholder="비밀번호 입력" 
                        {...field}
                      />
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
                      <Input 
                        type="tel" 
                        placeholder="전화번호 입력 (예: 010-1234-5678)" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>근무일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>근무시간</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isWorking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>근무 상태</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked ? true : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workCheck"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>출퇴근 체크</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked ? true : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit">저장</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerManagement;
