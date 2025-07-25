'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatementCard } from './StatementCard';
import { AddStatementModal } from './AddStatementModal';
import {
	FunnelIcon,
	PlusIcon,
	ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function KnowledgeBase() {
	const [selectedStatements, setSelectedStatements] = useState<Set<string>>(
		new Set(),
	);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [filter, setFilter] = useState({
		type: 'all',
		tags: [] as string[],
		search: '',
	});
	// Selection mode is always enabled

	const { data, isLoading, refetch } = useQuery({
		queryKey: ['statements', filter],
		queryFn: async () => {
			let url = '/api/statements?';
			if (filter.type !== 'all') url += `type=${filter.type}&`;
			if (filter.tags.length > 0) url += `tags=${filter.tags.join(',')}&`;
			if (filter.search)
				url += `search=${encodeURIComponent(filter.search)}`;

			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch statements');
			return response.json();
		},
	});

	// Listen for custom events
	useEffect(() => {
		const handleAddStatement = () => setIsAddModalOpen(true);
		const handleFilterTag = (e: any) => {
			const tag = e.detail;
			if (!filter.tags.includes(tag)) {
				setFilter({ ...filter, tags: [...filter.tags, tag] });
			}
		};

		window.addEventListener('add-statement', handleAddStatement);
		window.addEventListener('filter-tag', handleFilterTag);

		return () => {
			window.removeEventListener('add-statement', handleAddStatement);
			window.removeEventListener('filter-tag', handleFilterTag);
		};
	}, [filter]);

	const handleSelectStatement = (id: string, selected: boolean) => {
		const newSelection = new Set(selectedStatements);
		if (selected) {
			newSelection.add(id);
		} else {
			newSelection.delete(id);
		}
		setSelectedStatements(newSelection);
	};

	const selectedStatementsArray =
		data?.statements?.filter((s: any) => selectedStatements.has(s.id)) ||
		[];

	const allTags: string[] = Array.from(
		new Set(data?.statements?.flatMap((s: any) => s.tags) || []),
	);

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="border-b bg-white px-6 py-4">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-semibold">Knowledge Base</h1>
					<div className="flex items-center gap-2">
						{selectedStatements.size > 0 && (
							<span className="text-sm text-gray-600">
								{selectedStatements.size} selected
							</span>
						)}
						<button
							onClick={() => refetch()}
							className="p-2 hover:bg-gray-100 rounded-lg"
							title="Refresh"
						>
							<ArrowPathIcon className="w-5 h-5" />
						</button>
						<button
							onClick={() => setIsAddModalOpen(true)}
							className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
						>
							<PlusIcon className="w-5 h-5" />
							Add Statement
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<FunnelIcon className="w-5 h-5 text-gray-400" />
						<select
							value={filter.type}
							onChange={(e) =>
								setFilter({ ...filter, type: e.target.value })
							}
							className="px-3 py-1 border rounded-lg text-sm"
						>
							<option value="all">All Types</option>
							<option value="axiom">Axioms</option>
							<option value="theory">Theories</option>
						</select>
					</div>

					<input
						type="text"
						value={filter.search}
						onChange={(e) =>
							setFilter({ ...filter, search: e.target.value })
						}
						placeholder="Search statements..."
						className="flex-1 px-3 py-1 border rounded-lg text-sm"
					/>

					{filter.tags.length > 0 && (
						<div className="flex items-center gap-1">
							{filter.tags.map((tag) => (
								<span
									key={tag}
									className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1"
								>
									{tag}
									<button
										onClick={() =>
											setFilter({
												...filter,
												tags: filter.tags.filter(
													(t) => t !== tag,
												),
											})
										}
										className="hover:text-blue-900"
									>
										×
									</button>
								</span>
							))}
							<button
								onClick={() =>
									setFilter({ ...filter, tags: [] })
								}
								className="text-xs text-gray-500 hover:text-gray-700"
							>
								Clear all
							</button>
						</div>
					)}
				</div>

				{/* Quick Tag Filters */}
				{allTags.length > 0 && (
					<div className="mt-3 flex items-center gap-2">
						<span className="text-xs text-gray-500">
							Quick filters:
						</span>
						<div className="flex gap-1 flex-wrap">
							{allTags.slice(0, 10).map((tag: string) => (
								<button
									key={tag}
									onClick={() => {
										if (!filter.tags.includes(tag)) {
											setFilter({
												...filter,
												tags: [...filter.tags, tag],
											});
										}
									}}
									className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs"
									disabled={filter.tags.includes(tag)}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6 bg-gray-50">
				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-gray-500">
							Loading statements...
						</div>
					</div>
				) : data?.statements?.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<p className="mb-4">No statements found</p>
						<button
							onClick={() => setIsAddModalOpen(true)}
							className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
						>
							Create your first statement
						</button>
					</div>
				) : (
					<div className="space-y-4 max-w-4xl mx-auto">
						<p className="text-sm text-gray-600">
							{data.total} statement{data.total !== 1 ? 's' : ''}{' '}
							found
						</p>
						{data?.statements?.map((statement: any) => (
							<StatementCard
								key={statement.id}
								statement={statement}
								isSelected={selectedStatements.has(
									statement.id,
								)}
								onSelect={(selected: boolean) =>
									handleSelectStatement(
										statement.id,
										selected,
									)
								}
							/>
						))}
					</div>
				)}
			</div>

			{/* Selection Actions */}
			{selectedStatements.size > 0 && (
				<div className="border-t bg-white px-6 py-3 flex items-center justify-between">
					<span className="text-sm text-gray-600">
						{selectedStatements.size} statement
						{selectedStatements.size !== 1 ? 's' : ''} selected
					</span>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								window.dispatchEvent(
									new CustomEvent('generate-theory', {
										detail: selectedStatementsArray,
									}),
								);
							}}
							className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
						>
							Generate Theory with AI
						</button>
						<button
							onClick={() => setIsAddModalOpen(true)}
							className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
						>
							Create Theory from Selected
						</button>
						<button
							onClick={() => setSelectedStatements(new Set())}
							className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
						>
							Clear Selection
						</button>
					</div>
				</div>
			)}

			{/* Add Statement Modal */}
			<AddStatementModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				preSelectedStatements={selectedStatementsArray}
			/>
		</div>
	);
}
