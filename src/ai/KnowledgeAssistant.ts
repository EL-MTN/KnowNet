import {
	DerivationChain,
	DerivationEngine,
	KnowledgeNetwork,
	StatementType,
} from '../core';
import { Statement } from '../core/Statement';
import { QueryService } from '../services';

export interface SimilarStatement {
	statement: Statement;
	similarity: number;
	reason: string;
}

export interface DuplicateCheckResult {
	hasPotentialDuplicates: boolean;
	similarStatements: SimilarStatement[];
	suggestions: string[];
}

export interface KnowledgeContext {
	recentStatements: Statement[];
	relatedByTags: Statement[];
	relatedByDerivation: Statement[];
	gaps: string[];
}

export class KnowledgeAssistant {
	private queryService: QueryService;

	constructor(private network: KnowledgeNetwork) {
		this.queryService = new QueryService(network);
	}

	/**
	 * Checks if a new statement might be a duplicate of existing knowledge
	 */
	async checkForDuplicates(
		content: string,
		_type: StatementType,
		tags: string[] = [],
	): Promise<DuplicateCheckResult> {
		const result: DuplicateCheckResult = {
			hasPotentialDuplicates: false,
			similarStatements: [],
			suggestions: [],
		};

		// Search for similar content
		const existingStatements = this.network.getAllStatements();

		for (const statement of existingStatements) {
			const similarity = this.calculateSimilarity(
				content,
				statement.content,
				tags,
				statement.tags,
			);

			if (similarity > 0.7) {
				result.hasPotentialDuplicates = true;
				result.similarStatements.push({
					statement,
					similarity,
					reason: this.explainSimilarity(
						content,
						statement,
						similarity,
					),
				});
			}
		}

		// Sort by similarity
		result.similarStatements.sort((a, b) => b.similarity - a.similarity);

		// Generate suggestions
		if (result.hasPotentialDuplicates) {
			result.suggestions = this.generateSuggestions(
				content,
				result.similarStatements,
			);
		}

		return result;
	}

	/**
	 * Get contextual knowledge related to a topic or statement
	 */
	async getKnowledgeContext(
		query: string,
		tags: string[] = [],
	): Promise<KnowledgeContext> {
		const context: KnowledgeContext = {
			recentStatements: [],
			relatedByTags: [],
			relatedByDerivation: [],
			gaps: [],
		};

		// Get recent statements
		const allStatements = this.network.getAllStatements();
		context.recentStatements = allStatements
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.slice(0, 5);

		// Get related by tags
		if (tags.length > 0) {
			context.relatedByTags = this.queryService.advancedQuery({
				tags,
			}).statements;
		}

		// Search for related content
		const searchResults = this.queryService.advancedQuery({
			content: query,
		});
		const relatedIds = new Set<string>();

		for (const stmt of searchResults.statements) {
			// Add statements that derive from this one
			const dependents = this.network.getDependents(stmt.id);
			dependents.forEach((dep) => relatedIds.add(dep.id));

			// Add statements this derives from
			stmt.derivedFrom.forEach((id) => relatedIds.add(id));
		}

		context.relatedByDerivation = Array.from(relatedIds)
			.map((id) => this.network.getStatement(id))
			.filter((stmt): stmt is Statement => stmt !== null);

		// Identify knowledge gaps
		context.gaps = this.identifyGaps(query, tags, allStatements);

		return context;
	}

	/**
	 * Suggest related statements that might be worth reviewing
	 */
	async suggestRelatedKnowledge(statementId: string): Promise<Statement[]> {
		const statement = this.network.getStatement(statementId);
		if (!statement) return [];

		const suggestions = new Set<Statement>();

		// 1. Statements with overlapping tags
		const tagRelated = this.queryService
			.advancedQuery({
				tags: statement.tags,
			})
			.statements.filter((s) => s.id !== statementId);

		tagRelated.slice(0, 3).forEach((s) => suggestions.add(s));

		// 2. Statements in the same derivation chain
		const derivationEngine = new DerivationEngine(this.network);
		const chain = derivationEngine.getDerivationChain(statementId);
		if (chain) {
			this.collectChainStatements(chain, suggestions, statementId);
		}

		// 3. Statements that might conflict
		const potentialConflicts = this.findPotentialConflicts(statement);
		potentialConflicts.forEach((s) => suggestions.add(s));

		return Array.from(suggestions).slice(0, 10);
	}

	/**
	 * AI-powered knowledge review suggestions
	 */
	async getReviewSuggestions(): Promise<{
		statementsToReview: Statement[];
		reasons: Map<string, string>;
	}> {
		const suggestions: Statement[] = [];
		const reasons = new Map<string, string>();

		const allStatements = this.network.getAllStatements();

		// 1. Low confidence statements that have high-confidence dependents
		for (const stmt of allStatements) {
			if (stmt.confidence && stmt.confidence < 0.5) {
				const dependents = this.network.getDependents(stmt.id);
				const hasHighConfidenceDependents = dependents.some(
					(dep) => dep.confidence && dep.confidence > 0.8,
				);

				if (hasHighConfidenceDependents) {
					suggestions.push(stmt);
					reasons.set(
						stmt.id,
						'Low confidence statement with high confidence dependents - may need strengthening',
					);
				}
			}
		}

		// 2. Old axioms that might need reconsideration
		const oldAxioms = allStatements
			.filter((s) => s.type === 'axiom')
			.filter((s) => {
				const age = Date.now() - s.createdAt.getTime();
				return age > 30 * 24 * 60 * 60 * 1000; // 30 days
			});

		oldAxioms.slice(0, 3).forEach((axiom) => {
			suggestions.push(axiom);
			reasons.set(
				axiom.id,
				'Axiom is over 30 days old - consider if it still holds true',
			);
		});

		// 3. Isolated statements (no derivations or dependents)
		const isolatedStatements = allStatements.filter((stmt) => {
			const hasDependents =
				this.network.getDependents(stmt.id).length > 0;
			const hasDerivations = stmt.derivedFrom.length > 0;
			return !hasDependents && !hasDerivations && stmt.type !== 'axiom';
		});

		isolatedStatements.slice(0, 2).forEach((stmt) => {
			suggestions.push(stmt);
			reasons.set(
				stmt.id,
				'Isolated statement - consider connecting to other knowledge',
			);
		});

		return { statementsToReview: suggestions, reasons };
	}

