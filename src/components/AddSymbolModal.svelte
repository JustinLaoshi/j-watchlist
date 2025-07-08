<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import SymbolSearch from './SymbolSearch.svelte';
	import Icon from '$lib/components/Icon.svelte';

	export let watchlistName: string;

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	let isLoading = false;
	let error = '';

	async function handleSymbolSelect(event: CustomEvent<{ symbol: string; name: string }>) {
		const { symbol } = event.detail;

		isLoading = true;
		error = '';

		try {
			await watchlistsStore.addSymbolToWatchlist(watchlistName, symbol);
			dispatch('close');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add symbol to watchlist';
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		if (!isLoading) {
			dispatch('close');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="bg-opacity-75 fixed inset-0 z-40 bg-gray-500 transition-opacity"
	on:click={handleClose}
></div>

<!-- Modal -->
<div class="fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
			on:click|stopPropagation
		>
			<div class="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
				<button
					type="button"
					on:click={handleClose}
					disabled={isLoading}
					class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					<span class="sr-only">Close</span>
					<Icon icon="lucide:x" size="w-6 h-6" />
				</button>
			</div>

			<div class="sm:flex sm:items-start">
				<div
					class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10"
				>
					<Icon icon="lucide:plus" size="w-6 h-6" className="text-indigo-600" />
				</div>
				<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
					<h3 class="text-base leading-6 font-semibold text-gray-900">Add Symbol to Watchlist</h3>
					<div class="mt-2">
						<p class="text-sm text-gray-500">Search for a stock symbol to add to your watchlist.</p>
					</div>
				</div>
			</div>

			<div class="mt-6">
				<label for="symbol-search" class="block text-sm font-medium text-gray-700"> Symbol </label>
				<div class="mt-1">
					<SymbolSearch
						placeholder="Search for symbols (e.g., AAPL, TSLA, MSFT)"
						disabled={isLoading}
						on:select={handleSymbolSelect}
					/>
				</div>
			</div>

			{#if error}
				<div class="mt-4 rounded-md bg-red-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<Icon icon="lucide:alert-circle" size="w-5 h-5" className="text-red-400" />
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
				<div class="mt-4 flex items-center justify-center">
					<Icon icon="lucide:loader-2" size="w-5 h-5" className="animate-spin text-indigo-600" />
					<span class="ml-2 text-sm text-gray-600">Adding symbol...</span>
				</div>
			{/if}

			<div class="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse">
				<button
					type="button"
					on:click={handleClose}
					disabled={isLoading}
					class="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
				>
					Close
				</button>
			</div>
		</div>
	</div>
</div>
