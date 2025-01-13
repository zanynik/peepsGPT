import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, Moon, MapPin, Calendar, User2, Mail, Search, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define Gender type
type Gender = "Male" | "Female" | "Other";

// Define User type since it's not being imported correctly
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: Gender;
  location: string;
  photoUrl: string;
  publicDescription?: string;
  privateDescription?: string;
  socialIds?: string;
}

type UserWithMatch = User & {
  matchPercentage?: number;
};

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatUser extends User {
  lastMessage?: Message;
  unreadCount?: number;
}

interface UserProfileProps {
  user: UserWithMatch;
  onClose: () => void;
  isCurrentUser?: boolean;
  onUpdateProfile?: (data: User) => void;
  setIsLoggedIn: (value: boolean) => void;
  isLoggedIn: boolean;
  onStartChat: (userId: number) => void;
}

type AuthFormType = 'login' | 'register' | false;

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    // Check if user was previously logged in
    const wasLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (wasLoggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMatch | null>(null);
  const [showAuthForm, setShowAuthForm] = useState<AuthFormType>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState<number | null>(null);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isLoggedIn,
  });

  // Fetch users regardless of login state
  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithMatch[]>({
    queryKey: ["/api/users"],
  });

  const { data: chatUsers = [] } = useQuery<ChatUser[]>({
    queryKey: ["/api/messages/recent"],
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
      sessionStorage.setItem('isLoggedIn', 'true');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<User, 'id'>) => {
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
      sessionStorage.setItem('isLoggedIn', 'true');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: User) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Profile updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message });
    },
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    setSelectedUser(null); // Return to home screen
  };

  if (isLoggedIn && userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <header className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-primary">
                PeepsGPT
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect with like-minded people - Your Peeps!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                }}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              {isLoggedIn ? (
                <Button 
                  variant="default"
                  onClick={() => setSelectedUser({...currentUser, isCurrentUser: true} as UserWithMatch)}
                >
                  <Avatar className="h-6 w-6">
                    <img src={currentUser?.photoUrl} alt={currentUser?.name} />
                  </Avatar>
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    onClick={() => setShowAuthForm('login')}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAuthForm('register')}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </header>

          <main className="container mx-auto flex gap-6">
            {isLoggedIn && (
              <div className="w-80 border-r shrink-0">
                <ChatSidebar 
                  users={chatUsers}
                  activeChat={activeChat}
                  onSelectChat={setActiveChat}
                  currentUser={currentUser}
                />
              </div>
            )}
            <div className="flex-grow">
              {selectedUser ? (
                <UserProfile
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                  isCurrentUser={selectedUser.id === currentUser?.id}
                  onUpdateProfile={updateProfileMutation.mutate}
                  setIsLoggedIn={handleLogout}
                  isLoggedIn={isLoggedIn}
                  onStartChat={(userId) => setActiveChat(userId)}
                />
              ) : (
                <div className="matches-section space-y-6">
                  <UserList 
                    onSelect={setSelectedUser} 
                    users={users}
                    isLoggedIn={isLoggedIn}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-4">
                {showAuthForm === 'login' ? "Login" : "Register"}
              </h1>
              <AuthForm
                onLogin={loginMutation.mutate}
                onRegister={registerMutation.mutate}
                onClose={() => setShowAuthForm(false)}
                isLogin={showAuthForm === 'login'}
                setShowAuthForm={setShowAuthForm}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ChatSidebar({ users, activeChat, onSelectChat, currentUser }: { 
  users: ChatUser[];
  activeChat: number | null;
  onSelectChat: (userId: number) => void;
  currentUser?: User;
}) {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <span className="text-sm text-muted-foreground">
          {users.length} conversation{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ScrollArea className="h-full pr-4">
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectChat(user.id)}
              className={`w-full p-3 rounded-lg flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                activeChat === user.id ? 'bg-muted' : ''
              }`}
            >
              <Avatar className="h-10 w-10">
                <img src={user.photoUrl} alt={user.name} />
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{user.name}</span>
                  {user.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {user.lastMessage && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {user.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                    {user.lastMessage.content}
                  </p>
                )}
                {user.unreadCount ? (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {user.unreadCount}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}


function UserProfile({ 
  user, 
  onClose, 
  isCurrentUser, 
  onUpdateProfile, 
  setIsLoggedIn,
  isLoggedIn,
  onStartChat 
}: UserProfileProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      onStartChat(user.id);
      setMessage("");
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="profile-header relative aspect-[3/1]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        {user.photoUrl && (
          <img
            src={user.photoUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <CardContent className="form-section -mt-16 relative">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <img
                src={user.photoUrl}
                alt={user.name}
                className="object-cover"
              />
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">
                {user.age} • {user.gender} • {user.location}
              </p>
              {!isCurrentUser && user.matchPercentage && (
                <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary mt-2">
                  {user.matchPercentage}% Match
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isCurrentUser && (
              <Button variant="outline" onClick={() => {
                setIsLoggedIn(false);
                sessionStorage.removeItem('isLoggedIn');
              }}>
                Logout
              </Button>
            )}
          </div>
        </div>

        {isCurrentUser ? (
          <ProfileForm user={user} onSubmit={onUpdateProfile} />
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <div className="space-y-4">
                {user.publicDescription?.split("\n").map((note, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-muted/50"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${user.email}`}
                    className="text-primary hover:underline"
                  >
                    {user.email}
                  </a>
                </div>
                {user.socialIds && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Social Media</h4>
                    <p>{user.socialIds}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {isLoggedIn && !isCurrentUser && (
        <div className="px-6 pb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Send a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ProfileForm({ user, onSubmit }: { user: User; onSubmit: (data: User) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: user });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24 ring-4 ring-background">
          <img src={photoPreview} alt={user.name} className="object-cover" />
        </Avatar>
        <div className="mt-4 w-full">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              className="hidden"
              id="photo-upload"
              onChange={handlePhotoChange}
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer bg-muted hover:bg-muted/80 px-4 py-2 rounded-md text-sm font-medium"
            >
              Upload Photo
            </label>
            <p className="text-sm text-muted-foreground">or</p>
            <Input
              type="url"
              placeholder="Photo URL"
              {...register("photoUrl")}
              onChange={(e) => setPhotoPreview(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            <User2 className="h-4 w-4 inline-block mr-2" />
            Name
          </label>
          <Input
            placeholder="Name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">
              {errors.name.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            <Mail className="h-4 w-4 inline-block mr-2" />
            Email
          </label>
          <Input
            type="email"
            placeholder="Email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">
              {errors.email.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            <Calendar className="h-4 w-4 inline-block mr-2" />
            Age
          </label>
          <Input
            type="number"
            placeholder="Age"
            {...register("age", {
              required: "Age is required",
              min: { value: 18, message: "Must be 18 or older" },
            })}
          />
          {errors.age && (
            <p className="text-sm text-destructive mt-1">
              {errors.age.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Gender</label>
          <Select 
            defaultValue={user.gender}
            onValueChange={(value) => setValue("gender", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="hidden"
            {...register("gender", { required: "Gender is required" })}
          />
          {errors.gender && (
            <p className="text-sm text-destructive mt-1">
              {errors.gender.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          <MapPin className="h-4 w-4 inline-block mr-2" />
          Location
        </label>
        <Input
          placeholder="Location"
          {...register("location", { required: "Location is required" })}
        />
        {errors.location && (
          <p className="text-sm text-destructive mt-1">
            {errors.location.message as string}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Public Description</h3>
          <Textarea
            {...register("publicDescription")}
            placeholder="Tell others about yourself"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Private Description</h3>
          <Textarea
            {...register("privateDescription")}
            placeholder="Write private notes about yourself"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" className="w-full">
          Update Profile
        </Button>
      </div>
    </form>
  );
}

function UserList({ 
  onSelect, 
  users,
  isLoggedIn 
}: { 
  onSelect: (user: UserWithMatch) => void;
  users: UserWithMatch[];
  isLoggedIn: boolean;
}) {
  const [filters, setFilters] = useState({
    minAge: "18",
    maxAge: "75",
    gender: "all",
    maxDistance: "0",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    ...filters,
    anyDistance: filters.maxDistance === "0",
  });

  const handleApplyFilters = () => {
    setFilters({
      ...tempFilters,
      maxDistance: tempFilters.anyDistance ? "0" : tempFilters.maxDistance,
    });
    setShowFilters(false);
  };

  if (!users) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <h2 className="text-xl items-center font-bold">Who do you want to connect with?</h2>
          <Input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-primary/20 bg-muted/50 focus-visible:ring-primary/20"
            placeholder="Message PeepsGPT..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Suggested Matches</h2>
          {!isLoggedIn && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {Object.values(filters).some((v) => v !== "all" && v !== "0") && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  •
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Filter Matches</h3>
              <Button onClick={handleApplyFilters}>Apply</Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Age Range</label>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{tempFilters.minAge}</span>
                  <span>{tempFilters.maxAge}</span>
                </div>
                <Slider
                  min={18}
                  max={100}
                  step={1}
                  value={[
                    parseInt(tempFilters.minAge),
                    parseInt(tempFilters.maxAge),
                  ]}
                  onValueChange={([min, max]) =>
                    setTempFilters({
                      ...tempFilters,
                      minAge: min.toString(),
                      maxAge: max.toString(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tempFilters.anyDistance}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        anyDistance: e.target.checked,
                        maxDistance: e.target.checked
                          ? "0"
                          : tempFilters.maxDistance,
                      })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <label className="text-sm font-medium">Any distance</label>
                </div>

                {!tempFilters.anyDistance && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Max Distance</span>
                      <span>{tempFilters.maxDistance} km</span>
                    </div>
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={[parseInt(tempFilters.maxDistance)]}
                      onValueChange={([value]) =>
                        setTempFilters({
                          ...tempFilters,
                          maxDistance: value.toString(),
                        })
                      }
                    />
                  </>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select
                  value={tempFilters.gender}
                  onValueChange={(value) =>
                    setTempFilters({ ...tempFilters, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden bg-card/50"
            onClick={() => onSelect(user)}
          >
            <div className="aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
              {user.photoUrl && (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.age} • {user.gender}
                    </p>
                  </div>
                  {isLoggedIn && user.matchPercentage && (
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                        {user.matchPercentage}% Match
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
                {user.publicDescription && (
                  <p className="text-sm line-clamp-2">
                    {user.publicDescription.split("\n")[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuthForm({ onLogin, onRegister, onClose, isLogin, setShowAuthForm }: {
  onLogin: (data: { username: string; password: string }) => void;
  onRegister: (data: Omit<User, 'id'>) => void;
  onClose: () => void;
  isLogin: boolean;
  setShowAuthForm: (value: AuthFormType) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = handleSubmit(async (data) => {
    if (isLogin) {
      await onLogin(data);
      onClose();
    } else {
      await onRegister({
        ...data,
        photoUrl: "https://via.placeholder.com/150",
        publicDescription: "",
        privateDescription: "",
        socialIds: "",
      });
      onClose();
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Username"
          {...register("username", { required: "Username is required" })}
        />
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">
            {errors.username.message as string}
          </p>
        )}
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">
            {errors.password.message as string}
          </p>
        )}
      </div>
      {!isLogin && (
        <>
          <div>
            <Input
              type="email"
              placeholder="Email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message as string}
              </p>
            )}
          </div>
          <div>
            <Input
              placeholder="Name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {errors.name.message as string}
              </p>
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
              <p className="text-sm text-red-500 mt-1">
                {errors.age.message as string}
              </p>
            )}
          </div>
          <div>
            <Input
              placeholder="Location"
              {...register("location", { required: "Location is required" })}
            />
            {errors.location && (
              <p className="text-sm text-red-500 mt-1">
                {errors.location.message as string}
              </p>
            )}
          </div>
          <div>
            <Select 
              onValueChange={(value) => setValue("gender", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              {...register("gender", { required: "Gender is required" })}
            />
            {errors.gender && (
              <p className="text-sm text-red-500 mt-1">
                {errors.gender.message as string}
              </p>
            )}
          </div>
        </>
      )}
      <Button type="submit" className="w-full">
        {isLogin ? "Login" : "Register"}
      </Button>
      <Button
        variant="link"
        className="w-full"
        onClick={() => onClose()}
      >
        Close
      </Button>
      <Button
        variant="link"
        className="w-full"
        onClick={() => setShowAuthForm(isLogin ? 'register' : 'login')}
      >
        {isLogin ? "Need an account?" : "Already have an account?"}
      </Button>
    </form>
  );
}

function UserList({ 
  onSelect, 
  users,
  isLoggedIn 
}: { 
  onSelect: (user: UserWithMatch) => void;
  users: UserWithMatch[];
  isLoggedIn: boolean;
}) {
  const [filters, setFilters] = useState({
    minAge: "18",
    maxAge: "75",
    gender: "all",
    maxDistance: "0",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    ...filters,
    anyDistance: filters.maxDistance === "0",
  });

  const handleApplyFilters = () => {
    setFilters({
      ...tempFilters,
      maxDistance: tempFilters.anyDistance ? "0" : tempFilters.maxDistance,
    });
    setShowFilters(false);
  };

  if (!users) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <h2 className="text-xl items-center font-bold">Who do you want to connect with?</h2>
          <Input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-primary/20 bg-muted/50 focus-visible:ring-primary/20"
            placeholder="Message PeepsGPT..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Suggested Matches</h2>
          {!isLoggedIn && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {Object.values(filters).some((v) => v !== "all" && v !== "0") && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  •
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Filter Matches</h3>
              <Button onClick={handleApplyFilters}>Apply</Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Age Range</label>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{tempFilters.minAge}</span>
                  <span>{tempFilters.maxAge}</span>
                </div>
                <Slider
                  min={18}
                  max={100}
                  step={1}
                  value={[
                    parseInt(tempFilters.minAge),
                    parseInt(tempFilters.maxAge),
                  ]}
                  onValueChange={([min, max]) =>
                    setTempFilters({
                      ...tempFilters,
                      minAge: min.toString(),
                      maxAge: max.toString(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tempFilters.anyDistance}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        anyDistance: e.target.checked,
                        maxDistance: e.target.checked
                          ? "0"
                          : tempFilters.maxDistance,
                      })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <label className="text-sm font-medium">Any distance</label>
                </div>

                {!tempFilters.anyDistance && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Max Distance</span>
                      <span>{tempFilters.maxDistance} km</span>
                    </div>
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={[parseInt(tempFilters.maxDistance)]}
                      onValueChange={([value]) =>
                        setTempFilters({
                          ...tempFilters,
                          maxDistance: value.toString(),
                        })
                      }
                    />
                  </>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select
                  value={tempFilters.gender}
                  onValueChange={(value) =>
                    setTempFilters({ ...tempFilters, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden bg-card/50"
            onClick={() => onSelect(user)}
          >
            <div className="aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
              {user.photoUrl && (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.age} • {user.gender}
                    </p>
                  </div>
                  {isLoggedIn && user.matchPercentage && (
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                        {user.matchPercentage}% Match
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
                {user.publicDescription && (
                  <p className="text-sm line-clamp-2">
                    {user.publicDescription.split("\n")[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default App;