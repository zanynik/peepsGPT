import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: number;
  name: string;
  photo_url: string;
  public_description: string;
  similarity: number;
}

interface SmartSearchProps {
  onSelectResult: (user: any) => void;
  className?: string;
}

export function SmartSearch({ onSelectResult, className = "" }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: debouncedQuery }),
      });
      
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (result: SearchResult) => {
    onSelectResult({
      id: result.id,
      name: result.name,
      photoUrl: result.photo_url,
      publicDescription: result.public_description,
    });
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search professionals by interests, skills..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-1"
          >
            <Card className="shadow-lg border-2">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try different keywords or phrases
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {results.map((result) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0"
                        onClick={() => handleSelect(result)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <img 
                              src={result.photo_url} 
                              alt={result.name}
                              className="object-cover"
                            />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium truncate">{result.name}</p>
                              <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>{Math.round(result.similarity * 100)}%</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.public_description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close search */}
      {isOpen && query.length >= 2 && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}