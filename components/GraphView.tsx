'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function GraphView() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedNode] = useState<string | null>(null);

	const { data: graphData, isLoading } = useQuery({
		queryKey: ['graph'],
		queryFn: async () => {
			// TODO: Implement graph data endpoint
			const response = await fetch('/api/statements');
			if (!response.ok) throw new Error('Failed to fetch graph data');
			const statements = await response.json();

			// Transform to graph format
			const nodes = statements.statements.map((s: any) => ({
				id: s.id,
				label:
					s.content.substring(0, 50) +
					(s.content.length > 50 ? '...' : ''),
				type: s.type,
				confidence: s.confidence,
			}));

			const edges: any[] = [];
			statements.statements.forEach((s: any) => {
				s.derivedFrom.forEach((parentId: string) => {
					edges.push({
						from: parentId,
						to: s.id,
					});
				});
			});

			return { nodes, edges };
		},
	});

	useEffect(() => {
		if (!containerRef.current || !graphData) return;

		// TODO: Integrate with a graph visualization library like vis.js or d3
		// For now, show a placeholder
	}, [graphData]);

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-gray-500">Loading graph...</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div className="border-b bg-white px-6 py-4">
				<h1 className="text-2xl font-semibold">Knowledge Graph</h1>
				<p className="text-sm text-gray-600 mt-1">
					Visual representation of your knowledge network
				</p>
			</div>

			<div className="flex-1 bg-gray-50 p-6">
				<div className="bg-white rounded-lg border border-gray-200 h-full flex items-center justify-center">
					<div className="text-center">
						<svg
							className="w-16 h-16 mx-auto mb-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Graph Visualization Coming Soon
						</h3>
						<p className="text-sm text-gray-500 max-w-md">
							An interactive graph showing how your statements
							connect and derive from each other.
							{graphData && (
								<span className="block mt-2">
									Currently tracking {graphData.nodes.length}{' '}
									statements with {graphData.edges.length}{' '}
									connections.
								</span>
							)}
						</p>
					</div>
				</div>
			</div>

			{selectedNode && (
				<div className="border-t bg-white p-4">
					<p className="text-sm text-gray-600">
						Selected: {selectedNode}
					</p>
				</div>
			)}
		</div>
	);
}
