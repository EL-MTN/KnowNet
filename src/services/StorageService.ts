import { promises as fs } from 'fs';
import * as path from 'path';

import { KnowledgeNetwork } from '../core';

export class StorageService {
	private filePath: string;

	constructor(filePath?: string) {
		this.filePath =
			filePath || path.join(process.cwd(), 'data', 'knowledge.json');
	}

	async save(network: KnowledgeNetwork): Promise<void> {
		try {
			const dir = path.dirname(this.filePath);
			await fs.mkdir(dir, { recursive: true });

			const data = network.toJSON();
			const json = JSON.stringify(data, null, 2);
			await fs.writeFile(this.filePath, json, 'utf-8');
		} catch (error) {
			throw new Error(`Failed to save knowledge network: ${error}`);
		}
	}

	async load(): Promise<KnowledgeNetwork> {
		try {
			const json = await fs.readFile(this.filePath, 'utf-8');
			const data = JSON.parse(json);
			return KnowledgeNetwork.fromJSON(data);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return new KnowledgeNetwork();
			}
			throw new Error(`Failed to load knowledge network: ${error}`);
		}
	}

	async exists(): Promise<boolean> {
		try {
			await fs.access(this.filePath);
			return true;
		} catch {
			return false;
		}
	}

	async backup(): Promise<string> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = this.filePath.replace(
				'.json',
				`-backup-${timestamp}.json`,
			);

			const exists = await this.exists();
			if (exists) {
				await fs.copyFile(this.filePath, backupPath);
				return backupPath;
			}

			throw new Error('No knowledge network file to backup');
		} catch (error) {
			throw new Error(`Failed to create backup: ${error}`);
		}
	}

	async listBackups(): Promise<string[]> {
		try {
			const dir = path.dirname(this.filePath);
			const basename = path.basename(this.filePath, '.json');
			const files = await fs.readdir(dir);

			return files
				.filter(
					(file) =>
						file.startsWith(`${basename}-backup-`) &&
						file.endsWith('.json'),
				)
				.sort()
				.reverse();
		} catch (error) {
			throw new Error(`Failed to list backups: ${error}`);
		}
	}

	async restoreFromBackup(backupFileName: string): Promise<void> {
		try {
			const dir = path.dirname(this.filePath);
			const backupPath = path.join(dir, backupFileName);

			await fs.access(backupPath);

			if (await this.exists()) {
				await this.backup();
			}

			await fs.copyFile(backupPath, this.filePath);
		} catch (error) {
			throw new Error(`Failed to restore from backup: ${error}`);
		}
	}

	async exportToMarkdown(network: KnowledgeNetwork): Promise<string> {
		const statements = network.getAllStatements();
		const axioms = statements.filter((s) => s.type === 'axiom');
		const theories = statements.filter((s) => s.type === 'theory');
		const conclusions = statements.filter((s) => s.type === 'conclusion');

		let markdown = '# Knowledge Network Export\n\n';
		markdown += `Generated on: ${new Date().toISOString()}\n\n`;
		markdown += `Total Statements: ${statements.length}\n\n`;

		markdown += '## Axioms\n\n';
		for (const axiom of axioms) {
			markdown += `### ${axiom.id}\n`;
			markdown += `- **Content**: ${axiom.content}\n`;
			markdown += `- **Confidence**: ${axiom.confidence ?? 'N/A'}\n`;
			markdown += `- **Tags**: ${axiom.tags.join(', ') || 'None'}\n`;
			markdown += `- **Created**: ${axiom.createdAt.toISOString()}\n\n`;
		}

		markdown += '## Theories\n\n';
		for (const theory of theories) {
			markdown += `### ${theory.id}\n`;
			markdown += `- **Content**: ${theory.content}\n`;
			markdown += `- **Confidence**: ${theory.confidence ?? 'N/A'}\n`;
			markdown += `- **Tags**: ${theory.tags.join(', ') || 'None'}\n`;
			markdown += `- **Derived From**: ${theory.derivedFrom.join(', ')}\n`;
			markdown += `- **Created**: ${theory.createdAt.toISOString()}\n\n`;
		}

		markdown += '## Conclusions\n\n';
		for (const conclusion of conclusions) {
			markdown += `### ${conclusion.id}\n`;
			markdown += `- **Content**: ${conclusion.content}\n`;
			markdown += `- **Confidence**: ${conclusion.confidence ?? 'N/A'}\n`;
			markdown += `- **Tags**: ${conclusion.tags.join(', ') || 'None'}\n`;
			markdown += `- **Derived From**: ${conclusion.derivedFrom.join(', ')}\n`;
			markdown += `- **Created**: ${conclusion.createdAt.toISOString()}\n\n`;
		}

		return markdown;
	}

	async saveMarkdownExport(
		network: KnowledgeNetwork,
		outputPath?: string,
	): Promise<string> {
		const markdown = await this.exportToMarkdown(network);
		const exportPath =
			outputPath || this.filePath.replace('.json', '-export.md');

		await fs.writeFile(exportPath, markdown, 'utf-8');
		return exportPath;
	}
}
