import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { TheoryGenerator } from '@/lib/ai';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { statementId } = body;

		if (!statementId) {
			return NextResponse.json(
				{ error: 'statementId is required' },
				{ status: 400 },
			);
		}

		const network = await networkInstance.getNetwork();
		const generator = new TheoryGenerator(network);

		const suggestions = generator.suggestDerivations(statementId);

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error('Derivation suggestion error:', error);
		return NextResponse.json(
			{ error: 'Failed to suggest derivations' },
			{ status: 500 },
		);
	}
}
