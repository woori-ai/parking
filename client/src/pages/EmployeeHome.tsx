import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Car, User, Calendar, FileText, HelpCircle } from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { ParkingRecord, VisitorReservation, Employee } from "@/types";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const EmployeeHome = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch employee details
  const { data: employeeData } = useQuery<Employee>({
    queryKey: [`/api/employees/${user?.id}`],
    enabled: !!user,
  });

  // Fetch employee's vehicle parking status
  const { data: vehicleData } = useQuery<ParkingRecord[]>({
    queryKey: ['/api/parking/search', employeeData?.carNumber],
    enabled: !!employeeData?.carNumber,
  });

  // Get current date for upcoming reservations
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  // Fetch employee's visitor reservations
  const { data: visitorReservations } = useQuery<VisitorReservation[]>({
    queryKey: ['/api/visitor-reservations'],
    enabled: !!user,
  });

  // Filter upcoming reservations
  const upcomingReservations = visitorReservations?.filter(
    (reservation) => reservation.visitDate >= currentDate
  ).slice(0, 3);

  // Check if employee's car is currently parked
  const isCarParked = vehicleData?.some(
    record => record.inDate && record.inTime && !record.outDate && !record.outTime
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">안녕하세요, {employeeData?.username || user?.username}님!</h1>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parking Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>주차 상태</CardTitle>
            <CardDescription>내 차량의 현재 주차 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCarParked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Car className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">상태:</span>
                  <span className={`font-medium ${isCarParked ? 'text-green-600' : 'text-gray-500'}`}>
                    {isCarParked ? '주차 중' : '미주차'}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  차량번호: {employeeData?.carNumber || '등록된 차량이 없습니다'}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
              차량 정보 관리
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Reservations Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>예정된 방문</CardTitle>
            <CardDescription>다가오는 방문 예약</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReservations && upcomingReservations.length > 0 ? (
              <div className="space-y-2">
                {upcomingReservations.map((reservation, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{reservation.visitorName}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(reservation.visitDate), 'yyyy년 MM월 dd일', { locale: ko })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">예정된 방문이 없습니다.</div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/visitor-registration')}>
              방문 등록하기
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>바로가기</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/visitor-registration')}>
              <Car className="mr-2 h-4 w-4" />
              방문차량 등록
            </Button>
            <Button onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              내 정보 관리
            </Button>
            <Button onClick={() => navigate('/board/employee/' + user?.username)}>
              <FileText className="mr-2 h-4 w-4" />
              게시판
            </Button>
            <Button onClick={() => navigate('/help')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              도움말
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeHome;
