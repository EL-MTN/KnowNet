import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { KnowledgeAssistant } from '@/lib/ai';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { query, tags = [] } = body;

		if (!query) {
			return NextResponse.json(
				{ error: 'query is required' },
				{ status: 400 },
			);
		}

		const network = await networkInstance.getNetwork();
		const assistant = new KnowledgeAssistant(network);

		const context = await assistant.getKnowledgeContext(query, tags);

		return NextResponse.json(context);
	} catch (error) {
		console.error('Knowledge context error:', error);
		return NextResponse.json(
			{ error: 'Failed to get knowledge context' },
			{ status: 500 },
		);
	}
}
