import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { LoginDialog } from "@/components/ui/login-dialog";

interface Profile {
  id: number;
  username: string;
  matchPercentage?: number;
  // Add other profile fields as needed
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Fetch profiles based on authentication state
  const { data: profiles } = useQuery<Profile[]>({
    queryKey: [user ? '/api/suggested-matches' : '/api/random-profiles'],
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">Professional Network</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <>
                <Avatar 
                  className="cursor-pointer"
                  onClick={() => setLocation("/profile")}
                >
                  <User className="h-5 w-5" />
                </Avatar>
                <Button variant="ghost" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowLoginDialog(true)}>
                  Login
                </Button>
                <Button onClick={() => setLocation("/register")}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto pt-24 pb-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Find Your Professional Match</h2>
            <p className="text-muted-foreground">
              Connect with professionals who share your interests and goals
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-10 py-6"
              placeholder="Search professionals by skills, interests, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {profiles?.map((profile) => (
              <Card key={profile.id} className="cursor-pointer hover:bg-accent">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <User className="h-5 w-5" />
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{profile.username}</h3>
                      {profile.matchPercentage && user && (
                        <p className="text-sm text-muted-foreground">
                          {profile.matchPercentage}% Match
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}