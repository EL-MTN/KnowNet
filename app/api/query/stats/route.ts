import { NextResponse } from 'next/server';
import { QueryService } from '@/lib/services';
import { getNetworkInstance } from '@/lib/network-instance';

export async function GET() {
	try {
		const network = await getNetworkInstance();
		const queryService = new QueryService(network);
		const stats = queryService.getStatementSummary();

		return NextResponse.json(stats);
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch statistics' },
			{ status: 500 },
		);
	}
}
