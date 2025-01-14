
import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { Avatar } from './avatar';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search profiles..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((result: any) => (
          <Card key={result.id} className="p-4">
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
        ))}
      </div>
    </div>
  );
}
