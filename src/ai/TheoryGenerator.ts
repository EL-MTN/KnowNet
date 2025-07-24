import { AICompletionService } from './AICompletionService';
import { KnowledgeNetwork, Statement, StatementType } from '../core';

export interface GenerationRequest {
	sourceStatements: Statement[];
	prompt?: string;
	targetType?: StatementType;
}

export interface GeneratedTheory {
	content: string;
	suggestedTags: string[];
	suggestedConfidence: number;
	reasoning: string;
}

export class TheoryGenerator {
	private aiService: AICompletionService;

	constructor(private network: KnowledgeNetwork) {
		this.aiService = new AICompletionService();
	}

	async generateTheory(request: GenerationRequest): Promise<GeneratedTheory> {
		const { sourceStatements } = request;

		if (sourceStatements.length === 0) {
			throw new Error('At least one source statement is required');
		}

		const generatedContent = await this.aiService.generateTheoryCompletion({
			sourceStatements,
		});

		return generatedContent;
	}

	async generateMultipleTheories(
		sourceStatements: Statement[],
		count: number = 3,
	): Promise<GeneratedTheory[]> {
		const theories: GeneratedTheory[] = [];

		for (let i = 0; i < count; i++) {
			const theory = await this.generateTheory({
				sourceStatements,
				prompt: `Generate theory ${i + 1} of ${count}`,
			});
			theories.push(theory);
		}

		return theories;
	}

	suggestDerivations(statementId: string): Statement[] {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			return [];
		}

		const relatedStatements = this.network
			.query({
				tags: statement.tags,
			})
			.filter((s) => s.id !== statementId);

		const suggestions: Statement[] = [];

		for (const related of relatedStatements) {
			if (this.couldDeriveFrom(statement, related)) {
				suggestions.push(related);
			}
		}

		return suggestions.slice(0, 5);
	}

	private couldDeriveFrom(target: Statement, source: Statement): boolean {
		if (target.type === 'axiom') {
			return false;
		}

		const ancestors = new Set<string>();
		const collectAncestors = (id: string) => {
			const stmt = this.network.getStatement(id);
			if (stmt) {
				stmt.derivedFrom.forEach((parentId) => {
					ancestors.add(parentId);
					collectAncestors(parentId);
				});
			}
		};
		collectAncestors(target.id);

		if (ancestors.has(source.id)) {
			return false;
		}

		const sharedTags = target.tags.filter((tag) =>
			source.tags.includes(tag),
		);
		return sharedTags.length > 0;
	}
}
