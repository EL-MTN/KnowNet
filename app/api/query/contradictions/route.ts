import { NextResponse } from 'next/server';
import { ContradictionDetector } from '@/lib/services';
import { getNetworkInstance } from '@/lib/network-instance';

export async function GET() {
	try {
		const network = await getNetworkInstance();
		const contradictionDetector = new ContradictionDetector(network);
		const contradictions = contradictionDetector.detectContradictions();

		return NextResponse.json({
			total: contradictions.length,
			contradictions: contradictions.map((c) => ({
				severity: c.severity,
				statements: [
					{
						id: c.statement1.id,
						type: c.statement1.type,
						content: c.statement1.content,
					},
					{
						id: c.statement2.id,
						type: c.statement2.type,
						content: c.statement2.content,
					},
				],
				reason: c.reason,
			})),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to detect contradictions' },
			{ status: 500 },
		);
	}
}
