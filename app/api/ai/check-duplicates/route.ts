import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { KnowledgeAssistant } from '@/lib/ai';
import { StatementType } from '@/lib/core/types';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { content, type = 'theory', tags = [] } = body;

		if (!content) {
			return NextResponse.json(
				{ error: 'content is required' },
				{ status: 400 },
			);
		}

		const network = await networkInstance.getNetwork();
		const assistant = new KnowledgeAssistant(network);

		const result = await assistant.checkForDuplicates(
			content,
			type as StatementType,
			tags,
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error('Duplicate check error:', error);
		return NextResponse.json(
			{ error: 'Failed to check for duplicates' },
			{ status: 500 },
		);
	}
}
