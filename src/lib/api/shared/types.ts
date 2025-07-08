export interface TastytradeResponse<T> {
	data: T;
	context?: string;
}

export interface TastytradeError {
	error: {
		code: string;
		message: string;
	};
}
