import { NextRequest, NextResponse } from 'next/server';
import { DerivationEngine } from '@/lib/core';
import { getNetworkInstance } from '@/lib/network-instance';

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const network = await getNetworkInstance();
		const statement = network.getStatement(params.id);

		if (!statement) {
			return NextResponse.json(
				{ error: 'Statement not found' },
				{ status: 404 },
			);
		}

		const engine = new DerivationEngine(network);
		const chain = engine.getDerivationChain(params.id);

		return NextResponse.json({
			chain: chain ? formatDerivationChain(chain) : null,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch derivation chain' },
			{ status: 500 },
		);
	}
}

function formatDerivationChain(chain: any): any {
	return {
		statementId: chain.statementId,
		statement: {
			id: chain.statement.id,
			type: chain.statement.type,
			content: chain.statement.content,
			confidence: chain.statement.confidence,
			tags: chain.statement.tags,
			derivedFrom: chain.statement.derivedFrom,
			createdAt: chain.statement.createdAt,
			updatedAt: chain.statement.updatedAt,
		},
		parents: chain.parents.map(formatDerivationChain),
	};
}
