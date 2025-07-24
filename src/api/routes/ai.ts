import { Router, Request, Response, NextFunction } from 'express';
import { KnowledgeNetwork, Statement } from '../../core';
import { TheoryGenerator, KnowledgeAssistant, SimilarStatement } from '../../ai';
import { ApiError } from '../middleware/errorHandler';

export function createAIRoutes(network: KnowledgeNetwork): Router {
	const router = Router();

	// Generate theory from source statements
	router.post('/generate-theory', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { sourceStatementIds } = req.body;

			if (!sourceStatementIds || !Array.isArray(sourceStatementIds) || sourceStatementIds.length === 0) {
				const error: ApiError = new Error('sourceStatementIds array is required');
				error.statusCode = 400;
				throw error;
			}

			// Validate all source statements exist
			const sourceStatements = sourceStatementIds.map(id => {
				const stmt = network.getStatement(id);
				if (!stmt) {
					const error: ApiError = new Error(`Statement not found: ${id}`);
					error.statusCode = 404;
					throw error;
				}
				return stmt;
			});

			const generator = new TheoryGenerator(network);
			const result = await generator.generateTheory({
				sourceStatements,
				// context is not part of GenerationRequest interface
			});

			res.json({
				generated: result,
				sourceStatements: sourceStatements.map(s => ({
					id: s.id,
					type: s.type,
					content: s.content,
				})),
			});
		} catch (error) {
			next(error);
		}
	});

	// Check for duplicates
	router.post('/check-duplicates', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { content } = req.body;

			if (!content) {
				const error: ApiError = new Error('content is required');
				error.statusCode = 400;
				throw error;
			}

			const assistant = new KnowledgeAssistant(network);
			// Use checkForDuplicates which is the actual method
			const duplicateResult = await assistant.checkForDuplicates(
				content,
				'theory', // default type
				[] // empty tags
			);

			res.json({
				hasDuplicates: duplicateResult.hasPotentialDuplicates,
				duplicates: duplicateResult.similarStatements.map((d: SimilarStatement) => ({
					statement: {
						id: d.statement.id,
						type: d.statement.type,
						content: d.statement.content,
						tags: d.statement.tags,
					},
					similarity: d.similarity,
					reason: d.reason,
				})),
				suggestions: duplicateResult.suggestions,
			});
		} catch (error) {
			next(error);
		}
	});

	// Get knowledge context
	router.post('/knowledge-context', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { query } = req.body;

			if (!query) {
				const error: ApiError = new Error('query is required');
				error.statusCode = 400;
				throw error;
			}

			const assistant = new KnowledgeAssistant(network);
			// getKnowledgeContext takes query and tags array, not maxResults
			const context = await assistant.getKnowledgeContext(
				query,
				[] // empty tags array
			);

			res.json(context);
		} catch (error) {
			next(error);
		}
	});

	// Get AI suggestions for review
	router.get('/review-suggestions', async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const assistant = new KnowledgeAssistant(network);
			// Use getReviewSuggestions which is the actual method
			const result = await assistant.getReviewSuggestions();

			res.json({
				total: result.statementsToReview.length,
				suggestions: result.statementsToReview.map((s: Statement) => ({
					statement: {
						id: s.id,
						type: s.type,
						content: s.content,
						confidence: s.confidence,
						tags: s.tags,
						createdAt: s.createdAt,
						updatedAt: s.updatedAt,
					},
					reason: result.reasons.get(s.id) || 'No specific reason',
					priority: s.confidence && s.confidence < 0.5 ? 'high' : 'medium',
				})),
			});
		} catch (error) {
			next(error);
		}
	});

	// Generate multiple theories (batch)
	router.post('/generate-theories-batch', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { count, sourceStatementIds } = req.body;
			const numTheories = count || 3;

			if (!sourceStatementIds || !Array.isArray(sourceStatementIds) || sourceStatementIds.length === 0) {
				const error: ApiError = new Error('sourceStatementIds array is required');
				error.statusCode = 400;
				throw error;
			}

			// Validate all source statements exist
			const sourceStatements = sourceStatementIds.map(id => {
				const stmt = network.getStatement(id);
				if (!stmt) {
					const error: ApiError = new Error(`Statement not found: ${id}`);
					error.statusCode = 404;
					throw error;
				}
				return stmt;
			});

			const generator = new TheoryGenerator(network);
			const theories = [];

			// Generate multiple theories
			for (let i = 0; i < numTheories; i++) {
				const result = await generator.generateTheory({
					sourceStatements,
					// temperature is not part of GenerationRequest interface
				});
				theories.push(result);
			}

			res.json({
				count: theories.length,
				theories,
				sourceStatements: sourceStatements.map(s => ({
					id: s.id,
					type: s.type,
					content: s.content,
				})),
			});
		} catch (error) {
			next(error);
		}
	});

	// Analyze statement relationships
	router.post('/analyze-relationships', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { statementId } = req.body;

			if (!statementId) {
				const error: ApiError = new Error('statementId is required');
				error.statusCode = 400;
				throw error;
			}

			const statement = network.getStatement(statementId);
			if (!statement) {
				const error: ApiError = new Error('Statement not found');
				error.statusCode = 404;
				throw error;
			}

			const assistant = new KnowledgeAssistant(network);
			
			// Get related knowledge
			const relatedKnowledge = await assistant.getKnowledgeContext(
				statement.content,
				statement.tags // use statement tags instead of maxResults
			);

			// Get potential gaps
			const gaps = relatedKnowledge.gaps;

			// Get derivation chain depth
			const derivationEngine = new (await import('../../core')).DerivationEngine(network);
			const chain = derivationEngine.getDerivationChain(statementId);
			const depth = chain ? calculateDepth(chain) : 0;

			res.json({
				statement: {
					id: statement.id,
					type: statement.type,
					content: statement.content,
				},
				analysis: {
					derivationDepth: depth,
					parentCount: statement.derivedFrom.length,
					dependentCount: network.getDependents(statementId).length,
					relatedStatements: relatedKnowledge.relatedByDerivation.length,
					potentialGaps: gaps,
				},
				relatedKnowledge,
			});
		} catch (error) {
			next(error);
		}
	});

	return router;
}

// Helper function to calculate chain depth
function calculateDepth(chain: any): number {
	if (!chain.parents || chain.parents.length === 0) return 0;
	return 1 + Math.max(...chain.parents.map((p: any) => calculateDepth(p)));
}