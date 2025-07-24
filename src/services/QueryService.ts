import {
	DerivationEngine,
	KnowledgeNetwork,
	QueryOptions,
	Statement,
	StatementType,
} from '../core';

export interface QueryResult {
	statements: Statement[];
	count: number;
	query: QueryOptions;
}

export interface RelatedStatementsResult {
	parents: Statement[];
	children: Statement[];
	siblings: Statement[];
}

export class QueryService {
	private derivationEngine: DerivationEngine;

	constructor(private network: KnowledgeNetwork) {
		this.derivationEngine = new DerivationEngine(network);
	}

	search(query: string): QueryResult {
		const queryOptions: QueryOptions = {
			content: query,
		};

		const statements = this.network.query(queryOptions);

		return {
			statements,
			count: statements.length,
			query: queryOptions,
		};
	}

	advancedQuery(options: QueryOptions): QueryResult {
		const statements = this.network.query(options);

		return {
			statements,
			count: statements.length,
			query: options,
		};
	}

	getByTags(tags: string[], matchAll: boolean = false): Statement[] {
		const allStatements = this.network.getAllStatements();

		return allStatements.filter((statement) => {
			if (matchAll) {
				return tags.every((tag) => statement.tags.includes(tag));
			} else {
				return tags.some((tag) => statement.tags.includes(tag));
			}
		});
	}

	getRelatedStatements(statementId: string): RelatedStatementsResult {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			return {
				parents: [],
				children: [],
				siblings: [],
			};
		}

		const parents: Statement[] = [];
		for (const id of statement.derivedFrom) {
			const parent = this.network.getStatement(id);
			if (parent) {
				parents.push(parent);
			}
		}

		const children = this.network.getDependents(statementId);

		const siblings: Statement[] = [];
		const siblingsSet = new Set<string>();

		for (const parentId of statement.derivedFrom) {
			const parentChildren = this.network.getDependents(parentId);
			for (const sibling of parentChildren) {
				if (
					sibling.id !== statementId &&
					!siblingsSet.has(sibling.id)
				) {
					siblingsSet.add(sibling.id);
					siblings.push(sibling);
				}
			}
		}

		return {
			parents,
			children,
			siblings,
		};
	}

	getDerivationPath(fromId: string, toId: string): Statement[] | null {
		const path = this.derivationEngine.findShortestPath(fromId, toId);
		if (!path) {
			return null;
		}

		const statements: Statement[] = [];
		for (const id of path) {
			const stmt = this.network.getStatement(id);
			if (stmt) {
				statements.push(stmt);
			}
		}
		return statements;
	}

	getStatementsByConfidenceRange(min: number, max: number): Statement[] {
		const allStatements = this.network.getAllStatements();

		return allStatements.filter((statement) => {
			const confidence =
				statement.confidence ??
				this.derivationEngine.calculateConfidence(statement.id);
			return (
				confidence !== undefined &&
				confidence >= min &&
				confidence <= max
			);
		});
	}

	getMostDerivedStatements(limit: number = 10): Statement[] {
		const allStatements = this.network.getAllStatements();

		const statementsWithDependents = allStatements.map((statement) => ({
			statement,
			dependentsCount: this.network.getDependents(statement.id).length,
		}));

		statementsWithDependents.sort(
			(a, b) => b.dependentsCount - a.dependentsCount,
		);

		return statementsWithDependents
			.slice(0, limit)
			.map((item) => item.statement);
	}

	getDeepestStatements(limit: number = 10): Statement[] {
		const allStatements = this.network.getAllStatements();

		const statementsWithDepth = allStatements.map((statement) => ({
			statement,
			depth: this.derivationEngine.getDerivationDepth(statement.id),
		}));

		statementsWithDepth.sort((a, b) => b.depth - a.depth);

		return statementsWithDepth
			.slice(0, limit)
			.map((item) => item.statement);
	}

	getOrphanedStatements(): Statement[] {
		const allStatements = this.network.getAllStatements();

		return allStatements.filter((statement) => {
			if (statement.type === 'axiom') {
				return false;
			}

			const hasNoDependents =
				this.network.getDependents(statement.id).length === 0;

			return hasNoDependents;
		});
	}

	getAllTags(): { tag: string; count: number }[] {
		const tagCounts = new Map<string, number>();
		const allStatements = this.network.getAllStatements();

		for (const statement of allStatements) {
			for (const tag of statement.tags) {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			}
		}

		return Array.from(tagCounts.entries())
			.map(([tag, count]) => ({ tag, count }))
			.sort((a, b) => b.count - a.count);
	}

	getStatementSummary(): {
		total: number;
		byType: Record<StatementType, number>;
		withConfidence: number;
		avgConfidence: number | null;
		avgDerivationDepth: number;
		totalTags: number;
	} {
		const allStatements = this.network.getAllStatements();
		const byType: Record<StatementType, number> = {
			axiom: 0,
			theory: 0,
			conclusion: 0,
		};

		let totalConfidence = 0;
		let withConfidence = 0;
		let totalDepth = 0;

		for (const statement of allStatements) {
			byType[statement.type]++;

			const confidence =
				statement.confidence ??
				this.derivationEngine.calculateConfidence(statement.id);
			if (confidence !== undefined) {
				totalConfidence += confidence;
				withConfidence++;
			}

			totalDepth += this.derivationEngine.getDerivationDepth(
				statement.id,
			);
		}

		const allTags = this.getAllTags();

		return {
			total: allStatements.length,
			byType,
			withConfidence,
			avgConfidence:
				withConfidence > 0 ? totalConfidence / withConfidence : null,
			avgDerivationDepth:
				allStatements.length > 0
					? totalDepth / allStatements.length
					: 0,
			totalTags: allTags.length,
		};
	}
}
