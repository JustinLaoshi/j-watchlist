<script lang="ts">
	import { marketDataAPI } from '$lib/api/market-data';
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';

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

	// Debounce search.
	let searchTimeout: ReturnType<typeof setTimeout>;
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
			role="combobox"
			aria-expanded={showResults}
			aria-autocomplete="list"
			aria-controls="search-results"
			aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
			aria-describedby="search-status"
		/>

		{#if isLoading}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				<Icon
					icon="lucide:loader-2"
					size="w-5 h-5"
					className="animate-spin text-gray-400"
					ariaHidden={true}
				/>
			</div>
		{:else if query}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				<Button
					variant="ghost"
					size="sm"
					on:click={() => {
						query = '';
						results = [];
						showResults = false;
					}}
					aria-label="Clear search"
				>
					<Icon icon="lucide:x" size="w-5 h-5" ariaHidden={true} />
				</Button>
			</div>
		{/if}
	</div>

	<div id="search-status" class="sr-only" aria-live="polite">
		{#if isLoading}
			Searching for symbols...
		{:else if showResults}
			{results.length} {results.length === 1 ? 'result' : 'results'} found
		{:else if query && !isLoading}
			No results found
		{/if}
	</div>

	{#if showResults}
		<div
			id="search-results"
			class="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm"
			role="listbox"
			aria-label="Search results"
		>
			{#each results as result, index}
				<button
					type="button"
					id="result-{index}"
					on:click={() => selectResult(result)}
					class={`
            w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
            ${index === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'}
          `}
					role="option"
					aria-selected={index === selectedIndex}
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
