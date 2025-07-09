<script lang="ts">
	import { goto } from '$app/navigation';
	import { marketDataStore } from '$lib/stores/marketDataStore';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import Icon from '$lib/components/Icon.svelte';
	import { formatPrice } from '$lib/utils';
	import type { Watchlist } from '$lib/api/watchlists';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	export let watchlist: Watchlist;

	let isLoading = false;
	let removingSymbol: string | null = null;

	// Subscribe to market data.
	$: quotes = $marketDataStore.quotes;

	// Throttle: update displayed quotes for each symbol every 2 seconds.
	const throttleInterval = 2000; // ms.
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

	// Start throttling only once on mount.
	onMount(() => {
		updateDebouncedQuotes(); // initial.
		throttleTimer = setInterval(updateDebouncedQuotes, throttleInterval);
	});

	// When symbols change, update immediately (but do not restart timer).
	$: updateDebouncedQuotes();

	onDestroy(() => {
		if (throttleTimer) clearInterval(throttleTimer);
	});

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

		// Try using window.location as a fallback.
		try {
			goto(url);
		} catch (error) {
			console.error('goto failed, using window.location:', error);
			window.location.href = url;
		}
	}


	// Add Field type for table columns
	type Field = {
		key: 'symbol' | 'bid' | 'ask' | 'last';
		label: string;
		align: 'left' | 'right';
	};

	// DRY field definitions for table
	const fields: Field[] = [
		{ key: 'symbol', label: 'Symbol', align: 'left' },
		{ key: 'bid', label: 'Bid', align: 'right' },
		{ key: 'ask', label: 'Ask', align: 'right' },
		{ key: 'last', label: 'Last', align: 'right' },
		// Add 'change' and 'volume' if you want those columns back
	];
	let sortField: Field['key'] = 'symbol';
	let sortDirection: 'asc' | 'desc' = 'asc';
	function handleSort(field: Field['key']) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	}
	function getSortIcon(field: Field['key']) {
		if (sortField !== field) return 'lucide:chevrons-up-down';
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

	// Current fields we want to show, per the spec.
	const priceFields = [
		{ key: 'bid', label: 'Bid' },
		{ key: 'ask', label: 'Ask' },
		{ key: 'last', label: 'Last' }
	];

	function renderPriceCell(label: string, price: number | undefined, symbol: string) {
		return price !== undefined
			? `<span aria-label="${label} price for ${symbol}: ${formatPrice(price)}">${formatPrice(price)}</span>`
			: `<span class="text-gray-400" aria-label="No ${label.toLowerCase()} price available for ${symbol}">--</span>`;
	}
</script>

<div class="overflow-x-auto">
	<table
		class="min-w-full divide-y divide-gray-200"
		aria-label="Watchlist symbols table"
	>
		<thead class="bg-gray-50">
			<tr>
				{#each fields as field}
					<th
						scope="col"
						class="px-6 py-3 text-{field.align} text-xs font-medium tracking-wider text-gray-500 uppercase"
						aria-sort={sortField === field.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
					>
						<Button
							variant="ghost"
							size="sm"
							on:click={() => handleSort(field.key)}
							class="{field.align === 'right' ? 'ml-auto flex items-center justify-end' : 'flex items-center'}"
							aria-label={`Sort by ${field.label.toLowerCase()} ${sortField === field.key && sortDirection === 'asc' ? 'descending' : 'ascending'}`}
						>
							<span>{field.label}</span>
							<Icon
								icon={getSortIcon(field.key)}
								size="w-3 h-3"
								className={sortField === field.key ? 'text-indigo-600' : 'text-gray-400'}
								ariaHidden={true}
							/>
						</Button>
					</th>
				{/each}
				<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
					<span class="sr-only">Actions</span>
					Actions
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white">
			{#each sortedSymbols as symbol (symbol)}
				{@const quote = $debouncedQuotes.get(symbol)}
				<tr class="hover:bg-gray-50">
					<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
						<Button
							variant="ghost"
							size="sm"
							on:click={() => handleSymbolClick(symbol)}
							class="text-indigo-600 hover:text-indigo-900"
							aria-label={`View details for ${symbol}`}
						>
							{symbol}
						</Button>
					</td>
					{#each priceFields as field}
						<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
							{@html renderPriceCell(field.label, quote ? quote[`${field.key}Price`] : undefined, symbol)}
						</td>
					{/each}
					<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
						<Button
							variant="ghost"
							size="sm"
							on:click={() => handleRemoveSymbol(symbol)}
							disabled={removingSymbol === symbol}
							loading={removingSymbol === symbol}
							class="text-red-600 hover:text-red-900"
							aria-label={`Remove ${symbol} from watchlist`}
						>
							{#if removingSymbol === symbol}
								<span class="sr-only">Removing {symbol}...</span>
							{:else}
								<Icon icon="lucide:x" size="w-4 h-4" ariaHidden={true} />
							{/if}
						</Button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
