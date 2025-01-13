import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "./MessageInput";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { User, Message } from "@db/schema";

interface MessageThreadProps {
  user: User;
}

export default function MessageThread({ user }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${user.id}`],
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-none p-4 border-b">
        <div className="flex items-center space-x-4">
          <Avatar>
            <img src={user.photoUrl} alt={user.name} />
          </Avatar>
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.location}</p>
          </div>
        </div>
      </Card>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user.id ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === user.id
                    ? "bg-accent"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex-none p-4 border-t">
        <MessageInput receiverId={user.id} />
      </div>
    </div>
  );
}