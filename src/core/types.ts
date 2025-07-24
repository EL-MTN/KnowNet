export type StatementType = 'axiom' | 'theory' | 'conclusion';

export interface Statement {
	id: string;
	type: StatementType;
	content: string;
	confidence?: number;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
	derivedFrom: string[];
}

export interface DerivationChain {
	statementId: string;
	statement: Statement;
	parents: DerivationChain[];
}

export interface QueryOptions {
	type?: StatementType;
	tags?: string[];
	content?: string;
	derivedFrom?: string[];
	minConfidence?: number;
}

export interface ContradictionPair {
	statement1: Statement;
	statement2: Statement;
	reason: string;
	severity: 'high' | 'medium' | 'low';
}

export interface KnowledgeNetworkData {
	statements: Statement[];
	metadata: {
		version: string;
		exportedAt: string;
		totalStatements: number;
		axioms: number;
		theories: number;
		conclusions: number;
	};
}
