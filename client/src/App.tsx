import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sun, Moon, Search } from "lucide-react";
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
import { Loader2 } from "lucide-react";
import type { User, Gender } from "@db/schema";

interface UserWithMatch extends User {
  matchPercentage?: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isLoggedIn,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithMatch[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // For non-logged in users, fetch random profiles
      const endpoint = isLoggedIn ? '/api/users' : '/api/users/random';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
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
      setShowAuthForm(false);
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
      setShowAuthForm(false);
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


  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold sm:inline-block">
                Professional Network
              </span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {isLoggedIn && (
                <Button variant="outline" className="w-full" onClick={() => queryClient.invalidateQueries()}>
                  Refresh Matches
                </Button>
              )}
            </div>
            <nav className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                }}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </Button>
              {!isLoggedIn && (
                <>
                  <Button variant="ghost" onClick={() => { setShowAuthForm(true); setIsRegister(false); }}>
                    Log in
                  </Button>
                  <Button onClick={() => { setShowAuthForm(true); setIsRegister(true); }}>
                    Sign up
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-screen flex-col items-center px-4 pt-24 pb-16">
        <div className="mx-auto w-full max-w-2xl">
          {/* Search Section */}
          <div className="rounded-lg border bg-background p-8 mb-8 text-center">
            <h1 className="mb-6 text-3xl font-bold">
              What kind of people do you want to connect with?
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                className="pl-10 pr-4 py-6 text-lg"
                placeholder="Describe your ideal connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Profile Suggestions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">
              {isLoggedIn ? "Recommended Connections" : "Featured Profiles"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="match-card-cover" />
                    <div className="relative">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <img src={user.photoUrl} alt={user.name} />
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user.age} • {user.gender} • {user.location}
                          </p>
                          {isLoggedIn && user.matchPercentage && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                {user.matchPercentage}% Match
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthForm && (
        <AuthForm
          isRegister={isRegister}
          onClose={() => setShowAuthForm(false)}
          onLogin={loginMutation.mutate}
          onRegister={registerMutation.mutate}
        />
      )}
    </div>
  );
}

function AuthForm({ isRegister, onClose, onLogin, onRegister }: any) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const genderOptions: Gender[] = ["Male", "Female", "Other"];

  const handleGenderChange = (value: Gender) => {
    setValue("gender", value, { shouldValidate: true });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? "Sign up to connect with like-minded professionals"
              : "Sign in to your account"}
          </p>
        </div>
        <form
          onSubmit={handleSubmit(isRegister ? onRegister : onLogin)}
          className="space-y-4"
        >
          <div className="space-y-4">
            <Input
              placeholder="Username"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message as string}
              </p>
            )}
            <Input
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message as string}
              </p>
            )}
            {isRegister && (
              <>
                <Input
                  placeholder="Name"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message as string}
                  </p>
                )}
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
                  <p className="text-sm text-destructive">
                    {errors.email.message as string}
                  </p>
                )}
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
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isRegister ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </form>
      </div>
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center space-x-4 photo-upload">
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
          <p className="text-sm text-gray-500 mt-1">
            Enter a URL for your profile photo or upload a new one.
          </p>
        </div>
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
          <p className="text-sm text-red-500 mt-1">
            {errors.email.message as string}
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
          onChange={handleLocationChange}
          onKeyDown={handleLocationKeyDown}
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
                  onClick={() => handleSuggestionClick(suggestion)}
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
          <p className="text-sm text-red-500 mt-1">
            {errors.gender.message as string}
          </p>
        )}
      </div>
      <div className="social-info">
        <Input placeholder="Social IDs" {...register("socialIds")} />
        <p className="text-sm text-gray-500 mt-1">
          Add your social media handles (comma-separated)
        </p>
      </div>
      <div>
        <div className="space-y-2">
          <h3 className="font-semibold">Public Notes</h3>
          <Notes
            type="public"
            notes={watch("publicDescription")?.split("\n").filter(Boolean) || []}
            onAdd={(note) => {
              setValue("publicDescription", note);
            }}
            onDelete={(index) => {
              const currentNotes = watch("publicDescription")?.split("\n").filter(Boolean) || [];
              currentNotes.splice(index, 1);
              setValue("publicDescription", currentNotes.join("\n"));
            }}
          />
          <p className="text-sm text-gray-500">Visible to other users</p>
        </div>
      </div>
      <div>
        <div className="space-y-2">
          <h3 className="font-semibold">Private Notes</h3>
          <Notes
            type="private"
            notes={watch("privateDescription")?.split("\n").filter(Boolean) || []}
            onAdd={(note) => {
              setValue("privateDescription", note);
            }}
            onDelete={(index) => {
              const currentNotes = watch("privateDescription")?.split("\n").filter(Boolean) || [];
              currentNotes.splice(index, 1);
              setValue("privateDescription", currentNotes.join("\n"));
            }}
          />
          <p className="text-sm text-gray-500">Only visible to you</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register("newsletterEnabled")}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label className="text-sm text-gray-700">
          Receive weekly match recommendations via email
        </label>
      </div>
      <div>
        <Button type="submit">Update Profile</Button>
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
    <div>
      <div className="mb-6">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </Button>
        {showFilters && (
          <Card className="mt-2">
            <CardContent className="p-4 space-y-6">
              <div className="flex justify-end">
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
              </div>
              {/* Age Range Filter */}
              <div>
                <div className="flex justify-between mb-2">
                  <span>Age Range</span>
                  <span>{tempFilters.minAge} - {tempFilters.maxAge}</span>
                </div>
                <Slider
                  min={18}
                  max={100}
                  step={1}
                  value={[parseInt(tempFilters.minAge), parseInt(tempFilters.maxAge)]}
                  onValueChange={([min, max]) =>
                    setTempFilters({ ...tempFilters, minAge: min.toString(), maxAge: max.toString() })
                  }
                  className="mb-4"
                />
              </div>

              {/* Distance Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={tempFilters.anyDistance}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        anyDistance: e.target.checked,
                        maxDistance: e.target.checked ? "0" : tempFilters.maxDistance,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="text-sm text-gray-700">Any distance</label>
                </div>
                {!tempFilters.anyDistance && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span>Max Distance</span>
                      <span>{tempFilters.maxDistance} km</span>
                    </div>
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={[parseInt(tempFilters.maxDistance)]}
                      onValueChange={([value]) =>
                        setTempFilters({ ...tempFilters, maxDistance: value.toString() })
                      }
                      className="mb-4"
                    />
                  </>
                )}
              </div>

              {/* Gender Filter */}
              <div>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suggested Matches */}
      <h2 className="text-2xl font-bold mb-4">Suggested Matches</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer hover:shadow-lg transition-shadow match-card"
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

function UserProfile({
  user,
  onClose,
}: {
  user: UserWithMatch;
  onClose: () => void;
}) {
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
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