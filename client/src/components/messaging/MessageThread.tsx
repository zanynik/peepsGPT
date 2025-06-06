import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "./MessageInput";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypingIndicator } from "./TypingIndicator";
import { OnlineStatus } from "./OnlineStatus";
import { Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react";
import { User, Message } from "@db/schema";

interface MessageThreadProps {
  user: User;
}

interface ExtendedMessage extends Message {
  readAt?: Date | null;
}

export function MessageThread({ user }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: messages } = useQuery<ExtendedMessage[]>({
    queryKey: [`/api/messages/${user.id}`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(
        m => m.senderId === user.id && !m.readAt
      );
      
      if (unreadMessages.length > 0) {
        fetch(`/api/messages/mark-read/${user.id}`, {
          method: 'POST',
          credentials: 'include'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        });
      }
    }
  }, [messages, user.id, queryClient]);

  const formatTime = (dateInput: string | Date | null) => {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isMessageRead = (message: ExtendedMessage) => {
    return message.senderId === currentUser?.id && message.readAt;
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-none p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <img src={user.photoUrl} alt={user.name} className="object-cover" />
              </Avatar>
              {user.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user.name || ''}</h2>
              <OnlineStatus 
                isOnline={user.isOnline || false} 
                lastSeen={user.lastSeen}
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message, index) => {
            const isFromUser = message.senderId === user.id;
            const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isFromUser ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex items-end space-x-2 max-w-[70%] ${
                  isFromUser ? "flex-row" : "flex-row-reverse space-x-reverse"
                }`}>
                  {showAvatar && isFromUser ? (
                    <Avatar className="w-8 h-8">
                      <img src={user.photoUrl || ''} alt={user.name || ''} className="object-cover" />
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isFromUser
                        ? "bg-accent text-accent-foreground rounded-bl-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content || ''}</p>
                    <div className={`flex items-center justify-between mt-1 text-xs opacity-70 ${
                      isFromUser ? "flex-row" : "flex-row-reverse"
                    }`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {!isFromUser && (
                        <div className="ml-2">
                          {isMessageRead(message) ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {isTyping && <TypingIndicator userName={user.name || 'User'} />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex-none p-4 border-t bg-background/50">
        <MessageInput receiverId={user.id} />
      </div>
    </div>
  );
}
