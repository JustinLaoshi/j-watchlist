<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/sessionStore';
	import { marketDataStore } from '$lib/stores/marketDataStore';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import Icon from '$lib/components/Icon.svelte';
	import { MarketDataStream } from '$lib/api/market-data/streaming';
	import { getPolygonCandles } from '$lib/api/market-data/api';
	import SymbolDetailChart from '../../../components/SymbolDetailChart.svelte';
	import { writable } from 'svelte/store';

	// Get symbol from URL params.
	$: symbol = $page.params.symbol?.toUpperCase();
	$: isAuthenticated = $sessionStore.isAuthenticated;

	let isLoading = true;
	let error = '';

	let marketStream: MarketDataStream | null = null;
	let chartCandles: any[] = [];

	async function startChartCandleStream() {
		if (marketStream) {
			marketStream.disconnect();
			marketStream = null;
		}
		chartCandles = [];
		const token = sessionStore.getToken();
		if (!token) {
			error = 'No authentication token available';
			return;
		}
		marketStream = new MarketDataStream(token);
		// Listen for candle events.
		marketStream.onCandleMessage((candle) => {
			if (candle.symbol !== symbol) return;
			chartCandles = [...chartCandles, candle];
			// Remove duplicates by timestamp.
			const seen = new Set();
			chartCandles = chartCandles.filter((c) => {
				if (seen.has(c.timestamp)) return false;
				seen.add(c.timestamp);
				return true;
			});
			// Sort by timestamp.
			chartCandles.sort(
				(a, b) => new Date(candle.timestamp).getTime() - new Date(b.timestamp).getTime()
			);
		});
		// Connect and subscribe to candles.
		try {
			await marketStream.connect([symbol]);
			// Subscribe to 1m candles for the symbol (AAPL), with explicit fromTime (24h ago).
			const fromTime = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
			await marketStream.subscribeToCandles(symbol, '1m', fromTime);
		} catch (err) {
			console.error('[MarketDataStream] Candle subscription error:', err);
		}
	}

	// Throttled quote for detail page.
	let throttledQuote = writable<any>(null);
	let quoteTimer: ReturnType<typeof setInterval> | null = null;

	function updateThrottledQuote() {
		const q = marketDataStore.getQuote(symbol);
		throttledQuote.set(q);
	}

	const POLYGON_API_KEY = 'HXARQfUSdW4up2nW6rKlXmkvIdrARpMr';
	let polygonCandles: any[] = [];

	onMount(async () => {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		if (!symbol) {
			error = 'No symbol provided';
			isLoading = false;
			return;
		}
		try {
			await marketDataStore.loadQuotes([symbol]);
			await startChartCandleStream(); // Streaming logic remains.
			// Fetch Polygon candles for the last 5 days (1m interval).
			const now = new Date();
			const to = now.toISOString().slice(0, 10);
			const fromDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
			const from = fromDate.toISOString().slice(0, 10);
			try {
				polygonCandles = await getPolygonCandles(symbol, 1, 'minute', from, to, POLYGON_API_KEY);
			} catch (err) {
				console.error('Polygon candle fetch error:', err);
			}
			updateThrottledQuote();
			quoteTimer = setInterval(updateThrottledQuote, 2000);
		} catch (err) {
			console.error('Error loading symbol data:', err);
			error = err instanceof Error ? err.message : 'Failed to load symbol data';
		} finally {
			isLoading = false;
		}
	});

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(price);
	}

	function formatChange(change: number, changePercent: number): string {
		const sign = change >= 0 ? '+' : '';
		return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
	}

	function goBack() {
		// Navigate back to watchlists page, preserving the selected watchlist.
		goto('/watchlists');
	}

	// Helper to get latest candle for open/high/low.
	$: latestCandle =
		chartCandles && chartCandles.length > 0 ? chartCandles[chartCandles.length - 1] : null;

	let isHardRefreshing = false;

	async function hardRefreshQuote() {
		isHardRefreshing = true;
		try {
			await marketDataStore.loadQuotes([symbol]);
			updateThrottledQuote();
		} catch (err) {
			console.error('Hard refresh failed:', err);
		} finally {
			isHardRefreshing = false;
		}
	}

	let mappedCandles: { time: number; open: number; high: number; low: number; close: number }[] =
		[];
	$: {
		// Find the latest date in the data.
		const dates = polygonCandles.map((c) => new Date(c.timestamp));
		const latestDate = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

		let tradingStartUTC = null;
		if (latestDate) {
			tradingStartUTC = new Date(
				Date.UTC(
					latestDate.getUTCFullYear(),
					latestDate.getUTCMonth(),
					latestDate.getUTCDate(),
					13,
					30,
					0,
					0
				)
			);
		}

		mappedCandles = polygonCandles
			.filter((candle) => {
				const d = new Date(candle.timestamp);
				return (
					tradingStartUTC && d >= tradingStartUTC && d.getUTCDate() === tradingStartUTC.getUTCDate()
				);
			})
			.map((candle) => ({
				time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
				open: candle.open,
				high: candle.high,
				low: candle.low,
				close: candle.close
			}));
	}
</script>

