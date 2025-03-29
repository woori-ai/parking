import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VehicleSearchResult } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ParkingTableProps {
  vehicles: VehicleSearchResult[];
  onEntryClick: (vehicle: VehicleSearchResult) => void;
  onExitClick: (vehicle: VehicleSearchResult) => void;
  isLoading?: boolean;
  isSearchResult?: boolean;
}

const ParkingTable = ({
  vehicles,
  onEntryClick,
  onExitClick,
  isLoading = false,
  isSearchResult = false,
}: ParkingTableProps) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {isSearchResult 
          ? "검색 결과가 없습니다. 다른 검색어를 시도해보세요."
          : "현재 주차된 차량이 없습니다."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>차량번호</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>소유자</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>{isSearchResult ? "입/출차 시간" : "입차 시간"}</TableHead>
            {!isSearchResult && <TableHead>주차 시간</TableHead>}
            <TableHead className="text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            // Calculate parking duration if vehicle is parked
            let parkingDuration = "";
            if (vehicle.status === "parked" && vehicle.timestamp) {
              const entryTime = new Date(vehicle.timestamp);
              const now = new Date();
              const diffMs = now.getTime() - entryTime.getTime();
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              parkingDuration = `${diffHrs}시간 ${diffMins}분`;
            }

            return (
              <TableRow 
                key={vehicle.id} 
                className={vehicle.isUnregistered ? "bg-amber-50" : ""}
              >
                <TableCell className="font-medium">
                  {vehicle.carNumber}
                  {vehicle.isUnregistered && (
                    <span className="ml-2 text-xs text-amber-600 font-normal bg-amber-100 px-1.5 py-0.5 rounded">미등록</span>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle.type === "employee" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      사원
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                      방문
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle.isUnregistered 
                    ? <span className="text-amber-600">{vehicle.owner}</span> 
                    : vehicle.type === "visitor" 
                      ? <span className="text-purple-600">{vehicle.owner}</span>
                      : vehicle.owner
                  }
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={vehicle.status === "parked" ? "default" : "secondary"}
                    className={
                      vehicle.isUnregistered
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        : vehicle.status === "parked" 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {vehicle.status === "parked" ? "입차됨" : "미입차"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {vehicle.timestamp ? (
                    vehicle.timestamp
                  ) : (
                    vehicle.type === "visitor" && !vehicle.isUnregistered ? (
                      <div>
                        <span className="text-purple-600">방문 예약</span>
                        {vehicle.visitPurpose && (
                          <div className="text-xs text-gray-500 mt-1">
                            목적: {vehicle.visitPurpose}
                          </div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )
                  )}
                </TableCell>
                {!isSearchResult && (
                  <TableCell className="text-sm text-gray-500">
                    {parkingDuration || "-"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {vehicle.status === "parked" ? (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => onExitClick(vehicle)}
                    >
                      출차
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => onEntryClick(vehicle)}
                      className={vehicle.isUnregistered ? "bg-amber-500 hover:bg-amber-600" : ""}
                    >
                      {vehicle.isUnregistered ? "입차 등록" : "입차"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ParkingTable;
