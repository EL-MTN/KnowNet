import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { KnowledgeAssistant } from '@/lib/ai';

export async function GET(_request: NextRequest) {
	try {
		const network = await networkInstance.getNetwork();
		const assistant = new KnowledgeAssistant(network);

		const { statementsToReview, reasons } =
			await assistant.getReviewSuggestions();

		const response = {
			statementsToReview,
			reasons: Array.from(reasons.entries()).map(([id, reason]) => ({
				statementId: id,
				reason,
			})),
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('Review suggestions error:', error);
		return NextResponse.json(
			{ error: 'Failed to get review suggestions' },
			{ status: 500 },
		);
	}
}
