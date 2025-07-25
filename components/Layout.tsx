'use client';

import { useState } from 'react';
import {
	HomeIcon,
	MagnifyingGlassIcon,
	ChartBarIcon,
	Cog6ToothIcon,
	PlusIcon,
	DocumentTextIcon,
	ShareIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
	children: React.ReactNode;
	activeView: string;
	onViewChange: (view: string) => void;
}

export function Layout({ children, activeView, onViewChange }: LayoutProps) {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	const menuItems = [
		{ id: 'home', label: 'Knowledge Base', icon: HomeIcon },
		{ id: 'search', label: 'Search & Filter', icon: MagnifyingGlassIcon },
		{ id: 'graph', label: 'Graph View', icon: ShareIcon },
		{ id: 'stats', label: 'Statistics', icon: ChartBarIcon },
	];

	const actions = [
		{
			id: 'add',
			label: 'New Statement',
			icon: PlusIcon,
			action: 'add-statement',
		},
		{
			id: 'export',
			label: 'Export',
			icon: DocumentTextIcon,
			action: 'export',
		},
	];

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<div
				className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
			>
				{/* Logo/Brand */}
				<div className="p-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h1
							className={`font-bold text-xl ${isSidebarCollapsed ? 'hidden' : 'block'}`}
						>
							KnowNet
						</h1>
						<button
							onClick={() =>
								setIsSidebarCollapsed(!isSidebarCollapsed)
							}
							className="p-1 hover:bg-gray-100 rounded"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d={
										isSidebarCollapsed
											? 'M13 5l7 7-7 7'
											: 'M11 19l-7-7 7-7'
									}
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4">
					<div className="space-y-1">
						{menuItems.map((item) => {
							const Icon = item.icon;
							return (
								<button
									key={item.id}
									onClick={() => onViewChange(item.id)}
									className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
										activeView === item.id
											? 'bg-blue-50 text-blue-600'
											: 'text-gray-700 hover:bg-gray-50'
									}`}
								>
									<Icon className="w-5 h-5 flex-shrink-0" />
									{!isSidebarCollapsed && (
										<span>{item.label}</span>
									)}
								</button>
							);
						})}
					</div>

					{/* Quick Actions */}
					<div className="mt-8 pt-4 border-t border-gray-200">
						<div
							className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${isSidebarCollapsed ? 'hidden' : 'block'}`}
						>
							Quick Actions
						</div>
						<div className="space-y-1">
							{actions.map((action) => {
								const Icon = action.icon;
								return (
									<button
										key={action.id}
										onClick={() =>
											window.dispatchEvent(
												new CustomEvent(action.action),
											)
										}
										className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
									>
										<Icon className="w-5 h-5 flex-shrink-0" />
										{!isSidebarCollapsed && (
											<span>{action.label}</span>
										)}
									</button>
								);
							})}
						</div>
					</div>
				</nav>

				{/* Settings */}
				<div className="p-4 border-t border-gray-200">
					<button
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent('open-settings'),
							)
						}
						className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
					>
						<Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
						{!isSidebarCollapsed && <span>Settings</span>}
					</button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
