'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface StatementProps {
  statement: {
    id: string;
    type: 'axiom' | 'theory';
    content: string;
    confidence?: number;
    tags: string[];
    derivedFrom: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export function Statement({ statement }: StatementProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/statements/${statement.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete statement');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
    },
  });

  const typeColors = {
    axiom: 'bg-blue-100 text-blue-800 border-blue-200',
    theory: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[statement.type]}`}>
            {statement.type}
          </span>
          {statement.confidence !== undefined && (
            <span className="text-sm text-muted-foreground">
              Confidence: {(statement.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <p className="text-lg mb-2">{statement.content}</p>

      {statement.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {statement.tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary hover:underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <strong>ID:</strong> {statement.id}
          </div>
          <div>
            <strong>Created:</strong> {new Date(statement.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Updated:</strong> {new Date(statement.updatedAt).toLocaleString()}
          </div>
          {statement.derivedFrom.length > 0 && (
            <div>
              <strong>Derived from:</strong> {statement.derivedFrom.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}