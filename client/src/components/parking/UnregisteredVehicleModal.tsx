import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface UnregisteredVehicleModalProps {
  carNumber: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const UnregisteredVehicleModal = ({
  carNumber,
  onClose,
  onConfirm,
  isPending,
}: UnregisteredVehicleModalProps) => {
  // Format current time for display
  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd');
  const formattedTime = format(now, 'HH:mm');
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            미등록 차량 확인
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-gray-800 mb-2">
            <span className="font-medium">차량번호:</span> {carNumber}
          </p>
          <p className="text-gray-800 font-medium text-amber-600">
            미등록 차량입니다. 주차 차량으로 등록할까요?
          </p>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-800">
            <span className="font-medium">입차 시간:</span> {formattedDate} {formattedTime}
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button 
            variant="default" 
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : '입차 등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnregisteredVehicleModal;