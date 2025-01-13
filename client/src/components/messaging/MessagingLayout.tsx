import { useState } from "react";
import { ConversationSidebar } from "@/components/messaging/ConversationSidebar";
import { MessageThread } from "@/components/messaging/MessageThread";
import { Card } from "@/components/ui/card";
import { User } from "@db/schema";

export function MessagingLayout() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="h-screen flex">
      <Card className="flex-none w-80 h-full border-r">
        <ConversationSidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      </Card>
      <div className="flex-1 h-full">
        {selectedUser ? (
          <MessageThread user={selectedUser} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}