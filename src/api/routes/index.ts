import { Application } from 'express';
import { KnowledgeNetwork } from '../../core';
import { StorageService } from '../../services';

import { createStatementRoutes } from './statements';
import { createQueryRoutes } from './query';
import { createGraphRoutes } from './graph';
import { createAIRoutes } from './ai';

export function setupRoutes(
	app: Application,
	network: KnowledgeNetwork,
	storageService: StorageService
) {
	// API version prefix
	const apiPrefix = '/api/v1';

	// Mount route groups
	app.use(`${apiPrefix}/statements`, createStatementRoutes(network, storageService));
	app.use(`${apiPrefix}/query`, createQueryRoutes(network));
	app.use(`${apiPrefix}/graph`, createGraphRoutes(network));
	app.use(`${apiPrefix}/ai`, createAIRoutes(network));

	// API documentation endpoint
	app.get(`${apiPrefix}`, (_req, res) => {
		res.json({
			name: 'KnowNet API',
			version: '1.0.0',
			endpoints: {
				statements: `${apiPrefix}/statements`,
				query: `${apiPrefix}/query`,
				graph: `${apiPrefix}/graph`,
				ai: `${apiPrefix}/ai`,
			},
		});
	});
}