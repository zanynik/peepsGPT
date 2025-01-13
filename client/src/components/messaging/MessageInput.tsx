import { useState } from "react";
import { useQueryClient, InvalidateQueryFilters } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  receiverId: number;
}

export function MessageInput({ receiverId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId,
          content: message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      setMessage("");
      // Fix the invalidation with proper typing
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/${receiverId}`]
      } as InvalidateQueryFilters);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="resize-none"
        rows={1}
      />
      <Button type="submit" size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}