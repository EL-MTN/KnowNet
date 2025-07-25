'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Statement } from './Statement';

export function SearchPanel() {
  const [searchParams, setSearchParams] = useState({
    content: '',
    type: '',
    tags: '',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', searchParams],
    queryFn: async () => {
      const response = await fetch('/api/query/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: searchParams.content || undefined,
          type: searchParams.type || undefined,
          tags: searchParams.tags ? searchParams.tags.split(',').map(t => t.trim()) : undefined,
        }),
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Search Statements</h2>
        
        <div>
          <label className="block mb-2">Content</label>
          <input
            type="text"
            value={searchParams.content}
            onChange={(e) => setSearchParams({ ...searchParams, content: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Search in content..."
          />
        </div>

        <div>
          <label className="block mb-2">Type</label>
          <select
            value={searchParams.type}
            onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All types</option>
            <option value="axiom">Axiom</option>
            <option value="theory">Theory</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={searchParams.tags}
            onChange={(e) => setSearchParams({ ...searchParams, tags: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="philosophy, ethics"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
        >
          Search
        </button>
      </form>

      {isLoading && <div>Searching...</div>}
      {error && <div className="text-red-600">Search failed</div>}
      
      {data && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results ({data.total})</h3>
          {data.results.map((statement: any) => (
            <Statement key={statement.id} statement={statement} />
          ))}
        </div>
      )}
    </div>
  );
}