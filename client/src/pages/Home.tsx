import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Send, HelpCircle } from "lucide-react";

interface User {
  id: number;
  username: string;
  // Add other user fields as needed
}

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const isAuthenticated = false; // TODO: Replace with actual auth state

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users/random"],
    enabled: !isAuthenticated,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav Bar */}
      <nav className="border-b">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Professional Network</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost">Log in</Button>
            <Button>Sign up</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-center mb-12">
          What kind of people do you want to connect with?
        </h2>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-12">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="E.g. Software engineers in San Francisco"
              className="pr-12 h-12 text-lg"
            />
            <Button 
              size="icon"
              className="absolute right-1 top-1 bottom-1"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="w-full max-w-2xl mb-12 flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm">Summarize text</Button>
          <Button variant="outline" size="sm">Help me write</Button>
          <Button variant="outline" size="sm">Get advice</Button>
          <Button variant="outline" size="sm">Brainstorm</Button>
          <Button variant="outline" size="sm">Analyze data</Button>
        </div>

        {/* User Cards Grid */}
        {users.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                        {user.username[0].toUpperCase()}
                      </div>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        Software Engineer • San Francisco
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}