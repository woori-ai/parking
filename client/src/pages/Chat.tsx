import { useState, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/contexts/AuthContext";
import { Search } from "lucide-react";
import ChatUserList from "@/components/chat/ChatUserList";
import ChatInterface from "@/components/chat/ChatInterface";
import { ChatUserInfo } from "@/types";
import { ManagerWork, Employee } from "@shared/schema";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState<ChatUserInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch managers for chat
  const { data: managerWorks } = useQuery<ManagerWork[]>({
    queryKey: ['/api/manager-works'],
    enabled: !!user
  });

  // Fetch employees for admin view
  const { data: employeeData } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin')
  });

  // Prepare chat user lists based on role
  let chatUsers: ChatUserInfo[] = [];

  // Add parking managers to chat users (for both employee and admin/superadmin)
  if (managerWorks) {
    const parkingManagers = managerWorks.map((manager) => ({
      id: Number(manager.id),
      username: manager.employeeId,
      role: '주차 담당자',
      isOnline: !!manager.isWorking
    }));
    chatUsers = [...chatUsers, ...parkingManagers];
  }

  // Add employees to chat users (for admin/superadmin only)
  if (employeeData && (user?.role === 'admin' || user?.role === 'superadmin')) {
    const employeeUsers = employeeData.map((employee) => ({
      id: employee.id,
      username: employee.username,
      role: '사원'
    }));
    chatUsers = [...chatUsers, ...employeeUsers];
  }

  // Filter by search query
  const filteredUsers = chatUsers.filter((chatUser) => 
    chatUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (selectedUser && user) {
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: ['/api/chat/unread/count'] });
    }
  }, [selectedUser, user, queryClient]);

  // Handle clicking on a user
  const handleUserSelect = (chatUser: ChatUserInfo) => {
    setSelectedUser(chatUser);
  };

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex">
          <div className="w-full md:w-64 border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="사용자 검색"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatUserList
                users={filteredUsers}
                selectedUserId={selectedUser?.id}
                onUserSelect={handleUserSelect}
              />
            </div>
          </div>
          
          <div className="flex flex-1 flex-col h-full">
            {selectedUser ? (
              <ChatInterface
                receiver={selectedUser}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                왼쪽에서 채팅할 사용자를 선택하세요
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile chat interface */}
      {selectedUser && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <ChatInterface
            receiver={selectedUser}
            onBack={() => setSelectedUser(null)}
            isMobile
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
