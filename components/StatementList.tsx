'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Statement } from './Statement';
import type { Statement as StatementType } from '@/lib/core/types';

interface StatementData {
  id: string;
  type: 'axiom' | 'theory';
  content: string;
  confidence?: number;
  tags: string[];
  derivedFrom: string[];
  createdAt: string;
  updatedAt: string;
}

interface StatementListProps {
  onSelectionChange?: (statements: StatementType[]) => void;
}

export function StatementList({ onSelectionChange }: StatementListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data, isLoading, error } = useQuery({
    queryKey: ['statements'],
    queryFn: async () => {
      const response = await fetch('/api/statements');
      if (!response.ok) throw new Error('Failed to fetch statements');
      return response.json();
    },
  });

  if (isLoading) return <div>Loading statements...</div>;
  if (error) return <div>Error loading statements</div>;

  const handleSelectionToggle = (statement: StatementData) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(statement.id)) {
      newSelected.delete(statement.id);
    } else {
      newSelected.add(statement.id);
    }
    setSelectedIds(newSelected);
    
    if (onSelectionChange) {
      const selectedStatements = data?.statements
        ?.filter((s: StatementData) => newSelected.has(s.id))
        .map((s: StatementData) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        })) || [];
      onSelectionChange(selectedStatements);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">All Statements ({data?.total || 0})</h2>
        {selectedIds.size > 0 && (
          <span className="text-sm text-gray-600">
            {selectedIds.size} selected
          </span>
        )}
      </div>
      {data?.statements?.map((statement: StatementData) => (
        <div key={statement.id} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selectedIds.has(statement.id)}
            onChange={() => handleSelectionToggle(statement)}
            className="mt-5"
          />
          <div className="flex-1">
            <Statement statement={statement} />
          </div>
        </div>
      ))}
    </div>
  );
}