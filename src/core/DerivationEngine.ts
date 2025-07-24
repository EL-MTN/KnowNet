import { KnowledgeNetwork } from './KnowledgeNetwork';
import { Statement } from './Statement';
import { DerivationChain } from './types';

export class DerivationEngine {
	constructor(private network: KnowledgeNetwork) {}

	getDerivationChain(statementId: string): DerivationChain | null {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			return null;
		}

		return this.buildChain(statement);
	}

	private buildChain(statement: Statement): DerivationChain {
		const parents: DerivationChain[] = [];

		for (const parentId of statement.derivedFrom) {
			const parentStatement = this.network.getStatement(parentId);
			if (parentStatement) {
				parents.push(this.buildChain(parentStatement));
			}
		}

		return {
			statementId: statement.id,
			statement: statement,
			parents: parents,
		};
	}

	getAllAncestors(statementId: string): Set<string> {
		const ancestors = new Set<string>();
		const visited = new Set<string>();

		const collectAncestors = (id: string) => {
			if (visited.has(id)) {
				return;
			}
			visited.add(id);

			const statement = this.network.getStatement(id);
			if (!statement) {
				return;
			}

			for (const parentId of statement.derivedFrom) {
				ancestors.add(parentId);
				collectAncestors(parentId);
			}
		};

		collectAncestors(statementId);
		return ancestors;
	}

	getAllDescendants(statementId: string): Set<string> {
		const descendants = new Set<string>();
		const visited = new Set<string>();

		const collectDescendants = (id: string) => {
			if (visited.has(id)) {
				return;
			}
			visited.add(id);

			const dependents = this.network.getDependents(id);
			for (const dependent of dependents) {
				descendants.add(dependent.id);
				collectDescendants(dependent.id);
			}
		};

		collectDescendants(statementId);
		return descendants;
	}

	getImpactAnalysis(statementId: string): {
		directDependents: Statement[];
		allDependents: Statement[];
		axiomRoots: Statement[];
	} {
		const directDependents = this.network.getDependents(statementId);
		const allDependentIds = this.getAllDescendants(statementId);
		const allDependents = Array.from(allDependentIds)
			.map((id) => this.network.getStatement(id))
			.filter((s): s is Statement => s !== undefined);

		const ancestors = this.getAllAncestors(statementId);
		const axiomRoots = Array.from(ancestors)
			.map((id) => this.network.getStatement(id))
			.filter(
				(s): s is Statement => s !== undefined && s.type === 'axiom',
			);

		return {
			directDependents,
			allDependents,
			axiomRoots,
		};
	}

	calculateConfidence(statementId: string): number | undefined {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			return undefined;
		}

		if (statement.confidence !== undefined) {
			return statement.confidence;
		}

		if (statement.type === 'axiom') {
			return 1.0;
		}

		if (statement.derivedFrom.length === 0) {
			return undefined;
		}

		const parentConfidences: number[] = [];
		for (const parentId of statement.derivedFrom) {
			const parentConfidence = this.calculateConfidence(parentId);
			if (parentConfidence !== undefined) {
				parentConfidences.push(parentConfidence);
			}
		}

		if (parentConfidences.length === 0) {
			return undefined;
		}

		return Math.min(...parentConfidences) * 0.95;
	}

	findShortestPath(fromId: string, toId: string): string[] | null {
		const visited = new Set<string>();
		const queue: { id: string; path: string[] }[] = [
			{ id: fromId, path: [fromId] },
		];

		while (queue.length > 0) {
			const { id, path } = queue.shift()!;

			if (id === toId) {
				return path;
			}

			if (visited.has(id)) {
				continue;
			}
			visited.add(id);

			const statement = this.network.getStatement(id);
			if (!statement) {
				continue;
			}

			for (const parentId of statement.derivedFrom) {
				queue.push({ id: parentId, path: [...path, parentId] });
			}

			const dependents = this.network.getDependents(id);
			for (const dependent of dependents) {
				queue.push({ id: dependent.id, path: [...path, dependent.id] });
			}
		}

		return null;
	}

	getDerivationDepth(statementId: string): number {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			return -1;
		}

		if (statement.type === 'axiom' || statement.derivedFrom.length === 0) {
			return 0;
		}

		const parentDepths = statement.derivedFrom.map((parentId) =>
			this.getDerivationDepth(parentId),
		);

		return Math.max(...parentDepths) + 1;
	}
}