<svelte:head>
	<title>{symbol} - Stock Watchlist</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav
		class="border-b border-gray-200 bg-white shadow-sm"
		aria-label="Symbol detail navigation"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex items-center">
					<button
						on:click={goBack}
						class="mr-4 text-gray-500 hover:text-gray-700"
						aria-label="Go back to watchlists"
					>
						<Icon icon="lucide:arrow-left" size="w-6 h-6" ariaHidden={true} />
					</button>
					<div class="flex flex-shrink-0 items-center">
						<Icon
							icon="lucide:bar-chart-3"
							size="w-8 h-8"
							className="text-indigo-600"
							ariaHidden={true}
						/>
						<span class="ml-2 text-xl font-bold text-gray-900">Stock Watchlist</span>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		{#if error}
			<div class="mb-6 rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
				<div class="flex">
					<div class="flex-shrink-0">
						<Icon
							icon="lucide:alert-circle"
							size="w-5 h-5"
							className="text-red-400"
							ariaHidden={true}
						/>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">
							{error}
						</h3>
					</div>
				</div>
			</div>
		{/if}

		{#if isLoading}
			<div class="flex items-center justify-center py-12" role="status" aria-live="polite">
				<Icon
					icon="lucide:loader-2"
					size="w-8 h-8"
					className="animate-spin text-indigo-600"
					ariaHidden={true}
				/>
				<span class="sr-only">Loading {symbol} data...</span>
			</div>
		{:else if $throttledQuote}
			<!-- Symbol Header -->
			<div class="mb-6 overflow-hidden bg-white shadow sm:rounded-lg">
				<div class="px-4 py-5 sm:px-6">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-lg leading-6 font-medium text-gray-900">
								{symbol}
							</h1>
							<p class="mt-1 max-w-2xl text-sm text-gray-500">
								{#if $throttledQuote && $throttledQuote.description}
									{$throttledQuote.description}
								{:else}
									Stock Information
								{/if}
							</p>
						</div>
						<div class="text-right">
							<div class="flex items-center justify-end space-x-2">
								<div class="text-2xl font-bold text-gray-900">
									{#if $throttledQuote && typeof $throttledQuote.lastPrice === 'number'}
										<span aria-label="Last trade price: {formatPrice($throttledQuote.lastPrice)}">
											{formatPrice($throttledQuote.lastPrice)}
										</span>
										<span class="ml-2 text-xs text-gray-500">(Last Trade)</span>
									{:else}
										--
									{/if}
								</div>
								<button
									class="ml-2 flex items-center justify-center rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium hover:bg-gray-200"
									on:click={hardRefreshQuote}
									disabled={isHardRefreshing}
									aria-label="Fetch latest quote for {symbol}"
									style="width: 90px; min-height: 28px;"
								>
									{#if isHardRefreshing}
										<Icon
											icon="lucide:loader-2"
											size="w-4 h-4"
											className="animate-spin mr-1"
											ariaHidden={true}
										/>
										<span aria-live="polite">Refreshing</span>
									{:else}
										<Icon
											icon="lucide:refresh-cw"
											size="w-4 h-4"
											className="mr-1"
											ariaHidden={true}
										/>
										Refresh
									{/if}
								</button>
							</div>
							<div
								class={$throttledQuote && $throttledQuote.change >= 0
									? 'text-green-600'
									: 'text-red-600'}
								aria-label="Price change: {formatChange(
									$throttledQuote.change,
									$throttledQuote.changePercent
								)}"
							>
								{#if $throttledQuote}
									{formatChange($throttledQuote.change, $throttledQuote.changePercent)}
								{:else}
									--
								{/if}
							</div>
							<div class="mt-1 text-xs text-gray-400">
								{#if $throttledQuote && $throttledQuote.lastUpdated}
									Last updated: {new Date($throttledQuote.lastUpdated).toLocaleString()}
								{/if}
							</div>
							<div class="mt-1 text-xs text-gray-400">
								{#if $throttledQuote && $throttledQuote.bidPrice !== undefined && $throttledQuote.askPrice !== undefined}
									Bid: {formatPrice($throttledQuote.bidPrice)} | Ask: {formatPrice(
										$throttledQuote.askPrice
									)}
								{/if}
							</div>
							<div class="mt-1 text-xs text-yellow-600">
								{#if $throttledQuote && $throttledQuote.lastUpdated && Date.now() - new Date($throttledQuote.lastUpdated).getTime() > 60000}
									Data may be delayed
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Chart -->
			<div class="mb-6 overflow-hidden bg-white shadow sm:rounded-lg">
				<div class="px-4 py-5 sm:px-6">
					<h2 class="text-lg leading-6 font-medium text-gray-900">Price Chart (Last 24h)</h2>
				</div>
				<div class="px-4 py-5 sm:p-6">
					<div class="h-80 w-full rounded-lg border border-gray-200 bg-white p-4">
						{#if mappedCandles.length === 0}
							<div
								class="flex h-full items-center justify-center text-gray-500"
								role="status"
								aria-live="polite"
							>
								<div class="text-center">
									<Icon
										icon="lucide:bar-chart-3"
										size="w-12 h-12"
										className="mx-auto text-gray-400"
										ariaHidden={true}
									/>
									<p class="mt-2">No chart data available</p>
								</div>
							</div>
						{:else}
							<SymbolDetailChart candles={mappedCandles} />
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="py-12 text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">No data available</h3>
				<p class="mt-1 text-sm text-gray-500">Unable to load data for {symbol}.</p>
			</div>
		{/if}
	</main>
</div>
