import { API_BASE_URL, getAuthHeaders } from '../shared/config';
import { handleApiError, extractItemsFromResponse } from '../shared/utils';
import type { TastytradeResponse } from '../shared/types';
import type { SymbolQuote, CandleData } from './types';

// Helper function to transform quote data
const transformQuoteData = (quote: any): SymbolQuote => {
	// Handle nested data structure
	const data = quote.data || quote;

	// Calculate change and change percent from prev-close and last
	const lastPrice = parseFloat(data.last) || 0;
	const prevClose = parseFloat(data['prev-close']) || 0;
	const change = lastPrice - prevClose;
	const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

	return {
		symbol: data.symbol,
		bidPrice: parseFloat(data.bid) || 0,
		askPrice: parseFloat(data.ask) || 0,
		lastPrice: lastPrice,
		change: change,
		changePercent: changePercent,
		volume: parseFloat(data.volume) || 0,
		marketCap: undefined,
		lastUpdated: data['updated-at'] || new Date().toISOString()
	};
};

// Helper function to transform candle data
const transformCandleData = (candle: any): CandleData => ({
	timestamp: candle.timestamp,
	open: candle.open,
	high: candle.high,
	low: candle.low,
	close: candle.close,
	volume: candle.volume
});

export const marketDataAPI = {
	async getQuotes(symbols: string[]): Promise<SymbolQuote[]> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		try {
			// Use the correct market-data endpoint for each symbol
			const quotePromises = symbols.map(async (symbol) => {
				const response = await fetch(`${API_BASE_URL}/market-data/${symbol}`, {
					headers: getAuthHeaders(token)
				});

				if (!response.ok) {
					console.warn(`Failed to fetch quote for ${symbol}: ${response.status}`);
					return null;
				}

				const data = await response.json();
				return transformQuoteData(data.data || data);
			});

			const results = await Promise.all(quotePromises);
			return results.filter((quote): quote is SymbolQuote => quote !== null);
		} catch (error) {
			console.error('Failed to fetch quotes:', error);
			throw new Error('Failed to fetch quotes due to CORS or network error');
		}
	},

	async getCandles(
		symbol: string,
		interval: string = '1d',
		limit: number = 100
	): Promise<CandleData[]> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		try {
			const response = await fetch(
				`${API_BASE_URL}/market-data/${symbol}/candles?interval=${interval}&limit=${limit}`,
				{ headers: getAuthHeaders(token) }
			);

			if (!response.ok) {
				await handleApiError(response, 'Failed to fetch candle data');
			}

			const data: TastytradeResponse<{ items: any[] }> = await response.json();
			return data.data.items.map(transformCandleData);
		} catch (error) {
			console.error('Failed to fetch candles:', error);
			throw new Error('Failed to fetch candles due to CORS or network error');
		}
	},

	async searchSymbols(query: string): Promise<{ symbol: string; name: string }[]> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		const endpoints = [
			`${API_BASE_URL}/symbols/search/${encodeURIComponent(query)}`,
			`${API_BASE_URL}/instruments?search=${encodeURIComponent(query)}`,
			`${API_BASE_URL}/symbols?search=${encodeURIComponent(query)}`,
			`${API_BASE_URL}/equities?search=${encodeURIComponent(query)}`
		];

		let response: Response;
		let workingEndpoint = '';

		// Try endpoints until one works
		for (const endpoint of endpoints) {
			response = await fetch(endpoint, { headers: getAuthHeaders(token) });
			if (response.ok) {
				workingEndpoint = endpoint;
				break;
			}
		}

		if (!response!.ok) {
			await handleApiError(response!, 'Failed to search symbols');
		}

		const data = await response!.json();
		const items = extractItemsFromResponse(data);

		return items.map((instrument: any) => ({
			symbol: instrument.symbol,
			name: instrument.description || instrument.symbol
		}));
	}
};

/**
 * Fetch historical candles from Polygon.io
 * @param symbol - e.g. 'AAPL'
 * @param multiplier - e.g. 1
 * @param timespan - 'minute' or 'day'
 * @param from - 'YYYY-MM-DD'
 * @param to - 'YYYY-MM-DD'
 * @param apiKey - Polygon.io API key
 * @returns Promise<CandleData[]>
 */
export async function getPolygonCandles(
	symbol: string,
	multiplier: number = 1,
	timespan: string = 'minute',
	from: string,
	to: string,
	apiKey: string
) {
	const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Polygon candle fetch failed: ${response.status}`);
	const data = await response.json();
	if (!data.results) return [];
	return data.results.map((bar: any) => ({
		timestamp: new Date(bar.t).toISOString(),
		open: bar.o,
		high: bar.h,
		low: bar.l,
		close: bar.c,
		volume: bar.v
	}));
}
