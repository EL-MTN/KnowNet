'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatementCard } from './StatementCard';
import {
	MagnifyingGlassIcon,
	DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useCheckDuplicates } from '@/lib/hooks/useAI';

export function SearchPanel() {
	const [searchParams, setSearchParams] = useState({
		content: '',
		type: '',
		tags: '',
		minConfidence: '',
		maxConfidence: '',
	});

	const [duplicateCheckContent, setDuplicateCheckContent] = useState('');
	const [showDuplicateChecker, setShowDuplicateChecker] = useState(false);

	const checkDuplicates = useCheckDuplicates();

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['search', searchParams],
		queryFn: async () => {
			const response = await fetch('/api/query/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: searchParams.content || undefined,
					type: searchParams.type || undefined,
					tags: searchParams.tags
						? searchParams.tags.split(',').map((t) => t.trim())
						: undefined,
					minConfidence: searchParams.minConfidence
						? parseFloat(searchParams.minConfidence)
						: undefined,
					maxConfidence: searchParams.maxConfidence
						? parseFloat(searchParams.maxConfidence)
						: undefined,
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

	const handleReset = () => {
		setSearchParams({
			content: '',
			type: '',
			tags: '',
			minConfidence: '',
			maxConfidence: '',
		});
	};

	const handleCheckDuplicates = async () => {
		if (!duplicateCheckContent.trim()) {
			alert('Please enter content to check');
			return;
		}

		try {
			await checkDuplicates.mutateAsync({
				content: duplicateCheckContent,
			});
		} catch (error) {
			console.error('Failed to check duplicates:', error);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="border-b bg-white px-6 py-4">
				<h1 className="text-2xl font-semibold">Search & Filter</h1>
				<p className="text-sm text-gray-600 mt-1">
					Advanced search across your knowledge base
				</p>
			</div>

			<div className="flex-1 overflow-y-auto p-6 bg-gray-50">
				<div className="max-w-4xl mx-auto">
					<form
						onSubmit={handleSearch}
						className="bg-white border rounded-lg p-6 space-y-4 mb-6"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Content Search */}
							<div className="md:col-span-2">
								<label className="block text-sm font-medium mb-2">
									Search Content
								</label>
								<div className="relative">
									<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="text"
										value={searchParams.content}
										onChange={(e) =>
											setSearchParams({
												...searchParams,
												content: e.target.value,
											})
										}
										className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
										placeholder="Search in statement content..."
									/>
								</div>
							</div>

							{/* Type Filter */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Statement Type
								</label>
								<select
									value={searchParams.type}
									onChange={(e) =>
										setSearchParams({
											...searchParams,
											type: e.target.value,
										})
									}
									className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="">All types</option>
									<option value="axiom">Axioms only</option>
									<option value="theory">
										Theories only
									</option>
								</select>
							</div>

							{/* Tags */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Tags
								</label>
								<input
									type="text"
									value={searchParams.tags}
									onChange={(e) =>
										setSearchParams({
											...searchParams,
											tags: e.target.value,
										})
									}
									className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="philosophy, ethics"
								/>
							</div>

							{/* Confidence Range */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Min Confidence
								</label>
								<input
									type="number"
									min="0"
									max="1"
									step="0.1"
									value={searchParams.minConfidence}
									onChange={(e) =>
										setSearchParams({
											...searchParams,
											minConfidence: e.target.value,
										})
									}
									className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="0.0"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
									Max Confidence
								</label>
								<input
									type="number"
									min="0"
									max="1"
									step="0.1"
									value={searchParams.maxConfidence}
									onChange={(e) =>
										setSearchParams({
											...searchParams,
											maxConfidence: e.target.value,
										})
									}
									className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
									placeholder="1.0"
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-3 pt-2">
							<button
								type="submit"
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
							>
								Search
							</button>
							<button
								type="button"
								onClick={handleReset}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
							>
								Reset
							</button>
						</div>
					</form>

					{/* Duplicate Checker */}
					<div className="bg-white border rounded-lg p-6 mb-6">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<DocumentDuplicateIcon className="w-5 h-5 text-gray-600" />
								<h3 className="text-lg font-semibold">
									Duplicate Checker
								</h3>
							</div>
							<button
								onClick={() =>
									setShowDuplicateChecker(
										!showDuplicateChecker,
									)
								}
								className="text-sm text-blue-500 hover:underline"
							>
								{showDuplicateChecker ? 'Hide' : 'Show'}
							</button>
						</div>

						{showDuplicateChecker && (
							<div className="space-y-3">
								<p className="text-sm text-gray-600">
									Check if similar statements already exist in
									your knowledge base
								</p>
								<textarea
									value={duplicateCheckContent}
									onChange={(e) =>
										setDuplicateCheckContent(e.target.value)
									}
									placeholder="Enter statement content to check for duplicates..."
									className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
									rows={3}
								/>
								<div className="flex gap-2">
									<button
										onClick={handleCheckDuplicates}
										disabled={checkDuplicates.isPending}
										className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
									>
										{checkDuplicates.isPending
											? 'Checking...'
											: 'Check for Duplicates'}
									</button>
									{duplicateCheckContent && (
										<button
											onClick={() =>
												setDuplicateCheckContent('')
											}
											className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
										>
											Clear
										</button>
									)}
								</div>

								{/* Duplicate Results */}
								{checkDuplicates.data && (
									<div className="mt-4 p-4 bg-gray-50 rounded-lg">
										<h4 className="font-medium mb-2">
											{checkDuplicates.data
												.similarStatements.length > 0
												? `Found ${checkDuplicates.data.similarStatements.length} similar statement(s):`
												: 'No similar statements found'}
										</h4>
										{checkDuplicates.data.similarStatements
											.length > 0 && (
											<div className="space-y-2 mt-3">
												{checkDuplicates.data.similarStatements.map(
													(
														stmt: any,
														index: number,
													) => (
														<div
															key={index}
															className="p-3 bg-white rounded border"
														>
															<div className="flex items-center justify-between mb-1">
																<span
																	className={`px-2 py-0.5 rounded text-xs font-medium ${
																		stmt.type ===
																		'axiom'
																			? 'bg-blue-100 text-blue-700'
																			: 'bg-green-100 text-green-700'
																	}`}
																>
																	{stmt.type}
																</span>
																<span className="text-sm text-gray-500">
																	Similarity:{' '}
																	{(
																		stmt.similarity *
																		100
																	).toFixed(
																		0,
																	)}
																	%
																</span>
															</div>
															<p className="text-sm">
																{stmt.content}
															</p>
															{stmt.tags &&
																stmt.tags
																	.length >
																	0 && (
																	<div className="mt-2 flex gap-1">
																		{stmt.tags.map(
																			(
																				tag: string,
																			) => (
																				<span
																					key={
																						tag
																					}
																					className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
																				>
																					{
																						tag
																					}
																				</span>
																			),
																		)}
																	</div>
																)}
														</div>
													),
												)}
											</div>
										)}
									</div>
								)}

								{checkDuplicates.error && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
										Failed to check for duplicates. Please
										try again.
									</div>
								)}
							</div>
						)}
					</div>

					{/* Results */}
					{isLoading && (
						<div className="text-center py-8">
							<div className="inline-flex items-center gap-2 text-gray-500">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
								Searching...
							</div>
						</div>
					)}

					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
							Search failed. Please try again.
						</div>
					)}

					{data && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">
									Results ({data.total})
								</h3>
								{data.total > 0 && (
									<p className="text-sm text-gray-600">
										Found {data.total} matching statement
										{data.total !== 1 ? 's' : ''}
									</p>
								)}
							</div>

							{data.total === 0 ? (
								<div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
									No statements match your search criteria.
								</div>
							) : (
								<div className="space-y-4">
									{data.results.map((statement: any) => (
										<StatementCard
											key={statement.id}
											statement={statement}
											showRelationships={false}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
