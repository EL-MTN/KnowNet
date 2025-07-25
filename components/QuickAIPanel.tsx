'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	SparklesIcon,
	XMarkIcon,
	CheckIcon,
	ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface QuickAIPanelProps {
	selectedStatements: any[];
	onClose?: () => void;
}

export function QuickAIPanel({
	selectedStatements,
	onClose,
}: QuickAIPanelProps) {
	const [theories, setTheories] = useState<any[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedCount, setSavedCount] = useState(0);

	const queryClient = useQueryClient();

	// Auto-generate on mount if statements are selected
	useEffect(() => {
		if (selectedStatements.length > 0 && theories.length === 0) {
			generateTheories();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const generateTheories = async () => {
		if (selectedStatements.length === 0) return;

		setIsGenerating(true);
		setError(null);

		try {
			const response = await fetch('/api/ai/generate-theory', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceStatementIds: selectedStatements.map((s) => s.id),
					count: 3, // Generate multiple theories at once
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'Failed to generate theories',
				);
			}

			const data = await response.json();

			// Handle both single and multiple theory responses
			const newTheories =
				data.theories || (data.theory ? [data.theory] : []);
			setTheories(newTheories);
		} catch (error: any) {
			setError(error.message || 'Failed to generate theories');
		} finally {
			setIsGenerating(false);
		}
	};

	const saveMutation = useMutation({
		mutationFn: async (theory: any) => {
			const response = await fetch('/api/statements', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'theory',
					content: theory.content,
					tags: Array.isArray(theory.suggestedTags)
						? theory.suggestedTags
						: [],
					confidence: theory.suggestedConfidence || 0.7,
					derivedFrom: selectedStatements.map((s) => s.id),
				}),
			});
			if (!response.ok) throw new Error('Failed to save theory');
			return response.json();
		},
		onSuccess: () => {
			setSavedCount((prev) => prev + 1);
			queryClient.invalidateQueries({ queryKey: ['statements'] });
		},
	});

	const saveTheory = async (theory: any, index: number) => {
		await saveMutation.mutateAsync(theory);
		// Remove saved theory from list
		setTheories((prev) => prev.filter((_, i) => i !== index));
	};

	const saveAllTheories = async () => {
		for (let i = 0; i < theories.length; i++) {
			await saveTheory(theories[i], 0); // Always save the first one as array shrinks
		}
	};

	if (selectedStatements.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-40 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<SparklesIcon className="w-5 h-5 text-blue-500" />
					<h3 className="font-semibold">AI Theory Generator</h3>
				</div>
				<button
					onClick={onClose}
					className="p-1 hover:bg-gray-100 rounded"
				>
					<XMarkIcon className="w-5 h-5" />
				</button>
			</div>

			{/* Source Statements */}
			<div className="px-4 py-2 bg-gray-50 border-b">
				<p className="text-xs text-gray-600 mb-1">
					Generating from {selectedStatements.length} statement
					{selectedStatements.length > 1 ? 's' : ''}
				</p>
				<div className="text-xs text-gray-700 line-clamp-2">
					{selectedStatements.map((s) => s.content).join(' • ')}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
						{error}
					</div>
				)}

				{isGenerating && (
					<div className="flex flex-col items-center justify-center py-8">
						<ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin mb-2" />
						<p className="text-sm text-gray-600">
							Generating theories...
						</p>
					</div>
				)}

				{!isGenerating && theories.length === 0 && !error && (
					<div className="text-center py-8">
						<button
							onClick={generateTheories}
							className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
						>
							Generate Theories
						</button>
					</div>
				)}

				{theories.length > 0 && (
					<div className="space-y-3">
						{theories.map((theory, index) => (
							<div
								key={index}
								className="border rounded-lg p-3 bg-blue-50"
							>
								<p className="text-sm mb-2">{theory.content}</p>
								<div className="flex items-center justify-between">
									<div className="text-xs text-gray-600">
										<span className="mr-3">
											Confidence:{' '}
											{(theory.suggestedConfidence ||
												0.7) * 100}
											%
										</span>
										{Array.isArray(theory.suggestedTags) &&
											theory.suggestedTags.length > 0 && (
												<span>
													Tags:{' '}
													{theory.suggestedTags.join(
														', ',
													)}
												</span>
											)}
									</div>
									<button
										onClick={() =>
											saveTheory(theory, index)
										}
										disabled={saveMutation.isPending}
										className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
									>
										<CheckIcon className="w-3 h-3" />
										Save
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Footer Actions */}
			<div className="border-t p-4 space-y-2">
				{theories.length > 0 && (
					<div className="flex gap-2">
						<button
							onClick={saveAllTheories}
							disabled={saveMutation.isPending}
							className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
						>
							Save All ({theories.length})
						</button>
						<button
							onClick={generateTheories}
							disabled={isGenerating}
							className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
						>
							Generate More
						</button>
					</div>
				)}

				{savedCount > 0 && (
					<p className="text-xs text-center text-green-600">
						✓ {savedCount} theor{savedCount === 1 ? 'y' : 'ies'}{' '}
						saved
					</p>
				)}
			</div>
		</div>
	);
}
