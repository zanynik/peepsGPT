import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { User } from "@db/schema";

interface ConversationSidebarProps {
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
}

export function ConversationSidebar({ onSelectUser, selectedUser }: ConversationSidebarProps) {
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {users?.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors ${
              selectedUser?.id === user.id ? "bg-accent" : ""
            }`}
          >
            <Avatar>
              <img src={user.photoUrl} alt={user.name} />
            </Avatar>
            <div className="flex-1 text-left">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user.location}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
