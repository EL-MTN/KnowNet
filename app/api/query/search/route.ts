import { NextRequest, NextResponse } from 'next/server';
import { QueryOptions } from '@/lib/core';
import { QueryService } from '@/lib/services';
import { getNetworkInstance } from '@/lib/network-instance';

export async function POST(request: NextRequest) {
	try {
		const network = await getNetworkInstance();
		const queryService = new QueryService(network);
		const body = await request.json();

		const { type, tags, content, confidence, derivedFrom } = body;

		const options: QueryOptions = {
			type,
			tags,
			content,
			derivedFrom,
		};

		// Handle confidence range
		if (confidence) {
			options.minConfidence = confidence.min;
		}

		const queryResult = queryService.advancedQuery(options);
		const results = queryResult.statements;

		return NextResponse.json({
			total: results.length,
			results: results.map((stmt) => ({
				id: stmt.id,
				type: stmt.type,
				content: stmt.content,
				confidence: stmt.confidence,
				tags: stmt.tags,
				derivedFrom: stmt.derivedFrom,
				createdAt: stmt.createdAt,
				updatedAt: stmt.updatedAt,
			})),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to search statements' },
			{ status: 500 },
		);
	}
}
