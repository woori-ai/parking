import { ChatMessage } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatMessageProps {
  message: ChatMessage;
  isMine: boolean;
}

const ChatMessageComponent = ({ message, isMine }: ChatMessageProps) => {
  // Format timestamp
  const formattedTime = format(new Date(message.timestamp), 'a h:mm', { locale: ko });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isMine ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isMine
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <div
          className={`text-xs text-muted-foreground mt-1 ${
            isMine ? "text-right" : "text-left"
          }`}
        >
          {formattedTime}
          {isMine && (
            <span className="ml-1">
              {message.isRead ? "읽음" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
