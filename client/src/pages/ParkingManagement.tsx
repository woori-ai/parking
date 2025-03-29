import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VehicleSearch from "@/components/parking/VehicleSearch";
import ParkingTable from "@/components/parking/ParkingTable";
import EntryExitModal from "@/components/parking/EntryExitModal";
import UnregisteredVehicleModal from "@/components/parking/UnregisteredVehicleModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { ParkingRecord, VehicleSearchResult, ModalAction, VisitorReservation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ParkingManagement = () => {
  const [searchResults, setSearchResults] = useState<VehicleSearchResult[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSearchResult | null>(null);
  const [unregisteredVehicle, setUnregisteredVehicle] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch currently parked vehicles
  const { data: parkedVehicles, isLoading: isLoadingParkedVehicles } = useQuery<ParkingRecord[]>({
    queryKey: ['/api/parking/current'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parking/current');
      return response.json();
    },
  });

  // Fetch only today's visitor reservations
  const { data: visitorReservations, isLoading: isLoadingVisitors } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations/date', today],
    retry: 3,
    staleTime: 60000, // 1분 동안 최신 상태 유지
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/visitor-reservations/date/${today}`);
      const data = await response.json();
      console.log("Fetched today's visitor reservations:", data);
      return data;
    },
  });

  // Handle vehicle entry
  const entryMutation = useMutation({
    mutationFn: async (vehicle: { carNumber: string }) => {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const formattedTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);
      
      return apiRequest('POST', '/api/parking', {
        carNumber: vehicle.carNumber,
        inDate: formattedDate,
        inTime: formattedTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parking/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-reservations'] });
      
      toast({
        title: "차량 입차 처리 완료",
        description: `${selectedVehicle?.carNumber || unregisteredVehicle} 차량이 입차되었습니다.`,
      });
      setModalAction(null);
      setUnregisteredVehicle(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "입차 처리 실패",
        description: "차량 입차 처리 중 오류가 발생했습니다.",
      });
    }
  });

  // Handle vehicle exit
  const exitMutation = useMutation({
    mutationFn: async (vehicle: { id: number }) => {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const formattedTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);
      
      return apiRequest('PUT', `/api/parking/${vehicle.id}`, {
        outDate: formattedDate,
        outTime: formattedTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parking/current'] });
      toast({
        title: "차량 출차 처리 완료",
        description: `${selectedVehicle?.carNumber} 차량이 출차되었습니다.`,
      });
      setModalAction(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "출차 처리 실패",
        description: "차량 출차 처리 중 오류가 발생했습니다.",
      });
    }
  });

  // Handle vehicle search results
  const handleSearchResults = (results: VehicleSearchResult[]) => {
    setSearchResults(results);
  };

  // Handle opening the entry modal
  const handleEntryClick = (vehicle: VehicleSearchResult) => {
    if (vehicle.isUnregistered) {
      // Show unregistered vehicle modal instead
      setUnregisteredVehicle(vehicle.carNumber);
    } else {
      setSelectedVehicle(vehicle);
      setModalAction('entry');
    }
  };

  // Handle opening the exit modal
  const handleExitClick = (vehicle: VehicleSearchResult) => {
    setSelectedVehicle(vehicle);
    setModalAction('exit');
  };

  // Handle confirming entry
  const handleConfirmEntry = () => {
    if (selectedVehicle) {
      entryMutation.mutate({ carNumber: selectedVehicle.carNumber });
    }
  };

  // Handle confirming exit
  const handleConfirmExit = () => {
    if (selectedVehicle && selectedVehicle.parkingRecordId) {
      exitMutation.mutate({ id: selectedVehicle.parkingRecordId });
    }
  };

  // Format parked vehicles for the table
  const formatParkedVehiclesForTable = (): VehicleSearchResult[] => {
    if (!parkedVehicles) return [];

    return parkedVehicles.map(record => {
      // Try to find this vehicle in our visitor reservations
      const matchingVisitor = visitorReservations?.find(v => 
        v.carNumber.toLowerCase() === record.carNumber.toLowerCase()
      );
      
      // Use visitor info if found
      const isVisitor = !!matchingVisitor;
      const visitorName = matchingVisitor?.visitorName || '방문자';
      const visitPurpose = matchingVisitor?.visitPurpose || '';
      
      return {
        id: record.id,
        carNumber: record.carNumber,
        type: isVisitor ? 'visitor' : 'employee',
        owner: isVisitor ? (visitorName || '방문자') : '사원',
        status: 'parked',
        timestamp: record.inDate && record.inTime ? `${record.inDate} ${record.inTime}` : null,
        parkingRecordId: record.id,
        visitPurpose: visitPurpose
      };
    });
  };

  // Handle unregistered vehicle entry
  const handleUnregisteredVehicleEntry = () => {
    if (unregisteredVehicle) {
      entryMutation.mutate({ carNumber: unregisteredVehicle });
    }
  };

  // Check if vehicle is registered in the system (either as employee or visitor)
  const checkIfVehicleExists = (carNumber: string) => {
    // Check if this car number is in employees list
    const employeeExists = searchResults.some(vehicle => 
      vehicle.type === 'employee' && vehicle.carNumber.toLowerCase() === carNumber.toLowerCase()
    );
    
    // Check if this car number is in visitor reservations
    const visitorExists = visitorReservations?.some(reservation => 
      reservation.carNumber.toLowerCase() === carNumber.toLowerCase()
    );
    
    return employeeExists || visitorExists;
  };

  // Directly process entry for a car number
  const processDirect = (carNumber: string) => {
    if (checkIfVehicleExists(carNumber)) {
      // If vehicle is registered, handle as normal entry
      const matchingVehicle = searchResults.find(v => v.carNumber.toLowerCase() === carNumber.toLowerCase());
      if (matchingVehicle) {
        setSelectedVehicle(matchingVehicle);
        setModalAction('entry');
      }
    } else {
      // If vehicle is not registered, show unregistered vehicle modal
      setUnregisteredVehicle(carNumber);
    }
  };

  return (
    <div className="space-y-6">
      <VehicleSearch onSearchResults={handleSearchResults} />
      
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>차량 조회 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <ParkingTable 
              vehicles={searchResults}
              onEntryClick={handleEntryClick}
              onExitClick={handleExitClick}
              isSearchResult
            />
          </CardContent>
        </Card>
      )}
      
      {visitorReservations && visitorReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>당일 방문 예약 차량</CardTitle>
            <CardDescription>
              오늘({today}) 예약된 방문 차량 목록입니다. 예약된 차량의 입차 처리가 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>차량 번호</TableHead>
                    <TableHead>방문 날짜</TableHead>
                    <TableHead>방문 목적</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitorReservations.map(reservation => {
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
                        <TableCell>
                          <Badge 
                            className={`${
                              status === "예약됨" 
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                                : status === "입차됨" 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {status === "예약됨" && (
                            <Button 
                              onClick={() => processDirect(reservation.carNumber)}
                              size="sm"
                            >
                              입차
                            </Button>
                          )}
                          {status === "입차됨" && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const matchingVehicle = formatParkedVehiclesForTable().find(
                                  v => v.carNumber.toLowerCase() === reservation.carNumber.toLowerCase()
                                );
                                if (matchingVehicle) {
                                  setSelectedVehicle(matchingVehicle);
                                  setModalAction('exit');
                                }
                              }}
                            >
                              출차
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>현재 주차 현황</CardTitle>
          <div className="flex items-center text-sm space-x-2">
            <span className="text-gray-600">전체:</span>
            <span className="font-medium">150대</span>
            <span className="text-gray-600">현재:</span>
            <span className="font-medium text-primary">{parkedVehicles?.length || 0}대</span>
          </div>
        </CardHeader>
        <CardContent>
          <ParkingTable 
            vehicles={formatParkedVehiclesForTable()}
            onEntryClick={handleEntryClick}
            onExitClick={handleExitClick}
            isLoading={isLoadingParkedVehicles}
          />
        </CardContent>
      </Card>
      
      {modalAction && selectedVehicle && (
        <EntryExitModal
          vehicle={selectedVehicle}
          action={modalAction}
          onClose={() => setModalAction(null)}
          onConfirm={modalAction === 'entry' ? handleConfirmEntry : handleConfirmExit}
          isPending={modalAction === 'entry' ? entryMutation.isPending : exitMutation.isPending}
        />
      )}
      
      {unregisteredVehicle && (
        <UnregisteredVehicleModal
          carNumber={unregisteredVehicle}
          onClose={() => setUnregisteredVehicle(null)}
          onConfirm={handleUnregisteredVehicleEntry}
          isPending={entryMutation.isPending}
        />
      )}
    </div>
  );
};

export default ParkingManagement;
