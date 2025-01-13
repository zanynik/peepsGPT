import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, Moon, MapPin, Calendar, User2, Mail, Search } from "lucide-react";
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
import { Switch, Route } from "wouter";
import { AlertCircle } from "lucide-react";
import { MessagingLayout } from "@/components/messaging/MessagingLayout";

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

interface UserProfileProps {
  user: UserWithMatch;
  onClose: () => void;
  isCurrentUser?: boolean;
  onUpdateProfile?: (data: User) => void;
  setIsLoggedIn: (value: boolean) => void;
}

type AuthFormType = 'login' | 'register' | false;

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Check actual session status from server
    fetch('/api/user')
      .then(res => {
        if (res.ok) {
          setIsLoggedIn(true);
          return res.json();
        }
        // If not logged in, clear session storage
        sessionStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        throw new Error('Not authenticated');
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMatch | null>(null);
  const [showAuthForm, setShowAuthForm] = useState<AuthFormType>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isLoggedIn,
  });

  // Fetch random profiles when not logged in
  const getRandomProfiles = () => {
    const demoProfiles: UserWithMatch[] = [
      {
        id: 1,
        name: "Alex Chen",
        email: "alex@example.com",
        age: 29,
        gender: "Other",
        location: "Seattle, US",
        photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=alex",
        publicDescription: "Strategic thinker and innovator.",
      },
      {
        id: 2,
        name: "Maya Patel",
        email: "maya@example.com",
        age: 30,
        gender: "Female",
        location: "Chicago, US",
        photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=maya",
        publicDescription: "Natural mentor and inspirational leader.",
      },
      {
        id: 3,
        name: "Sam Wright",
        email: "sam@example.com",
        age: 25,
        gender: "Other",
        location: "Boston, US",
        photoUrl: "https://api.dicebear.com/7.x/personas/svg?seed=sam",
        publicDescription: "Analytical problem-solver.",
      }
    ];
    return demoProfiles.sort(() => Math.random() - 0.5).slice(0, 2);
  };

  // Fetch users only when logged in
  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithMatch[]>({
    queryKey: ["/api/users"],
    enabled: isLoggedIn,
    initialData: !isLoggedIn ? getRandomProfiles() : []
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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    setSelectedUser(null); // Return to home screen
    queryClient.clear(); // Clear React Query cache
  };

  if (isLoggedIn && userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // fallback 404 not found page
  function NotFound() {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Did you forget to add the page to the router?
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <Switch>
      <Route path="/messages" component={MessagingLayout} />
      <Route path="/">
        <>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-4 max-w-5xl">
              <header className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h1 
                    className="text-2xl font-semibold text-primary cursor-pointer" 
                    onClick={() => setSelectedUser(null)}
                  >
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

              <main className="container mx-auto">
                {selectedUser ? (
                  <UserProfile
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    isCurrentUser={'isCurrentUser' in selectedUser}
                    onUpdateProfile={updateProfileMutation.mutate}
                    setIsLoggedIn={handleLogout}
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
      </Route>
    </Switch>
  );
}

interface AuthFormProps {
  onLogin: (data: { username: string; password: string }) => void;
  onRegister: (data: Omit<User, 'id'>) => void;
  onClose: () => void;
  isLogin: boolean;
  setShowAuthForm: (value: AuthFormType) => void;
}

function AuthForm({ onLogin, onRegister, onClose, isLogin, setShowAuthForm }: AuthFormProps) {
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
          <h2 className="text-2xl font-bold">
            {isLoggedIn ? "Suggested Matches" : "Featured Profiles"}
          </h2>
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

function UserProfile({ user, onClose, isCurrentUser, onUpdateProfile, setIsLoggedIn }: UserProfileProps) {
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

export default App;