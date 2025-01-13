import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Filter } from "lucide-react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import type { User, Gender } from "@db/schema";

interface UserWithMatch extends User {
  matchPercentage?: number;
}

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMatch | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isLoggedIn,
  });

  const demoUser: User = {
    id: 0,
    username: "demo_user",
    name: "Demo User",
    email: "demo@example.com",
    age: 25,
    gender: "Other",
    location: "New York, United States",
    latitude: "40.7128",
    longitude: "-74.0060",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    publicDescription: "This is a demo profile.\nLog in or sign up to see real matches!",
    privateDescription: "",
    socialIds: "",
    newsletterEnabled: false,
    updatedAt: new Date().toISOString(),
    password: ""
  };

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (isLoggedIn && !hasSeenTutorial) {
      setRunTutorial(true);
    }
  }, [isLoggedIn]);

  const tutorialSteps: Step[] = [
    {
      target: ".profile-section",
      content:
        "Welcome to the matching platform! This is your profile section where you can edit your details and preferences.",
      disableBeacon: true,
    },
    {
      target: ".photo-upload",
      content:
        "Add a photo to make your profile more appealing. You can upload an image or provide a URL.",
    },
    {
      target: ".matches-section",
      content:
        "Here you can see your potential matches, sorted by compatibility percentage.",
    },
    {
      target: ".match-card",
      content:
        "Click on any profile card to view detailed information about that person.",
    },
    {
      target: ".social-info",
      content:
        "Add your social media handles to let others connect with you on different platforms.",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      localStorage.setItem("hasSeenTutorial", "true");
      setRunTutorial(false);
    }
  };

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

  if (showAuthForm) {
    return (
      <AuthForm
        onLogin={loginMutation.mutate}
        onRegister={registerMutation.mutate}
        onClose={() => setShowAuthForm(false)}
      />
    );
  }

  if (isLoggedIn && userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            backgroundColor: "hsl(var(--background))",
            textColor: "hsl(var(--foreground))",
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Matching Platform
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect with like-minded professionals
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRunTutorial(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Tutorial
              </Button>
              <Button 
                variant="default"
                onClick={() => setShowAuthForm(true)}
              >
                {isLoggedIn ? 'Profile' : 'Login / Sign Up'}
              </Button>
            </div>
          </header>

          <div className="grid gap-8 md:grid-cols-[350px,1fr]">
            <aside>
              <Card className="profile-section sticky top-8">
                <div className="profile-header">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                </div>
                <CardContent className="form-section -mt-16 relative">
                  {isLoggedIn && currentUser ? (
                    <ProfileForm
                      user={currentUser}
                      onSubmit={updateProfileMutation.mutate}
                    />
                  ) : (
                    <ProfileForm
                      user={demoUser}
                      onSubmit={() => setShowAuthForm(true)}
                      isDemo={true}
                    />
                  )}
                </CardContent>
              </Card>
            </aside>

            <main>
              {selectedUser ? (
                <UserProfile
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                />
              ) : (
                <div className="matches-section space-y-6">
                  <UserList onSelect={setSelectedUser} />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

function AuthForm({ onLogin, onRegister }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const genderOptions: Gender[] = ["Male", "Female", "Other"];

  const handleGenderChange = (value: string) => {
    setValue("gender", value, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="w-full max-w-md bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Welcome to our "Connections" Platform!</h2>
            <p className="text-gray-700 mb-2">
              Connect with like-minded individuals who share your passions and interests. Our platform helps you find meaningful connections based on what matters most to you.
            </p>
            <p className="text-gray-700">
              Share about yourself in your profile - your interests, hobbies, and what drives you - AI will use it to connect you with the right people. You can filter based on location, age, and most importantly, the passions you describe in your profile.
            </p>
          </div>
          <h1 className="text-2xl font-bold mb-4">
            {isLogin ? "Login" : "Register"}
          </h1>
          <form
            onSubmit={handleSubmit(isLogin ? onLogin : onRegister)}
            className="space-y-4"
          >
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
                      min: { value: 18, message: "Must be 18 or older" },
                    })}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.age.message as string}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Location"
                    {...register("location", { required: "Location is required" })}
                    onChange={async (e) => {
                      const query = e.target.value;
                      setValue('location', query);
                      if (query.length >= 2) {
                        try {
                          const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(query)}`);
                          const data = await response.json();
                          setLocationSuggestions(data.suggestions || []);
                          setShowSuggestions(true);
                        } catch (error) {
                          console.error('Error fetching locations:', error);
                          setLocationSuggestions([]);
                          setShowSuggestions(false);
                        }
                      } else {
                        setLocationSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const newIndex = e.key === "ArrowDown"
                          ? Math.min(selectedIndex + 1, locationSuggestions.length - 1)
                          : Math.max(selectedIndex - 1, -1);
                        setSelectedIndex(newIndex);
                      } else if (e.key === "Enter" && selectedIndex >= 0) {
                        e.preventDefault();
                        const selected = locationSuggestions[selectedIndex];
                        setValue("location", selected.fullName);
                        setValue("latitude", selected.latitude.toString());
                        setValue("longitude", selected.longitude.toString());
                        setShowSuggestions(false);
                      }
                    }}
                  />
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.length === 0 ? (
                        <div className="p-2 text-gray-500 italic">No results found</div>
                      ) : (
                        locationSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.name}-${index}`}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${
                              index === selectedIndex ? "bg-gray-200" : ""
                            }`}
                            onClick={() => {
                              setValue("location", suggestion.fullName);
                              setValue("latitude", suggestion.latitude.toString());
                              setValue("longitude", suggestion.longitude.toString());
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion.fullName}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {errors.location && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.location.message as string}
                    </p>
                  )}
                  <input type="hidden" {...register("latitude")} />
                  <input type="hidden" {...register("longitude")} />
                </div>
                <div>
                  <Select onValueChange={handleGenderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: user });

  const [photoPreview, setPhotoPreview] = useState(user.photoUrl);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const genderOptions: Gender[] = ["Male", "Female", "Other"];

  const handleGenderChange = (value: string) => {
    setValue("gender", value, { shouldValidate: true });
  };

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

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setValue('location', query);
    if (query.length >= 2) {
      try {
        const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setLocationSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex =
        e.key === "ArrowDown"
          ? Math.min(selectedIndex + 1, locationSuggestions.length - 1)
          : Math.max(selectedIndex - 1, -1);
      setSelectedIndex(newIndex);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = locationSuggestions[selectedIndex];
      setValue("location", selected.fullName);
      setValue("latitude", selected.latitude.toString());
      setValue("longitude", selected.longitude.toString());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setValue("location", suggestion.fullName);
    setValue("latitude", suggestion.latitude.toString());
    setValue("longitude", suggestion.longitude.toString());
    setShowSuggestions(false);
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
          <Select defaultValue={user.gender} onValueChange={handleGenderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
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

      <div className="relative space-y-2">
        <label className="text-sm font-medium">
          <MapPin className="h-4 w-4 inline-block mr-2" />
          Location
        </label>
        <Input
          placeholder="Location"
          {...register("location", { required: "Location is required" })}
          onChange={handleLocationChange}
          onKeyDown={handleLocationKeyDown}
        />
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
            {locationSuggestions.length === 0 ? (
              <div className="p-2 text-muted-foreground italic">
                No results found
              </div>
            ) : (
              locationSuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.name}-${index}`}
                  className={`p-2 cursor-pointer hover:bg-muted ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.fullName}
                </div>
              ))
            )}
          </div>
        )}
        {errors.location && (
          <p className="text-sm text-destructive mt-1">
            {errors.location.message as string}
          </p>
        )}
        <input type="hidden" {...register("latitude")} />
        <input type="hidden" {...register("longitude")} />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Public Description</h3>
          <Notes
            type="public"
            notes={watch("publicDescription")?.split("\n").filter(Boolean) || []}
            onAdd={(note) => {
              const currentNotes =
                watch("publicDescription")?.split("\n").filter(Boolean) || [];
              setValue("publicDescription", [...currentNotes, note].join("\n"));
            }}
            onDelete={(index) => {
              const currentNotes =
                watch("publicDescription")?.split("\n").filter(Boolean) || [];
              currentNotes.splice(index, 1);
              setValue("publicDescription", currentNotes.join("\n"));
            }}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Private Notes</h3>
          <Notes
            type="private"
            notes={watch("privateDescription")?.split("\n").filter(Boolean) || []}
            onAdd={(note) => {
              const currentNotes =
                watch("privateDescription")?.split("\n").filter(Boolean) || [];
              setValue("privateDescription", [...currentNotes, note].join("\n"));
            }}
            onDelete={(index) => {
              const currentNotes =
                watch("privateDescription")?.split("\n").filter(Boolean) || [];
              currentNotes.splice(index, 1);
              setValue("privateDescription", currentNotes.join("\n"));
            }}
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

function UserList({ onSelect }: { onSelect: (user: UserWithMatch) => void }) {
  const [filters, setFilters] = useState({
    minAge: "18",
    maxAge: "75",
    gender: "all",
    maxDistance: "0",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithMatch[]>({
    queryKey: ["/api/users", filters],
    queryFn: async () => {
      const res = await fetch(
        `/api/users?minAge=${filters.minAge}&maxAge=${filters.maxAge}&gender=${filters.gender}&maxDistance=${filters.maxDistance}`
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
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

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suggested Matches</h2>
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
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Filter Matches</h3>
              <Button onClick={handleApplyFilters}>Apply</Button>
            </div>

            <div className="space-y-4">
              {/* Age Range Filter */}
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

              {/* Distance Filter */}
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

              {/* Gender Filter */}
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
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
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
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                      {user.matchPercentage}% Match
                    </span>
                  </div>
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

function UserProfile({
  user,
  onClose,
}: {
  user: UserWithMatch;
  onClose: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="profile-header">
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
              <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary mt-2">
                {user.matchPercentage}% Match
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

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
      </CardContent>
    </Card>
  );
}

export default App;