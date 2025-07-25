'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	PencilIcon,
	TrashIcon,
	LinkIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CheckIcon,
	XMarkIcon,
	SparklesIcon,
} from '@heroicons/react/24/outline';

interface StatementCardProps {
	statement: {
		id: string;
		type: 'axiom' | 'theory';
		content: string;
		confidence?: number;
		tags: string[];
		derivedFrom: string[];
		createdAt: string;
		updatedAt: string;
	};
	isSelected?: boolean;
	onSelect?: (selected: boolean) => void;
	showRelationships?: boolean;
}

export function StatementCard({
	statement,
	isSelected = false,
	onSelect,
	showRelationships = true,
}: StatementCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(statement.content);
	const [editTags, setEditTags] = useState(statement.tags.join(', '));
	const [editConfidence, setEditConfidence] = useState(
		statement.confidence?.toString() || '',
	);
	const [showDetails, setShowDetails] = useState(false);
	const [isLoadingRelations, setIsLoadingRelations] = useState(false);
	const [relations, setRelations] = useState<any>(null);

	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: async (updates: any) => {
			const response = await fetch(`/api/statements/${statement.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			});
			if (!response.ok) throw new Error('Failed to update');
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['statements'] });
			setIsEditing(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch(`/api/statements/${statement.id}`, {
				method: 'DELETE',
			});
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete statement');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['statements'] });
		},
	});

	const loadRelations = async () => {
		if (relations || isLoadingRelations) return;

		setIsLoadingRelations(true);
		try {
			const response = await fetch(`/api/statements/${statement.id}`);
			if (response.ok) {
				const data = await response.json();
				setRelations(data);
			}
		} catch (error) {
			console.error('Failed to load relations:', error);
		} finally {
			setIsLoadingRelations(false);
		}
	};

	const handleSave = () => {
		const updates: any = {
			content: editContent,
			tags: editTags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		};

		if (editConfidence && statement.type !== 'axiom') {
			updates.confidence = parseFloat(editConfidence);
		}

		updateMutation.mutate(updates);
	};

	const handleCancel = () => {
		setEditContent(statement.content);
		setEditTags(statement.tags.join(', '));
		setEditConfidence(statement.confidence?.toString() || '');
		setIsEditing(false);
	};

	const typeColors = {
		axiom: 'bg-blue-50 text-blue-700 border-blue-200',
		theory: 'bg-green-50 text-green-700 border-green-200',
	};

	const confidenceColor = (confidence: number) => {
		if (confidence >= 0.8) return 'text-green-600';
		if (confidence >= 0.5) return 'text-yellow-600';
		return 'text-red-600';
	};

	return (
		<div
			className={`bg-white rounded-lg border ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'} transition-all`}
		>
			<div className="p-4">
				{/* Header */}
				<div className="flex items-start justify-between mb-3">
					<div className="flex items-center gap-2 flex-1">
						{onSelect && (
							<input
								type="checkbox"
								checked={isSelected}
								onChange={(e) => onSelect(e.target.checked)}
								className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
							/>
						)}
						<span
							className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors[statement.type]}`}
						>
							{statement.type}
						</span>
						{statement.confidence !== undefined && (
							<span
								className={`text-sm font-medium ${confidenceColor(statement.confidence)}`}
							>
								{(statement.confidence * 100).toFixed(0)}%
							</span>
						)}
						{statement.derivedFrom.length > 0 && (
							<LinkIcon
								className="w-4 h-4 text-gray-400"
								title="Has derivations"
							/>
						)}
					</div>

					{!isEditing && (
						<div className="flex items-center gap-1">
							<button
								onClick={() => {
									window.dispatchEvent(
										new CustomEvent('quick-ai-generate', {
											detail: [statement],
										}),
									);
								}}
								className="p-1 hover:bg-blue-50 rounded"
								title="Generate AI Theory"
							>
								<SparklesIcon className="w-4 h-4 text-blue-500" />
							</button>
							<button
								onClick={() => setIsEditing(true)}
								className="p-1 hover:bg-gray-100 rounded"
								title="Edit"
							>
								<PencilIcon className="w-4 h-4 text-gray-500" />
							</button>
							<button
								onClick={() => deleteMutation.mutate()}
								disabled={deleteMutation.isPending}
								className="p-1 hover:bg-red-50 rounded"
								title="Delete"
							>
								<TrashIcon className="w-4 h-4 text-red-500" />
							</button>
						</div>
					)}
				</div>

				{/* Content */}
				{isEditing ? (
					<div className="space-y-3">
						<textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							rows={3}
						/>
						<input
							type="text"
							value={editTags}
							onChange={(e) => setEditTags(e.target.value)}
							placeholder="Tags (comma-separated)"
							className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						{statement.type !== 'axiom' && (
							<input
								type="number"
								value={editConfidence}
								onChange={(e) =>
									setEditConfidence(e.target.value)
								}
								placeholder="Confidence (0-1)"
								min="0"
								max="1"
								step="0.1"
								className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						)}
						<div className="flex gap-2">
							<button
								onClick={handleSave}
								disabled={updateMutation.isPending}
								className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
							>
								<CheckIcon className="w-4 h-4" />
								{updateMutation.isPending
									? 'Saving...'
									: 'Save'}
							</button>
							<button
								onClick={handleCancel}
								className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
							>
								<XMarkIcon className="w-4 h-4" />
								Cancel
							</button>
						</div>
					</div>
				) : (
					<>
						<p className="text-gray-900 mb-3">
							{statement.content}
						</p>

						{/* Tags */}
						{statement.tags.length > 0 && (
							<div className="flex gap-1 flex-wrap mb-3">
								{statement.tags.map((tag) => (
									<span
										key={tag}
										className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 cursor-pointer"
										onClick={() =>
											window.dispatchEvent(
												new CustomEvent('filter-tag', {
													detail: tag,
												}),
											)
										}
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{/* Show More Button */}
						{(showRelationships || showDetails) && (
							<button
								onClick={() => {
									setShowDetails(!showDetails);
									if (!showDetails && showRelationships) {
										loadRelations();
									}
								}}
								className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
							>
								{showDetails ? (
									<ChevronDownIcon className="w-4 h-4" />
								) : (
									<ChevronRightIcon className="w-4 h-4" />
								)}
								{showDetails ? 'Hide' : 'Show'} details
							</button>
						)}
					</>
				)}
			</div>

			{/* Details Section */}
			{showDetails && !isEditing && (
				<div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3 text-sm">
					{/* Relationships */}
					{showRelationships && relations && (
						<>
							{relations.parents &&
								relations.parents.length > 0 && (
									<div>
										<p className="font-medium text-gray-700 mb-1">
											Derived from:
										</p>
										<div className="space-y-1">
											{relations.parents.map(
												(parent: any) => (
													<div
														key={parent.id}
														className="pl-4 py-1 border-l-2 border-blue-300"
													>
														<span
															className={`text-xs px-1 py-0.5 rounded ${typeColors[parent.type as keyof typeof typeColors]}`}
														>
															{parent.type}
														</span>
														<span className="ml-2 text-gray-600">
															{parent.content}
														</span>
													</div>
												),
											)}
										</div>
									</div>
								)}

							{relations.dependents &&
								relations.dependents.length > 0 && (
									<div>
										<p className="font-medium text-gray-700 mb-1">
											Used by:
										</p>
										<div className="space-y-1">
											{relations.dependents.map(
												(dep: any) => (
													<div
														key={dep.id}
														className="pl-4 py-1 border-l-2 border-green-300"
													>
														<span
															className={`text-xs px-1 py-0.5 rounded ${typeColors[dep.type as keyof typeof typeColors]}`}
														>
															{dep.type}
														</span>
														<span className="ml-2 text-gray-600">
															{dep.content}
														</span>
													</div>
												),
											)}
										</div>
									</div>
								)}
						</>
					)}

					{/* Metadata */}
					<div className="text-xs text-gray-500 space-y-1">
						<p>
							Created:{' '}
							{new Date(statement.createdAt).toLocaleString()}
						</p>
						<p>
							Updated:{' '}
							{new Date(statement.updatedAt).toLocaleString()}
						</p>
						<p>ID: {statement.id}</p>
					</div>
				</div>
			)}
		</div>
	);
}
