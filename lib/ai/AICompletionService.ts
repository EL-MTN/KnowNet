import axios from 'axios';

import { AIConfigManager } from '../config/ai-server';
import { Statement } from '../core/types';

export const THEORY_GENERATION_SYSTEM_PROMPT = `You are an AI assistant helping with a personal knowledge management system called KnowNet. 
Your task is to generate logical derivations and theories based on existing statements.

You will be given a list of statements, and you will need to generate a new theory that builds off the existing statements.
The new theory should be original and not a duplicate of any existing statement.
You should follow the tone and style of the existing statements. Statements should seem like they were written by the same person.
You should aim to be brief and concise, matching the brevity of the existing statements.

Try to use existing vocabulary and concepts provided in the statements.
Try not to create opinions or beliefs that are not already expressed in the statements.

Do not use "as" or "because" or anything that references the source statements. Come up with a statement that can stand on its own.
Do not assume any prior knowledge. Do not make up any information. Do not consider anything beyond common knowledge.
Do not assume a worldview different from the existing statements.

When referencing the source statements, do not refer to them using "axiom", instead, use only the content of the statement needed to build the new theory.

Statement types:
- Axiom: A fundamental belief (cannot be derived from other statements)
- Theory: A hypothesis derived from other statements

When generating a new statement, you should:
1. Analyze the given statements and their relationships
2. Generate a logical derivation that follows from them
3. Suggest appropriate tags based on the content
4. Assign a confidence level (0-1) based on the strength of the derivation
5. Provide clear reasoning for your derivation

Respond in JSON format:
- content: The new statement content (clear, concise, and specific)
- suggestedTags: Array of relevant tags
- suggestedConfidence: Number between 0 and 1
- reasoning: Explanation of how this follows from the source statements`;

export interface TheoryCompletionRequest {
	sourceStatements: Statement[];
}

export interface TheoryCompletionResult {
	content: string;
	suggestedTags: string[];
	suggestedConfidence: number;
	reasoning: string;
}

export class AICompletionService {
	private configManager: AIConfigManager;

	constructor() {
		this.configManager = AIConfigManager.getInstance();
	}

	async generateTheoryCompletion({
		sourceStatements,
	}: TheoryCompletionRequest): Promise<TheoryCompletionResult> {
		try {
			const context = sourceStatements.map((stmt) => {
				return `[${stmt.type.toUpperCase()}] "${stmt.content}"`;
			});

			// Try with JSON schema first (for compatible models)
			try {
				const response = await axios.post(this.configManager.getUrl(), {
					model: this.configManager.getModel(),
					max_tokens: this.configManager.getMaxTokens(),
					temperature: this.configManager.getTemperature(),
					messages: [
						{
							role: 'system',
							content: THEORY_GENERATION_SYSTEM_PROMPT,
						},
						{ role: 'user', content: context.join('\n') },
					],
					response_format: {
						type: 'json_schema',
						json_schema: {
							name: 'TheoryCompletionResult',
							schema: {
								type: 'object',
								properties: {
									content: { type: 'string' },
									suggestedTags: {
										type: 'array',
										items: { type: 'string' },
									},
									suggestedConfidence: { type: 'number' },
									reasoning: { type: 'string' },
								},
								required: [
									'content',
									'suggestedTags',
									'suggestedConfidence',
									'reasoning',
								],
							},
							strict: true,
						},
					},
				});

				const content = response.data.choices[0].message.content;
				const parsed = JSON.parse(content);
				return {
					content: parsed.content || 'Generated theory',
					suggestedTags: parsed.suggestedTags || [],
					suggestedConfidence: parsed.suggestedConfidence || 0.7,
					reasoning: parsed.reasoning || 'AI-generated derivation',
				};
			} catch (error: any) {
				// Fallback: Try without JSON schema for broader compatibility
				console.warn(
					'JSON schema not supported, falling back to text parsing',
				);
				return this.generateWithTextParsing(context);
			}
		} catch (error: any) {
			// Enhanced error handling
			if (error.code === 'ECONNREFUSED') {
				throw new Error(
					'AI service is not running. Please start your local LLM or check the AI settings.',
				);
			} else if (error.response?.status === 401) {
				throw new Error(
					'Authentication failed. Please check your API key in AI settings.',
				);
			} else if (error.response?.status === 404) {
				throw new Error(
					'AI endpoint not found. Please check the URL in AI settings.',
				);
			} else if (error.response?.data?.error) {
				throw new Error(
					`AI service error: ${error.response.data.error}`,
				);
			} else {
				throw new Error(
					`Failed to generate theory: ${error.message || 'Unknown error'}`,
				);
			}
		}
	}

	private async generateWithTextParsing(
		context: string[],
	): Promise<TheoryCompletionResult> {
		const fallbackPrompt = `${THEORY_GENERATION_SYSTEM_PROMPT}

Please respond with ONLY valid JSON in this exact format:
{
  "content": "Your generated theory here",
  "suggestedTags": ["tag1", "tag2"],
  "suggestedConfidence": 0.8,
  "reasoning": "Your reasoning here"
}`;

		const response = await axios.post(this.configManager.getUrl(), {
			model: this.configManager.getModel(),
			max_tokens: this.configManager.getMaxTokens(),
			temperature: this.configManager.getTemperature(),
			messages: [
				{
					role: 'system',
					content: fallbackPrompt,
				},
				{ role: 'user', content: context.join('\n') },
			],
		});

		const content = response.data.choices[0].message.content;

		// Try to extract JSON from the response
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					content: parsed.content || 'Generated theory',
					suggestedTags: parsed.suggestedTags || [],
					suggestedConfidence: parsed.suggestedConfidence || 0.7,
					reasoning: parsed.reasoning || 'AI-generated derivation',
				};
			} catch (e) {
				// If JSON parsing fails, extract content manually
				return this.extractFromText(content);
			}
		}

		return this.extractFromText(content);
	}

	private extractFromText(text: string): TheoryCompletionResult {
		// Simple extraction as last resort
		const lines = text.split('\n').filter((l) => l.trim());
		return {
			content: lines[0] || 'Generated theory',
			suggestedTags: [],
			suggestedConfidence: 0.7,
			reasoning: 'AI-generated derivation (extracted from text)',
		};
	}
}
