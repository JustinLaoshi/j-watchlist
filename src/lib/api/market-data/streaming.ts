import { API_BASE_URL, getAuthHeaders } from '../shared/config';
import type { SymbolQuote, CandleData } from './types';

// DXLink message types
interface DXLinkSetup {
	type: 'SETUP';
	channel: number;
	version: string;
	keepaliveTimeout: number;
	acceptKeepaliveTimeout: number;
}

interface DXLinkAuth {
	type: 'AUTH';
	channel: number;
	token: string;
}

interface DXLinkChannelRequest {
	type: 'CHANNEL_REQUEST';
	channel: number;
	service: string;
	parameters: Record<string, any>;
}

interface DXLinkFeedSetup {
	type: 'FEED_SETUP';
	channel: number;
	acceptAggregationPeriod: number;
	acceptDataFormat: string;
	acceptEventFields: Record<string, string[]>;
}

interface DXLinkFeedSubscription {
	type: 'FEED_SUBSCRIPTION';
	channel: number;
	reset?: boolean;
	add?: Array<{ type: string; symbol: string; fromTime?: number }>;
	remove?: Array<{ type: string; symbol: string }>;
}

interface DXLinkKeepalive {
	type: 'KEEPALIVE';
	channel: number;
}

// API Quote Token response
interface ApiQuoteTokenResponse {
	data: {
		token: string;
		'dxlink-url': string;
		level: string;
	};
	context: string;
}

export class MarketDataStream {
	private ws: WebSocket | null = null;
	private sessionToken: string;
	private apiQuoteToken: string | null = null;
	private dxlinkUrl: string | null = null;
	private onMessageCallback: ((data: SymbolQuote) => void) | null = null;
	private onCandleCallback: ((data: CandleData & { symbol: string }) => void) | null = null;
	private keepaliveInterval: number | null = null;
	private channelId = 3; // Using channel 3 for market data
	private isConnected = false;
	private subscribedSymbols: Set<string> = new Set();
	private symbolData: Map<string, { lastPrice: number; volume: number; timestamp: number }> =
		new Map();

	constructor(sessionToken: string) {
		this.sessionToken = sessionToken;
	}

	// Get API quote token from Tastytrade
	private async getApiQuoteToken(): Promise<{ token: string; url: string }> {
		const response = await fetch(`${API_BASE_URL}/api-quote-tokens`, {
			headers: getAuthHeaders(this.sessionToken)
		});

		if (!response.ok) {
			if (response.status === 403) {
				const errorData = await response.json().catch(() => ({}));
				if (errorData.error?.code === 'quote_streamer.customer_not_found_error') {
					throw new Error(
						'You must be a registered Tastytrade customer to access streaming quotes. Please complete the account opening process at tastytrade.com'
					);
				}
			}
			throw new Error(`Failed to get API quote token: ${response.status}`);
		}

		const data: ApiQuoteTokenResponse = await response.json();
		return {
			token: data.data.token,
			url: data.data['dxlink-url']
		};
	}

	// Convert symbols to DXLink format
	private async getStreamerSymbols(symbols: string[]): Promise<string[]> {
		const streamerSymbols: string[] = [];

		for (const symbol of symbols) {
			try {
				// Try to get the streamer symbol from the instruments API
				// We'll try equities first, then other instrument types
				const response = await fetch(`${API_BASE_URL}/instruments/equities/${symbol}`, {
					headers: getAuthHeaders(this.sessionToken)
				});

				if (response.ok) {
					const data = await response.json();
					if (data.data && data.data['streamer-symbol']) {
						streamerSymbols.push(data.data['streamer-symbol']);
						continue;
					}
				}

				// If not found in equities, try other instrument types
				// For now, fall back to using the symbol as-is
				// In a full implementation, you'd check futures, options, etc.
				streamerSymbols.push(symbol.toUpperCase());
			} catch (error) {
				console.warn(`Failed to get streamer symbol for ${symbol}:`, error);
				// Fall back to using the symbol as-is
				streamerSymbols.push(symbol.toUpperCase());
			}
		}

		return streamerSymbols;
	}

