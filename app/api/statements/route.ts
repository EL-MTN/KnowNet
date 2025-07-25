import { NextRequest, NextResponse } from 'next/server';
import { Statement, StatementType } from '@/lib/core';
import { getNetworkInstance, saveNetwork } from '@/lib/network-instance';

export async function GET() {
	try {
		const network = await getNetworkInstance();
		const statements = network.getAllStatements();

		return NextResponse.json({
			total: statements.length,
			statements: statements.map(formatStatement),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch statements' },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { type, content, confidence, tags, derivedFrom } = body;

		// Validate required fields
		if (!type || !content) {
			return NextResponse.json(
				{ error: 'Missing required fields: type and content' },
				{ status: 400 },
			);
		}

		// Validate type
		if (!['axiom', 'theory'].includes(type)) {
			return NextResponse.json(
				{
					error: 'Invalid statement type. Must be "axiom" or "theory"',
				},
				{ status: 400 },
			);
		}

		// Create statement
		const statement = new Statement(type as StatementType, content, {
			confidence,
			tags: tags || [],
			derivedFrom: derivedFrom || [],
		});

		// Add to network
		const network = await getNetworkInstance();
		network.addStatement(statement);

		// Save to storage
		await saveNetwork();

		return NextResponse.json(
			{
				message: 'Statement created successfully',
				statement: formatStatement(statement),
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to create statement' },
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
