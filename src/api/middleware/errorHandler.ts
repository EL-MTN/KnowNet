import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
	statusCode?: number;
	details?: any;
}

export function errorHandler(
	err: ApiError,
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const statusCode = err.statusCode || 500;
	const message = err.message || 'Internal Server Error';

	console.error(`[API Error] ${req.method} ${req.path}:`, err);

	res.status(statusCode).json({
		error: {
			message,
			statusCode,
			details: err.details || undefined,
			timestamp: new Date().toISOString(),
		},
	});
}