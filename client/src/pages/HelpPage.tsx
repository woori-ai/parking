import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash, Plus, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { JobHelp, FormMode } from "@/types";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const helpFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
});

type HelpFormValues = z.infer<typeof helpFormSchema>;

const HelpPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<JobHelp | null>(null);
  const [viewHelp, setViewHelp] = useState<JobHelp | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Fetch help entries
  const { data: helpEntries, isLoading } = useQuery<JobHelp[]>({
    queryKey: ['/api/job-help'],
  });

  // Create help entry mutation
  const createMutation = useMutation({
    mutationFn: (data: HelpFormValues) => {
      return apiRequest('POST', '/api/job-help', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-help'] });
      toast({
        title: "도움말 등록 완료",
        description: "도움말이 성공적으로 등록되었습니다.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "도움말 등록 실패",
        description: "도움말 등록 중 오류가 발생했습니다.",
      });
    },
  });

  // Update help entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: HelpFormValues }) => {
      return apiRequest('PUT', `/api/job-help/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-help'] });
      toast({
        title: "도움말 수정 완료",
        description: "도움말이 성공적으로 수정되었습니다.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "도움말 수정 실패",
        description: "도움말 수정 중 오류가 발생했습니다.",
      });
    },
  });

  // Delete help entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/job-help/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-help'] });
      toast({
        title: "도움말 삭제 완료",
        description: "도움말이 성공적으로 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "도움말 삭제 실패",
        description: "도움말 삭제 중 오류가 발생했습니다.",
      });
    },
  });

  // Setup form
  const form = useForm<HelpFormValues>({
    resolver: zodResolver(helpFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Handle opening the create form
  const handleAddNew = () => {
    form.reset({
      title: "",
      content: "",
    });
    setFormMode('create');
    setSelectedHelp(null);
    setIsDialogOpen(true);
  };

  // Handle opening the edit form
  const handleEdit = (help: JobHelp) => {
    form.reset({
      title: help.title,
      content: help.content,
    });
    setFormMode('edit');
    setSelectedHelp(help);
    setIsDialogOpen(true);
  };

  // Handle viewing a help entry
  const handleView = (help: JobHelp) => {
    setViewHelp(help);
    setIsViewDialogOpen(true);
  };

  // Handle deleting a help entry
  const handleDelete = (id: number) => {
    if (window.confirm("정말로 이 도움말을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle form submit
  const onSubmit = (data: HelpFormValues) => {
    if (formMode === 'create') {
      createMutation.mutate(data);
    } else if (selectedHelp) {
      updateMutation.mutate({
        id: selectedHelp.id,
        data,
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>업무 도움말</CardTitle>
              <CardDescription>주차관리 시스템 사용에 관한 도움말 및 가이드</CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={handleAddNew} className="whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> 도움말 추가
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : helpEntries?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 도움말이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>최종 수정일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {helpEntries?.map((help) => (
                    <TableRow key={help.id}>
                      <TableCell className="font-medium">
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-left justify-start font-medium"
                          onClick={() => handleView(help)}
                        >
                          {help.title}
                        </Button>
                      </TableCell>
                      <TableCell>{formatDate(help.createdAt)}</TableCell>
                      <TableCell>{formatDate(help.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(help)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(help)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(help.id)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
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

      {/* Edit/Create Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '도움말 추가' : '도움말 수정'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="도움말 제목 입력" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="도움말 내용 입력" 
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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

      {/* View Help Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {viewHelp?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="text-sm text-gray-500">
              <span>작성일: {viewHelp && formatDate(viewHelp.createdAt)}</span>
              <span className="mx-2">|</span>
              <span>최종 수정일: {viewHelp && formatDate(viewHelp.updatedAt)}</span>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{viewHelp?.content}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              닫기
            </Button>
            {isAdmin && viewHelp && (
              <Button variant="outline" onClick={() => {
                setIsViewDialogOpen(false);
                handleEdit(viewHelp);
              }}>
                수정
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpPage;
