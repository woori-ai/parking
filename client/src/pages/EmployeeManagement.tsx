import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Trash, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Employee, FormMode } from "@/types";
import EmployeeForm from "@/components/employee/EmployeeForm";
import { Switch } from "@/components/ui/switch";

const EmployeeManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employees
  const { 
    data: employees, 
    isLoading, 
    isFetching, 
    isError, 
    error 
  } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      console.log('Employee 데이터 요청 시작');
      const res = await fetch('/api/employees', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Employee 데이터 요청 완료:', data);
      return data;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000
  });

  // Add debug logging
  useEffect(() => {
    console.log("Employee List Query State:", {
      isLoading,
      isFetching,
      isError,
      error,
      employeesLoaded: employees ? employees.length : 0
    });
  }, [isLoading, isFetching, isError, error, employees]);

  // Handle error
  useEffect(() => {
    if (isError) {
      console.error('사원 데이터 로딩 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로딩 실패",
        description: "사원 데이터를 불러오지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [isError, error, toast]);

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/employees/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "사원 삭제 완료",
        description: "사원이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "사원 삭제 실패",
        description: "사원 삭제 중 오류가 발생했습니다.",
      });
    },
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      return apiRequest('PUT', `/api/employees/${id}`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "권한 변경 완료",
        description: "관리자 권한이 변경되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "권한 변경 실패",
        description: "권한 변경 중 오류가 발생했습니다.",
      });
    },
  });

  // Handle opening the create form
  const handleAddNew = () => {
    setFormMode('create');
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  // Handle opening the edit form
  const handleEdit = (employee: Employee) => {
    setFormMode('edit');
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  // Handle toggling admin status
  const handleToggleAdmin = (employee: Employee) => {
    // 최고 관리자는 권한 변경 불가
    if (employee.username === "admin" || employee.username === "superadmin") {
      toast({
        variant: "destructive",
        title: "권한 변경 불가",
        description: "최고 관리자의 권한은 변경할 수 없습니다.",
      });
      return;
    }
    
    toggleAdminMutation.mutate({
      id: employee.id,
      isAdmin: !employee.isAdmin,
    });
  };

  // Handle deleting an employee
  const handleDelete = (id: number) => {
    if (window.confirm("정말로 이 사원을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle form submit success
  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
  };

  // Filter employees based on search query
  const filteredEmployees = employees?.filter(
    (employee) =>
      employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.carNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>사원 관리</CardTitle>
            <Button onClick={handleAddNew} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> 사원 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="이름, 이메일, 차량번호, 직책으로 검색"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/employees'] })}
              >
                다시 시도
              </button>
            </div>
          ) : filteredEmployees?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>아이디</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>차량번호</TableHead>
                    <TableHead>직책</TableHead>
                    <TableHead>관리자 권한</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.username}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.carNumber}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={employee.isAdmin === true}
                            onCheckedChange={() => handleToggleAdmin(employee)}
                            disabled={employee.username === "admin" || employee.username === "superadmin"}
                          />
                          <span>{employee.isAdmin ? '관리자' : '일반 사용자'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                            disabled={employee.username === "admin" || employee.username === "superadmin"}
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
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '사원 추가' : '사원 정보 수정'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            mode={formMode}
            initialData={editingEmployee}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
