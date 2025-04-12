import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { CalendarIcon, Edit, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VisitorReservation, FormMode } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import VisitorForm from "@/components/visitor/VisitorForm";

const VisitorManagement = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<VisitorReservation | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Format date string for API
  const formatDateForAPI = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Fetch reservation data
  const { data: reservations, isLoading, isFetching, isError, error } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations'],
    queryFn: async () => {
      console.log('방문자 예약 데이터 요청 시작');
      const res = await fetch('/api/visitor-reservations', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('방문자 예약 데이터 요청 완료:', data);
      return data;
    },
    staleTime: 0,
    retry: 2,
    retryDelay: 1000
  });

  // Debug logging and error handling
  useEffect(() => {
    console.log("Visitor Reservation Query State:", {
      isLoading,
      isFetching,
      isError,
      error,
      reservationsLoaded: reservations ? reservations.length : 0
    });

    if (isError) {
      console.error('방문자 예약 데이터 로딩 실패:', error);
      toast({
        variant: "destructive",
        title: "데이터 로딩 실패",
        description: "방문자 예약 데이터를 불러오지 못했습니다. 다시 시도해주세요.",
      });
    }
  }, [isLoading, isFetching, isError, error, reservations, toast]);

  // Fetch visitor reservations for selected date
  const { data: dateReservations, isLoading: isLoadingDate, isError: isDateError, error: dateError } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations/date', formatDateForAPI(selectedDate)],
    queryFn: async () => {
      const formattedDate = formatDateForAPI(selectedDate);
      console.log(`날짜별(${formattedDate}) 방문자 예약 데이터 요청 시작`);
      const res = await fetch(`/api/visitor-reservations/date/${formattedDate}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log(`날짜별(${formattedDate}) 방문자 예약 데이터 요청 완료:`, data);
      return data;
    },
    staleTime: 0,
    enabled: !showAllReservations && !!selectedDate,
    retry: 2,
    retryDelay: 1000
  });

  // Delete visitor reservation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/visitor-reservations/${id}`, {});
    },
    onSuccess: () => {
      // 모든 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations/date', formatDateForAPI(selectedDate)] });
      toast({
        title: "예약 삭제 완료",
        description: "방문 차량 예약이 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "예약 삭제 실패",
        description: "예약 삭제 중 오류가 발생했습니다.",
      });
    },
  });

  // Handle opening the create form
  const handleAddNew = () => {
    setFormMode('create');
    setEditingReservation(null);
    setIsDialogOpen(true);
  };

  // Handle opening the edit form
  const handleEdit = (reservation: VisitorReservation) => {
    setFormMode('edit');
    setEditingReservation(reservation);
    setIsDialogOpen(true);
  };

  // Handle deleting a reservation
  const handleDelete = (id: number) => {
    if (window.confirm("정말로 이 예약을 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle form submit success
  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    // 모든 관련 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations/date', formatDateForAPI(selectedDate)] });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>방문 차량 예약 관리</CardTitle>
            <Button onClick={handleAddNew}>새 예약 추가</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium mb-1">표시 옵션</label>
              <div className="flex gap-2">
                <Button 
                  variant={!showAllReservations ? "default" : "outline"}
                  onClick={() => setShowAllReservations(false)}
                  className="w-28"
                >
                  날짜별 보기
                </Button>
                <Button 
                  variant={showAllReservations ? "default" : "outline"}
                  onClick={() => setShowAllReservations(true)}
                  className="w-28"
                >
                  전체 보기
                </Button>
              </div>
            </div>
            
            {!showAllReservations && (
              <div>
                <label className="block text-sm font-medium mb-1">날짜 선택</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP', { locale: ko })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* 로딩 상태 처리 */}
          {(showAllReservations ? isLoading || isFetching : isLoadingDate) ? (
            <div className="text-center py-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              <div>로딩 중...</div>
              <div className="text-xs text-gray-500 mt-1">
                isLoading: {(showAllReservations ? isLoading : isLoadingDate) ? 'true' : 'false'}, 
                isFetching: {isFetching ? 'true' : 'false'}
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500 flex flex-col items-center">
              <div className="text-lg font-medium">데이터를 불러오는 중 오류가 발생했습니다.</div>
              <div className="text-sm mt-2">{error instanceof Error ? error.message : '알 수 없는 오류'}</div>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] })}
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              {/* 선택된 모드에 따라 예약 데이터 표시 */}
              {showAllReservations ? (
                // 전체 예약 보기
                reservations && reservations.length > 0 ? (
                  <div className="overflow-x-auto scrollable-content">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>차량 번호</TableHead>
                          <TableHead>방문 날짜</TableHead>
                          <TableHead>방문 목적</TableHead>
                          <TableHead>방문자</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation: VisitorReservation) => {
                          const hasEntered = !!reservation.inDate && !!reservation.inTime;
                          const hasExited = hasEntered && !!reservation.outDate && !!reservation.outTime;
                          
                          let status = "예약됨";
                          if (hasEntered && !hasExited) status = "입차됨";
                          if (hasExited) status = "출차됨";
                          
                          return (
                            <TableRow key={reservation.id}>
                              <TableCell className="font-medium">{reservation.carNumber}</TableCell>
                              <TableCell>{reservation.visitDate}</TableCell>
                              <TableCell>{reservation.visitPurpose}</TableCell>
                              <TableCell>{reservation.visitorName || '미지정'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  status === "예약됨" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : status === "입차됨" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-gray-100 text-gray-800"
                                }`}>
                                  {status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(reservation)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(reservation.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    등록된 방문 예약이 없습니다.
                  </div>
                )
              ) : (
                // 선택된 날짜 예약 보기
                dateReservations && dateReservations.length > 0 ? (
                  <div className="overflow-x-auto scrollable-content">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>차량 번호</TableHead>
                          <TableHead>방문 목적</TableHead>
                          <TableHead>예상 입차</TableHead>
                          <TableHead>예상 출차</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateReservations.map((reservation: VisitorReservation) => {
                          const hasEntered = !!reservation.inDate && !!reservation.inTime;
                          const hasExited = hasEntered && !!reservation.outDate && !!reservation.outTime;
                          
                          let status = "예약됨";
                          if (hasEntered && !hasExited) status = "입차됨";
                          if (hasExited) status = "출차됨";
                          
                          return (
                            <TableRow key={reservation.id}>
                              <TableCell className="font-medium">{reservation.carNumber}</TableCell>
                              <TableCell>{reservation.visitPurpose}</TableCell>
                              <TableCell>
                                {reservation.inDate && reservation.inTime 
                                  ? `${reservation.inDate} ${reservation.inTime}` 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {reservation.outDate && reservation.outTime 
                                  ? `${reservation.outDate} ${reservation.outTime}` 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  status === "예약됨" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : status === "입차됨" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-gray-100 text-gray-800"
                                }`}>
                                  {status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(reservation)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(reservation.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    선택한 날짜에 예약된 방문 차량이 없습니다.
                  </div>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] scrollable-dialog">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '방문 차량 예약 추가' : '방문 차량 예약 수정'}
            </DialogTitle>
          </DialogHeader>
          <VisitorForm 
            mode={formMode}
            initialData={editingReservation}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
            defaultDate={selectedDate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorManagement;
