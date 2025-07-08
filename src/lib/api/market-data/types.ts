export interface SymbolQuote {
	symbol: string;
	bidPrice: number;
	askPrice: number;
	lastPrice: number;
	change: number;
	changePercent: number;
	volume: number;
	marketCap?: number;
	lastUpdated: string;
	timestamp?: number; // For real-time streaming data
}

export interface CandleData {
	timestamp: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}
