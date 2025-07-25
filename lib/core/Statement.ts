import { v4 as uuidv4 } from 'uuid';

import { Statement as IStatement, StatementType } from './types';

export class Statement implements IStatement {
	id: string;
	type: StatementType;
	content: string;
	confidence?: number;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
	derivedFrom: string[];

	constructor(
		type: StatementType,
		content: string,
		options?: {
			id?: string;
			confidence?: number;
			tags?: string[];
			derivedFrom?: string[];
			createdAt?: Date;
			updatedAt?: Date;
		},
	) {
		this.id = options?.id || uuidv4();
		this.type = type;
		this.content = content;
		this.confidence = options?.confidence;
		this.tags = options?.tags || [];
		this.derivedFrom = options?.derivedFrom || [];
		this.createdAt = options?.createdAt || new Date();
		this.updatedAt = options?.updatedAt || new Date();

		this.validate();
	}

	private validate(): void {
		if (!this.content || this.content.trim().length === 0) {
			throw new Error('Statement content cannot be empty');
		}

		if (
			this.confidence !== undefined &&
			(this.confidence < 0 || this.confidence > 1)
		) {
			throw new Error('Confidence must be between 0 and 1');
		}

		if (this.type === 'axiom' && this.derivedFrom.length > 0) {
			throw new Error('Axioms cannot be derived from other statements');
		}

		if (this.type === 'theory' && this.derivedFrom.length === 0) {
			throw new Error(
				'Theories must be derived from at least one statement',
			);
		}
	}

	update(updates: Partial<Omit<IStatement, 'id' | 'createdAt'>>): void {
		if (updates.content !== undefined) {
			this.content = updates.content;
		}
		if (updates.confidence !== undefined) {
			this.confidence = updates.confidence;
		}
		if (updates.tags !== undefined) {
			this.tags = updates.tags;
		}
		if (updates.type !== undefined) {
			this.type = updates.type;
		}
		if (updates.derivedFrom !== undefined) {
			this.derivedFrom = updates.derivedFrom;
		}

		this.updatedAt = new Date();
		this.validate();
	}

	toJSON(): IStatement {
		return {
			id: this.id,
			type: this.type,
			content: this.content,
			confidence: this.confidence,
			tags: this.tags,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			derivedFrom: this.derivedFrom,
		};
	}

	static fromJSON(data: IStatement): Statement {
		return new Statement(data.type, data.content, {
			id: data.id,
			confidence: data.confidence,
			tags: data.tags,
			derivedFrom: data.derivedFrom,
			createdAt: new Date(data.createdAt),
			updatedAt: new Date(data.updatedAt),
		});
	}
}
