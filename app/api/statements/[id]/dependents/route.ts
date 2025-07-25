import { NextRequest, NextResponse } from 'next/server';
import { Statement } from '@/lib/core';
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

		const dependents = network.getDependents(params.id);

		return NextResponse.json({
			total: dependents.length,
			dependents: dependents.map(formatStatement),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch dependents' },
			{ status: 500 },
		);
	}
}

function formatStatement(statement: Statement) {
	return {
		id: statement.id,
		type: statement.type,
		content: statement.content,
		confidence: statement.confidence,
		tags: statement.tags,
		derivedFrom: statement.derivedFrom,
		createdAt: statement.createdAt,
		updatedAt: statement.updatedAt,
	};
}
