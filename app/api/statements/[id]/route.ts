import { NextRequest, NextResponse } from 'next/server';
import { Statement } from '@/lib/core';
import { getNetworkInstance, saveNetwork } from '@/lib/network-instance';

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

		return NextResponse.json(
			formatStatementWithRelations(statement, network),
		);
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch statement' },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
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

		const updates = await request.json();
		network.updateStatement(params.id, updates);
		await saveNetwork();

		const updatedStatement = network.getStatement(params.id)!;
		return NextResponse.json({
			message: 'Statement updated successfully',
			statement: formatStatement(updatedStatement),
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to update statement' },
			{ status: 500 },
		);
	}
}

export async function DELETE(
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

		// Check for dependents
		const dependents = network.getDependents(params.id);
		if (dependents.length > 0) {
			return NextResponse.json(
				{
					error: 'Cannot delete statement with dependents',
					details: {
						dependentCount: dependents.length,
						dependentIds: dependents.map((d) => d.id),
					},
				},
				{ status: 400 },
			);
		}

		network.deleteStatement(params.id);
		await saveNetwork();

		return NextResponse.json({
			message: 'Statement deleted successfully',
			id: params.id,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to delete statement' },
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

function formatStatementWithRelations(statement: Statement, network: any) {
	const formatted: any = formatStatement(statement);

	// Add parent statements
	formatted.parents = statement.derivedFrom
		.map((id) => {
			const parent = network.getStatement(id);
			return parent
				? {
						id: parent.id,
						type: parent.type,
						content: parent.content,
					}
				: null;
		})
		.filter(Boolean);

	// Add dependent statements
	const dependents = network.getDependents(statement.id);
	formatted.dependents = dependents.map((dep: Statement) => ({
		id: dep.id,
		type: dep.type,
		content: dep.content,
	}));

	return formatted;
}