	async connect(symbols: string[]) {
		try {
			// Step 1: Get API quote token
			const { token, url } = await this.getApiQuoteToken();
			this.apiQuoteToken = token;
			this.dxlinkUrl = url;

			// Step 2: Connect to DXLink WebSocket
			this.ws = new WebSocket(url);

			this.ws.onopen = () => {
				this.isConnected = true;
				this.performDXLinkHandshake(symbols);
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleDXLinkMessage(data);
				} catch (error) {
					console.error('Failed to parse DXLink message:', error);
				}
			};

			this.ws.onerror = (error) => {
				console.error('DXLink WebSocket error:', error);
			};

			this.ws.onclose = () => {
				this.isConnected = false;
				this.stopKeepalive();
			};
		} catch (error) {
			console.error('Failed to establish DXLink connection:', error);
			throw error;
		}
	}

	private async performDXLinkHandshake(symbols: string[]) {
		if (!this.ws || !this.isConnected) return;

		try {
			// Step 3: SETUP
			const setupMessage: DXLinkSetup = {
				type: 'SETUP',
				channel: 0,
				version: '0.1-DXF-JS/0.3.0',
				keepaliveTimeout: 60,
				acceptKeepaliveTimeout: 60
			};
			this.sendMessage(setupMessage);

			// Step 4: AUTHORIZE (will be sent after receiving AUTH_STATE)
			// Step 5: CHANNEL_REQUEST (will be sent after authorization)
			// Step 6: FEED_SETUP (will be sent after channel opened)
			// Step 7: FEED_SUBSCRIPTION (will be sent after feed setup)
			// Step 8: Start KEEPALIVE

			// Store symbols for subscription after handshake
			this.subscribedSymbols = new Set(symbols);
		} catch (error) {
			console.error('Failed to perform DXLink handshake:', error);
		}
	}

	private handleDXLinkMessage(data: any) {
		switch (data.type) {
			case 'SETUP':
				break;

			case 'AUTH_STATE':
				if (data.state === 'UNAUTHORIZED') {
					// Send authorization
					const authMessage: DXLinkAuth = {
						type: 'AUTH',
						channel: 0,
						token: this.apiQuoteToken!
					};
					this.sendMessage(authMessage);
				} else if (data.state === 'AUTHORIZED') {
					// Request channel
					const channelRequest: DXLinkChannelRequest = {
						type: 'CHANNEL_REQUEST',
						channel: this.channelId,
						service: 'FEED',
						parameters: { contract: 'AUTO' }
					};
					this.sendMessage(channelRequest);
				}
				break;

			case 'CHANNEL_OPENED':
				if (data.channel === this.channelId) {
					// Setup feed
					const feedSetup: DXLinkFeedSetup = {
						type: 'FEED_SETUP',
						channel: this.channelId,
						acceptAggregationPeriod: 0.1,
						acceptDataFormat: 'COMPACT',
						acceptEventFields: {
							Trade: ['eventType', 'eventSymbol', 'price', 'dayVolume', 'size'],
							TradeETH: ['eventType', 'eventSymbol', 'price', 'dayVolume', 'size'],
							Quote: ['eventType', 'eventSymbol', 'bidPrice', 'askPrice', 'bidSize', 'askSize'],
							Greeks: [
								'eventType',
								'eventSymbol',
								'volatility',
								'delta',
								'gamma',
								'theta',
								'rho',
								'vega'
							],
							Profile: [
								'eventType',
								'eventSymbol',
								'description',
								'shortSaleRestriction',
								'tradingStatus',
								'statusReason',
								'haltStartTime',
								'haltEndTime',
								'highLimitPrice',
								'lowLimitPrice',
								'high52WeekPrice',
								'low52WeekPrice'
							],
							Summary: [
								'eventType',
								'eventSymbol',
								'openInterest',
								'dayOpenPrice',
								'dayHighPrice',
								'dayLowPrice',
								'prevDayClosePrice'
							]
						}
					};
					this.sendMessage(feedSetup);
				}
				break;

			case 'FEED_CONFIG':
				if (data.channel === this.channelId) {
					// Subscribe to symbols
					this.subscribeToSymbols(Array.from(this.subscribedSymbols));
					// Start keepalive
					this.startKeepalive();
				}
				break;

			case 'FEED_DATA':
				if (data.channel === this.channelId) {
					this.handleFeedData(data.data);
				}
				break;

			default:
				// Handle other message types as needed
				break;
		}
	}

	private async subscribeToSymbols(symbols: string[]) {
		if (!this.ws || !this.isConnected || symbols.length === 0) return;

		try {
			const streamerSymbols = await this.getStreamerSymbols(symbols);

			const subscription: DXLinkFeedSubscription = {
				type: 'FEED_SUBSCRIPTION',
				channel: this.channelId,
				reset: true,
				add: streamerSymbols.flatMap((symbol) => [
					{ type: 'Trade', symbol },
					{ type: 'Quote', symbol },
					{ type: 'Profile', symbol },
					{ type: 'Summary', symbol }
				])
			};

			this.sendMessage(subscription);
		} catch (error) {
			console.error('Failed to subscribe to symbols:', error);
		}
	}

	private handleFeedData(data: any[]) {
		// Parse DXLink feed data and convert to SymbolQuote format
		for (const event of data) {
			const eventType = event[0];
			const symbol = event[1];

			if (!symbol) continue;

			// Get or create symbol data
			let symbolData = this.symbolData.get(symbol);
			if (!symbolData) {
				symbolData = { lastPrice: 0, volume: 0, timestamp: Date.now() };
				this.symbolData.set(symbol, symbolData);
			}

			switch (eventType) {
				case 'Quote':
					const bidPrice = event[2] || 0;
					const askPrice = event[3] || 0;
					const lastPrice = bidPrice || askPrice || symbolData.lastPrice;

					const change = lastPrice - symbolData.lastPrice;
					const changePercent =
						symbolData.lastPrice > 0 ? (change / symbolData.lastPrice) * 100 : 0;

					const quote: SymbolQuote = {
						symbol,
						bidPrice,
						askPrice,
						lastPrice,
						change,
						changePercent,
						volume: symbolData.volume,
						lastUpdated: new Date().toISOString(),
						timestamp: Date.now()
					};

					// Update stored data
					symbolData.lastPrice = lastPrice;
					symbolData.timestamp = Date.now();

					this.onMessageCallback?.(quote);
					break;

				case 'Trade':
					const tradePrice = event[2] || 0;
					const tradeVolume = event[3] || 0;

					// Update volume
					symbolData.volume += tradeVolume;

					const tradeChange = tradePrice - symbolData.lastPrice;
					const tradeChangePercent =
						symbolData.lastPrice > 0 ? (tradeChange / symbolData.lastPrice) * 100 : 0;

					// Create quote from trade data
					const tradeQuote: SymbolQuote = {
						symbol,
						bidPrice: tradePrice,
						askPrice: tradePrice,
						lastPrice: tradePrice,
						change: tradeChange,
						changePercent: tradeChangePercent,
						volume: symbolData.volume,
						lastUpdated: new Date().toISOString(),
						timestamp: Date.now()
					};

					// Update stored data
					symbolData.lastPrice = tradePrice;
					symbolData.timestamp = Date.now();

					this.onMessageCallback?.(tradeQuote);
					break;

				case 'Summary':
					// Handle summary data (day open, high, low, etc.)
					const dayOpen = event[3] || 0;
					const dayHigh = event[4] || 0;
					const dayLow = event[5] || 0;
					const prevClose = event[6] || 0;

					// Update change calculations based on previous close
					if (prevClose > 0) {
						symbolData.lastPrice = prevClose;
					}
					break;

				case 'Candle':
					// Handle candle data
					const candleData: CandleData & { symbol: string } = {
						symbol,
						timestamp: new Date(event[2] || Date.now()).toISOString(),
						open: event[3] || 0,
						high: event[4] || 0,
						low: event[5] || 0,
						close: event[6] || 0,
						volume: event[7] || 0
					};

					this.onCandleCallback?.(candleData);
					break;
			}
		}
	}

	private startKeepalive() {
		this.keepaliveInterval = window.setInterval(() => {
			if (this.ws && this.isConnected) {
				const keepalive: DXLinkKeepalive = {
					type: 'KEEPALIVE',
					channel: 0
				};
				this.sendMessage(keepalive);
			}
		}, 30000); // Send keepalive every 30 seconds
	}

	private stopKeepalive() {
		if (this.keepaliveInterval) {
			clearInterval(this.keepaliveInterval);
			this.keepaliveInterval = null;
		}
	}

	private sendMessage(message: any) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	onMessage(callback: (data: SymbolQuote) => void) {
		this.onMessageCallback = callback;
	}

	onCandleMessage(callback: (data: CandleData & { symbol: string }) => void) {
		this.onCandleCallback = callback;
	}

	async subscribeToCandles(symbol: string, period: string = '1m', fromTime?: number) {
		if (!this.ws || !this.isConnected) return;

		try {
			// Create candle symbol with period (e.g., AAPL{=1m})
			const candleSymbol = `${symbol}{=${period}}`;
			// Calculate fromTime if not provided (24 hours ago)
			const fromTimestamp = fromTime || Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
			const subscription: DXLinkFeedSubscription = {
				type: 'FEED_SUBSCRIPTION',
				channel: this.channelId,
				reset: false,
				add: [{ type: 'Candle', symbol: candleSymbol, fromTime: fromTimestamp }]
			};
			this.sendMessage(subscription);
		} catch (error) {
			console.error('Failed to subscribe to candles:', error);
		}
	}

	async updateSymbols(symbols: string[]) {
		if (!this.ws || !this.isConnected) return;

		const newSymbols = new Set(symbols);
		const symbolsToAdd = symbols.filter((s) => !this.subscribedSymbols.has(s));
		const symbolsToRemove = Array.from(this.subscribedSymbols).filter((s) => !newSymbols.has(s));

		// Remove old symbols from subscription but preserve their data
		if (symbolsToRemove.length > 0) {
			const streamerSymbols = await this.getStreamerSymbols(symbolsToRemove);
			const removeSubscription: DXLinkFeedSubscription = {
				type: 'FEED_SUBSCRIPTION',
				channel: this.channelId,
				remove: streamerSymbols.flatMap((symbol) => [
					{ type: 'Trade', symbol },
					{ type: 'Quote', symbol },
					{ type: 'Profile', symbol },
					{ type: 'Summary', symbol }
				])
			};
			this.sendMessage(removeSubscription);

			// Note: We don't clear symbolData here to preserve state for when symbols are re-added
		}

		// Add new symbols
		if (symbolsToAdd.length > 0) {
			await this.subscribeToSymbols(symbolsToAdd);
		}

		this.subscribedSymbols = newSymbols;
	}

	// Initialize symbol data from existing quotes
	initializeSymbolData(symbol: string, lastPrice: number, volume: number = 0) {
		this.symbolData.set(symbol, {
			lastPrice,
			volume,
			timestamp: Date.now()
		});
	}

	disconnect() {
		this.stopKeepalive();
		this.ws?.close();
		this.ws = null;
		this.isConnected = false;
		this.subscribedSymbols.clear();
		this.symbolData.clear();
	}
}