	// Helper methods

	private extractKeywords(content: string): string[] {
		// Simple keyword extraction - in production, would use NLP
		return content
			.toLowerCase()
			.split(/\W+/)
			.filter((word) => word.length > 3)
			.filter(
				(word) =>
					!['this', 'that', 'with', 'from', 'have', 'been'].includes(
						word,
					),
			);
	}

	private calculateSimilarity(
		content1: string,
		content2: string,
		tags1: string[],
		tags2: string[],
	): number {
		const words1 = new Set(this.extractKeywords(content1));
		const words2 = new Set(this.extractKeywords(content2));

		// Calculate word overlap
		const intersection = new Set([...words1].filter((x) => words2.has(x)));
		const union = new Set([...words1, ...words2]);

		const contentSimilarity = intersection.size / union.size;

		// Calculate tag overlap
		const tagIntersection = tags1.filter((t) => tags2.includes(t)).length;
		const tagUnion = new Set([...tags1, ...tags2]).size;
		const tagSimilarity = tagUnion > 0 ? tagIntersection / tagUnion : 0;

		// Weighted average
		return contentSimilarity * 0.7 + tagSimilarity * 0.3;
	}

	private explainSimilarity(
		newContent: string,
		existing: Statement,
		similarity: number,
	): string {
		const sharedWords = this.extractKeywords(newContent).filter((word) =>
			existing.content.toLowerCase().includes(word),
		);

		if (similarity > 0.9) {
			return `Nearly identical content (${Math.round(similarity * 100)}% similar)`;
		} else if (sharedWords.length > 3) {
			return `Shares key concepts: ${sharedWords.slice(0, 3).join(', ')}`;
		} else {
			return `Similar theme and structure`;
		}
	}

	private generateSuggestions(
		content: string,
		similar: SimilarStatement[],
	): string[] {
		const suggestions: string[] = [];

		if (similar.some((s) => s.similarity > 0.9)) {
			suggestions.push(
				'This appears to be a duplicate. Consider updating the existing statement instead.',
			);
		} else if (similar.length > 0) {
			suggestions.push(
				'Consider linking this as a derivation of existing knowledge.',
			);
			suggestions.push(
				'You might want to differentiate this more clearly from existing statements.',
			);
		}

		const hasConflict = similar.some((s) =>
			this.detectPotentialConflict(content, s.statement.content),
		);

		if (hasConflict) {
			suggestions.push(
				'This might conflict with existing beliefs. Consider adding as a theory to explore.',
			);
		}

		return suggestions;
	}

	private detectPotentialConflict(
		content1: string,
		content2: string,
	): boolean {
		// Simple conflict detection - look for negation patterns
		const negationWords = [
			'not',
			'never',
			'no',
			'cannot',
			"don't",
			"doesn't",
			"isn't",
		];

		const words1 = this.extractKeywords(content1);
		const words2 = this.extractKeywords(content2);

		const hasNegation1 = words1.some((w) => negationWords.includes(w));
		const hasNegation2 = words2.some((w) => negationWords.includes(w));

		// If one has negation and they share keywords, might be conflict
		if (hasNegation1 !== hasNegation2) {
			const sharedWords = words1.filter((w) => words2.includes(w));
			return sharedWords.length > 2;
		}

		return false;
	}

	private identifyGaps(
		_query: string,
		tags: string[],
		statements: Statement[],
	): string[] {
		const gaps: string[] = [];

		// Check for missing fundamental statements
		if (tags.includes('conclusion') || tags.includes('theory')) {
			const hasAxioms = statements.some(
				(s) =>
					s.type === 'axiom' && s.tags.some((t) => tags.includes(t)),
			);

			if (!hasAxioms) {
				gaps.push(
					'No axioms found for this topic - consider adding fundamental beliefs',
				);
			}
		}

		// Check for incomplete chains
		const theories = statements.filter(
			(s) => s.type === 'theory' && s.derivedFrom.length === 0,
		);
		if (theories.length > 0) {
			gaps.push(
				`${theories.length} theories without derivations - consider linking to sources`,
			);
		}

		return gaps;
	}

	private collectChainStatements(
		chain: DerivationChain,
		collection: Set<Statement>,
		excludeId: string,
	): void {
		if (chain.statement.id !== excludeId) {
			// Get the full Statement object from the network
			const fullStatement = this.network.getStatement(chain.statement.id);
			if (fullStatement) {
				collection.add(fullStatement);
			}
		}

		if (chain.parents) {
			chain.parents.forEach((parent: DerivationChain) =>
				this.collectChainStatements(parent, collection, excludeId),
			);
		}
	}

	private findPotentialConflicts(statement: Statement): Statement[] {
		const conflicts: Statement[] = [];
		const allStatements = this.network.getAllStatements();

		for (const other of allStatements) {
			if (other.id === statement.id) continue;

			// Check for semantic opposition
			if (
				this.detectPotentialConflict(statement.content, other.content)
			) {
				conflicts.push(other);
			}
		}

		return conflicts.slice(0, 3);
	}
}
