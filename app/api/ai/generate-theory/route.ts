import { NextRequest, NextResponse } from 'next/server';
import { networkInstance } from '@/lib/network-instance';
import { TheoryGenerator } from '@/lib/ai';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { sourceStatementIds, count = 1 } = body;

		if (!sourceStatementIds || !Array.isArray(sourceStatementIds)) {
			return NextResponse.json(
				{ error: 'sourceStatementIds array is required' },
				{ status: 400 }
			);
		}

		const network = await networkInstance.getNetwork();
		const generator = new TheoryGenerator(network);

		const sourceStatements = sourceStatementIds
			.map(id => network.getStatement(id))
			.filter((stmt): stmt is NonNullable<typeof stmt> => stmt !== null);

		if (sourceStatements.length === 0) {
			return NextResponse.json(
				{ error: 'No valid source statements found' },
				{ status: 404 }
			);
		}

		if (count === 1) {
			const theory = await generator.generateTheory({ sourceStatements });
			return NextResponse.json({ theory });
		} else {
			const theories = await generator.generateMultipleTheories(
				sourceStatements,
				count
			);
			return NextResponse.json({ theories });
		}
	} catch (error) {
		console.error('Theory generation error:', error);
		return NextResponse.json(
			{ error: 'Failed to generate theory' },
			{ status: 500 }
		);
	}
}