'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AddStatement() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'axiom' | 'theory'>('axiom');
  const [content, setContent] = useState('');
  const [confidence, setConfidence] = useState('');
  const [tags, setTags] = useState('');
  const [derivedFrom, setDerivedFrom] = useState('');
  
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create statement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      setIsOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setContent('');
    setConfidence('');
    setTags('');
    setDerivedFrom('');
    setType('axiom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      type,
      content,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    if (confidence) {
      data.confidence = parseFloat(confidence);
    }

    if (derivedFrom && type === 'theory') {
      data.derivedFrom = derivedFrom.split(',').map(d => d.trim()).filter(Boolean);
    }

    mutation.mutate(data);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
      >
        Add Statement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-semibold">Add New Statement</h3>
      
      <div>
        <label className="block mb-2">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'axiom' | 'theory')}
          className="w-full border rounded px-3 py-2"
        >
          <option value="axiom">Axiom</option>
          <option value="theory">Theory</option>
        </select>
      </div>

      <div>
        <label className="block mb-2">Content *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 h-24"
          placeholder="Enter your statement..."
        />
      </div>

      <div>
        <label className="block mb-2">Confidence (0-1)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="0.8"
        />
      </div>

      <div>
        <label className="block mb-2">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="philosophy, ethics, science"
        />
      </div>

      {type === 'theory' && (
        <div>
          <label className="block mb-2">Derived From (comma-separated IDs)</label>
          <input
            type="text"
            value={derivedFrom}
            onChange={(e) => setDerivedFrom(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="statement-id-1, statement-id-2"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
        >
          {mutation.isPending ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
          className="border px-4 py-2 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {mutation.isError && (
        <div className="text-red-600">Error: Failed to create statement</div>
      )}
    </form>
  );
}