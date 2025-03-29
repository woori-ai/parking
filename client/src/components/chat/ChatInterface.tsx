import { useState, useEffect, useRef, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SendHorizonal, ArrowLeft, RefreshCcw } from "lucide-react";
import useChatMessages from "@/hooks/useChatMessages"; // Import our new hook
import { ChatUserInfo } from "@/types";
import { ChatMessage } from "@shared/schema";
import { AuthContext } from "@/contexts/AuthContext";
import ChatMessageComponent from "./ChatMessage";

interface ChatInterfaceProps {
  receiver: ChatUserInfo;
  onBack?: () => void;
  isMobile?: boolean;
}

const ChatInterface = ({
  receiver,
  onBack,
  isMobile = false,
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { fetchMessages, sendMessage } = useChatMessages();

  // Fetch chat history
  const loadMessages = async () => {
    if (!user || !receiver.id) return;
    
    setIsLoading(true);
    try {
      const messages = await fetchMessages(receiver.id);
      setChatMessages(messages);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "메시지 로드 실패",
        description: "메시지를 불러오는 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages on mount and when receiver changes
  useEffect(() => {
    if (user && receiver.id) {
      loadMessages();
    }
  }, [user, receiver.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Sort messages by timestamp, safely handling null timestamps
  const sortedMessages = [...(chatMessages || [])].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  // Send message function
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    try {
      setMessage("");
      const sentMessage = await sendMessage(receiver.id, message.trim());
      
      if (sentMessage) {
        // Add the new message to the local state
        setChatMessages(prev => [...prev, sentMessage]);
        // Invalidate unread count
        queryClient.invalidateQueries({ queryKey: ['/api/chat/unread/count'] });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "메시지 전송 실패",
        description: "메시지를 전송하는 중 오류가 발생했습니다.",
      });
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-2 flex items-center">
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h3 className="font-medium">{receiver.username}</h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{receiver.role}</span>
            {receiver.isOnline !== undefined && (
              <span className={`ml-2 ${receiver.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                • {receiver.isOnline ? '온라인' : '오프라인'}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadMessages}
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">로딩 중...</div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            대화 내역이 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          sortedMessages.map((msg) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              isMine={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? "전송 중..." : <SendHorizonal className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
