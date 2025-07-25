export interface AIConfig {
	apiKey?: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
	url?: string;
}

export class AIConfigManager {
	private static instance: AIConfigManager;
	private config: AIConfig;

	private constructor() {
		this.config = {
			url:
				process.env.AI_URL ||
				'http://127.0.0.1:1234/v1/chat/completions',
			model: process.env.AI_MODEL || 'llama-3.2-3b-instruct',
			maxTokens: parseInt(process.env.AI_MAX_TOKENS || '-1'),
			temperature: parseFloat(process.env.AI_TEMPERATURE || '0'),
			apiKey: process.env.AI_API_KEY,
		};
	}

	static getInstance(): AIConfigManager {
		if (!AIConfigManager.instance) {
			AIConfigManager.instance = new AIConfigManager();
		}
		return AIConfigManager.instance;
	}

	getModel(): string {
		return this.config.model || 'llama-3.2-3b-instruct';
	}

	getMaxTokens(): number {
		return this.config.maxTokens || -1;
	}

	getTemperature(): number {
		return this.config.temperature || 0;
	}

	isConfigured(): boolean {
		return !!this.config.url;
	}

	getUrl(): string {
		return this.config.url || 'http://127.0.0.1:1234/v1/chat/completions';
	}

	getApiKey(): string | undefined {
		return this.config.apiKey;
	}
}
