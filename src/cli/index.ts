#!/usr/bin/env node

import { checkbox, confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';

import { KnowledgeAssistant, TheoryGenerator } from '../ai';
import {
	DerivationChain,
	DerivationEngine,
	KnowledgeNetwork,
	QueryOptions,
	StatementType,
} from '../core';
import { Statement } from '../core/Statement';
import {
	ContradictionDetector,
	GraphVisualizationService,
	QueryService,
	StorageService,
} from '../services';

interface CommandOption {
	name: string;
	value: string;
	description?: string;
}

class InteractiveCLI {
	private storageService: StorageService;
	private network!: KnowledgeNetwork;
	private queryService!: QueryService;
	private derivationEngine!: DerivationEngine;
	private knowledgeAssistant!: KnowledgeAssistant;
	private isRunning = true;

	constructor() {
		this.storageService = new StorageService();
	}

	async start() {
		console.clear();
		console.log(chalk.cyan(figlet.textSync('KnowNet', { font: 'Speed' })));
		console.log(
			chalk.gray('Personal Knowledge Network - Interactive Mode\n'),
		);

		await this.loadNetwork();

		while (this.isRunning) {
			try {
				const command = await this.showMainMenu();
				await this.executeCommand(command);
			} catch (error) {
				if (
					error instanceof Error &&
					error.name === 'ExitPromptError'
				) {
					await this.exit();
				} else if (error instanceof Error) {
					console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
				} else {
					console.error(chalk.red(`\n❌ Error: ${error}\n`));
				}
			}
		}
	}

	private async loadNetwork() {
		const spinner = ora('Loading knowledge network...').start();
		try {
			this.network = await this.storageService.load();
			this.queryService = new QueryService(this.network);
			this.derivationEngine = new DerivationEngine(this.network);
			this.knowledgeAssistant = new KnowledgeAssistant(this.network);
			spinner.succeed('Knowledge network loaded');
		} catch (error) {
			spinner.fail('Failed to load knowledge network');
			throw error;
		}
	}

	private async saveNetwork() {
		const spinner = ora('Saving knowledge network...').start();
		try {
			await this.storageService.save(this.network);
			spinner.succeed('Knowledge network saved');
		} catch (error) {
			spinner.fail('Failed to save knowledge network');
			throw error;
		}
	}

	private async showMainMenu(): Promise<string> {
		const commands: CommandOption[] = [
			{
				name: '📝 Add Statement',
				value: 'add',
				description: 'Add axiom or theory',
			},
			{
				name: '📋 List Statements',
				value: 'list',
				description: 'View all statements',
			},
			{
				name: '🔍 Search',
				value: 'search',
				description: 'Query statements',
			},
			{
				name: '✏️  Edit Statement',
				value: 'edit',
				description: 'Edit existing statements',
			},
			{
				name: '🔗 Show Chain',
				value: 'chain',
				description: 'View derivation chain',
			},
			{
				name: '📊 Statistics',
				value: 'stats',
				description: 'View network statistics',
			},
			{
				name: '🧠 Knowledge Review',
				value: 'review',
				description: 'AI-powered knowledge insights',
			},
			{
				name: '🚨 Check Contradictions',
				value: 'check',
				description: 'Detect logical contradictions',
			},
			{
				name: '🤖 AI Assist',
				value: 'derive',
				description: 'Generate theories with AI',
			},
			{
				name: '🌐 Visualize',
				value: 'visualize',
				description: 'Graph visualization',
			},
			{
				name: '💾 Export',
				value: 'export',
				description: 'Export to Markdown',
			},
			{
				name: '🔧 Manage',
				value: 'manage',
				description: 'Delete statements, backup',
			},
			{ name: '🚪 Exit', value: 'exit', description: 'Exit KnowNet' },
		];

		return await select({
			message: chalk.bold.blue('What would you like to do?'),
			choices: commands.map((cmd) => ({
				name: `${cmd.name}${
					cmd.description ? chalk.gray(` - ${cmd.description}`) : ''
				}`,
				value: cmd.value,
			})),
		});
	}

	private async executeCommand(command: string) {
		console.log(); // Add spacing

		switch (command) {
			case 'add':
				await this.addStatement();
				break;
			case 'list':
				await this.listStatements();
				break;
			case 'search':
				await this.searchStatements();
				break;
			case 'edit':
				await this.editStatement();
				break;
			case 'chain':
				await this.showChain();
				break;
			case 'stats':
				await this.showStats();
				break;
			case 'review':
				await this.knowledgeReview();
				break;
			case 'check':
				await this.checkContradictions();
				break;
			case 'derive':
				await this.deriveWithAI();
				break;
			case 'visualize':
				await this.visualizeNetwork();
				break;
			case 'export':
				await this.exportNetwork();
				break;
			case 'manage':
				await this.manageNetwork();
				break;
			case 'exit':
				await this.exit();
				break;
		}
	}

	private async addStatement() {
		const type = (await select({
			message: 'Select statement type:',
			choices: [
				{ name: '🏛️  Axiom - Fundamental belief', value: 'axiom' },
				{ name: '💭 Theory - Derived statement', value: 'theory' },
			],
		})) as StatementType;

		const content = await input({
			message: 'Enter statement content:',
			validate: (value) =>
				value.trim().length > 0 || 'Content cannot be empty',
		});

		const addTags = await confirm({ message: 'Add tags?', default: false });
		let tags: string[] = [];
		if (addTags) {
			const tagsInput = await input({
				message: 'Enter tags (comma-separated):',
			});
			tags = tagsInput
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t.length > 0);
		}

		const addConfidence = await confirm({
			message: 'Set confidence level?',
			default: false,
		});
		let confidence: number | undefined;
		if (addConfidence) {
			const confInput = await input({
				message: 'Enter confidence (0-1):',
				validate: (value) => {
					const num = parseFloat(value);
					return (
						(!isNaN(num) && num >= 0 && num <= 1) ||
						'Must be between 0 and 1'
					);
				},
			});
			confidence = parseFloat(confInput);
		}

		let derivedFrom: string[] = [];
		if (type !== 'axiom') {
			const addDerivation = await confirm({
				message: 'Derive from existing statements?',
				default: true,
			});

			if (addDerivation) {
				const availableStatements = this.network.getAllStatements();
				if (availableStatements.length > 0) {
					const selected = await checkbox({
						message: 'Select parent statements:',
						choices: availableStatements.map((stmt) => ({
							name: `[${stmt.type}] ${stmt.content.substring(
								0,
								50,
							)}${
								stmt.content.length > 50 ? '...' : ''
							} (${stmt.id.substring(0, 8)})`,
							value: stmt.id,
						})),
					});
					derivedFrom = selected;
				}
			}
		}

		// Check for duplicates before adding
		const duplicateCheck = await this.knowledgeAssistant.checkForDuplicates(
			content,
			type,
			tags,
		);

		if (duplicateCheck.hasPotentialDuplicates) {
			console.log(chalk.yellow('\n⚠️  Potential duplicates found:\n'));

			for (const similar of duplicateCheck.similarStatements) {
				const typeColor =
					similar.statement.type === 'axiom'
						? chalk.blue
						: similar.statement.type === 'theory'
							? chalk.yellow
							: chalk.green;

				console.log(
					typeColor(`[${similar.statement.type.toUpperCase()}]`) +
						` ${similar.statement.content.substring(0, 60)}...`,
				);
				console.log(chalk.gray(`  ${similar.reason}`));
				console.log(
					chalk.gray(
						`  ID: ${similar.statement.id.substring(0, 8)}\n`,
					),
				);
			}

			if (duplicateCheck.suggestions.length > 0) {
				console.log(chalk.cyan('💡 Suggestions:'));
				duplicateCheck.suggestions.forEach((suggestion) => {
					console.log(`  • ${suggestion}`);
				});
				console.log();
			}

			const proceed = await confirm({
				message: 'Add anyway?',
				default: false,
			});

			if (!proceed) {
				console.log(chalk.gray('\nStatement not added.\n'));
				return;
			}
		}

		const statement = new Statement(type, content, {
			tags,
			confidence,
			derivedFrom,
		});

		this.network.addStatement(statement);
		await this.saveNetwork();

		console.log(
			chalk.green(
				`\n✅ Added ${type} with ID: ${chalk.yellow(statement.id)}\n`,
			),
		);

		// Show related knowledge
		const related = await this.knowledgeAssistant.suggestRelatedKnowledge(
			statement.id,
		);
		if (related.length > 0) {
			console.log(
				chalk.cyan('📚 Related knowledge you might want to review:'),
			);
			related.slice(0, 3).forEach((stmt) => {
				console.log(
					`  • [${stmt.type}] ${stmt.content.substring(0, 50)}...`,
				);
			});
			console.log();
		}
	}

	private async listStatements() {
		const filterByType = await confirm({
			message: 'Filter by type?',
			default: false,
		});

		let statements: Statement[];
		if (filterByType) {
			const type = await select({
				message: 'Select type:',
				choices: [
					{ name: 'All types', value: 'all' },
					{ name: 'Axioms', value: 'axiom' },
					{ name: 'Theories', value: 'theory' },
				],
			});

			if (type === 'all') {
				statements = this.network.getAllStatements();
			} else {
				statements = this.network.getStatementsByType(
					type as StatementType,
				);
			}
		} else {
			statements = this.network.getAllStatements();
		}

		if (statements.length === 0) {
			console.log(chalk.yellow('\n⚠️  No statements found\n'));
			return;
		}

		console.log(
			chalk.bold(`\nShowing ${statements.length} statement(s):\n`),
		);

		statements.forEach((stmt) => {
			const typeColor =
				stmt.type === 'axiom'
					? chalk.blue
					: stmt.type === 'theory'
						? chalk.yellow
						: chalk.green;

			console.log(
				typeColor(`[${stmt.type.toUpperCase()}]`) +
					` ${chalk.gray(stmt.id)}`,
			);
			console.log(`  ${stmt.content}`);

			if (stmt.confidence !== undefined) {
				const confColor =
					stmt.confidence >= 0.8
						? chalk.green
						: stmt.confidence >= 0.5
							? chalk.yellow
							: chalk.red;
				console.log(
					`  ${chalk.gray('Confidence:')} ${confColor(
						stmt.confidence.toFixed(2),
					)}`,
				);
			}

			if (stmt.tags.length > 0) {
				console.log(
					`  ${chalk.gray('Tags:')} ${stmt.tags
						.map((t) => chalk.cyan(`#${t}`))
						.join(' ')}`,
				);
			}

			if (stmt.derivedFrom.length > 0) {
				console.log(
					`  ${chalk.gray('Derived from:')} ${
						stmt.derivedFrom.length
					} statement(s)`,
				);
			}

			console.log();
		});
	}

	private async searchStatements() {
		const searchQuery = await input({
			message: 'Enter search query:',
			validate: (value) =>
				value.trim().length > 0 || 'Query cannot be empty',
		});

		const options: QueryOptions = { content: searchQuery };

		const addFilters = await confirm({
			message: 'Add filters?',
			default: false,
		});

		if (addFilters) {
			const filterType = await confirm({
				message: 'Filter by type?',
				default: false,
			});
			if (filterType) {
				options.type = (await select({
					message: 'Select type:',
					choices: [
						{ name: 'Axiom', value: 'axiom' },
						{ name: 'Theory', value: 'theory' },
					],
				})) as StatementType;
			}

			const filterTags = await confirm({
				message: 'Filter by tags?',
				default: false,
			});
			if (filterTags) {
				const tagsInput = await input({
					message: 'Enter tags (comma-separated):',
				});
				options.tags = tagsInput
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0);
			}

			const filterConfidence = await confirm({
				message: 'Filter by minimum confidence?',
				default: false,
			});
			if (filterConfidence) {
				const confInput = await input({
					message: 'Enter minimum confidence (0-1):',
					validate: (value) => {
						const num = parseFloat(value);
						return (
							(!isNaN(num) && num >= 0 && num <= 1) ||
							'Must be between 0 and 1'
						);
					},
				});
				options.minConfidence = parseFloat(confInput);
			}
		}

		const spinner = ora('Searching...').start();
		const result = this.queryService.advancedQuery(options);
		spinner.stop();

		if (result.count === 0) {
			console.log(chalk.yellow('\n⚠️  No matching statements found\n'));
			return;
		}

		console.log(
			chalk.green(`\n✅ Found ${result.count} matching statement(s):\n`),
		);

		result.statements.forEach((stmt) => {
			const typeColor =
				stmt.type === 'axiom'
					? chalk.blue
					: stmt.type === 'theory'
						? chalk.yellow
						: chalk.green;

			console.log(
				typeColor(`[${stmt.type.toUpperCase()}]`) +
					` ${chalk.gray(stmt.id)}`,
			);
			console.log(`  ${stmt.content}\n`);
		});
	}

	private async showChain() {
		const statements = this.network.getAllStatements();
		if (statements.length === 0) {
			console.log(chalk.yellow('\n⚠️  No statements found\n'));
			return;
		}

		const statementId = await select({
			message: 'Select statement to show chain:',
			choices: statements.map((stmt) => ({
				name: `[${stmt.type}] ${stmt.content.substring(0, 50)}${
					stmt.content.length > 50 ? '...' : ''
				} (${stmt.id.substring(0, 8)})`,
				value: stmt.id,
			})),
		});

		const chain = this.derivationEngine.getDerivationChain(statementId);
		if (!chain) {
			console.log(chalk.red('\n❌ Statement not found\n'));
			return;
		}

		console.log(chalk.bold('\n📊 Derivation Chain:\n'));
		this.printChain(chain);
		console.log();
	}

	private printChain(node: DerivationChain, depth = 0) {
		const indent = '  '.repeat(depth);
		const stmt = node.statement;

		const typeColor =
			stmt.type === 'axiom'
				? chalk.blue
				: stmt.type === 'theory'
					? chalk.yellow
					: chalk.green;

		console.log(
			`${indent}${typeColor(`[${stmt.type.toUpperCase()}]`)} ${chalk.gray(
				stmt.id.substring(0, 8),
			)}`,
		);
		console.log(`${indent}  ${stmt.content}`);

		if (node.parents.length > 0) {
			console.log(`${indent}  ${chalk.gray('Derived from:')}`);
			node.parents.forEach((parent) =>
				this.printChain(parent, depth + 1),
			);
		}
	}

	private async showStats() {
		const spinner = ora('Calculating statistics...').start();

		const summary = this.queryService.getStatementSummary();
		const topTags = this.queryService.getAllTags().slice(0, 10);

		spinner.stop();

		console.log(chalk.bold('\n📊 Knowledge Network Statistics\n'));

		console.log(
			`${chalk.gray('Total statements:')} ${chalk.white(summary.total)}`,
		);
		console.log(`  ${chalk.blue('Axioms:')} ${summary.byType.axiom}`);
		console.log(`  ${chalk.yellow('Theories:')} ${summary.byType.theory}`);
		console.log();

		console.log(
			`${chalk.gray('Statements with confidence:')} ${
				summary.withConfidence
			}`,
		);
		if (summary.avgConfidence !== null) {
			const confColor =
				summary.avgConfidence >= 0.8
					? chalk.green
					: summary.avgConfidence >= 0.5
						? chalk.yellow
						: chalk.red;
			console.log(
				`${chalk.gray('Average confidence:')} ${confColor(
					summary.avgConfidence.toFixed(3),
				)}`,
			);
		}
		console.log(
			`${chalk.gray(
				'Average derivation depth:',
			)} ${summary.avgDerivationDepth.toFixed(2)}`,
		);
		console.log();

		console.log(`${chalk.gray('Total unique tags:')} ${summary.totalTags}`);

		if (topTags.length > 0) {
			console.log(`\n${chalk.gray('Top tags:')}`);
			topTags.forEach(({ tag, count }) => {
				console.log(`  ${chalk.cyan(`#${tag}`)} - ${count} uses`);
			});
		}
		console.log();
	}

	private async checkContradictions() {
		const spinner = ora('Checking for contradictions...').start();

		const detector = new ContradictionDetector(this.network);
		const report = detector.getContradictionReport();

		spinner.stop();

		console.log(chalk.bold('\n🔍 Contradiction Detection Report\n'));
		console.log(report);
		console.log();
	}

	private async knowledgeReview() {
		const reviewOptions = [
			{ name: '🔍 Find Similar Knowledge', value: 'similar' },
			{ name: '📚 Get Context for Topic', value: 'context' },
			{ name: '💡 Review Suggestions', value: 'suggestions' },
			{ name: '← Back', value: 'back' },
		];

		const choice = await select({
			message: 'What would you like to review?',
			choices: reviewOptions,
		});

		if (choice === 'back') return;

		console.log();

		switch (choice) {
			case 'similar':
				await this.findSimilarKnowledge();
				break;
			case 'context':
				await this.getTopicContext();
				break;
			case 'suggestions':
				await this.showReviewSuggestions();
				break;
		}
	}

	private async findSimilarKnowledge() {
		const query = await input({
			message: 'Enter content to check for similar knowledge:',
			validate: (value) =>
				value.trim().length > 0 || 'Content cannot be empty',
		});

		const type = (await select({
			message: 'What type of statement is this?',
			choices: [
				{ name: 'Axiom', value: 'axiom' },
				{ name: 'Theory', value: 'theory' },
			],
		})) as StatementType;

		const spinner = ora('Searching for similar knowledge...').start();

		const duplicateCheck = await this.knowledgeAssistant.checkForDuplicates(
			query,
			type,
		);

		spinner.stop();

		if (!duplicateCheck.hasPotentialDuplicates) {
			console.log(
				chalk.green(
					'\n✅ No similar statements found - this appears to be new knowledge!\n',
				),
			);
			return;
		}

		console.log(chalk.yellow('\n📚 Similar knowledge found:\n'));

		for (const similar of duplicateCheck.similarStatements) {
			const typeColor =
				similar.statement.type === 'axiom'
					? chalk.blue
					: similar.statement.type === 'theory'
						? chalk.yellow
						: chalk.green;

			console.log(
				typeColor(`[${similar.statement.type.toUpperCase()}]`) +
					` ${similar.statement.content}`,
			);
			console.log(chalk.gray(`  ${similar.reason}`));
			console.log(
				chalk.gray(
					`  Similarity: ${Math.round(similar.similarity * 100)}%`,
				),
			);
			console.log(
				chalk.gray(`  ID: ${similar.statement.id.substring(0, 8)}`),
			);
			if (similar.statement.tags.length > 0) {
				console.log(
					`  Tags: ${similar.statement.tags
						.map((t) => chalk.cyan(`#${t}`))
						.join(' ')}`,
				);
			}
			console.log();
		}

		if (duplicateCheck.suggestions.length > 0) {
			console.log(chalk.cyan('💡 Suggestions:'));
			duplicateCheck.suggestions.forEach((suggestion) => {
				console.log(`  • ${suggestion}`);
			});
			console.log();
		}
	}

	private async getTopicContext() {
		const query = await input({
			message: 'Enter topic or keyword to explore:',
			validate: (value) =>
				value.trim().length > 0 || 'Query cannot be empty',
		});

		const spinner = ora('Gathering knowledge context...').start();

		const context =
			await this.knowledgeAssistant.getKnowledgeContext(query);

		spinner.stop();

		console.log(chalk.bold('\n🧠 Knowledge Context\n'));

		if (context.recentStatements.length > 0) {
			console.log(chalk.cyan('📅 Recent additions:'));
			context.recentStatements.forEach((stmt) => {
				console.log(
					`  • [${stmt.type}] ${stmt.content.substring(0, 60)}...`,
				);
			});
			console.log();
		}

		if (context.relatedByTags.length > 0) {
			console.log(chalk.cyan('🏷️  Related by tags:'));
			context.relatedByTags.slice(0, 5).forEach((stmt) => {
				console.log(
					`  • [${stmt.type}] ${stmt.content.substring(0, 60)}...`,
				);
			});
			console.log();
		}

		if (context.relatedByDerivation.length > 0) {
			console.log(chalk.cyan('🔗 Related by derivation:'));
			context.relatedByDerivation.slice(0, 5).forEach((stmt) => {
				console.log(
					`  • [${stmt.type}] ${stmt.content.substring(0, 60)}...`,
				);
			});
			console.log();
		}

		if (context.gaps.length > 0) {
			console.log(chalk.yellow('⚠️  Potential gaps:'));
			context.gaps.forEach((gap) => {
				console.log(`  • ${gap}`);
			});
			console.log();
		}
	}

	private async showReviewSuggestions() {
		const spinner = ora('Analyzing knowledge network...').start();

		const { statementsToReview, reasons } =
			await this.knowledgeAssistant.getReviewSuggestions();

		spinner.stop();

		if (statementsToReview.length === 0) {
			console.log(
				chalk.green(
					'\n✅ Your knowledge network looks good! No urgent reviews needed.\n',
				),
			);
			return;
		}

		console.log(chalk.bold('\n💡 Suggested Reviews\n'));

		for (const stmt of statementsToReview) {
			const typeColor =
				stmt.type === 'axiom'
					? chalk.blue
					: stmt.type === 'theory'
						? chalk.yellow
						: chalk.green;

			console.log(
				typeColor(`[${stmt.type.toUpperCase()}]`) + ` ${stmt.content}`,
			);
			console.log(chalk.gray(`  ID: ${stmt.id.substring(0, 8)}`));

			const reason = reasons.get(stmt.id);
			if (reason) {
				console.log(chalk.yellow(`  ⚠️  ${reason}`));
			}

			if (stmt.confidence !== undefined) {
				const confColor =
					stmt.confidence >= 0.8
						? chalk.green
						: stmt.confidence >= 0.5
							? chalk.yellow
							: chalk.red;
				console.log(
					`  Confidence: ${confColor(stmt.confidence.toFixed(2))}`,
				);
			}

			console.log();
		}

		const reviewNow = await confirm({
			message: 'Would you like to review one of these statements now?',
			default: true,
		});

		if (reviewNow) {
			const statementId = await select({
				message: 'Select statement to review:',
				choices: statementsToReview.map((stmt) => ({
					name: `[${stmt.type}] ${stmt.content.substring(0, 50)}...`,
					value: stmt.id,
				})),
			});

			await this.reviewStatement(statementId);
		}
	}

	private async reviewStatement(statementId: string) {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			console.log(chalk.red('\n❌ Statement not found\n'));
			return;
		}

		console.log(chalk.bold('\n📝 Reviewing Statement\n'));

		const typeColor =
			statement.type === 'axiom'
				? chalk.blue
				: statement.type === 'theory'
					? chalk.yellow
					: chalk.green;

		console.log(
			typeColor(`[${statement.type.toUpperCase()}]`) +
				` ${statement.content}`,
		);
		console.log(chalk.gray(`ID: ${statement.id}`));

		if (statement.confidence !== undefined) {
			console.log(`Confidence: ${statement.confidence}`);
		}

		if (statement.tags.length > 0) {
			console.log(
				`Tags: ${statement.tags
					.map((t) => chalk.cyan(`#${t}`))
					.join(' ')}`,
			);
		}

		if (statement.derivedFrom.length > 0) {
			console.log(`\nDerived from:`);
			statement.derivedFrom.forEach((id) => {
				const parent = this.network.getStatement(id);
				if (parent) {
					console.log(
						`  • [${parent.type}] ${parent.content.substring(
							0,
							50,
						)}...`,
					);
				}
			});
		}

		const dependents = this.network.getDependents(statementId);
		if (dependents.length > 0) {
			console.log(
				`\nSupports ${dependents.length} dependent statement(s):`,
			);
			dependents.slice(0, 3).forEach((dep) => {
				console.log(
					`  • [${dep.type}] ${dep.content.substring(0, 50)}...`,
				);
			});
		}

		console.log();

		const action = await select({
			message: 'What would you like to do?',
			choices: [
				{ name: '✏️  Edit content', value: 'edit' },
				{ name: '📊 Update confidence', value: 'confidence' },
				{ name: '🏷️  Update tags', value: 'tags' },
				{ name: '🗑️  Delete statement', value: 'delete' },
				{ name: '← Back', value: 'back' },
			],
		});

		switch (action) {
			case 'edit':
				await this.editStatementContent(statement);
				break;
			case 'confidence':
				await this.updateStatementConfidence(statement);
				break;
			case 'tags':
				await this.updateStatementTags(statement);
				break;
			case 'delete':
				await this.deleteStatementById(statement.id);
				break;
			case 'back':
				return;
		}
	}

	private async deriveWithAI() {
		const statements = this.network.getAllStatements();
		if (statements.length === 0) {
			console.log(
				chalk.yellow('\n⚠️  No statements available for derivation\n'),
			);
			return;
		}

		const selected = await checkbox({
			message: 'Select statements to derive from:',
			choices: statements.map((stmt) => ({
				name: `[${stmt.type}] ${stmt.content.substring(0, 50)}${
					stmt.content.length > 50 ? '...' : ''
				} (${stmt.id.substring(0, 8)})`,
				value: stmt.id,
			})),
			validate: (answer) =>
				answer.length > 0 || 'Select at least one statement',
		});

		const sourceStatements = selected.map(
			(id) => this.network.getStatement(id)!,
		);

		console.log(chalk.gray('\n🤖 Generating theory from:'));
		sourceStatements.forEach((stmt) => {
			console.log(`  - [${stmt.type.toUpperCase()}] ${stmt.content}`);
		});

		const generator = new TheoryGenerator(this.network);

		let done = false;
		while (!done) {
			const spinner = ora('AI is thinking...').start();
			let generated;
			try {
				generated = await generator.generateTheory({
					sourceStatements,
				});
				spinner.succeed('Theory generated!');
			} catch (error) {
				spinner.fail('Failed to generate theory');
				throw error;
			}

			console.log(chalk.bold('\n✨ Generated Theory:\n'));
			console.log(`${chalk.gray('Content:')} ${generated.content}`);
			console.log(
				`${chalk.gray('Suggested tags:')} ${generated.suggestedTags
					.map((t) => chalk.cyan(`#${t}`))
					.join(' ')}`,
			);
			console.log(
				`${chalk.gray('Suggested confidence:')} ${chalk.yellow(
					generated.suggestedConfidence.toString(),
				)}`,
			);
			console.log(`${chalk.gray('Reasoning:')} ${generated.reasoning}\n`);

			const action = await select({
				message: 'What would you like to do?',
				choices: [
					{
						name: 'Add this theory to your knowledge network',
						value: 'add',
					},
					{ name: 'Retry (generate a new theory)', value: 'retry' },
					{ name: 'Cancel', value: 'cancel' },
				],
			});

			if (action === 'add') {
				const statement = new Statement('theory', generated.content, {
					tags: generated.suggestedTags,
					confidence: generated.suggestedConfidence,
					derivedFrom: selected,
				});

				this.network.addStatement(statement);
				await this.saveNetwork();

				console.log(
					chalk.green(
						`\n✅ Added theory with ID: ${chalk.yellow(
							statement.id,
						)}\n`,
					),
				);
				done = true;
			} else if (action === 'cancel') {
				done = true;
			}
			// else, retry: loop continues
		}
	}

	private async exportNetwork() {
		const customPath = await confirm({
			message: 'Specify custom export path?',
			default: false,
		});
		let path: string | undefined;

		if (customPath) {
			path = await input({ message: 'Enter export path:' });
		}

		const spinner = ora('Exporting to Markdown...').start();

		try {
			const exportPath = await this.storageService.saveMarkdownExport(
				this.network,
				path,
			);
			spinner.succeed(`Exported to ${chalk.yellow(exportPath)}`);
		} catch (error) {
			spinner.fail('Export failed');
			throw error;
		}
		console.log();
	}

	private async manageNetwork() {
		const action = await select({
			message: 'Select management action:',
			choices: [
				{ name: '🗑️  Delete Statement', value: 'delete' },
				{ name: '💾 Create Backup', value: 'backup' },
				{ name: '🔧 Configure AI', value: 'configure-ai' },
				{ name: '← Back to Main Menu', value: 'back' },
			],
		});

		if (action === 'back') return;

		switch (action) {
			case 'delete':
				await this.deleteStatement();
				break;
			case 'backup':
				await this.createBackup();
				break;
		}
	}

	private async deleteStatement() {
		const statements = this.network.getAllStatements();
		if (statements.length === 0) {
			console.log(chalk.yellow('\n⚠️  No statements to delete\n'));
			return;
		}

		const statementId = await select({
			message: 'Select statement to delete:',
			choices: statements.map((stmt) => ({
				name: `[${stmt.type}] ${stmt.content.substring(0, 50)}${
					stmt.content.length > 50 ? '...' : ''
				} (${stmt.id.substring(0, 8)})`,
				value: stmt.id,
			})),
		});

		const statement = this.network.getStatement(statementId);
		if (!statement) {
			console.log(chalk.red('\n❌ Statement not found\n'));
			return;
		}

		const dependents = this.network.getDependents(statementId);
		if (dependents.length > 0) {
			console.log(
				chalk.yellow(
					`\n⚠️  Warning: ${dependents.length} statement(s) depend on this:\n`,
				),
			);
			dependents.forEach((dep) => {
				console.log(
					`  - [${dep.type}] ${dep.content.substring(0, 50)}${
						dep.content.length > 50 ? '...' : ''
					}`,
				);
			});
			console.log();
		}

		const confirmDelete = await confirm({
			message: `Are you sure you want to delete this ${statement.type}?`,
			default: false,
		});

		if (!confirmDelete) {
			console.log(chalk.gray('\nDeletion cancelled\n'));
			return;
		}

		this.network.deleteStatement(statementId);
		await this.saveNetwork();

		console.log(chalk.green('\n✅ Statement deleted\n'));
	}

	private async editStatement() {
		const statements = this.network.getAllStatements();
		if (statements.length === 0) {
			console.log(
				chalk.yellow('\n⚠️  No statements available to edit\n'),
			);
			return;
		}

		const statementId = await select({
			message: 'Select a statement to edit:',
			choices: statements.map((stmt) => ({
				name: `[${stmt.type}] ${stmt.content.substring(0, 60)}${
					stmt.content.length > 60 ? '...' : ''
				}`,
				value: stmt.id,
			})),
			pageSize: 10,
		});

		await this.reviewStatement(statementId);
	}

	private async editStatementContent(statement: Statement) {
		console.log(chalk.bold('\n✏️  Edit Statement Content\n'));
		console.log(chalk.gray('Current content:'));
		console.log(statement.content);
		console.log();

		const newContent = await input({
			message: 'Enter new content:',
			default: statement.content,
			validate: (value) =>
				value.trim().length > 0 || 'Content cannot be empty',
		});

		if (newContent === statement.content) {
			console.log(chalk.gray('\nNo changes made\n'));
			return;
		}

		try {
			this.network.updateStatement(statement.id, { content: newContent });
			await this.saveNetwork();
			console.log(chalk.green('\n✅ Content updated successfully\n'));
		} catch (error) {
			console.log(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
		}
	}

	private async updateStatementConfidence(statement: Statement) {
		console.log(chalk.bold('\n📊 Update Statement Confidence\n'));

		if (statement.confidence !== undefined) {
			console.log(
				chalk.gray(`Current confidence: ${statement.confidence}`),
			);
		} else {
			console.log(chalk.gray('Current confidence: Not set'));
		}
		console.log();

		const newConfidence = await input({
			message: 'Enter new confidence (0-1):',
			default: statement.confidence?.toString() || '0.5',
			validate: (value) => {
				const num = parseFloat(value);
				if (isNaN(num)) return 'Please enter a valid number';
				if (num < 0 || num > 1)
					return 'Confidence must be between 0 and 1';
				return true;
			},
		});

		const confidenceValue = parseFloat(newConfidence);

		try {
			this.network.updateStatement(statement.id, {
				confidence: confidenceValue,
			});
			await this.saveNetwork();
			console.log(chalk.green('\n✅ Confidence updated successfully\n'));
		} catch (error) {
			console.log(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
		}
	}

	private async updateStatementTags(statement: Statement) {
		console.log(chalk.bold('\n🏷️  Update Statement Tags\n'));

		if (statement.tags.length > 0) {
			console.log(chalk.gray('Current tags:'));
			console.log(
				statement.tags.map((t) => chalk.cyan(`#${t}`)).join(' '),
			);
		} else {
			console.log(chalk.gray('Current tags: None'));
		}
		console.log();

		const action = await select({
			message: 'What would you like to do?',
			choices: [
				{ name: 'Replace all tags', value: 'replace' },
				{ name: 'Add new tags', value: 'add' },
				{ name: 'Remove tags', value: 'remove' },
				{ name: 'Cancel', value: 'cancel' },
			],
		});

		if (action === 'cancel') return;

		switch (action) {
			case 'replace': {
				const newTags = await input({
					message: 'Enter new tags (comma-separated):',
					default: statement.tags.join(', '),
				});

				const tags = newTags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0);

				try {
					this.network.updateStatement(statement.id, { tags });
					await this.saveNetwork();
					console.log(
						chalk.green('\n✅ Tags updated successfully\n'),
					);
				} catch (error) {
					console.log(
						chalk.red(`\n❌ Error: ${(error as Error).message}\n`),
					);
				}
				break;
			}
			case 'add': {
				const newTags = await input({
					message: 'Enter tags to add (comma-separated):',
				});

				const tagsToAdd = newTags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0);

				const updatedTags = [
					...new Set([...statement.tags, ...tagsToAdd]),
				];

				try {
					this.network.updateStatement(statement.id, {
						tags: updatedTags,
					});
					await this.saveNetwork();
					console.log(chalk.green('\n✅ Tags added successfully\n'));
				} catch (error) {
					console.log(
						chalk.red(`\n❌ Error: ${(error as Error).message}\n`),
					);
				}
				break;
			}
			case 'remove': {
				if (statement.tags.length === 0) {
					console.log(chalk.yellow('\n⚠️  No tags to remove\n'));
					return;
				}

				const tagsToRemove = await checkbox({
					message: 'Select tags to remove:',
					choices: statement.tags.map((tag) => ({
						name: chalk.cyan(`#${tag}`),
						value: tag,
					})),
				});

				const updatedTags = statement.tags.filter(
					(t) => !tagsToRemove.includes(t),
				);

				try {
					this.network.updateStatement(statement.id, {
						tags: updatedTags,
					});
					await this.saveNetwork();
					console.log(
						chalk.green('\n✅ Tags removed successfully\n'),
					);
				} catch (error) {
					console.log(
						chalk.red(`\n❌ Error: ${(error as Error).message}\n`),
					);
				}
				break;
			}
		}
	}

	private async visualizeNetwork() {
		const graphService = new GraphVisualizationService(this.network);
		const stats = graphService.getGraphStats();

		console.log(chalk.bold('\n🌐 Knowledge Network Visualization\n'));
		console.log(chalk.gray('Graph Statistics:'));
		console.log(`  • Total Nodes: ${stats.totalNodes}`);
		console.log(`  • Total Edges: ${stats.totalEdges}`);
		console.log(`  • Orphan Nodes: ${stats.orphanNodes}`);
		console.log(`  • Max Depth: ${stats.maxDepth}`);
		console.log(`  • Root Components: ${stats.connectedComponents}\n`);

		if (stats.totalNodes === 0) {
			console.log(chalk.yellow('⚠️  No statements in the knowledge network\n'));
			return;
		}

		const visualizationType = await select({
			message: 'Choose visualization type:',
			choices: [
				{
					name: '📊 Export to DOT (Graphviz)',
					value: 'dot',
					description: 'Export for external visualization',
				},
				{
					name: '🔍 Interactive Explorer',
					value: 'explore',
					description: 'Navigate through the graph interactively',
				},
				{ name: '← Back', value: 'back' },
			],
		});

		switch (visualizationType) {
			case 'dot':
				await this.exportDOTFormat(graphService);
				break;
			case 'explore':
				await this.exploreGraph();
				break;
			case 'back':
				return;
		}
	}

	private async exportDOTFormat(graphService: GraphVisualizationService) {
		console.log(chalk.bold('\n📊 Export to DOT Format\n'));

		const includeOrphans = await confirm({
			message: 'Include orphan nodes (no connections)?',
			default: true,
		});

		const rankdir = await select({
			message: 'Graph direction:',
			choices: [
				{ name: 'Top to Bottom', value: 'TB' },
				{ name: 'Bottom to Top', value: 'BT' },
				{ name: 'Left to Right', value: 'LR' },
				{ name: 'Right to Left', value: 'RL' },
			],
		});

		const dot = graphService.exportToDOT({
			title: 'KnowNet Knowledge Graph',
			rankdir: rankdir as 'TB' | 'BT' | 'LR' | 'RL',
			includeOrphans,
		});

		const filename = `knowledge-graph-${new Date().toISOString().split('T')[0]}.dot`;
		const filepath = `exports/${filename}`;

		// Ensure exports directory exists
		const fs = await import('fs/promises');
		await fs.mkdir('exports', { recursive: true });
		await fs.writeFile(filepath, dot);

		console.log(chalk.green(`\n✅ Graph exported to: ${chalk.yellow(filepath)}\n`));
		console.log(chalk.gray('To visualize, use Graphviz:'));
		console.log(chalk.cyan(`  dot -Tpng ${filepath} -o graph.png`));
		console.log(chalk.cyan(`  dot -Tsvg ${filepath} -o graph.svg\n`));
	}

	private async exploreGraph() {
		let currentNodeId: string | null = null;
		
		while (true) {
			console.log(chalk.bold('\n🔍 Interactive Graph Explorer\n'));

			if (!currentNodeId) {
				// Select starting node
				const statements = this.network.getAllStatements();
				currentNodeId = await select({
					message: 'Select a node to explore:',
					choices: statements.map(stmt => ({
						name: `[${stmt.type}] ${stmt.content.substring(0, 60)}...`,
						value: stmt.id,
					})),
					pageSize: 10,
				});
			}

			const currentNode: Statement = this.network.getStatement(currentNodeId)!;
			const parents: Statement[] = currentNode.derivedFrom.map((id: string) => this.network.getStatement(id)!);
			const children = this.network.getDependents(currentNodeId);

			// Display current node
			console.log(chalk.bold('\n📍 Current Node:\n'));
			console.log(chalk.yellow(`[${currentNode.type.toUpperCase()}]`) + ` ${currentNode.content}`);
			
			if (currentNode.confidence !== undefined) {
				console.log(chalk.gray(`Confidence: ${currentNode.confidence}`));
			}
			
			if (currentNode.tags.length > 0) {
				console.log(chalk.gray(`Tags: ${currentNode.tags.map((t: string) => chalk.cyan(`#${t}`)).join(' ')}`));
			}

			// Show connections
			if (parents.length > 0) {
				console.log(chalk.bold('\n⬆️  Derived From:'));
				parents.forEach((parent: Statement, i: number) => {
					console.log(`  ${i + 1}. [${parent.type}] ${parent.content.substring(0, 40)}...`);
				});
			}

			if (children.length > 0) {
				console.log(chalk.bold('\n⬇️  Derives To:'));
				children.forEach((child, i) => {
					console.log(`  ${i + 1}. [${child.type}] ${child.content.substring(0, 40)}...`);
				});
			}

			// Navigation options
			const choices = [];
			
			if (parents.length > 0) {
				choices.push({
					name: '⬆️  Go to parent',
					value: 'parent',
				});
			}
			
			if (children.length > 0) {
				choices.push({
					name: '⬇️  Go to child',
					value: 'child',
				});
			}
			
			choices.push(
				{ name: '🔍 Select new node', value: 'new' },
				{ name: '📝 View full details', value: 'details' },
				{ name: '← Back to menu', value: 'back' },
			);

			const action = await select({
				message: '\nWhat would you like to do?',
				choices,
			});

			switch (action) {
				case 'parent':
					if (parents.length === 1) {
						currentNodeId = parents[0].id;
					} else {
						currentNodeId = await select({
							message: 'Select parent to navigate to:',
							choices: parents.map((p: Statement, i: number) => ({
								name: `${i + 1}. [${p.type}] ${p.content.substring(0, 50)}...`,
								value: p.id,
							})),
						});
					}
					break;
				
				case 'child':
					if (children.length === 1) {
						currentNodeId = children[0].id;
					} else {
						currentNodeId = await select({
							message: 'Select child to navigate to:',
							choices: children.map((c, i) => ({
								name: `${i + 1}. [${c.type}] ${c.content.substring(0, 50)}...`,
								value: c.id,
							})),
						});
					}
					break;
				
				case 'new':
					currentNodeId = null;
					break;
				
				case 'details':
					await this.reviewStatement(currentNodeId);
					break;
				
				case 'back':
					return;
			}
		}
	}

	private async deleteStatementById(statementId: string) {
		const statement = this.network.getStatement(statementId);
		if (!statement) {
			console.log(chalk.red('\n❌ Statement not found\n'));
			return;
		}

		const dependents = this.network.getDependents(statementId);
		if (dependents.length > 0) {
			console.log(
				chalk.yellow(
					`\n⚠️  This statement has ${dependents.length} dependents:`,
				),
			);
			dependents.forEach((dep) => {
				console.log(
					`  • [${dep.type}] ${dep.content.substring(0, 50)}...`,
				);
			});
			console.log();
		}

		const confirmDelete = await confirm({
			message: `Are you sure you want to delete this ${statement.type}?`,
			default: false,
		});

		if (!confirmDelete) {
			console.log(chalk.gray('\nDeletion cancelled\n'));
			return;
		}

		this.network.deleteStatement(statementId);
		await this.saveNetwork();

		console.log(chalk.green('\n✅ Statement deleted\n'));
	}

	private async createBackup() {
		const spinner = ora('Creating backup...').start();

		try {
			const backupPath = await this.storageService.backup();
			spinner.succeed(`Backup created: ${chalk.yellow(backupPath)}`);
		} catch (error) {
			spinner.fail('Backup failed');
			throw error;
		}
		console.log();
	}

	private async exit() {
		const confirmExit = await confirm({
			message: 'Are you sure you want to exit?',
			default: false,
		});

		if (confirmExit) {
			console.log(chalk.gray('\nGoodbye! 👋\n'));
			this.isRunning = false;
			process.exit(0);
		}
	}
}

// Start the interactive CLI
const cli = new InteractiveCLI();
cli.start().catch((error) => {
	console.error(chalk.red(`Failed to start: ${error.message}`));
	process.exit(1);
});
