'use client';

import { useState, useEffect } from 'react';
import { AIConfigManager } from '@/lib/config/ai-client';

export function AISettings() {
	const [config, setConfig] = useState({
		url: '',
		model: '',
		apiKey: '',
	});
	const [isOpen, setIsOpen] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		const configManager = AIConfigManager.getInstance();
		setConfig({
			url: configManager.getUrl(),
			model: configManager.getModel(),
			apiKey: configManager.getApiKey() || '',
		});
	}, []);

	const handleSave = () => {
		const configManager = AIConfigManager.getInstance();
		configManager.setUrl(config.url);
		configManager.setModel(config.model);
		if (config.apiKey) {
			configManager.setApiKey(config.apiKey);
		}
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div className="fixed bottom-4 right-4">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-600"
				title="AI Settings"
			>
				⚙️
			</button>

			{isOpen && (
				<div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-80">
					<h3 className="font-semibold mb-3">AI Configuration</h3>
					
					<div className="space-y-3">
						<div>
							<label className="block text-sm font-medium mb-1">
								API URL
							</label>
							<input
								type="text"
								value={config.url}
								onChange={(e) => setConfig({ ...config, url: e.target.value })}
								className="w-full p-2 border rounded"
								placeholder="http://127.0.0.1:1234/v1/chat/completions"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Model
							</label>
							<input
								type="text"
								value={config.model}
								onChange={(e) => setConfig({ ...config, model: e.target.value })}
								className="w-full p-2 border rounded"
								placeholder="llama-3.2-3b-instruct"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								API Key (optional)
							</label>
							<input
								type="password"
								value={config.apiKey}
								onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
								className="w-full p-2 border rounded"
								placeholder="For cloud providers"
							/>
						</div>

						<div className="flex justify-between items-center pt-2">
							<button
								onClick={handleSave}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Save
							</button>
							{saved && (
								<span className="text-green-600 text-sm">Saved!</span>
							)}
						</div>
					</div>

					<div className="mt-4 pt-3 border-t text-xs text-gray-500">
						<p>Configure your local LLM or cloud AI provider.</p>
						<p className="mt-1">Default: Local LLM at port 1234</p>
					</div>
				</div>
			)}
		</div>
	);
}