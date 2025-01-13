import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { User, Message } from "@db/schema";

interface ConversationUser extends User {
  lastMessage: Message;
}

interface ConversationSidebarProps {
  onSelectUser?: (user: User) => void;
  selectedUser?: User | null;
}

export default function ConversationSidebar({ onSelectUser, selectedUser }: ConversationSidebarProps) {
  const { data: conversations } = useQuery<ConversationUser[]>({
    queryKey: ["/api/conversations"],
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {conversations?.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectUser?.(conversation)}
            className={`w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors ${
              selectedUser?.id === conversation.id ? "bg-accent" : ""
            }`}
          >
            <Avatar>
              <img src={conversation.photoUrl} alt={conversation.name} />
            </Avatar>
            <div className="flex-1 text-left">
              <p className="font-medium">{conversation.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage.content}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(conversation.lastMessage.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}