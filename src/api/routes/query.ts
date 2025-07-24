import { Router, Request, Response } from 'express';
import { KnowledgeNetwork, QueryOptions, Statement } from '../../core';
import { QueryService, ContradictionDetector } from '../../services';

export function createQueryRoutes(network: KnowledgeNetwork): Router {
	const router = Router();
	const queryService = new QueryService(network);
	const contradictionDetector = new ContradictionDetector(network);

	// Search statements
	router.post('/search', (req: Request, res: Response) => {
		const { type, tags, content, confidence, derivedFrom } = req.body;

		const options: QueryOptions = {
			type,
			tags,
			content,
			derivedFrom,
		};

		// Handle confidence range
		if (confidence) {
			options.minConfidence = confidence.min;
			// Note: maxConfidence doesn't exist in QueryOptions, would need to filter results
		}

		// Use advancedQuery method which exists in QueryService
		const queryResult = queryService.advancedQuery(options);
		const results = queryResult.statements;

		res.json({
			total: results.length,
			results: results.map(stmt => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				confidence: stmt.confidence,
				tags: stmt.tags,
				derivedFrom: stmt.derivedFrom,
				createdAt: stmt.createdAt,
				updatedAt: stmt.updatedAt,
			})),
		});
	});

	// Get statistics
	router.get('/stats', (_req: Request, res: Response) => {
		// Use getStatementSummary which is the actual method
		const stats = queryService.getStatementSummary();
		res.json(stats);
	});

	// Get orphaned statements
	router.get('/orphans', (_req: Request, res: Response) => {
		const orphans = queryService.getOrphanedStatements();
		res.json({
			total: orphans.length,
			statements: orphans.map(stmt => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				confidence: stmt.confidence,
				tags: stmt.tags,
			})),
		});
	});

	// Get most derived statements
	router.get('/most-derived', (req: Request, res: Response) => {
		const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
		const mostDerived = queryService.getMostDerivedStatements(limit);
		
		res.json({
			total: mostDerived.length,
			statements: mostDerived.map(stmt => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				dependentCount: network.getDependents(stmt.id).length,
			})),
		});
	});

	// Get deepest statements
	router.get('/deepest', (req: Request, res: Response) => {
		const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
		const deepest = queryService.getDeepestStatements(limit);
		
		res.json({
			total: deepest.length,
			statements: deepest.map((stmt) => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				// Calculate depth using DerivationEngine
				depth: new (require('../../core')).DerivationEngine(network).getDerivationDepth(stmt.id),
			})),
		});
	});

	// Check contradictions
	router.get('/contradictions', (_req: Request, res: Response) => {
		const contradictions = contradictionDetector.detectContradictions();
		
		res.json({
			total: contradictions.length,
			contradictions: contradictions.map(c => ({
				severity: c.severity,
				statements: [{
					id: c.statement1.id,
					type: c.statement1.type,
					content: c.statement1.content,
				}, {
					id: c.statement2.id,
					type: c.statement2.type,
					content: c.statement2.content,
				}],
				reason: c.reason,
			})),
		});
	});

	// Find shortest path between statements
	router.get('/path/:fromId/:toId', (req: Request, res: Response) => {
		const { fromId, toId } = req.params;
		const path = queryService.getDerivationPath(fromId, toId);

		if (!path) {
			res.json({
				found: false,
				path: null,
			});
		} else {
			res.json({
				found: true,
				length: path.length,
				path: path.map(stmt => ({
					id: stmt.id,
					type: stmt.type,
					content: stmt.content,
				})),
			});
		}
	});

	// Get related statements
	router.get('/related/:id', (req: Request, res: Response) => {
		const { id } = req.params;
		// maxDistance parameter removed as getRelatedStatements doesn't use it

		// getRelatedStatements only takes one parameter
		const relatedResult = queryService.getRelatedStatements(id);

		// Combine all related statements
		const allRelated = [
			...relatedResult.parents,
			...relatedResult.children,
			...relatedResult.siblings
		];

		res.json({
			total: allRelated.length,
			statements: allRelated.map((stmt: Statement) => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				tags: stmt.tags,
			})),
			detailed: {
				parents: relatedResult.parents.length,
				children: relatedResult.children.length,
				siblings: relatedResult.siblings.length,
			},
		});
	});

	// Tag analytics
	router.get('/tags/analytics', (_req: Request, res: Response) => {
		// Use getAllTags which is the actual method
		const analytics = queryService.getAllTags();
		res.json({
			totalTags: analytics.length,
			tags: analytics,
		});
	});

	return router;
}