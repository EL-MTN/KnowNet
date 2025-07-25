'use client';

import { useState, useEffect } from 'react';
import { AIConfigManager } from '@/lib/config/ai-client';

export function AISettings() {
	const [config, setConfig] = useState({
		url: '',
		model: '',
		apiKey: '',
	});
	const [saved, setSaved] = useState(false);
	const [testing, setTesting] = useState(false);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

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

	const handleTestConnection = async () => {
		setTesting(true);
		setTestResult(null);

		try {
			const response = await fetch('/api/ai/test-connection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: config.url,
					model: config.model,
					apiKey: config.apiKey,
				}),
			});

			const result = await response.json();
			setTestResult(result);
		} catch (error) {
			setTestResult({
				success: false,
				message: 'Failed to test connection',
			});
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				<div>
					<label className="block text-sm font-medium mb-1">
						API URL
					</label>
					<input
						type="text"
						value={config.url}
						onChange={(e) =>
							setConfig({ ...config, url: e.target.value })
						}
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
						onChange={(e) =>
							setConfig({ ...config, model: e.target.value })
						}
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
						onChange={(e) =>
							setConfig({ ...config, apiKey: e.target.value })
						}
						className="w-full p-2 border rounded"
						placeholder="For cloud providers"
					/>
				</div>

				<div className="flex gap-2 pt-2">
					<button
						onClick={handleSave}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Save
					</button>
					<button
						onClick={handleTestConnection}
						disabled={testing}
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
					>
						{testing ? 'Testing...' : 'Test'}
					</button>
				</div>

				{saved && (
					<p className="text-green-600 text-sm mt-2">
						Settings saved!
					</p>
				)}

				{testResult && (
					<div
						className={`mt-2 p-2 rounded text-sm ${
							testResult.success
								? 'bg-green-50 text-green-700'
								: 'bg-red-50 text-red-700'
						}`}
					>
						{testResult.message}
					</div>
				)}
			</div>

			<div className="mt-4 pt-3 border-t text-xs text-gray-500">
				<p>Configure your local LLM or cloud AI provider.</p>
				<p className="mt-1">Default: Local LLM at port 1234</p>
			</div>
		</div>
	);
}
