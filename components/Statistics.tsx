'use client';

import { useQuery } from '@tanstack/react-query';

export function Statistics() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/query/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: contradictions, isLoading: contradictionsLoading } = useQuery({
    queryKey: ['contradictions'],
    queryFn: async () => {
      const response = await fetch('/api/query/contradictions');
      if (!response.ok) throw new Error('Failed to fetch contradictions');
      return response.json();
    },
  });

  if (statsLoading || contradictionsLoading) return <div>Loading statistics...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Network Statistics</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Total Statements</h3>
              <p className="text-3xl font-bold">{stats.totalStatements}</p>
            </div>
            
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Axioms</h3>
              <p className="text-3xl font-bold">{stats.axiomCount}</p>
            </div>
            
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Theories</h3>
              <p className="text-3xl font-bold">{stats.theoryCount}</p>
            </div>
            
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Average Confidence</h3>
              <p className="text-3xl font-bold">
                {stats.averageConfidence ? (stats.averageConfidence * 100).toFixed(1) + '%' : 'N/A'}
              </p>
            </div>
            
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Most Common Tag</h3>
              <p className="text-xl font-bold">{stats.mostCommonTag || 'None'}</p>
            </div>
            
            <div className="bg-secondary rounded p-4">
              <h3 className="font-semibold text-lg">Average Depth</h3>
              <p className="text-3xl font-bold">{stats.averageDepth?.toFixed(2) || '0'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Contradictions ({contradictions?.total || 0})</h2>
        
        {contradictions?.contradictions?.length > 0 ? (
          <div className="space-y-4">
            {contradictions.contradictions.map((c: any, index: number) => (
              <div key={index} className="border rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    c.severity === 'high' ? 'bg-red-100 text-red-800' :
                    c.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {c.severity} severity
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{c.reason}</p>
                <div className="space-y-2">
                  {c.statements.map((stmt: any, idx: number) => (
                    <div key={idx} className="bg-secondary rounded p-2">
                      <span className="font-medium">{stmt.type}:</span> {stmt.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No contradictions detected</p>
        )}
      </div>
    </div>
  );
}