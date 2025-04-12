import { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash, Plus, CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VisitorReservation, FormMode } from "@/types";
import { AuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import VisitorForm from "@/components/visitor/VisitorForm";

const VisitorRegistration = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<VisitorReservation | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [showAllReservations, setShowAllReservations] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useContext(AuthContext);

  // Format date string for API
  const formatDateForAPI = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Fetch visitor reservations for selected date
  const { data: allReservations, isLoading: isLoadingAll } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations'],
    enabled: !!user,
    staleTime: 0,
  });

  // Filter reservations for the selected date
  const reservationsForDate = allReservations?.filter(
    (reservation) => reservation.visitDate === formatDateForAPI(selectedDate)
  );

  // Delete visitor reservation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/visitor-reservations/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
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
    queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
  };

  // Get dates with reservations for the calendar
  const datesWithReservations = allReservations?.reduce<Record<string, number>>((acc, reservation) => {
    if (!acc[reservation.visitDate]) {
      acc[reservation.visitDate] = 0;
    }
    acc[reservation.visitDate]++;
    return acc;
  }, {});

  // Render reservation status tag
  const renderStatusTag = (reservation: VisitorReservation) => {
    const hasEntered = !!reservation.inDate && !!reservation.inTime;
    const hasExited = hasEntered && !!reservation.outDate && !!reservation.outTime;
    
    let status = "예약됨";
    if (hasEntered && !hasExited) status = "입차됨";
    if (hasExited) status = "출차됨";
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${
        status === "예약됨" 
          ? "bg-blue-100 text-blue-800" 
          : status === "입차됨" 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
      }`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>방문 차량 예약</CardTitle>
              <CardDescription>방문 차량의 주차 예약을 등록하고 관리하세요.</CardDescription>
            </div>
            <Button onClick={handleAddNew} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> 새 예약 추가
            </Button>
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
                      modifiers={{
                        booked: (date) => {
                          const formattedDate = format(date, 'yyyy-MM-dd');
                          return !!datesWithReservations?.[formattedDate];
                        },
                      }}
                      modifiersStyles={{
                        booked: {
                          backgroundColor: '#1976d21a',
                          borderRadius: '0',
                        },
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {isLoadingAll ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2 mx-auto"></div>
              <div>로딩 중...</div>
            </div>
          ) : (
            <>
              {/* Show different views based on the selected display option */}
              {showAllReservations ? (
                // All reservations view (similar to admin page)
                allReservations && allReservations.length > 0 ? (
                  <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>차량 번호</TableHead>
                          <TableHead>방문자명</TableHead>
                          <TableHead>방문 날짜</TableHead>
                          <TableHead>방문 목적</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allReservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">{reservation.carNumber}</TableCell>
                            <TableCell>{reservation.visitorName}</TableCell>
                            <TableCell>{reservation.visitDate}</TableCell>
                            <TableCell>{reservation.visitPurpose}</TableCell>
                            <TableCell>
                              {renderStatusTag(reservation)}
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    등록된 방문 예약이 없습니다.
                  </div>
                )
              ) : (
                // Date view (original calendar + daily reservations)
                <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                  <div className="md:col-span-3">
                    <div className="bg-white rounded-lg border p-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="w-full"
                        modifiers={{
                          booked: (date) => {
                            const formattedDate = format(date, 'yyyy-MM-dd');
                            return !!datesWithReservations?.[formattedDate];
                          },
                        }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: '#1976d21a',
                            borderRadius: '0',
                          },
                        }}
                      />
                    </div>
                    <div className="flex justify-center mt-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#1976d21a] rounded-sm"></div>
                        <span>예약 있음</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <div className="bg-white rounded-lg border p-4 h-full">
                      <h3 className="text-lg font-medium mb-4">
                        {format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })} 예약
                      </h3>

                      {!reservationsForDate || reservationsForDate.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          선택한 날짜에 예약된 방문 차량이 없습니다.
                        </div>
                      ) : (
                        <div className="overflow-x-auto overflow-y-auto max-h-[40vh]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>차량 번호</TableHead>
                                <TableHead>방문자명</TableHead>
                                <TableHead>방문 목적</TableHead>
                                <TableHead>예약 상태</TableHead>
                                <TableHead className="text-right">관리</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reservationsForDate.map((reservation) => (
                                <TableRow key={reservation.id}>
                                  <TableCell className="font-medium">{reservation.carNumber}</TableCell>
                                  <TableCell>{reservation.visitorName}</TableCell>
                                  <TableCell>{reservation.visitPurpose}</TableCell>
                                  <TableCell>
                                    {renderStatusTag(reservation)}
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
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[70vh] overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '방문 차량 예약 추가' : '방문 차량 예약 수정'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <VisitorForm 
              mode={formMode}
              initialData={editingReservation}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
              defaultDate={selectedDate}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorRegistration;
