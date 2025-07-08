// TypeScript interfaces and types for TastyTrade API

// Authentication types
export interface TastyTradeAuthRequest {
	login: string;
	password: string;
}

export interface TastyTradeAuthResponse {
	data: {
		session_token: string;
		user: {
			id: string;
			email: string;
			username: string;
			first_name: string;
			last_name: string;
		};
	};
}

// Watchlist types
export interface TastyTradeWatchlist {
	id: string;
	name: string;
	watchlist_entries: TastyTradeWatchlistEntry[];
	created_at: string;
	updated_at: string;
}

export interface TastyTradeWatchlistEntry {
	id: string;
	symbol: string;
	instrument_type: string;
	created_at: string;
}

export interface TastyTradeCreateWatchlistRequest {
	name: string;
}

export interface TastyTradeAddSymbolRequest {
	symbol: string;
	instrument_type?: string;
}

// Market data types
export interface TastyTradeQuote {
	symbol: string;
	last_price: number;
	bid_price: number;
	ask_price: number;
	bid_size: number;
	ask_size: number;
	last_size: number;
	volume: number;
	open_interest: number;
	underlying_price: number;
	mark: number;
	mark_price: number;
	mark_change: number;
	mark_change_percent: number;
	high_price: number;
	low_price: number;
	open_price: number;
	close_price: number;
	previous_close_price: number;
	previous_close_date: string;
	implied_volatility: number;
	delta: number;
	gamma: number;
	theta: number;
	vega: number;
	rho: number;
	time_value: number;
	intrinsic_value: number;
	underlying_bid: number;
	underlying_ask: number;
	underlying_last: number;
	underlying_mark: number;
	underlying_mark_change: number;
	underlying_mark_change_percent: number;
	exchange: string;
	description: string;
	last_updated: string;
}

export interface TastyTradeCandle {
	timestamp: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface TastyTradeSymbolSearchResult {
	symbol: string;
	description: string;
	instrument_type: string;
	exchange: string;
	is_tradable: boolean;
	is_quotable: boolean;
}

// WebSocket types
export interface TastyTradeWebSocketMessage {
	type: 'quote' | 'heartbeat' | 'error';
	data?: any;
	error?: string;
}

export interface TastyTradeWebSocketSubscribeRequest {
	type: 'subscribe';
	symbols: string[];
	session_token: string;
}

export interface TastyTradeWebSocketUpdateRequest {
	type: 'update';
	symbols: string[];
}

// Error types
export interface TastyTradeError {
	code: string;
	message: string;
	details?: any;
}

// API Response wrapper types
export interface TastyTradeResponse<T> {
	data: T;
	context: string;
}

export interface TastyTradePaginatedResponse<T> {
	data: T[];
	context: string;
	pagination: {
		total_count: number;
		page_size: number;
		page_number: number;
		total_pages: number;
	};
}
