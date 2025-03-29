import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleSearchResult, ModalAction } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface EntryExitModalProps {
  vehicle: VehicleSearchResult;
  action: ModalAction;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const EntryExitModal = ({
  vehicle,
  action,
  onClose,
  onConfirm,
  isPending,
}: EntryExitModalProps) => {
  // Format current time for display
  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd');
  const formattedTime = format(now, 'HH:mm');
  
  // Calculate parking duration if vehicle is parked
  let parkingDuration = "";
  if (action === 'exit' && vehicle.timestamp) {
    const entryTime = new Date(vehicle.timestamp);
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    parkingDuration = `${diffHrs}시간 ${diffMins}분`;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'entry' ? '차량 입차 등록' : '차량 출차 처리'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">차량 정보</h3>
          <p className="text-gray-800">
            <span className="font-medium">차량번호:</span> {vehicle.carNumber}
          </p>
          <p className="text-gray-800">
            <span className="font-medium">유형:</span> {vehicle.type === 'employee' ? '사원' : '방문'}
          </p>
        </div>
        
        {action === 'entry' ? (
          <div className="mb-6">
            <p className="text-gray-800">
              <span className="font-medium">입차 시간:</span> {formattedDate} {formattedTime}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-800">
              <span className="font-medium">입차 시간:</span> {vehicle.timestamp}
            </p>
            <p className="text-gray-800">
              <span className="font-medium">출차 시간:</span> {formattedDate} {formattedTime}
            </p>
            <p className="text-gray-800">
              <span className="font-medium">총 주차 시간:</span> {parkingDuration}
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button 
            variant={action === 'entry' ? 'default' : 'destructive'} 
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? (action === 'entry' ? '처리 중...' : '처리 중...')
              : (action === 'entry' ? '입차 확인' : '출차 확인')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntryExitModal;
