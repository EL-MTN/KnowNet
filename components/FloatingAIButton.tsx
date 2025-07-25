'use client';

import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

export function FloatingAIButton() {
	const [selectedCount, setSelectedCount] = useState(1);

	// Get random statements for quick generation
	const { data } = useQuery({
		queryKey: ['statements'],
		queryFn: async () => {
			const response = await fetch('/api/statements');
			if (!response.ok) throw new Error('Failed to fetch statements');
			return response.json();
		},
	});

	const handleQuickGenerate = () => {
		if (!data?.statements || data.statements.length === 0) return;

		// Select random statements
		const shuffled = [...data.statements].sort(() => 0.5 - Math.random());
		const selected = shuffled.slice(0, selectedCount);

		window.dispatchEvent(
			new CustomEvent('quick-ai-generate', {
				detail: selected,
			}),
		);
	};

	return (
		<>
			<div className="fixed bottom-4 left-4 z-40">
				<div className="relative group">
					<button
						onClick={handleQuickGenerate}
						className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110"
						title="Quick AI Theory Generation"
					>
						<SparklesIcon className="w-6 h-6" />
					</button>

					{/* Quick Options */}
					<div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
							<p className="text-xs font-medium text-gray-600 px-2">
								Generate from:
							</p>
							{[1, 2, 3].map((num) => (
								<button
									key={num}
									onClick={(e) => {
										e.stopPropagation();
										setSelectedCount(num);
										handleQuickGenerate();
									}}
									className={`block w-full text-left px-3 py-1 text-sm rounded hover:bg-blue-50 ${
										selectedCount === num
											? 'bg-blue-100 text-blue-700'
											: ''
									}`}
								>
									{num} random statement{num > 1 ? 's' : ''}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
					{selectedCount}
				</div>
			</div>
		</>
	);
}
