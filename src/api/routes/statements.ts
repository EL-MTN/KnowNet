import { Router, Request, Response, NextFunction } from 'express';
import { KnowledgeNetwork, Statement, StatementType } from '../../core';
import { StorageService } from '../../services';
import { ApiError } from '../middleware/errorHandler';

export function createStatementRoutes(
	network: KnowledgeNetwork,
	storageService: StorageService
): Router {
	const router = Router();

	// Get all statements
	router.get('/', (_req: Request, res: Response) => {
		const statements = network.getAllStatements();
		res.json({
			total: statements.length,
			statements: statements.map(formatStatement),
		});
	});

	// Get a single statement by ID
	router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
		const { id } = req.params;
		const statement = network.getStatement(id);

		if (!statement) {
			const error: ApiError = new Error('Statement not found');
			error.statusCode = 404;
			return next(error);
		}

		res.json(formatStatementWithRelations(statement, network));
	});

	// Create a new statement
	router.post('/', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { type, content, confidence, tags, derivedFrom } = req.body;

			// Validate required fields
			if (!type || !content) {
				const error: ApiError = new Error('Missing required fields: type and content');
				error.statusCode = 400;
				throw error;
			}

			// Validate type
			if (!['axiom', 'theory'].includes(type)) {
				const error: ApiError = new Error('Invalid statement type. Must be "axiom" or "theory"');
				error.statusCode = 400;
				throw error;
			}

			// Create statement
			const statement = new Statement(type as StatementType, content, {
				confidence,
				tags: tags || [],
				derivedFrom: derivedFrom || [],
			});

			// Add to network
			network.addStatement(statement);

			// Save to storage
			await storageService.save(network);

			res.status(201).json({
				message: 'Statement created successfully',
				statement: formatStatement(statement),
			});
		} catch (error) {
			next(error);
		}
	});

	// Update a statement
	router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const updates = req.body;

			const statement = network.getStatement(id);
			if (!statement) {
				const error: ApiError = new Error('Statement not found');
				error.statusCode = 404;
				throw error;
			}

			// Update the statement
			network.updateStatement(id, updates);

			// Save to storage
			await storageService.save(network);

			const updatedStatement = network.getStatement(id)!;
			res.json({
				message: 'Statement updated successfully',
				statement: formatStatement(updatedStatement),
			});
		} catch (error) {
			next(error);
		}
	});

	// Delete a statement
	router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;

			const statement = network.getStatement(id);
			if (!statement) {
				const error: ApiError = new Error('Statement not found');
				error.statusCode = 404;
				throw error;
			}

			// Check for dependents
			const dependents = network.getDependents(id);
			if (dependents.length > 0) {
				const error: ApiError = new Error('Cannot delete statement with dependents');
				error.statusCode = 400;
				error.details = {
					dependentCount: dependents.length,
					dependentIds: dependents.map(d => d.id),
				};
				throw error;
			}

			// Delete the statement
			network.deleteStatement(id);

			// Save to storage
			await storageService.save(network);

			res.json({
				message: 'Statement deleted successfully',
				id,
			});
		} catch (error) {
			next(error);
		}
	});

	// Get statement derivation chain
	router.get('/:id/chain', (req: Request, res: Response, next: NextFunction) => {
		const { id } = req.params;
		const statement = network.getStatement(id);

		if (!statement) {
			const error: ApiError = new Error('Statement not found');
			error.statusCode = 404;
			return next(error);
		}

		const DerivationEngine = require('../../core').DerivationEngine;
		const engine = new DerivationEngine(network);
		const chain = engine.getDerivationChain(id);
		res.json({
			chain: chain ? formatDerivationChain(chain) : null,
		});
	});

	// Get statement dependents
	router.get('/:id/dependents', (req: Request, res: Response, next: NextFunction) => {
		const { id } = req.params;
		const statement = network.getStatement(id);

		if (!statement) {
			const error: ApiError = new Error('Statement not found');
			error.statusCode = 404;
			return next(error);
		}

		const dependents = network.getDependents(id);
		res.json({
			total: dependents.length,
			dependents: dependents.map(formatStatement),
		});
	});

	return router;
}

// Helper functions to format responses
function formatStatement(statement: Statement) {
	return {
		id: statement.id,
		type: statement.type,
		content: statement.content,
		confidence: statement.confidence,
		tags: statement.tags,
		derivedFrom: statement.derivedFrom,
		createdAt: statement.createdAt,
		updatedAt: statement.updatedAt,
	};
}

function formatStatementWithRelations(statement: Statement, network: KnowledgeNetwork) {
	const formatted: any = formatStatement(statement);
	
	// Add parent statements
	formatted.parents = statement.derivedFrom.map(id => {
		const parent = network.getStatement(id);
		return parent ? {
			id: parent.id,
			type: parent.type,
			content: parent.content,
		} : null;
	}).filter(Boolean);

	// Add dependent statements
	const dependents = network.getDependents(statement.id);
	formatted.dependents = dependents.map(dep => ({
		id: dep.id,
		type: dep.type,
		content: dep.content,
	}));

	return formatted;
}

function formatDerivationChain(chain: any): any {
	return {
		statementId: chain.statementId,
		statement: formatStatement(chain.statement),
		parents: chain.parents.map(formatDerivationChain),
	};
}