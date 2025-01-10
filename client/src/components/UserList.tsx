import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { User } from "@db/schema";
import { Loader2 } from "lucide-react";

interface UserListProps {
  onSelect: (user: User) => void;
}

export function UserList({ onSelect }: UserListProps) {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card
          key={user.id}
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onSelect(user)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                  {user.username[0].toUpperCase()}
                </div>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-muted-foreground">Professional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
