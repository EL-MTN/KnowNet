import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { AIConfigManager } from '@/lib/config/ai-server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { url, model, apiKey } = body;

		// Use provided config or fall back to saved config
		const configManager = AIConfigManager.getInstance();
		const testUrl = url || configManager.getUrl();
		const testModel = model || configManager.getModel();

		// Test the connection with a simple request
		const response = await axios.post(
			testUrl,
			{
				model: testModel,
				messages: [
					{
						role: 'user',
						content: 'Test connection. Reply with "OK".',
					},
				],
				max_tokens: 10,
				temperature: 0,
			},
			{
				headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
				timeout: 5000, // 5 second timeout
			},
		);

		// Check if we got a valid response
		if (response.data && response.data.choices) {
			return NextResponse.json({
				success: true,
				message: 'Connection successful',
				model: testModel,
				provider: response.data.model || 'Unknown',
			});
		} else {
			return NextResponse.json({
				success: false,
				message: 'Invalid response format from AI service',
			});
		}
	} catch (error: any) {
		console.error('Connection test error:', error);

		let message = 'Connection failed';
		if (error.code === 'ECONNREFUSED') {
			message = 'Cannot connect to AI service. Is it running?';
		} else if (error.response?.status === 401) {
			message = 'Authentication failed. Check your API key.';
		} else if (error.response?.status === 404) {
			message = 'Endpoint not found. Check the URL.';
		} else if (
			error.code === 'ETIMEDOUT' ||
			error.code === 'ECONNABORTED'
		) {
			message = 'Connection timeout. Service may be slow or unreachable.';
		} else if (error.response?.data?.error) {
			message = `Service error: ${error.response.data.error}`;
		}

		return NextResponse.json(
			{
				success: false,
				message,
				details: error.message,
			},
			{ status: 200 }, // Return 200 even for errors so the client can handle the response
		);
	}
}
