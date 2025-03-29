import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VisitorReservation, FormMode } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// Form validation schema
const visitorFormSchema = z.object({
  carNumber: z.string().min(4, "차량번호는 최소 4자 이상 입력해주세요"),
  visitPurpose: z.string().min(1, "방문 목적을 입력해주세요"),
  visitDate: z.date({ required_error: "방문 날짜를 선택해주세요" }),
  visitorName: z.string().optional(),
  contactNumber: z.string().optional(),
  inDate: z.string().optional(),
  inTime: z.string().optional(),
  outDate: z.string().optional(),
  outTime: z.string().optional(),
});

type VisitorFormValues = z.infer<typeof visitorFormSchema>;

interface VisitorFormProps {
  mode: FormMode;
  initialData?: VisitorReservation | null;
  onSuccess: () => void;
  onCancel: () => void;
  defaultDate?: Date;
}

const VisitorForm = ({
  mode,
  initialData,
  onSuccess,
  onCancel,
  defaultDate = new Date(),
}: VisitorFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Prepare initial form values
  const defaultValues: Partial<VisitorFormValues> = {
    carNumber: initialData?.carNumber || "",
    visitPurpose: initialData?.visitPurpose || "",
    visitDate: initialData?.visitDate 
      ? new Date(initialData.visitDate) 
      : defaultDate,
    visitorName: initialData?.visitorName || "",
    contactNumber: initialData?.contactNumber || "",
    inDate: initialData?.inDate || "",
    inTime: initialData?.inTime || "",
    outDate: initialData?.outDate || "",
    outTime: initialData?.outTime || "",
  };

  // Initialize form
  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<VisitorReservation>) => {
      return apiRequest('POST', '/api/visitor-reservations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
      toast({
        title: "예약 등록 완료",
        description: "방문 차량 예약이 등록되었습니다.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "예약 등록 실패",
        description: "방문 차량 예약 등록 중 오류가 발생했습니다.",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<VisitorReservation> }) => {
      return apiRequest('PUT', `/api/visitor-reservations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
      toast({
        title: "예약 수정 완료",
        description: "방문 차량 예약이 수정되었습니다.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "예약 수정 실패",
        description: "방문 차량 예약 수정 중 오류가 발생했습니다.",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: VisitorFormValues) => {
    // Format date for API
    const formattedData = {
      ...values,
      visitDate: format(values.visitDate, 'yyyy-MM-dd'),
    };

    if (mode === 'create') {
      createMutation.mutate(formattedData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: formattedData,
      });
    }
  };

  // 로딩 상태 확인
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="carNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>차량 번호</FormLabel>
              <FormControl>
                <Input placeholder="예: 12가3456" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitPurpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>방문 목적</FormLabel>
              <FormControl>
                <Input placeholder="방문 목적 입력 (회의, 배송 등)" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>방문 날짜</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ko })
                      ) : (
                        <span>날짜를 선택하세요</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isLoading}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">추가 정보 (선택사항)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">방문자명 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="방문자 이름" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">연락처 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="000-0000-0000" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {mode === 'edit' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>입차 날짜 (선택)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>입차 시간 (선택)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="outDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>출차 날짜 (선택)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>출차 시간 (선택)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              )
              : mode === 'create' ? "등록" : "수정"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VisitorForm;
