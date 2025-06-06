import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Avatar } from './avatar';
import { useToast } from '@/hooks/use-toast';

interface SearchProps {
  onSelectResult: (user: any) => void;
}

interface SearchResult {
  id: number;
  name: string;
  photo_url: string;
  public_description: string;
  similarity: number;
}

export function Search({ onSelectResult }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: 'Error', description: 'Please enter a search query.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        setResults([]);
        return;
      }

      console.log('Search results:', data);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'Error', description: 'Failed to fetch search results.' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search profiles..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-2">
        {results.length > 0 ? (
          results.map((result) => (
            <Card
              key={result.id}
              className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden bg-card/50"
              onClick={() => onSelectResult?.(result)}
            >
              <div className="aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                {result.photo_url && (
                  <img
                    src={result.photo_url}
                    alt={result.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{result.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.age && result.gender ? `${result.age} • ${result.gender}` : (result.age || result.gender || '')}
                      </p>
                      {result.location && (
                        <p className="text-xs text-muted-foreground">📍 {result.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                        {(result.similarity * 100).toFixed(1)}% Match
                      </span>
                    </div>
                  </div>
                  {result.public_description && (
                    <p className="text-sm line-clamp-2">
                      {result.public_description.split("\n")[0]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {loading ? 'Searching...' : 'No results found.'}
          </p>
        )}
      </div>
    </div>
  );
}