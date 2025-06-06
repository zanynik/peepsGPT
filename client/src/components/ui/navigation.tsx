import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageCircle, 
  User, 
  Bell, 
  Search,
  LogOut 
} from "lucide-react";

interface NavigationProps {
  onLogout: () => void;
  unreadCount?: number;
}

export function Navigation({ onLogout, unreadCount = 0 }: NavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { 
      path: "/", 
      icon: Users, 
      label: "Discover",
      isActive: location === "/" 
    },
    { 
      path: "/messages", 
      icon: MessageCircle, 
      label: "Messages",
      isActive: location === "/messages",
      badge: unreadCount > 0 ? unreadCount : null
    },
    { 
      path: "/notifications", 
      icon: Bell, 
      label: "Notifications",
      isActive: location === "/notifications"
    },
    { 
      path: "/profile", 
      icon: User, 
      label: "Profile",
      isActive: location === "/profile"
    },
  ];

  return (
    <nav className="bg-background border-b px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-2 mr-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-lg">NetConnect</span>
          </div>
          
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button 
                variant={item.isActive ? "default" : "ghost"} 
                className="relative"
                size="sm"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}