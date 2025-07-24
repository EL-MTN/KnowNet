import path from 'path';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { KnowledgeNetwork } from '../core';
import { StorageService } from '../services';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';

dotenv.config();

export class ApiServer {
	private app: express.Application;
	private network: KnowledgeNetwork;
	private storageService: StorageService;
	private port: number;

	constructor(port: number = 3000) {
		this.app = express();
		this.port = port;
		
		// Initialize services
		this.storageService = new StorageService(
			path.join(process.cwd(), 'data', 'knowledge.json')
		);
		this.network = new KnowledgeNetwork();
	}

	async initialize() {
		// Load existing data
		try {
			const data = await this.storageService.load();
			if (data) {
				this.network = data;
			}
		} catch (error) {
			console.error('Failed to load existing data:', error);
		}

		// Configure middleware
		this.app.use(cors());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));

		// Health check endpoint
		this.app.get('/health', (_req, res) => {
			res.json({ 
				status: 'ok', 
				timestamp: new Date().toISOString(),
				statements: this.network.getAllStatements().length
			});
		});

		// Setup routes
		setupRoutes(this.app, this.network, this.storageService);

		// Error handling middleware (must be last)
		this.app.use(errorHandler);
	}

	async start() {
		await this.initialize();
		
		return new Promise<void>((resolve) => {
			this.app.listen(this.port, () => {
				console.log(`🚀 KnowNet API server running on http://localhost:${this.port}`);
				console.log(`📊 Loaded ${this.network.getAllStatements().length} statements`);
				resolve();
			});
		});
	}

	getApp() {
		return this.app;
	}
}

// Start server if run directly
if (require.main === module) {
	const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
	const server = new ApiServer(port);
	
	server.start().catch((error) => {
		console.error('Failed to start server:', error);
		process.exit(1);
	});
}