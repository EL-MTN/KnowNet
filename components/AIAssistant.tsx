'use client';

import { useState } from 'react';
import { Statement } from '@/lib/core/types';
import {
	useGenerateTheory,
	useCheckDuplicates,
	useReviewSuggestions,
} from '@/lib/hooks/useAI';

interface AIAssistantProps {
	selectedStatements?: Statement[];
	onTheoryGenerated?: (theory: any) => void;
}

export function AIAssistant({ selectedStatements = [], onTheoryGenerated }: AIAssistantProps) {
	const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
	const [duplicateCheckContent, setDuplicateCheckContent] = useState('');

	const generateTheory = useGenerateTheory();
	const checkDuplicates = useCheckDuplicates();
	const reviewSuggestions = useReviewSuggestions();

	const handleGenerateTheory = async () => {
		if (selectedStatements.length === 0) {
			alert('Please select at least one statement to generate a theory from');
			return;
		}

		try {
			const result = await generateTheory.mutateAsync({
				sourceStatementIds: selectedStatements.map(s => s.id),
				count: 1,
			});

			if (onTheoryGenerated && result.theory) {
				onTheoryGenerated(result.theory);
			}
		} catch (error) {
			console.error('Failed to generate theory:', error);
		}
	};

	const handleCheckDuplicates = async () => {
		if (!duplicateCheckContent.trim()) {
			alert('Please enter content to check');
			return;
		}

		try {
			const result = await checkDuplicates.mutateAsync({
				content: duplicateCheckContent,
			});

			console.log('Duplicate check result:', result);
		} catch (error) {
			console.error('Failed to check duplicates:', error);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow p-6 space-y-4">
			<h2 className="text-xl font-semibold">AI Assistant</h2>

			{/* Theory Generation */}
			<div className="border-t pt-4">
				<h3 className="font-medium mb-2">Generate Theory</h3>
				<p className="text-sm text-gray-600 mb-3">
					Select statements and generate a new theory based on them
				</p>
				<button
					onClick={handleGenerateTheory}
					disabled={selectedStatements.length === 0 || generateTheory.isPending}
					className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
				>
					{generateTheory.isPending ? 'Generating...' : 'Generate Theory'}
				</button>
				{selectedStatements.length > 0 && (
					<p className="text-sm text-gray-500 mt-2">
						{selectedStatements.length} statement(s) selected
					</p>
				)}
			</div>

			{/* Duplicate Check */}
			<div className="border-t pt-4">
				<h3 className="font-medium mb-2">Check for Duplicates</h3>
				<button
					onClick={() => setShowDuplicateCheck(!showDuplicateCheck)}
					className="text-sm text-blue-500 hover:underline"
				>
					{showDuplicateCheck ? 'Hide' : 'Show'} duplicate checker
				</button>

				{showDuplicateCheck && (
					<div className="mt-3 space-y-2">
						<textarea
							value={duplicateCheckContent}
							onChange={(e) => setDuplicateCheckContent(e.target.value)}
							placeholder="Enter content to check for duplicates..."
							className="w-full p-2 border rounded"
							rows={3}
						/>
						<button
							onClick={handleCheckDuplicates}
							disabled={!duplicateCheckContent.trim() || checkDuplicates.isPending}
							className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
						>
							{checkDuplicates.isPending ? 'Checking...' : 'Check Duplicates'}
						</button>

						{checkDuplicates.data && (
							<div className="mt-3 p-3 bg-gray-50 rounded">
								{checkDuplicates.data.hasPotentialDuplicates ? (
									<div>
										<p className="font-medium text-orange-600">
											Potential duplicates found:
										</p>
										<ul className="mt-2 space-y-1">
											{checkDuplicates.data.similarStatements.map((item: any, idx: number) => (
												<li key={idx} className="text-sm">
													<span className="font-medium">
														{Math.round(item.similarity * 100)}% similar:
													</span>{' '}
													{item.reason}
												</li>
											))}
										</ul>
										{checkDuplicates.data.suggestions.length > 0 && (
											<div className="mt-3">
												<p className="font-medium">Suggestions:</p>
												<ul className="list-disc list-inside text-sm">
													{checkDuplicates.data.suggestions.map((suggestion: string, idx: number) => (
														<li key={idx}>{suggestion}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								) : (
									<p className="text-green-600">No duplicates found!</p>
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Review Suggestions */}
			<div className="border-t pt-4">
				<h3 className="font-medium mb-2">Review Suggestions</h3>
				{reviewSuggestions.isLoading && <p className="text-sm">Loading suggestions...</p>}
				{reviewSuggestions.data && reviewSuggestions.data.statementsToReview.length > 0 && (
					<div className="space-y-2">
						{reviewSuggestions.data.reasons.map((item: any) => (
							<div key={item.statementId} className="p-3 bg-yellow-50 rounded text-sm">
								<p className="text-gray-700">{item.reason}</p>
							</div>
						))}
					</div>
				)}
				{reviewSuggestions.data && reviewSuggestions.data.statementsToReview.length === 0 && (
					<p className="text-sm text-gray-500">No statements need review at this time</p>
				)}
			</div>
		</div>
	);
}