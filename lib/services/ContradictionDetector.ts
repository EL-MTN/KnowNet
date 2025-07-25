import { ContradictionPair, KnowledgeNetwork, Statement } from '../core';

export class ContradictionDetector {
	constructor(private network: KnowledgeNetwork) {}

	detectContradictions(): ContradictionPair[] {
		const contradictions: ContradictionPair[] = [];
		const statements = this.network.getAllStatements();

		for (let i = 0; i < statements.length; i++) {
			for (let j = i + 1; j < statements.length; j++) {
				const contradiction = this.checkForContradiction(
					statements[i],
					statements[j],
				);
				if (contradiction) {
					contradictions.push(contradiction);
				}
			}
		}

		return contradictions;
	}

	private checkForContradiction(
		stmt1: Statement,
		stmt2: Statement,
	): ContradictionPair | null {
		const directContradiction = this.checkDirectContradiction(stmt1, stmt2);
		if (directContradiction) {
			return directContradiction;
		}

		const negationContradiction = this.checkNegationContradiction(
			stmt1,
			stmt2,
		);
		if (negationContradiction) {
			return negationContradiction;
		}

		const semanticContradiction = this.checkSemanticContradiction(
			stmt1,
			stmt2,
		);
		if (semanticContradiction) {
			return semanticContradiction;
		}

		return null;
	}

	private checkDirectContradiction(
		stmt1: Statement,
		stmt2: Statement,
	): ContradictionPair | null {
		const content1 = this.normalizeContent(stmt1.content);
		const content2 = this.normalizeContent(stmt2.content);

		if (content1 === content2 && stmt1.type === stmt2.type) {
			return null;
		}

		const opposites = [
			['true', 'false'],
			['always', 'never'],
			['all', 'none'],
			['possible', 'impossible'],
			['necessary', 'unnecessary'],
			['exist', 'not exist'],
			['exists', 'does not exist'],
		];

		for (const [word1, word2] of opposites) {
			if (
				(content1.includes(word1) && content2.includes(word2)) ||
				(content1.includes(word2) && content2.includes(word1))
			) {
				const restOfContent1 = content1
					.replace(word1, '')
					.replace(word2, '');
				const restOfContent2 = content2
					.replace(word1, '')
					.replace(word2, '');

				if (this.areSimilar(restOfContent1, restOfContent2)) {
					return {
						statement1: stmt1,
						statement2: stmt2,
						reason: `Opposing terms: "${word1}" vs "${word2}"`,
						severity: 'high',
					};
				}
			}
		}

		return null;
	}

	private checkNegationContradiction(
		stmt1: Statement,
		stmt2: Statement,
	): ContradictionPair | null {
		const content1 = this.normalizeContent(stmt1.content);
		const content2 = this.normalizeContent(stmt2.content);

		const negationPatterns = [
			{ positive: /^(.+)$/, negative: /^not (.+)$/ },
			{ positive: /^(.+)$/, negative: /^no (.+)$/ },
			{ positive: /^(.+) is (.+)$/, negative: /^(.+) is not (.+)$/ },
			{ positive: /^(.+) are (.+)$/, negative: /^(.+) are not (.+)$/ },
			{ positive: /^(.+) can (.+)$/, negative: /^(.+) cannot (.+)$/ },
			{ positive: /^(.+) will (.+)$/, negative: /^(.+) will not (.+)$/ },
		];

		for (const { positive, negative } of negationPatterns) {
			const match1Positive = content1.match(positive);
			const match1Negative = content1.match(negative);
			const match2Positive = content2.match(positive);
			const match2Negative = content2.match(negative);

			if (match1Positive && match2Negative) {
				const core1 = match1Positive[1];
				const core2 = match2Negative[1];
				if (this.areSimilar(core1, core2)) {
					return {
						statement1: stmt1,
						statement2: stmt2,
						reason: 'Direct negation pattern detected',
						severity: 'high',
					};
				}
			}

			if (match1Negative && match2Positive) {
				const core1 = match1Negative[1];
				const core2 = match2Positive[1];
				if (this.areSimilar(core1, core2)) {
					return {
						statement1: stmt1,
						statement2: stmt2,
						reason: 'Direct negation pattern detected',
						severity: 'high',
					};
				}
			}
		}

		return null;
	}

