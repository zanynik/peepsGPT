import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OnlineStatus } from "./OnlineStatus";
import { User } from "@db/schema";

interface ConversationSidebarProps {
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
}

interface UserWithLastMessage extends User {
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount?: number;
}

export function ConversationSidebar({ onSelectUser, selectedUser }: ConversationSidebarProps) {
  const { data: users } = useQuery<UserWithLastMessage[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {users?.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors ${
                selectedUser?.id === user.id ? "bg-accent" : ""
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <img src={user.photoUrl || ""} alt={user.name || ""} className="object-cover" />
                </Avatar>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{user.name}</p>
                  {user.unreadCount && user.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 px-2 py-1 text-xs">
                      {user.unreadCount}
                    </Badge>
                  )}
                </div>
                <OnlineStatus 
                  isOnline={user.isOnline || false} 
                  lastSeen={user.lastSeen || null}
                  size="sm"
                />
                {user.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {user.lastMessage.senderId === user.id ? "" : "You: "}
                    {user.lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
