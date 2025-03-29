import { ChatUserInfo } from "@/types";

interface ChatUserListProps {
  users: ChatUserInfo[];
  selectedUserId?: number;
  onUserSelect: (user: ChatUserInfo) => void;
}

const ChatUserList = ({ users, selectedUserId, onUserSelect }: ChatUserListProps) => {
  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        채팅 가능한 사용자가 없습니다.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {users.map((user) => (
        <div
          key={`${user.role}-${user.id}`}
          onClick={() => onUserSelect(user)}
          className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedUserId === user.id ? "bg-gray-50" : ""
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.username}</p>
              <p className="text-sm text-gray-500 truncate">
                <span className="font-medium">{user.role}</span>
                {user.isOnline !== undefined && (
                  <span className={`ml-2 ${user.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                    • {user.isOnline ? '온라인' : '오프라인'}
                  </span>
                )}
              </p>
            </div>
            {user.unreadCount && user.unreadCount > 0 && (
              <div className="inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-semibold text-white bg-red-500 rounded-full">
                {user.unreadCount}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatUserList;
