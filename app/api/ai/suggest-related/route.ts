import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { KnowledgeAssistant } from '@/lib/ai';

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const statementId = params.id;

		const network = await networkInstance.getNetwork();
		const assistant = new KnowledgeAssistant(network);

		const suggestions = await assistant.suggestRelatedKnowledge(statementId);

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error('Related knowledge suggestion error:', error);
		return NextResponse.json(
			{ error: 'Failed to suggest related knowledge' },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { statementId } = body;

		if (!statementId) {
			return NextResponse.json(
				{ error: 'statementId is required' },
				{ status: 400 }
			);
		}

		const network = await networkInstance.getNetwork();
		const assistant = new KnowledgeAssistant(network);

		const suggestions = await assistant.suggestRelatedKnowledge(statementId);

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error('Related knowledge suggestion error:', error);
		return NextResponse.json(
			{ error: 'Failed to suggest related knowledge' },
			{ status: 500 }
		);
	}
}