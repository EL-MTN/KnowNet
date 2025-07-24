import { Statement } from './Statement';
import {
	Statement as IStatement,
	KnowledgeNetworkData,
	QueryOptions,
	StatementType,
} from './types';

export class KnowledgeNetwork {
	private statements: Map<string, Statement>;
	private derivationMap: Map<string, Set<string>>;

	constructor() {
		this.statements = new Map();
		this.derivationMap = new Map();
	}

	addStatement(statement: Statement): void {
		if (this.statements.has(statement.id)) {
			throw new Error(`Statement with id ${statement.id} already exists`);
		}

		this.validateDerivations(statement);
		this.checkForCircularDependencies(statement);

		this.statements.set(statement.id, statement);

		for (const parentId of statement.derivedFrom) {
			if (!this.derivationMap.has(parentId)) {
				this.derivationMap.set(parentId, new Set());
			}
			this.derivationMap.get(parentId)!.add(statement.id);
		}
	}

	getStatement(id: string): Statement | undefined {
		return this.statements.get(id);
	}

	updateStatement(
		id: string,
		updates: Partial<Omit<IStatement, 'id' | 'createdAt'>>,
	): void {
		const statement = this.statements.get(id);
		if (!statement) {
			throw new Error(`Statement with id ${id} not found`);
		}

		const oldDerivedFrom = [...statement.derivedFrom];
		statement.update(updates);

		if (updates.derivedFrom) {
			this.validateDerivations(statement);
			this.checkForCircularDependencies(statement);

			for (const parentId of oldDerivedFrom) {
				this.derivationMap.get(parentId)?.delete(id);
				if (this.derivationMap.get(parentId)?.size === 0) {
					this.derivationMap.delete(parentId);
				}
			}

			for (const parentId of statement.derivedFrom) {
				if (!this.derivationMap.has(parentId)) {
					this.derivationMap.set(parentId, new Set());
				}
				this.derivationMap.get(parentId)!.add(statement.id);
			}
		}
	}

	deleteStatement(id: string): void {
		const statement = this.statements.get(id);
		if (!statement) {
			throw new Error(`Statement with id ${id} not found`);
		}

		const dependents = this.derivationMap.get(id);
		if (dependents && dependents.size > 0) {
			throw new Error(
				`Cannot delete statement ${id} because it has ${dependents.size} dependent statements`,
			);
		}

		for (const parentId of statement.derivedFrom) {
			this.derivationMap.get(parentId)?.delete(id);
			if (this.derivationMap.get(parentId)?.size === 0) {
				this.derivationMap.delete(parentId);
			}
		}

		this.statements.delete(id);
	}

	getAllStatements(): Statement[] {
		return Array.from(this.statements.values());
	}

	getStatementsByType(type: StatementType): Statement[] {
		return Array.from(this.statements.values()).filter(
			(s) => s.type === type,
		);
	}

	getDependents(statementId: string): Statement[] {
		const dependentIds = this.derivationMap.get(statementId);
		if (!dependentIds) {
			return [];
		}
		return Array.from(dependentIds)
			.map((id) => this.statements.get(id))
			.filter((s): s is Statement => s !== undefined);
	}

	query(options: QueryOptions): Statement[] {
		let results = Array.from(this.statements.values());

		if (options.type) {
			results = results.filter((s) => s.type === options.type);
		}

		if (options.tags && options.tags.length > 0) {
			results = results.filter((s) =>
				options.tags!.some((tag) => s.tags.includes(tag)),
			);
		}

		if (options.content) {
			const searchTerm = options.content.toLowerCase();
			results = results.filter((s) =>
				s.content.toLowerCase().includes(searchTerm),
			);
		}

		if (options.derivedFrom && options.derivedFrom.length > 0) {
			results = results.filter((s) =>
				options.derivedFrom!.some((id) => s.derivedFrom.includes(id)),
			);
		}

		if (options.minConfidence !== undefined) {
			results = results.filter(
				(s) =>
					s.confidence !== undefined &&
					s.confidence >= options.minConfidence!,
			);
		}

		return results;
	}

	private validateDerivations(statement: Statement): void {
		for (const parentId of statement.derivedFrom) {
			if (!this.statements.has(parentId)) {
				throw new Error(`Parent statement ${parentId} not found`);
			}
		}
	}

	private checkForCircularDependencies(statement: Statement): void {
		const visited = new Set<string>();
		const stack = new Set<string>();

		const hasCycle = (id: string): boolean => {
			if (stack.has(id)) {
				return true;
			}
			if (visited.has(id)) {
				return false;
			}

			visited.add(id);
			stack.add(id);

			const stmt = this.statements.get(id);
			if (stmt) {
				for (const parentId of stmt.derivedFrom) {
					if (hasCycle(parentId)) {
						return true;
					}
				}
			}

			stack.delete(id);
			return false;
		};

		stack.add(statement.id);
		for (const parentId of statement.derivedFrom) {
			if (hasCycle(parentId)) {
				throw new Error('Circular dependency detected');
			}
		}
	}

	toJSON(): KnowledgeNetworkData {
		return {
			statements: Array.from(this.statements.values()).map((s) =>
				s.toJSON(),
			),
			metadata: {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				totalStatements: this.statements.size,
				axioms: this.getStatementsByType('axiom').length,
				theories: this.getStatementsByType('theory').length,
			},
		};
	}

	static fromJSON(data: KnowledgeNetworkData): KnowledgeNetwork {
		const network = new KnowledgeNetwork();

		if (!data.statements || !Array.isArray(data.statements)) {
			throw new Error('Invalid knowledge network data');
		}

		const statements = data.statements.map((s: IStatement) =>
			Statement.fromJSON(s),
		);

		statements.sort(
			(a: Statement, b: Statement) =>
				a.derivedFrom.length - b.derivedFrom.length,
		);

		for (const statement of statements) {
			network.addStatement(statement);
		}

		return network;
	}
}
