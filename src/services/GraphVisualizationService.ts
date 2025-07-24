import { DerivationChain, DerivationEngine, KnowledgeNetwork } from '../core';

export interface GraphNode {
	id: string;
	label: string;
	type: 'axiom' | 'theory';
	confidence?: number;
	tags: string[];
}

export interface GraphEdge {
	from: string;
	to: string;
	label?: string;
}

export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

export class GraphVisualizationService {
	constructor(private network: KnowledgeNetwork) {}

	/**
	 * Generate graph data structure from the knowledge network
	 */
	generateGraphData(options: {
		includeOrphans?: boolean;
		maxLabelLength?: number;
	} = {}): GraphData {
		const { includeOrphans = true, maxLabelLength = 50 } = options;
		const statements = this.network.getAllStatements();
		const nodes: GraphNode[] = [];
		const edges: GraphEdge[] = [];
		const processedEdges = new Set<string>();

		// Create nodes
		for (const statement of statements) {
			// Skip orphans if requested
			if (!includeOrphans && statement.derivedFrom.length === 0 && 
				this.network.getDependents(statement.id).length === 0) {
				continue;
			}

			nodes.push({
				id: statement.id,
				label: this.truncateLabel(statement.content, maxLabelLength),
				type: statement.type,
				confidence: statement.confidence,
				tags: statement.tags,
			});
		}

		// Create edges (derivation relationships)
		for (const statement of statements) {
			for (const parentId of statement.derivedFrom) {
				const edgeKey = `${parentId}->${statement.id}`;
				if (!processedEdges.has(edgeKey)) {
					edges.push({
						from: parentId,
						to: statement.id,
						label: 'derives',
					});
					processedEdges.add(edgeKey);
				}
			}
		}

		return { nodes, edges };
	}

	/**
	 * Export graph to DOT format for Graphviz
	 */
	exportToDOT(options: {
		title?: string;
		rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
		includeOrphans?: boolean;
	} = {}): string {
		const { 
			title = 'Knowledge Network', 
			rankdir = 'TB',
			includeOrphans = true 
		} = options;
		
		const graphData = this.generateGraphData({ includeOrphans });
		let dot = `digraph "${title}" {\n`;
		dot += `  rankdir=${rankdir};\n`;
		dot += '  node [shape=box, style=rounded];\n';
		dot += '  edge [color=gray];\n\n';

		// Add nodes with styling based on type
		for (const node of graphData.nodes) {
			const color = node.type === 'axiom' ? 'lightblue' : 'lightyellow';
			const style = node.type === 'axiom' ? 'filled,bold' : 'filled';
			const confidence = node.confidence !== undefined 
				? `\\nConfidence: ${node.confidence}` 
				: '';
			const tags = node.tags.length > 0 
				? `\\nTags: ${node.tags.join(', ')}` 
				: '';
			
			dot += `  "${node.id}" [label="${node.label}${confidence}${tags}", fillcolor=${color}, style="${style}"];\n`;
		}

		dot += '\n';

		// Add edges
		for (const edge of graphData.edges) {
			dot += `  "${edge.from}" -> "${edge.to}";\n`;
		}

		dot += '}\n';
		return dot;
	}


	/**
	 * Get graph statistics
	 */
	getGraphStats(): {
		totalNodes: number;
		totalEdges: number;
		orphanNodes: number;
		maxDepth: number;
		connectedComponents: number;
	} {
		const graphData = this.generateGraphData();
		const orphans = graphData.nodes.filter(node => {
			const hasIncoming = graphData.edges.some(e => e.to === node.id);
			const hasOutgoing = graphData.edges.some(e => e.from === node.id);
			return !hasIncoming && !hasOutgoing;
		});

		// Calculate max depth
		let maxDepth = 0;
		const derivationEngine = new DerivationEngine(this.network);
		for (const statement of this.network.getAllStatements()) {
			const chain = derivationEngine.getDerivationChain(statement.id);
			if (chain) {
				const depth = this.calculateChainDepth(chain);
				maxDepth = Math.max(maxDepth, depth);
			}
		}

		// Count connected components (simplified - counts root nodes)
		const roots = this.network.getAllStatements()
			.filter(s => s.derivedFrom.length === 0);

		return {
			totalNodes: graphData.nodes.length,
			totalEdges: graphData.edges.length,
			orphanNodes: orphans.length,
			maxDepth,
			connectedComponents: roots.length,
		};
	}

	private truncateLabel(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength - 3) + '...';
	}

	private calculateChainDepth(chain: DerivationChain): number {
		if (chain.parents.length === 0) return 0;
		return 1 + Math.max(...chain.parents.map(p => this.calculateChainDepth(p)));
	}
}