	private checkSemanticContradiction(
		stmt1: Statement,
		stmt2: Statement,
	): ContradictionPair | null {
		const content1 = this.normalizeContent(stmt1.content);
		const content2 = this.normalizeContent(stmt2.content);

		const contradictoryPairs = [
			['increase', 'decrease'],
			['rise', 'fall'],
			['grow', 'shrink'],
			['expand', 'contract'],
			['strengthen', 'weaken'],
			['improve', 'worsen'],
			['accelerate', 'decelerate'],
			['positive', 'negative'],
			['benefit', 'harm'],
			['help', 'hinder'],
			['support', 'oppose'],
			['agree', 'disagree'],
			['accept', 'reject'],
			['allow', 'forbid'],
			['permit', 'prohibit'],
		];

		for (const [term1, term2] of contradictoryPairs) {
			const hasTerm1In1 = content1.includes(term1);
			const hasTerm2In1 = content1.includes(term2);
			const hasTerm1In2 = content2.includes(term1);
			const hasTerm2In2 = content2.includes(term2);

			if ((hasTerm1In1 && hasTerm2In2) || (hasTerm2In1 && hasTerm1In2)) {
				const similarity = this.calculateSimilarity(
					content1.replace(term1, '').replace(term2, ''),
					content2.replace(term1, '').replace(term2, ''),
				);

				if (similarity > 0.7) {
					return {
						statement1: stmt1,
						statement2: stmt2,
						reason: `Contradictory terms: "${term1}" vs "${term2}"`,
						severity: 'medium',
					};
				}
			}
		}

		return null;
	}

	checkNewStatementForContradictions(
		newStatement: Statement,
	): ContradictionPair[] {
		const contradictions: ContradictionPair[] = [];
		const existingStatements = this.network.getAllStatements();

		for (const existing of existingStatements) {
			const contradiction = this.checkForContradiction(
				newStatement,
				existing,
			);
			if (contradiction) {
				contradictions.push(contradiction);
			}
		}

		return contradictions;
	}

	private normalizeContent(content: string): string {
		return content
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	private areSimilar(str1: string, str2: string): boolean {
		const normalized1 = this.normalizeContent(str1);
		const normalized2 = this.normalizeContent(str2);

		if (normalized1 === normalized2) {
			return true;
		}

		const similarity = this.calculateSimilarity(normalized1, normalized2);
		return similarity > 0.8;
	}

	private calculateSimilarity(str1: string, str2: string): number {
		const words1 = new Set(str1.split(' ').filter((w) => w.length > 2));
		const words2 = new Set(str2.split(' ').filter((w) => w.length > 2));

		if (words1.size === 0 || words2.size === 0) {
			return 0;
		}

		const intersection = new Set([...words1].filter((w) => words2.has(w)));
		const union = new Set([...words1, ...words2]);

		return intersection.size / union.size;
	}

	getContradictionReport(): string {
		const contradictions = this.detectContradictions();

		if (contradictions.length === 0) {
			return 'No contradictions detected in the knowledge network.';
		}

		let report = `Found ${contradictions.length} potential contradictions:\n\n`;

		contradictions.forEach((contradiction, index) => {
			report += `${index + 1}. ${contradiction.reason} (Severity: ${contradiction.severity})\n`;
			report += `   Statement 1 [${contradiction.statement1.type}]: "${contradiction.statement1.content}"\n`;
			report += `   Statement 2 [${contradiction.statement2.type}]: "${contradiction.statement2.content}"\n\n`;
		});

		return report;
	}
}
