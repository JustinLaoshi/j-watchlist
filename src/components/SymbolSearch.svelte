<script lang="ts">
	import { marketDataAPI } from '$lib/api/market-data';
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	export let placeholder = 'Search symbols...';
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		select: { symbol: string; name: string };
	}>();

	let query = '';
	let results: { symbol: string; name: string }[] = [];
	let isLoading = false;
	let showResults = false;
	let selectedIndex = -1;

	async function searchSymbols() {
		if (!query.trim() || query.length < 2) {
			results = [];
			showResults = false;
			return;
		}

		isLoading = true;
		try {
			results = await marketDataAPI.searchSymbols(query);
			showResults = results.length > 0;
			selectedIndex = -1;
		} catch (error) {
			console.error('SymbolSearch: Failed to search symbols:', error);
			results = [];
			showResults = false;
		} finally {
			isLoading = false;
		}
	}

	function handleInput() {
		searchSymbols();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showResults) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < results.length) {
					selectResult(results[selectedIndex]);
				}
				break;
			case 'Escape':
				showResults = false;
				selectedIndex = -1;
				break;
		}
	}

	function selectResult(result: { symbol: string; name: string }) {
		dispatch('select', result);
		query = '';
		results = [];
		showResults = false;
		selectedIndex = -1;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.symbol-search')) {
			showResults = false;
			selectedIndex = -1;
		}
	}

	// Debounce search
	let searchTimeout: number;
	$: {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(searchSymbols, 300);
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="symbol-search relative">
	<div class="relative">
		<input
			type="text"
			bind:value={query}
			on:input={handleInput}
			on:keydown={handleKeydown}
			{placeholder}
			{disabled}
			class="block w-full rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 leading-5 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
		/>

		{#if isLoading}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				<Icon icon="lucide:loader-2" size="w-5 h-5" className="animate-spin text-gray-400" />
			</div>
		{:else if query}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				<button
					type="button"
					on:click={() => {
						query = '';
						results = [];
						showResults = false;
					}}
					class="text-gray-400 hover:text-gray-600"
				>
					<Icon icon="lucide:x" size="w-5 h-5" />
				</button>
			</div>
		{/if}
	</div>

	{#if showResults}
		<div
			class="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm"
		>
			{#each results as result, index}
				<button
					type="button"
					on:click={() => selectResult(result)}
					class={`
            w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
            ${index === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'}
          `}
				>
					<div class="flex items-center justify-between">
						<span class="font-medium">{result.symbol}</span>
						<span class="ml-2 truncate text-xs text-gray-500">{result.name}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
