import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, Moon, MapPin, Calendar, User2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Notes } from "@/components/ui/note";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Filter, Loader2 } from "lucide-react";
import type { User, Gender } from "@db/schema";
import { ProfileForm } from "@/components/ProfileForm";
import { UserList } from "@/components/UserList";
import { UserProfile } from "@/components/UserProfile";

interface UserWithMatch extends User {
  matchPercentage?: number;
}

export function Profile() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Success", description: "Profile updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[350px,1fr]">
          {currentUser && (
            <aside>
              <ProfileForm
                user={currentUser}
                onSubmit={updateProfileMutation.mutate}
              />
            </aside>
          )}

          <main>
            {selectedUser ? (
              <UserProfile
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
              />
            ) : (
              <div className="space-y-6">
                <UserList onSelect={setSelectedUser} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}