import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { User } from "@db/schema";

interface UserWithMatch extends User {
  matchPercentage?: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMatch | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isLoggedIn,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithMatch[]>({
    queryKey: ["/api/users"],
    enabled: isLoggedIn,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
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

  if (!isLoggedIn) {
    return <AuthForm onLogin={loginMutation.mutate} onRegister={registerMutation.mutate} />;
  }

  if (userLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-8">
        {currentUser && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
              <ProfileForm user={currentUser} onSubmit={updateProfileMutation.mutate} />
            </CardContent>
          </Card>
        )}

        {selectedUser ? (
          <UserProfile user={selectedUser} onClose={() => setSelectedUser(null)} />
        ) : (
          <UserList users={users} onSelect={setSelectedUser} />
        )}
      </div>
    </div>
  );
}

function AuthForm({ onLogin, onRegister }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">{isLogin ? "Login" : "Register"}</h1>
          <form onSubmit={handleSubmit(isLogin ? onLogin : onRegister)} className="space-y-4">
            <div>
              <Input 
                placeholder="Username" 
                {...register("username", { required: "Username is required" })} 
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message as string}</p>
              )}
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Password" 
                {...register("password", { required: "Password is required" })} 
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
              )}
            </div>
            {!isLogin && (
              <>
                <div>
                  <Input 
                    placeholder="Name" 
                    {...register("name", { required: "Name is required" })} 
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
                  )}
                </div>
                <div>
                  <Input 
                    type="number" 
                    placeholder="Age" 
                    {...register("age", { 
                      required: "Age is required",
                      min: { value: 18, message: "Must be 18 or older" }
                    })} 
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500 mt-1">{errors.age.message as string}</p>
                  )}
                </div>
                <div>
                  <Input 
                    placeholder="Location" 
                    {...register("location", { required: "Location is required" })} 
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500 mt-1">{errors.location.message as string}</p>
                  )}
                </div>
                <div>
                  <Input 
                    placeholder="Gender" 
                    {...register("gender", { required: "Gender is required" })} 
                  />
                  {errors.gender && (
                    <p className="text-sm text-red-500 mt-1">{errors.gender.message as string}</p>
                  )}
                </div>
              </>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>
          <Button
            variant="link"
            className="mt-4"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account?" : "Already have an account?"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileForm({ user, onSubmit }: { user: User; onSubmit: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: user });
  const [photoPreview, setPhotoPreview] = useState(user.photoUrl);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <img src={photoPreview} alt={user.name} />
        </Avatar>
        <div>
          <input type="file" onChange={handlePhotoChange} />
          <Input 
            type="url" 
            placeholder="Photo URL" 
            {...register("photoUrl")}
            onChange={(e) => setPhotoPreview(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">Enter a URL for your profile photo or upload a new one.</p>
        </div>
      </div>
      <div>
        <Input placeholder="Name" {...register("name", { required: "Name is required" })} />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
        )}
      </div>
      <div>
        <Input 
          type="number" 
          placeholder="Age" 
          {...register("age", { 
            required: "Age is required",
            min: { value: 18, message: "Must be 18 or older" }
          })} 
        />
        {errors.age && (
          <p className="text-sm text-red-500 mt-1">{errors.age.message as string}</p>
        )}
      </div>
      <div>
        <Input 
          placeholder="Location" 
          {...register("location", { required: "Location is required" })} 
        />
        {errors.location && (
          <p className="text-sm text-red-500 mt-1">{errors.location.message as string}</p>
        )}
      </div>
      <div>
        <Input placeholder="Gender" {...register("gender", { required: "Gender is required" })} />
        {errors.gender && (
          <p className="text-sm text-red-500 mt-1">{errors.gender.message as string}</p>
        )}
      </div>
      <div>
        <Input placeholder="Social IDs" {...register("socialIds")} />
        <p className="text-sm text-gray-500 mt-1">Add your social media handles (comma-separated)</p>
      </div>
      <div>
        <Textarea 
          placeholder="Public Description" 
          {...register("publicDescription")} 
          className="h-24"
        />
        <p className="text-sm text-gray-500 mt-1">This will be visible to other users</p>
      </div>
      <div>
        <Textarea 
          placeholder="Private Description" 
          {...register("privateDescription")} 
          className="h-24"
        />
        <p className="text-sm text-gray-500 mt-1">This is just for you</p>
      </div>
      <Button type="submit">Update Profile</Button>
    </form>
  );
}

function UserList({ users, onSelect }: { users: UserWithMatch[]; onSelect: (user: UserWithMatch) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Suggested Matches</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card 
            key={user.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => onSelect(user)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <img src={user.photoUrl} alt={user.name} />
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold">{user.name}</h3>
                  <p className="text-sm text-gray-500">
                    {user.age} • {user.gender} • {user.location}
                  </p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                      {user.matchPercentage}% Match
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UserProfile({ user, onClose }: { user: UserWithMatch; onClose: () => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <img src={user.photoUrl} alt={user.name} />
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-500">
                {user.age} • {user.gender} • {user.location}
              </p>
              <span className="inline-block px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full mt-2">
                {user.matchPercentage}% Match
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">About</h3>
            <p className="text-gray-700">{user.publicDescription}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Social</h3>
            <p className="text-gray-700">{user.socialIds}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default App;