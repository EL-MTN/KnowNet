'use client';

import { useState } from 'react';
import { StatementList } from '@/components/StatementList';
import { AddStatement } from '@/components/AddStatement';
import { SearchPanel } from '@/components/SearchPanel';
import { Statistics } from '@/components/Statistics';
import { AIAssistant } from '@/components/AIAssistant';
import { AISettings } from '@/components/AISettings';
import { Statement } from '@/lib/core/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'statements' | 'search' | 'stats' | 'ai'>('statements');
  const [selectedStatements, setSelectedStatements] = useState<Statement[]>([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">KnowNet</h1>
      
      <div className="mb-6">
        <nav className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'statements'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            Statements
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'search'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'stats'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'ai'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            AI Assistant
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'statements' && (
          <>
            <AddStatement />
            <StatementList onSelectionChange={setSelectedStatements} />
          </>
        )}
        {activeTab === 'search' && <SearchPanel />}
        {activeTab === 'stats' && <Statistics />}
        {activeTab === 'ai' && (
          <AIAssistant 
            selectedStatements={selectedStatements}
            onTheoryGenerated={(theory) => {
              console.log('New theory generated:', theory);
              setActiveTab('statements');
            }}
          />
        )}
      </div>
      
      <AISettings />
    </div>
  );
}