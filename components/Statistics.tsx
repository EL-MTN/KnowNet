'use client';

import { useQuery } from '@tanstack/react-query';
import {
	ChartBarIcon,
	DocumentTextIcon,
	LinkIcon,
	ExclamationTriangleIcon,
	TagIcon,
	ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export function Statistics() {
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ['stats'],
		queryFn: async () => {
			const response = await fetch('/api/query/stats');
			if (!response.ok) throw new Error('Failed to fetch stats');
			return response.json();
		},
	});

	const { data: contradictions, isLoading: contradictionsLoading } = useQuery(
		{
			queryKey: ['contradictions'],
			queryFn: async () => {
				const response = await fetch('/api/query/contradictions');
				if (!response.ok)
					throw new Error('Failed to fetch contradictions');
				return response.json();
			},
		},
	);

	if (statsLoading || contradictionsLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-gray-500">Loading statistics...</div>
			</div>
		);
	}

	const statCards = [
		{
			title: 'Total Statements',
			value: stats?.totalStatements || 0,
			icon: DocumentTextIcon,
			color: 'bg-blue-50 text-blue-600',
		},
		{
			title: 'Axioms',
			value: stats?.axiomCount || 0,
			icon: ChartBarIcon,
			color: 'bg-green-50 text-green-600',
		},
		{
			title: 'Theories',
			value: stats?.theoryCount || 0,
			icon: LinkIcon,
			color: 'bg-purple-50 text-purple-600',
		},
		{
			title: 'Average Confidence',
			value: stats?.averageConfidence
				? `${(stats.averageConfidence * 100).toFixed(1)}%`
				: 'N/A',
			icon: ArrowTrendingUpIcon,
			color: 'bg-yellow-50 text-yellow-600',
		},
	];

	return (
		<div className="h-full flex flex-col">
			<div className="border-b bg-white px-6 py-4">
				<h1 className="text-2xl font-semibold">Statistics</h1>
				<p className="text-sm text-gray-600 mt-1">
					Insights and analytics about your knowledge network
				</p>
			</div>

			<div className="flex-1 overflow-y-auto p-6 bg-gray-50">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* Key Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{statCards.map((stat, index) => {
							const Icon = stat.icon;
							return (
								<div
									key={index}
									className="bg-white rounded-lg border border-gray-200 p-6"
								>
									<div
										className={`inline-flex p-3 rounded-lg ${stat.color} mb-4`}
									>
										<Icon className="w-6 h-6" />
									</div>
									<h3 className="text-sm font-medium text-gray-600">
										{stat.title}
									</h3>
									<p className="text-2xl font-bold mt-1">
										{stat.value}
									</p>
								</div>
							);
						})}
					</div>

					{/* Additional Stats */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Tags Distribution */}
						<div className="bg-white rounded-lg border border-gray-200 p-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<TagIcon className="w-5 h-5" />
								Tag Distribution
							</h3>
							{stats?.tagDistribution &&
							Object.keys(stats.tagDistribution).length > 0 ? (
								<div className="space-y-2">
									{Object.entries(stats.tagDistribution)
										.sort(
											([, a], [, b]) =>
												(b as number) - (a as number),
										)
										.slice(0, 10)
										.map(([tag, count]) => (
											<div
												key={tag}
												className="flex items-center justify-between"
											>
												<span className="text-sm">
													{tag}
												</span>
												<span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
													{count as React.ReactNode}
												</span>
											</div>
										))}
								</div>
							) : (
								<p className="text-gray-500">No tags found</p>
							)}
						</div>

						{/* Network Depth */}
						<div className="bg-white rounded-lg border border-gray-200 p-6">
							<h3 className="text-lg font-semibold mb-4">
								Network Insights
							</h3>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Average Derivation Depth
									</span>
									<span className="font-medium">
										{stats?.averageDepth?.toFixed(2) || '0'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Max Derivation Depth
									</span>
									<span className="font-medium">
										{stats?.maxDepth || '0'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Orphaned Statements
									</span>
									<span className="font-medium">
										{stats?.orphanedStatements || '0'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-gray-600">
										Most Connected Statement
									</span>
									<span className="font-medium">
										{stats?.mostConnected || 'None'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Contradictions */}
					<div className="bg-white rounded-lg border border-gray-200 p-6">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<ExclamationTriangleIcon className="w-5 h-5" />
							Contradictions ({contradictions?.total || 0})
						</h3>

						{contradictions?.contradictions?.length > 0 ? (
							<div className="space-y-4">
								{contradictions.contradictions.map(
									(c: any, index: number) => (
										<div
											key={index}
											className="border rounded-lg p-4 bg-red-50 border-red-200"
										>
											<div className="flex items-center gap-2 mb-2">
												<span
													className={`px-2 py-1 rounded text-xs font-medium ${
														c.severity === 'high'
															? 'bg-red-600 text-white'
															: c.severity ===
																  'medium'
																? 'bg-yellow-600 text-white'
																: 'bg-blue-600 text-white'
													}`}
												>
													{c.severity} severity
												</span>
											</div>
											<p className="text-sm text-red-800 mb-3">
												{c.reason}
											</p>
											<div className="space-y-2">
												{c.statements.map(
													(
														stmt: any,
														idx: number,
													) => (
														<div
															key={idx}
															className="bg-white rounded p-3 border border-red-200"
														>
															<span
																className={`text-xs px-2 py-0.5 rounded ${
																	stmt.type ===
																	'axiom'
																		? 'bg-blue-100 text-blue-700'
																		: 'bg-green-100 text-green-700'
																}`}
															>
																{stmt.type}
															</span>
															<p className="mt-1 text-sm">
																{stmt.content}
															</p>
														</div>
													),
												)}
											</div>
										</div>
									),
								)}
							</div>
						) : (
							<p className="text-gray-500">
								No contradictions detected in your knowledge
								network.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
