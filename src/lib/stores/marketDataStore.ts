import { writable, derived } from 'svelte/store';
import {
	marketDataAPI,
	MarketDataStream,
	type SymbolQuote,
	type CandleData
} from '$lib/api/market-data';
import { sessionStore } from './sessionStore';
import { allSymbols } from './watchlistsStore';

export interface MarketDataState {
	quotes: Map<string, SymbolQuote>;
	candles: Map<string, CandleData[]>;
	isLoading: boolean;
	error: string | null;
	isStreaming: boolean;
}

// Create the market data store.
const createMarketDataStore = () => {
	const { subscribe, set, update } = writable<MarketDataState>({
		quotes: new Map(),
		candles: new Map(),
		isLoading: false,
		error: null,
		isStreaming: false
	});

	let stream: MarketDataStream | null = null;

	return {
		subscribe,

		// Load quotes for symbols.
		async loadQuotes(symbols: string[]) {
			if (symbols.length === 0) return;

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const quotes = await marketDataAPI.getQuotes(symbols);
				update((state) => {
					const newQuotes = new Map(state.quotes);
					quotes.forEach((quote) => {
						newQuotes.set(quote.symbol, quote);
					});
					return { ...state, quotes: newQuotes, isLoading: false };
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load quotes';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Load candle data for a symbol.
		async loadCandles(symbol: string, interval: string = '1d', limit: number = 100) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const candles = await marketDataAPI.getCandles(symbol, interval, limit);
				update((state) => {
					const newCandles = new Map(state.candles);
					newCandles.set(symbol, candles);
					return { ...state, candles: newCandles, isLoading: false };
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load candle data';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Start real-time streaming.
		async startStreaming(symbols: string[]) {
			if (symbols.length === 0) return;

			const token = sessionStore.getToken();
			if (!token) {
				console.error('No authentication token available for streaming');
				return;
			}

			// Stop existing stream if any.
			this.stopStreaming();

			try {
				// Create new stream.
				stream = new MarketDataStream(token);

				// Initialize symbol data from existing quotes.
				subscribe((state) => {
					symbols.forEach((symbol) => {
						const existingQuote = state.quotes.get(symbol);
						if (existingQuote && stream) {
							stream.initializeSymbolData(symbol, existingQuote.lastPrice, existingQuote.volume);
						}
					});
				})();

				// Restore original quote update logic: update immediately on each message.
				stream.onMessage((quote: SymbolQuote) => {
					update((state) => {
						const newQuotes = new Map(state.quotes);
						newQuotes.set(quote.symbol, quote);
						return { ...state, quotes: newQuotes };
					});
				});

				// Handle candle updates.
				stream.onCandleMessage((candle: CandleData & { symbol: string }) => {
					update((state) => {
						const newCandles = new Map(state.candles);
						const symbolCandles = newCandles.get(candle.symbol) || [];

						// Add new candle or update existing one.
						const existingIndex = symbolCandles.findIndex((c) => c.timestamp === candle.timestamp);
						if (existingIndex >= 0) {
							symbolCandles[existingIndex] = candle;
						} else {
							symbolCandles.push(candle);
						}

						// Sort by timestamp and keep only last 100 candles.
						symbolCandles.sort(
							(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
						);
						if (symbolCandles.length > 100) {
							symbolCandles.splice(0, symbolCandles.length - 100);
						}

						newCandles.set(candle.symbol, symbolCandles);
						return { ...state, candles: newCandles };
					});
				});

				await stream.connect(symbols);
				update((state) => ({ ...state, isStreaming: true }));
			} catch (error) {
				console.error('Failed to start streaming:', error);
				// Fall back to polling if streaming fails.
				this.startPolling(symbols);
			}
		},

		// Fallback polling mechanism.
		startPolling(symbols: string[]) {
			if (symbols.length === 0) return;

			// Poll every 5 seconds as fallback.
			const pollInterval = setInterval(async () => {
				try {
					await this.loadQuotes(symbols);
				} catch (error) {
					console.error('Polling failed:', error);
				}
			}, 5000);

			// Store the interval ID for cleanup.
			(this as any).pollInterval = pollInterval;
		},

		// Stop polling.
		stopPolling() {
			if ((this as any).pollInterval) {
				clearInterval((this as any).pollInterval);
				(this as any).pollInterval = null;
			}
		},

		// Stop real-time streaming.
		stopStreaming() {
			if (stream) {
				stream.disconnect();
				stream = null;
			}
			this.stopPolling();
			update((state) => ({ ...state, isStreaming: false }));
		},

		// Update streaming symbols.
		updateStreamingSymbols(symbols: string[]) {
			if (stream) {
				stream.updateSymbols(symbols);
			}
		},

		// Start candle streaming for a specific symbol.
		async startCandleStreaming(symbol: string, period: string = '1m') {
			if (!stream) {
				console.error('Stream not initialized');
				return;
			}

			try {
				await stream.subscribeToCandles(symbol, period);
			} catch (error) {
				console.error('Failed to start candle streaming:', error);
			}
		},

		// Clear error.
		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		// Get quote for a specific symbol.
		getQuote(symbol: string): SymbolQuote | undefined {
			let quote: SymbolQuote | undefined;
			subscribe((state) => {
				quote = state.quotes.get(symbol);
			})();
			return quote;
		},

		// Get candles for a specific symbol.
		getCandles(symbol: string): CandleData[] | undefined {
			let candles: CandleData[] | undefined;
			subscribe((state) => {
				candles = state.candles.get(symbol);
			})();
			return candles;
		},

		// Clear all data.
		clear() {
			set({
				quotes: new Map(),
				candles: new Map(),
				isLoading: false,
				error: null,
				isStreaming: false
			});
		}
	};
};

export const marketDataStore = createMarketDataStore();

// Derived store for quotes as array.
export const quotesArray = derived(marketDataStore, ($marketDataStore) => {
	return Array.from($marketDataStore.quotes.values());
});

// Auto-load quotes when symbols change.
allSymbols.subscribe((symbols) => {
	if (symbols.length > 0) {
		marketDataStore.loadQuotes(symbols);
	}
});

// Auto-start streaming when symbols change.
allSymbols.subscribe((symbols) => {
	if (symbols.length > 0) {
		marketDataStore.startStreaming(symbols).catch((error) => {
			console.error('Failed to start streaming:', error);
		});
	} else {
		marketDataStore.stopStreaming();
	}
});
