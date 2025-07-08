<script lang="ts">
	import { goto } from '$app/navigation';
	import { marketDataStore } from '$lib/stores/marketDataStore';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import Icon from '$lib/components/Icon.svelte';
	import type { Watchlist } from '$lib/api/watchlists';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	export let watchlist: Watchlist;

	let isLoading = false;
	let removingSymbol: string | null = null;

	// Subscribe to market data
	$: quotes = $marketDataStore.quotes;

	// Throttle: update displayed quotes for each symbol every 2 seconds
	const throttleInterval = 2000; // ms
	const debouncedQuotes = writable(new Map());
	let throttleTimer: ReturnType<typeof setInterval> | null = null;

	function updateDebouncedQuotes() {
		debouncedQuotes.update((map) => {
			const newMap = new Map(map);
			for (const symbol of watchlist.symbols) {
				const quote = quotes.get(symbol);
				newMap.set(symbol, quote);
			}
			return newMap;
		});
	}

	// Start throttling only once on mount
	onMount(() => {
		updateDebouncedQuotes(); // initial
		throttleTimer = setInterval(updateDebouncedQuotes, throttleInterval);
	});

	// When symbols change, update immediately (but do not restart timer)
	$: (watchlist.symbols, updateDebouncedQuotes());

	onDestroy(() => {
		if (throttleTimer) clearInterval(throttleTimer);
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
		return `${sign}${formatPrice(change)} (${sign}${(changePercent || 0).toFixed(2)}%)`;
	}

	function formatVolume(volume: number): string {
		const vol = volume || 0;
		if (vol >= 1e9) {
			return `${(vol / 1e9).toFixed(2)}B`;
		} else if (vol >= 1e6) {
			return `${(vol / 1e6).toFixed(2)}M`;
		} else if (vol >= 1e3) {
			return `${(vol / 1e3).toFixed(2)}K`;
		}
		return vol.toString();
	}

	async function handleRemoveSymbol(symbol: string) {
		try {
			removingSymbol = symbol;
			await watchlistsStore.removeSymbolFromWatchlist(watchlist.name, symbol);
		} catch (error) {
			console.error('Failed to remove symbol:', error);
		} finally {
			removingSymbol = null;
		}
	}

	function handleSymbolClick(symbol: string) {
		if (!symbol || symbol.trim() === '') {
			console.error('Invalid symbol:', symbol);
			return;
		}

		const url = `/symbol/${symbol.trim()}`;

		// Try using window.location as a fallback
		try {
			goto(url);
		} catch (error) {
			console.error('goto failed, using window.location:', error);
			window.location.href = url;
		}
	}

	// Sorting functionality
	let sortField: 'symbol' | 'bid' | 'ask' | 'last' | 'change' | 'volume' = 'symbol';
	let sortDirection: 'asc' | 'desc' = 'asc';

	function handleSort(field: 'symbol' | 'bid' | 'ask' | 'last' | 'change' | 'volume') {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}

	function getSortIcon(field: 'symbol' | 'bid' | 'ask' | 'last' | 'change' | 'volume') {
		if (sortField !== field) {
			return 'lucide:chevrons-up-down';
		}
		return sortDirection === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down';
	}

	$: sortedSymbols = [...watchlist.symbols].sort((a, b) => {
		const quoteA = quotes.get(a);
		const quoteB = quotes.get(b);

		let aValue: string | number;
		let bValue: string | number;

		switch (sortField) {
			case 'symbol':
				aValue = a;
				bValue = b;
				break;
			case 'bid':
				aValue = quoteA?.bidPrice || 0;
				bValue = quoteB?.bidPrice || 0;
				break;
			case 'ask':
				aValue = quoteA?.askPrice || 0;
				bValue = quoteB?.askPrice || 0;
				break;
			case 'last':
				aValue = quoteA?.lastPrice || 0;
				bValue = quoteB?.lastPrice || 0;
				break;
			case 'change':
				aValue = quoteA?.change || 0;
				bValue = quoteB?.change || 0;
				break;
			case 'volume':
				aValue = quoteA?.volume || 0;
				bValue = quoteB?.volume || 0;
				break;
			default:
				return 0;
		}

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		} else {
			return sortDirection === 'asc'
				? (aValue as number) - (bValue as number)
				: (bValue as number) - (aValue as number);
		}
	});
</script>

<div class="overflow-x-auto">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					<button
						on:click={() => handleSort('symbol')}
						class="flex items-center space-x-1 transition-colors hover:text-gray-700"
						aria-label="Sort by symbol"
					>
						<span>Symbol</span>
						<Icon 
							icon={getSortIcon('symbol')} 
							size="w-3 h-3" 
							className={sortField === 'symbol' ? 'text-indigo-600' : 'text-gray-400'} 
						/>
					</button>
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					<button
						on:click={() => handleSort('bid')}
						class="ml-auto flex items-center justify-end space-x-1 transition-colors hover:text-gray-700"
						aria-label="Sort by bid"
					>
						<span>Bid</span>
						<Icon 
							icon={getSortIcon('bid')} 
							size="w-3 h-3" 
							className={sortField === 'bid' ? 'text-indigo-600' : 'text-gray-400'} 
						/>
					</button>
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					<button
						on:click={() => handleSort('ask')}
						class="ml-auto flex items-center justify-end space-x-1 transition-colors hover:text-gray-700"
						aria-label="Sort by ask"
					>
						<span>Ask</span>
						<Icon 
							icon={getSortIcon('ask')} 
							size="w-3 h-3" 
							className={sortField === 'ask' ? 'text-indigo-600' : 'text-gray-400'} 
						/>
					</button>
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					<button
						on:click={() => handleSort('last')}
						class="ml-auto flex items-center justify-end space-x-1 transition-colors hover:text-gray-700"
						aria-label="Sort by last"
					>
						<span>Last</span>
						<Icon 
							icon={getSortIcon('last')} 
							size="w-3 h-3" 
							className={sortField === 'last' ? 'text-indigo-600' : 'text-gray-400'} 
						/>
					</button>
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					Actions
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white">
			{#each sortedSymbols as symbol}
				{@const quote = $debouncedQuotes.get(symbol)}
				<tr class="hover:bg-gray-50">
					<td class="px-6 py-4 whitespace-nowrap">
						<button
							on:click={() => handleSymbolClick(symbol)}
							class="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-900"
						>
							{symbol}
						</button>
					</td>
					<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
						{#if quote}
							{formatPrice(quote.bidPrice)}
						{:else}
							<span class="text-gray-400">--</span>
						{/if}
					</td>
					<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
						{#if quote}
							{formatPrice(quote.askPrice)}
						{:else}
							<span class="text-gray-400">--</span>
						{/if}
					</td>
					<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
						{#if quote}
							{formatPrice(quote.lastPrice)}
						{:else}
							<span class="text-gray-400">--</span>
						{/if}
					</td>
					<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
						<button
							on:click={() => handleRemoveSymbol(symbol)}
							disabled={removingSymbol === symbol}
							class="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
							title="Remove from watchlist"
						>
							{#if removingSymbol === symbol}
								<Icon icon="lucide:loader-2" size="w-4 h-4" className="animate-spin" />
							{:else}
								<Icon icon="lucide:x" size="w-4 h-4" />
							{/if}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
