import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RegistrationRequest } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect } from "react";

const RegistrationRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch registration requests
  const { 
    data: requests, 
    isLoading,
    isFetching,
    isError,
    error,
    refetch 
  } = useQuery<RegistrationRequest[]>({
    queryKey: ['/api/registration-requests'],
    queryFn: async () => {
      console.log('사원 가입 신청 데이터 요청 시작');
      const res = await fetch('/api/registration-requests', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('사원 가입 신청 데이터 요청 완료:', data);
      return data;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000
  });

  // 페이지 접근 시 데이터 갱신
  useEffect(() => {
    refetch();
  }, [refetch]);

  // 디버그 로깅 및 오류 처리
  useEffect(() => {
    console.log("Registration Requests Query State:", {
      isLoading,
      isFetching,
      isError,
      error,
      requestsLoaded: requests ? requests.length : 0
    });

    if (isError) {
      console.error('사원 가입 신청 데이터 로딩 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로딩 실패",
        description: "사원 가입 신청 데이터를 불러오지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [isLoading, isFetching, isError, error, requests, toast]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    refetch();
    toast({
      title: "새로고침 완료",
      description: "가입 신청 목록을 갱신했습니다.",
    });
  };

  // Approve registration request mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('POST', `/api/registration-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "가입 신청 승인 완료",
        description: "사원으로 등록되었습니다.",
      });
      // 승인 후 즉시 목록 갱신
      refetch();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "가입 신청 승인 실패",
        description: "가입 신청 승인 중 오류가 발생했습니다.",
      });
    },
  });

  // Reject registration request mutation
  const rejectMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/registration-requests/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registration-requests'] });
      toast({
        title: "가입 신청 거부 완료",
        description: "가입 신청이 거부되었습니다.",
      });
      // 거부 후 즉시 목록 갱신
      refetch();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "가입 신청 거부 실패",
        description: "가입 신청 거부 중 오류가 발생했습니다.",
      });
    },
  });

  // Handle approving a registration request
  const handleApprove = (id: number) => {
    if (window.confirm("이 가입 신청을 승인하시겠습니까?")) {
      approveMutation.mutate(id);
    }
  };

  // Handle rejecting a registration request
  const handleReject = (id: number) => {
    if (window.confirm("이 가입 신청을 거부하시겠습니까?")) {
      rejectMutation.mutate(id);
    }
  };

  // Format date for display
  const formatRequestDate = (date: Date | null) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "날짜 정보 없음";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle>사원 가입 신청</CardTitle>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {requests && requests.length > 0 && (
                <Badge variant="secondary">
                  처리 대기 {requests.length}건
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                새로고침
              </Button>
            </div>
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
                onClick={() => refetch()}
              >
                다시 시도
              </button>
            </div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              처리 대기 중인 가입 신청이 없습니다.
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
                    <TableHead>신청일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.username}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.phone}</TableCell>
                      <TableCell>{request.carNumber}</TableCell>
                      <TableCell>{request.position}</TableCell>
                      <TableCell>{formatRequestDate(request.requestDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            거부
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
    </div>
  );
};

export default RegistrationRequests;
