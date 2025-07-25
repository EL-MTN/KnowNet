import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AIConfig {
	apiKey?: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
	url?: string;
}

const CONFIG_FILE = path.join(os.homedir(), '.knownet', 'config.json');

export class AIConfigManager {
	private static instance: AIConfigManager;
	private config: AIConfig = {
		url: 'http://127.0.0.1:1234/v1/chat/completions',
		model: 'llama-3.2-3b-instruct',
		maxTokens: -1,
		temperature: 0,
	};

	private constructor() {
		this.loadConfig();
	}

	static getInstance(): AIConfigManager {
		if (!AIConfigManager.instance) {
			AIConfigManager.instance = new AIConfigManager();
		}
		return AIConfigManager.instance;
	}

	private loadConfig(): void {
		try {
			if (fs.existsSync(CONFIG_FILE)) {
				const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
				this.config = { ...this.config, ...JSON.parse(data) };
			}
		} catch (error) {
			console.warn('Could not load AI configuration:', error);
		}
	}

	saveConfig(): void {
		try {
			const dir = path.dirname(CONFIG_FILE);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
		} catch (error) {
			console.error('Could not save AI configuration:', error);
		}
	}

	getModel(): string {
		return this.config.model || 'claude-3-5-sonnet-20241022';
	}

	setModel(model: string): void {
		this.config.model = model;
		this.saveConfig();
	}

	getMaxTokens(): number {
		return this.config.maxTokens || 1024;
	}

	getTemperature(): number {
		return this.config.temperature || 0;
	}

	isConfigured(): boolean {
		return !!this.config.apiKey;
	}

	getUrl(): string {
		return this.config.url || 'http://127.0.0.1:1234';
	}

	setUrl(url: string): void {
		this.config.url = url;
		this.saveConfig();
	}
}
