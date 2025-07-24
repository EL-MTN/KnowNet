import { Router, Request, Response } from 'express';
import { KnowledgeNetwork } from '../../core';
import { GraphVisualizationService } from '../../services';

export function createGraphRoutes(network: KnowledgeNetwork): Router {
	const router = Router();

	// Get graph data for visualization
	router.get('/data', (req: Request, res: Response) => {
		const graphService = new GraphVisualizationService(network);
		const includeOrphans = req.query.includeOrphans !== 'false';
		const maxLabelLength = req.query.maxLabelLength 
			? parseInt(req.query.maxLabelLength as string) 
			: 50;

		const graphData = graphService.generateGraphData({
			includeOrphans,
			maxLabelLength,
		});

		res.json(graphData);
	});

	// Get graph statistics
	router.get('/stats', (_req: Request, res: Response) => {
		const graphService = new GraphVisualizationService(network);
		const stats = graphService.getGraphStats();
		res.json(stats);
	});

	// Export to DOT format
	router.get('/export/dot', (req: Request, res: Response) => {
		const graphService = new GraphVisualizationService(network);
		const title = (req.query.title as string) || 'Knowledge Network';
		const rankdir = (req.query.rankdir as string) || 'TB';
		const includeOrphans = req.query.includeOrphans !== 'false';

		const dot = graphService.exportToDOT({
			title,
			rankdir: rankdir as 'TB' | 'BT' | 'LR' | 'RL',
			includeOrphans,
		});

		// Set headers for file download
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader(
			'Content-Disposition', 
			`attachment; filename="knowledge-graph-${new Date().toISOString().split('T')[0]}.dot"`
		);
		res.send(dot);
	});

	// Get subgraph around a specific node
	router.get('/subgraph/:id', (req: Request, res: Response) => {
		const { id } = req.params;
		const depth = req.query.depth ? parseInt(req.query.depth as string) : 2;

		const statement = network.getStatement(id);
		if (!statement) {
			res.status(404).json({
				error: 'Statement not found',
			});
			return;
		}

		// Get all related statements within the specified depth
		const visited = new Set<string>();
		const nodes = new Map<string, any>();
		const edges: any[] = [];

		function traverse(statementId: string, currentDepth: number) {
			if (currentDepth > depth || visited.has(statementId)) return;
			visited.add(statementId);

			const stmt = network.getStatement(statementId);
			if (!stmt) return;

			// Add node
			nodes.set(statementId, {
				id: stmt.id,
				label: stmt.content.substring(0, 50) + (stmt.content.length > 50 ? '...' : ''),
				type: stmt.type,
				confidence: stmt.confidence,
				tags: stmt.tags,
				depth: currentDepth,
			});

			// Add edges and traverse parents
			for (const parentId of stmt.derivedFrom) {
				edges.push({
					from: parentId,
					to: stmt.id,
					label: 'derives',
				});
				traverse(parentId, currentDepth + 1);
			}

			// Traverse children
			const dependents = network.getDependents(stmt.id);
			for (const dependent of dependents) {
				edges.push({
					from: stmt.id,
					to: dependent.id,
					label: 'derives',
				});
				traverse(dependent.id, currentDepth + 1);
			}
		}

		traverse(id, 0);

		res.json({
			center: id,
			depth,
			nodes: Array.from(nodes.values()),
			edges: edges.filter((edge, index, self) => 
				index === self.findIndex(e => e.from === edge.from && e.to === edge.to)
			),
		});
	});

	// Get node details for graph visualization
	router.get('/node/:id', (req: Request, res: Response) => {
		const { id } = req.params;
		const statement = network.getStatement(id);

		if (!statement) {
			res.status(404).json({
				error: 'Statement not found',
			});
			return;
		}

		const parents = statement.derivedFrom.map(pid => {
			const parent = network.getStatement(pid);
			return parent ? {
				id: parent.id,
				type: parent.type,
				content: parent.content,
			} : null;
		}).filter(Boolean);

		const dependents = network.getDependents(id).map(dep => ({
			id: dep.id,
			type: dep.type,
			content: dep.content,
		}));

		res.json({
			node: {
				id: statement.id,
				type: statement.type,
				content: statement.content,
				confidence: statement.confidence,
				tags: statement.tags,
				createdAt: statement.createdAt,
				updatedAt: statement.updatedAt,
			},
			connections: {
				parents,
				dependents,
				parentCount: parents.length,
				dependentCount: dependents.length,
			},
		});
	});

	return router;
}