'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCheckDuplicates } from '@/lib/hooks/useAI';

interface AddStatementModalProps {
	isOpen: boolean;
	onClose: () => void;
	preSelectedStatements?: any[];
	generatedContent?: {
		content: string;
		tags: string[];
		confidence: number;
		reasoning?: string;
	};
}

export function AddStatementModal({
	isOpen,
	onClose,
	preSelectedStatements = [],
	generatedContent,
}: AddStatementModalProps) {
	const [type, setType] = useState<'axiom' | 'theory'>('axiom');
	const [content, setContent] = useState('');
	const [confidence, setConfidence] = useState('');
	const [tags, setTags] = useState('');
	const [selectedParents, setSelectedParents] = useState<string[]>([]);
	const [parentSearch, setParentSearch] = useState('');
	const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

	const queryClient = useQueryClient();
	const checkDuplicates = useCheckDuplicates();

	// Load all statements for parent selection
	const { data: statements } = useQuery({
		queryKey: ['statements'],
		queryFn: async () => {
			const response = await fetch('/api/statements');
			if (!response.ok) throw new Error('Failed to fetch statements');
			return response.json();
		},
	});

	// Initialize with generated content if provided
	useEffect(() => {
		if (generatedContent) {
			setContent(generatedContent.content || '');
			setTags(
				Array.isArray(generatedContent.tags)
					? generatedContent.tags.join(', ')
					: '',
			);
			setConfidence(
				generatedContent.confidence
					? generatedContent.confidence.toString()
					: '',
			);
			setType('theory');
		}
	}, [generatedContent]);

	// Initialize with pre-selected statements
	useEffect(() => {
		if (preSelectedStatements.length > 0) {
			setSelectedParents(preSelectedStatements.map((s) => s.id));
			setType('theory');
		}
	}, [preSelectedStatements]);

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
			handleClose();
		},
	});

	const handleClose = () => {
		setContent('');
		setConfidence('');
		setTags('');
		setSelectedParents([]);
		setType('axiom');
		setParentSearch('');
		setShowDuplicateWarning(false);
		onClose();
	};

	const handleContentChange = async (value: string) => {
		setContent(value);

		// Check for duplicates as user types (debounced)
		if (value.length > 20) {
			const result = await checkDuplicates.mutateAsync({
				content: value,
				type,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
			});

			setShowDuplicateWarning(result.hasPotentialDuplicates);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const data: any = {
			type,
			content,
			tags: tags
				? tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: [],
		};

		if (confidence) {
			data.confidence = parseFloat(confidence);
		}

		if (type === 'theory' && selectedParents.length > 0) {
			data.derivedFrom = selectedParents;
		}

		mutation.mutate(data);
	};

	const filteredStatements = statements?.statements?.filter(
		(stmt: any) =>
			stmt.content.toLowerCase().includes(parentSearch.toLowerCase()) ||
			stmt.tags.some((tag: string) =>
				tag.toLowerCase().includes(parentSearch.toLowerCase()),
			),
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-xl font-semibold">Add New Statement</h2>
					<button
						onClick={handleClose}
						className="p-1 hover:bg-gray-100 rounded"
					>
						<XMarkIcon className="w-6 h-6" />
					</button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto p-6"
				>
					<div className="space-y-4">
						{/* Type Selection */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Type
							</label>
							<div className="flex gap-4">
								<label className="flex items-center">
									<input
										type="radio"
										value="axiom"
										checked={type === 'axiom'}
										onChange={(e) =>
											setType(e.target.value as 'axiom')
										}
										className="mr-2"
									/>
									<span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
										Axiom
									</span>
									<span className="ml-2 text-sm text-gray-600">
										Fundamental belief
									</span>
								</label>
								<label className="flex items-center">
									<input
										type="radio"
										value="theory"
										checked={type === 'theory'}
										onChange={(e) =>
											setType(e.target.value as 'theory')
										}
										className="mr-2"
									/>
									<span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
										Theory
									</span>
									<span className="ml-2 text-sm text-gray-600">
										Derived statement
									</span>
								</label>
							</div>
						</div>

						{/* Content */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Content <span className="text-red-500">*</span>
							</label>
							<textarea
								value={content}
								onChange={(e) =>
									handleContentChange(e.target.value)
								}
								required
								className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows={4}
								placeholder="Enter your statement..."
							/>
							{showDuplicateWarning && (
								<p className="mt-1 text-sm text-orange-600">
									⚠️ This might be similar to existing
									statements
								</p>
							)}
						</div>

						{/* Parent Selection for Theories */}
						{type === 'theory' && (
							<div>
								<label className="block text-sm font-medium mb-2">
									Derived From
									{selectedParents.length === 0 && (
										<span className="ml-2 text-gray-500 font-normal">
											(optional)
										</span>
									)}
								</label>

								{/* Search */}
								<div className="relative mb-2">
									<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="text"
										value={parentSearch}
										onChange={(e) =>
											setParentSearch(e.target.value)
										}
										placeholder="Search statements..."
										className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								{/* Statement List */}
								<div className="border rounded-lg max-h-48 overflow-y-auto">
									{filteredStatements?.map((stmt: any) => (
										<label
											key={stmt.id}
											className="flex items-start p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
										>
											<input
												type="checkbox"
												checked={selectedParents.includes(
													stmt.id,
												)}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedParents([
															...selectedParents,
															stmt.id,
														]);
													} else {
														setSelectedParents(
															selectedParents.filter(
																(id) =>
																	id !==
																	stmt.id,
															),
														);
													}
												}}
												className="mt-1 mr-3"
											/>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`text-xs px-1 py-0.5 rounded ${
															stmt.type ===
															'axiom'
																? 'bg-blue-50 text-blue-700'
																: 'bg-green-50 text-green-700'
														}`}
													>
														{stmt.type}
													</span>
													{stmt.tags.map(
														(tag: string) => (
															<span
																key={tag}
																className="text-xs text-gray-500"
															>
																#{tag}
															</span>
														),
													)}
												</div>
												<p className="text-sm text-gray-700">
													{stmt.content}
												</p>
											</div>
										</label>
									))}
								</div>
							</div>
						)}

						{/* Confidence */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Confidence
								{type === 'axiom' && (
									<span className="ml-2 text-gray-500 font-normal">
										(optional)
									</span>
								)}
							</label>
							<input
								type="number"
								step="0.1"
								min="0"
								max="1"
								value={confidence}
								onChange={(e) => setConfidence(e.target.value)}
								className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
								placeholder="0.8"
							/>
						</div>

						{/* Tags */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Tags
								<span className="ml-2 text-gray-500 font-normal">
									(comma-separated)
								</span>
							</label>
							<input
								type="text"
								value={tags}
								onChange={(e) => setTags(e.target.value)}
								className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
								placeholder="philosophy, ethics, science"
							/>
						</div>

						{generatedContent?.reasoning && (
							<div className="p-3 bg-blue-50 rounded-lg">
								<p className="text-sm text-blue-700">
									<strong>AI Reasoning:</strong>{' '}
									{generatedContent.reasoning}
								</p>
							</div>
						)}
					</div>
				</form>

				{/* Footer */}
				<div className="flex justify-end gap-3 p-6 border-t">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={mutation.isPending || !content.trim()}
						className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
					>
						{mutation.isPending
							? 'Creating...'
							: 'Create Statement'}
					</button>
				</div>
			</div>
		</div>
	);
}
