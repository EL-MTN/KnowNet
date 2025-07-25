'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { KnowledgeBase } from '@/components/KnowledgeBase';
import { SearchPanel } from '@/components/SearchPanel';
import { Statistics } from '@/components/Statistics';
import { AISettings } from '@/components/AISettings';
import { AddStatementModal } from '@/components/AddStatementModal';
import { GraphView } from '@/components/GraphView';
import { FloatingAIButton } from '@/components/FloatingAIButton';
import { QuickAIPanel } from '@/components/QuickAIPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
	const [activeView, setActiveView] = useState('home');
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [generatedTheory, setGeneratedTheory] = useState<any>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [quickAIStatements, setQuickAIStatements] = useState<any[]>([]);

	// Enable keyboard shortcuts
	useKeyboardShortcuts();

	// Listen for custom events
	useEffect(() => {
		const handleOpenSettings = () => setIsSettingsOpen(true);
		const handleGenerateTheory = (e: any) => {
			// Instead of changing view, show QuickAIPanel
			setQuickAIStatements(e.detail);
		};
		const handleAddWithTheory = (e: any) => {
			setGeneratedTheory(e.detail);
			setIsAddModalOpen(true);
		};
		const handleQuickAI = (e: any) => {
			setQuickAIStatements(e.detail);
		};

		window.addEventListener('open-settings', handleOpenSettings);
		window.addEventListener('generate-theory', handleGenerateTheory);
		window.addEventListener('add-with-theory', handleAddWithTheory);
		window.addEventListener('quick-ai-generate', handleQuickAI);

		return () => {
			window.removeEventListener('open-settings', handleOpenSettings);
			window.removeEventListener('generate-theory', handleGenerateTheory);
			window.removeEventListener('add-with-theory', handleAddWithTheory);
			window.removeEventListener('quick-ai-generate', handleQuickAI);
		};
	}, []);

	const renderView = () => {
		switch (activeView) {
			case 'home':
				return <KnowledgeBase />;
			case 'search':
				return <SearchPanel />;
			case 'stats':
				return <Statistics />;
			case 'graph':
				return <GraphView />;
			default:
				return <KnowledgeBase />;
		}
	};

	return (
		<>
			<Layout activeView={activeView} onViewChange={setActiveView}>
				{renderView()}
			</Layout>

			{/* Settings Modal */}
			{isSettingsOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full p-6">
						<h2 className="text-xl font-semibold mb-4">Settings</h2>
						<AISettings />
						<button
							onClick={() => setIsSettingsOpen(false)}
							className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
						>
							Close
						</button>
					</div>
				</div>
			)}

			{/* Add Statement Modal with Generated Theory */}
			<AddStatementModal
				isOpen={isAddModalOpen}
				onClose={() => {
					setIsAddModalOpen(false);
					setGeneratedTheory(null);
				}}
				generatedContent={generatedTheory}
			/>

			{/* Floating AI Button for quick generation */}
			<FloatingAIButton />

			{/* Quick AI Panel - shows when AI generation is triggered */}
			{quickAIStatements.length > 0 && (
				<QuickAIPanel
					selectedStatements={quickAIStatements}
					onClose={() => setQuickAIStatements([])}
				/>
			)}
		</>
	);
}
