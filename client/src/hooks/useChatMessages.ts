import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

// This hook provides message board functionality instead of real-time WebSocket
const useChatMessages = () => {
  const { user } = useContext(AuthContext);

  // Function to fetch messages between two users
  const fetchMessages = async (receiverId: number): Promise<ChatMessage[]> => {
    if (!user) return [];
    
    try {
      const response = await apiRequest(
        'GET',
        `/api/chat/${receiverId}`
      );
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  // Function to send a message
  const sendMessage = async (receiverId: number, message: string): Promise<ChatMessage | null> => {
    if (!user) return null;
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/chat',
        {
          senderId: user.id,
          receiverId,
          message
        }
      );
      
      const data = await response.json();
      return data && typeof data === 'object' ? data as ChatMessage : null;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  };

  // Function to get the count of unread messages
  const getUnreadCount = async (): Promise<number> => {
    if (!user) return 0;
    
    try {
      const response = await apiRequest(
        'GET',
        '/api/chat/unread/count'
      );
      
      const data = await response.json();
      return data && typeof data === 'object' && 'count' in data 
        ? (data as {count: number}).count 
        : 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  };

  return {
    fetchMessages,
    sendMessage,
    getUnreadCount
  };
};

export default useChatMessages;
