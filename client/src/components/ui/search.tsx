import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { Avatar } from './avatar';
import { useToast } from './use-toast'; // Assuming you have a toast hook

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
        throw new Error('Invalid response format');
      }

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
              className="p-4 cursor-pointer hover:border-primary/30 transition-all duration-300"
              onClick={() => onSelectResult?.(result)}
            >
              <div className="flex items-center gap-4">
                <Avatar src={result.photo_url} alt={result.name} />
                <div>
                  <h3 className="font-medium">{result.name}</h3>
                  <p className="text-sm text-gray-500">{result.public_description}</p>
                  <p className="text-xs text-gray-400">
                    Similarity: {(result.similarity * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
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