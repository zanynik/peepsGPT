import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

interface OnlineStatusProps {
  isOnline?: boolean;
  lastSeen?: string;
  size?: "sm" | "md" | "lg";
}

export function OnlineStatus({ isOnline, lastSeen, size = "sm" }: OnlineStatusProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  if (isOnline) {
    return (
      <div className="flex items-center space-x-1">
        <Circle className={`${sizeClasses[size]} fill-green-500 text-green-500`} />
        <span className="text-xs text-green-600">Online</span>
      </div>
    );
  }

  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    let timeAgo = "";
    if (diffInMinutes < 1) {
      timeAgo = "Just now";
    } else if (diffInMinutes < 60) {
      timeAgo = `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      timeAgo = `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      timeAgo = `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    return (
      <div className="flex items-center space-x-1">
        <Circle className={`${sizeClasses[size]} fill-gray-400 text-gray-400`} />
        <span className="text-xs text-muted-foreground">Last seen {timeAgo}</span>
      </div>
    );
  }

  return null;
}