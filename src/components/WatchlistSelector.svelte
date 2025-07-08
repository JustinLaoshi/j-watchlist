<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import Icon from '$lib/components/Icon.svelte';
	import type { Watchlist } from '$lib/api/watchlists';

	export let watchlists: Watchlist[] = [];
	export let selectedWatchlistName: string | null = null;
	export let placeholder = 'Select a watchlist...';

	const dispatch = createEventDispatcher<{
		select: { watchlistName: string };
	}>();

	let isOpen = false;
	let searchTerm = '';
	let filteredWatchlists: Watchlist[] = [];

	// Filter watchlists based on search term.
	$: filteredWatchlists = watchlists.filter((watchlist) =>
		watchlist.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	function handleSelect(watchlistName: string) {
		dispatch('select', { watchlistName });
		isOpen = false;
		searchTerm = '';
	}

	function handleToggle() {
		isOpen = !isOpen;
		if (isOpen) {
			searchTerm = '';
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		const target = event.target as HTMLElement;
		if (!target.closest('.watchlist-selector')) {
			isOpen = false;
			searchTerm = '';
		}
	}

	// Close dropdown when clicking outside.
	$: if (isOpen && browser) {
		setTimeout(() => {
			document.addEventListener('click', handleClickOutside);
		}, 100);
	} else if (browser) {
		document.removeEventListener('click', handleClickOutside);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!browser) return;
		if (event.key === 'Escape') {
			isOpen = false;
			searchTerm = '';
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="watchlist-selector relative">
	<button
		type="button"
		on:click={handleToggle}
		class="relative w-64 cursor-default rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:text-sm"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		aria-labelledby="watchlist-select-label"
		id="watchlist-select"
	>
		<span class="block truncate">
			{#if selectedWatchlistName}
				{@const selectedWatchlist = watchlists.find((w) => w.name === selectedWatchlistName)}
				{#if selectedWatchlist}
					{selectedWatchlist.name} ({selectedWatchlist.symbols.length} symbols)
				{:else}
					{selectedWatchlistName}
				{/if}
			{:else}
				<span class="text-gray-500">{placeholder}</span>
			{/if}
		</span>
		<span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
			<Icon
				icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'}
				size="w-4 h-4"
				className="text-gray-400"
				ariaHidden={true}
			/>
		</span>
	</button>

	{#if isOpen}
		<div
			class="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-64 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm"
			role="listbox"
			aria-labelledby="watchlist-select-label"
		>
			<!-- Search input -->
			<div class="border-b border-gray-200 px-3 py-2">
				<div class="relative">
					<Icon
						icon="lucide:search"
						size="w-4 h-4"
						className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
						ariaHidden={true}
					/>
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search watchlists..."
						class="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
						autocomplete="off"
						aria-label="Search watchlists"
					/>
				</div>
			</div>

			<!-- Watchlist options -->
			{#if filteredWatchlists.length > 0}
				{#each filteredWatchlists as watchlist, index}
					<button
						type="button"
						on:click={() => handleSelect(watchlist.name)}
						class="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none {watchlist.name ===
						selectedWatchlistName
							? 'bg-indigo-100 text-indigo-900'
							: 'text-gray-900'}"
						role="option"
						aria-selected={watchlist.name === selectedWatchlistName}
					>
						<div class="flex items-center justify-between">
							<span class="truncate">{watchlist.name}</span>
							<span class="ml-2 text-xs text-gray-500">
								{watchlist.symbols.length} symbols
							</span>
						</div>
					</button>
				{/each}
			{:else}
				<div class="px-3 py-2 text-sm text-gray-500" role="status" aria-live="polite">
					{searchTerm ? 'No watchlists found' : 'No watchlists available'}
				</div>
			{/if}
		</div>
	{/if}
</div>
