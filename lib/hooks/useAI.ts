import { useMutation, useQuery } from '@tanstack/react-query';
import { StatementType } from '@/lib/core/types';

interface GenerateTheoryRequest {
	sourceStatementIds: string[];
	count?: number;
}

interface CheckDuplicatesRequest {
	content: string;
	type?: StatementType;
	tags?: string[];
}

interface KnowledgeContextRequest {
	query: string;
	tags?: string[];
}

export function useGenerateTheory() {
	return useMutation({
		mutationFn: async ({
			sourceStatementIds,
			count = 1,
		}: GenerateTheoryRequest) => {
			const response = await fetch('/api/ai/generate-theory', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceStatementIds, count }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to generate theory');
			}

			return response.json();
		},
	});
}

export function useCheckDuplicates() {
	return useMutation({
		mutationFn: async ({
			content,
			type = 'theory',
			tags = [],
		}: CheckDuplicatesRequest) => {
			const response = await fetch('/api/ai/check-duplicates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, type, tags }),
			});

			if (!response.ok) {
				throw new Error('Failed to check duplicates');
			}

			return response.json();
		},
	});
}

export function useKnowledgeContext() {
	return useMutation({
		mutationFn: async ({ query, tags = [] }: KnowledgeContextRequest) => {
			const response = await fetch('/api/ai/knowledge-context', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, tags }),
			});

			if (!response.ok) {
				throw new Error('Failed to get knowledge context');
			}

			return response.json();
		},
	});
}

export function useSuggestRelatedKnowledge(statementId: string | undefined) {
	return useQuery({
		queryKey: ['ai', 'related', statementId],
		queryFn: async () => {
			if (!statementId) return { suggestions: [] };

			const response = await fetch('/api/ai/suggest-related', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ statementId }),
			});

			if (!response.ok) {
				throw new Error('Failed to get related knowledge');
			}

			return response.json();
		},
		enabled: !!statementId,
	});
}

export function useReviewSuggestions() {
	return useQuery({
		queryKey: ['ai', 'review-suggestions'],
		queryFn: async () => {
			const response = await fetch('/api/ai/review-suggestions');

			if (!response.ok) {
				throw new Error('Failed to get review suggestions');
			}

			return response.json();
		},
	});
}

export function useSuggestDerivations(statementId: string | undefined) {
	return useQuery({
		queryKey: ['ai', 'derivations', statementId],
		queryFn: async () => {
			if (!statementId) return { suggestions: [] };

			const response = await fetch('/api/ai/suggest-derivations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ statementId }),
			});

			if (!response.ok) {
				throw new Error('Failed to get derivation suggestions');
			}

			return response.json();
		},
		enabled: !!statementId,
	});
}
