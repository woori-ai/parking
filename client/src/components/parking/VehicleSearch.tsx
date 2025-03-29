import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VehicleSearchResult, ParkingRecord, Employee, VisitorReservation } from "@/types";

interface VehicleSearchProps {
  onSearchResults: (results: VehicleSearchResult[]) => void;
}

const VehicleSearch = ({ onSearchResults }: VehicleSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showUnregisteredWarning, setShowUnregisteredWarning] = useState(false);
  const { toast } = useToast();
  
  // Get today's date for visitor reservations
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all visitor reservations instead of just today's
  const { data: visitorReservations, isLoading: isLoadingVisitors } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations'],
    retry: 3,
    staleTime: 60000, // 1분 동안 최신 상태 유지
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/visitor-reservations`);
      const data = await response.json();
      console.log("All visitor reservations:", data);
      return data;
    },
  });
  
  // Search vehicles mutation
  const searchMutation = useMutation({
    mutationFn: async (carNumber: string) => {
      // First search for parking records
      const recordsRes = await apiRequest('GET', `/api/parking/search?carNumber=${carNumber}`, null);
      const parkingRecords: ParkingRecord[] = await recordsRes.json();
      console.log("Parking search results:", parkingRecords);
      
      // Then check if there are any employees with this car number
      const employeesRes = await apiRequest('GET', `/api/employees`, null);
      const employees: Employee[] = await employeesRes.json();
      console.log("Employees:", employees);
      const matchingEmployees = employees.filter(emp => 
        emp.carNumber.toLowerCase().includes(carNumber.toLowerCase())
      );
      console.log("Matching employees:", matchingEmployees);
      
      return { parkingRecords, matchingEmployees };
    },
    onSuccess: (data) => {
      // Process results to a unified format
      const results: VehicleSearchResult[] = [];
      
      // Process parking records
      data.parkingRecords.forEach(record => {
        // Find matching employee
        const matchingEmployee = data.matchingEmployees.find(
          emp => emp.carNumber === record.carNumber
        );
        
        results.push({
          id: record.id,
          carNumber: record.carNumber,
          type: matchingEmployee ? 'employee' : 'visitor',
          owner: matchingEmployee ? matchingEmployee.username : '방문자',
          status: record.entryTimestamp && !record.exitTimestamp ? 'parked' : 'not_parked',
          timestamp: record.entryTimestamp ? 
            `${record.inDate} ${record.inTime}` : 
            null,
          parkingRecordId: record.id
        });
      });
      
      // Add employees that don't have parking records
      data.matchingEmployees.forEach(employee => {
        const alreadyAdded = results.some(r => r.carNumber === employee.carNumber);
        
        if (!alreadyAdded) {
          results.push({
            id: employee.id,
            carNumber: employee.carNumber,
            type: 'employee',
            owner: employee.username,
            status: 'not_parked',
            timestamp: null
          });
        }
      });
      
      // Check for visitor reservations with this car number
      if (visitorReservations) {
        // 숫자만 추출하여 포함 관계를 비교합니다
        const searchTermNumbers = searchTerm.replace(/[^0-9]/g, '');
        
        const matchingVisitors = visitorReservations.filter(visitor => {
          // 차량번호에서 숫자만 추출
          const visitorNumbers = visitor.carNumber.replace(/[^0-9]/g, '');
          
          // 1. 차량번호에 검색어가 포함되어 있는지 확인 (원본 문자열)
          // 2. 또는 숫자만 비교했을 때 일치하는지 확인
          return visitor.carNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 visitorNumbers.includes(searchTermNumbers) ||
                 searchTermNumbers.includes(visitorNumbers);
        });
        
        console.log("Search term:", searchTerm);
        console.log("Available visitor reservations:", visitorReservations);
        console.log("Matching visitor reservations:", matchingVisitors);
        
        matchingVisitors.forEach(visitor => {
          const alreadyAdded = results.some(r => r.carNumber === visitor.carNumber);
          
          if (!alreadyAdded) {
            results.push({
              id: visitor.id,
              carNumber: visitor.carNumber,
              type: 'visitor',
              owner: visitor.visitorName || '방문 예약자',
              status: 'not_parked',
              timestamp: null,
              visitPurpose: visitor.visitPurpose
            });
          }
        });
      }
      
      // Always show the unregistered vehicle option if the search term matches a valid car number format
      if (searchTerm.length >= 4 && !results.some(r => r.carNumber.toLowerCase() === searchTerm.toLowerCase())) {
        setShowUnregisteredWarning(true);
        
        // Add the unregistered vehicle as a search result
        results.push({
          id: -1, // Use a negative ID to indicate an unregistered vehicle
          carNumber: searchTerm,
          type: 'visitor',
          owner: '미등록 차량',
          status: 'not_parked',
          timestamp: null,
          isUnregistered: true
        });
      } else {
        setShowUnregisteredWarning(false);
      }
      
      onSearchResults(results);
      setIsSearching(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "검색 실패",
        description: "차량 검색 중 오류가 발생했습니다.",
      });
      setIsSearching(false);
    },
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm || searchTerm.length < 2) {
      toast({
        variant: "destructive",
        title: "검색어 오류",
        description: "차량번호는 최소 2자리 이상 입력해주세요.",
      });
      return;
    }
    
    setIsSearching(true);
    searchMutation.mutate(searchTerm);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>차량 검색</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="차량 번호 입력 (최소 2자리)"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "검색 중..." : "검색"}
          </Button>
        </form>
        
        {showUnregisteredWarning && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">미등록 차량</p>
              <p className="text-amber-700 text-sm">
                '{searchTerm}'는 등록되지 않은 차량입니다. 
                방문 차량으로 처리하려면 '입차' 버튼을 클릭하세요.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleSearch;
