import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VehicleSearchResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
  // 각 차량의 상세 정보 표시 상태를 관리하기 위한 상태
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});

  // 상세 정보 토글 함수
  const toggleRowExpand = (vehicleId: number | string) => {
    setExpandedRows(prev => ({
      ...prev,
      [vehicleId.toString()]: !prev[vehicleId.toString()]
    }));
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
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

  // 모바일 화면에서 사용할 카드 형태의 뷰
  const renderMobileView = () => {
    return (
      <div className="grid grid-cols-1 gap-3 md:hidden">
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

          const isExpanded = expandedRows[vehicle.id.toString()] || false;

          return (
            <Card key={vehicle.id} className={vehicle.isUnregistered ? "bg-amber-50" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{vehicle.carNumber}</span>
                      {vehicle.isUnregistered && (
                        <span className="text-xs text-amber-600 font-normal bg-amber-100 px-1.5 py-0.5 rounded">미등록</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {vehicle.type === "employee" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          사원
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                          방문
                        </Badge>
                      )}
                      <span className={
                        vehicle.isUnregistered 
                          ? "text-amber-600" 
                          : vehicle.type === "visitor" 
                            ? "text-purple-600"
                            : ""
                      }>
                        {vehicle.owner}
                      </span>
                    </div>
                  </div>
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
                </div>

                <button 
                  onClick={() => toggleRowExpand(vehicle.id)}
                  className="flex items-center justify-between w-full py-1 text-sm text-gray-500 hover:bg-gray-50 rounded-md"
                >
                  <span className="text-left">상세 정보 {isExpanded ? '숨기기' : '보기'}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>{isSearchResult ? "입/출차 시간:" : "입차 시간:"}</span>
                      <span className="font-medium">
                        {vehicle.timestamp ? vehicle.timestamp : 
                          (vehicle.type === "visitor" && !vehicle.isUnregistered ? 
                            "방문 예약" : "-")}
                      </span>
                    </div>
                    
                    {!isSearchResult && vehicle.status === "parked" && (
                      <div className="flex justify-between">
                        <span>주차 시간:</span>
                        <span className="font-medium">{parkingDuration || "-"}</span>
                      </div>
                    )}
                    
                    {vehicle.visitPurpose && (
                      <div className="flex justify-between">
                        <span>방문 목적:</span>
                        <span className="font-medium">{vehicle.visitPurpose}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // 데스크톱 화면에서 사용할 테이블 형태의 뷰
  const renderDesktopView = () => {
    return (
      <div className="hidden md:block overflow-x-auto">
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

  return (
    <>
      {renderMobileView()}
      {renderDesktopView()}
    </>
  );
};

export default ParkingTable;
