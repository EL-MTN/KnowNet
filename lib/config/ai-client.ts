export interface AIConfig {
	apiKey?: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
	url?: string;
}

const DEFAULT_CONFIG: AIConfig = {
	url:
		process.env.NEXT_PUBLIC_AI_URL ||
		'http://127.0.0.1:1234/v1/chat/completions',
	model: process.env.NEXT_PUBLIC_AI_MODEL || 'llama-3.2-3b-instruct',
	maxTokens: -1,
	temperature: 0,
};

export class AIConfigManager {
	private static instance: AIConfigManager;
	private config: AIConfig;

	private constructor() {
		this.config = { ...DEFAULT_CONFIG };
		this.loadFromLocalStorage();
	}

	static getInstance(): AIConfigManager {
		if (!AIConfigManager.instance) {
			AIConfigManager.instance = new AIConfigManager();
		}
		return AIConfigManager.instance;
	}

	private loadFromLocalStorage(): void {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('knownet-ai-config');
				if (saved) {
					this.config = { ...this.config, ...JSON.parse(saved) };
				}
			} catch (error) {
				console.warn('Could not load AI configuration:', error);
			}
		}
	}

	private saveToLocalStorage(): void {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(
					'knownet-ai-config',
					JSON.stringify(this.config),
				);
			} catch (error) {
				console.error('Could not save AI configuration:', error);
			}
		}
	}

	getModel(): string {
		return this.config.model || 'llama-3.2-3b-instruct';
	}

	setModel(model: string): void {
		this.config.model = model;
		this.saveToLocalStorage();
	}

	getMaxTokens(): number {
		return this.config.maxTokens || 1024;
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

	setUrl(url: string): void {
		this.config.url = url;
		this.saveToLocalStorage();
	}

	getApiKey(): string | undefined {
		return this.config.apiKey || process.env.NEXT_PUBLIC_AI_API_KEY;
	}

	setApiKey(apiKey: string): void {
		this.config.apiKey = apiKey;
		this.saveToLocalStorage();
	}
}
