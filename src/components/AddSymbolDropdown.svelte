<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import SymbolSearch from './SymbolSearch.svelte';
	import Icon from '$lib/components/Icon.svelte';

	export let watchlistName: string;
	export let isOpen = false;
	export let onClose: () => void = () => {};

	const dispatch = createEventDispatcher<{ close: void }>();

	let isLoading = false;
	let error = '';

	async function handleSymbolSelect(event: CustomEvent<{ symbol: string; name: string }>) {
		const { symbol } = event.detail;
		if (!watchlistName) {
			error = 'Watchlist name is required';
			return;
		}
		isLoading = true;
		error = '';
		try {
			await watchlistsStore.addSymbolToWatchlist(watchlistName, symbol);
			dispatch('close');
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add symbol to watchlist';
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		if (!isLoading) {
			dispatch('close');
			onClose();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		const target = event.target as HTMLElement;
		if (!target.closest('.add-symbol-dropdown')) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!browser) return;
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	// Attach/detach listeners only when open.
	$: if (isOpen && browser) {
		setTimeout(() => {
			document.addEventListener('click', handleClickOutside);
		}, 100);
		window.addEventListener('keydown', handleKeydown);
	} else if (browser) {
		document.removeEventListener('click', handleClickOutside);
		window.removeEventListener('keydown', handleKeydown);
	}
</script>

{#if isOpen}
	<div
		class="add-symbol-dropdown absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg"
		style="min-width: 384px;"
		role="dialog"
		aria-modal="true"
		aria-labelledby="add-symbol-title"
		aria-describedby="add-symbol-description"
	>
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100"
					>
						<Icon icon="lucide:plus" size="w-5 h-5" className="text-indigo-600" ariaHidden={true} />
					</div>
					<div class="ml-3">
						<h3 id="add-symbol-title" class="text-base leading-6 font-semibold text-gray-900">
							Add Symbol to Watchlist
						</h3>
						<p id="add-symbol-description" class="text-sm text-gray-500">
							Search for a stock symbol to add.
						</p>
					</div>
				</div>
				<button
					on:click={handleClose}
					disabled={isLoading}
					class="text-gray-400 hover:text-gray-600 disabled:opacity-50"
					aria-label="Close dialog"
				>
					<Icon icon="lucide:x" size="w-5 h-5" ariaHidden={true} />
				</button>
			</div>

			<div class="mb-4">
				<label for="symbol-search" class="mb-2 block text-sm font-medium text-gray-700">
					Symbol
				</label>
				<SymbolSearch
					placeholder="Search for symbols (e.g., AAPL, TSLA, MSFT)"
					disabled={isLoading}
					on:select={handleSymbolSelect}
				/>
			</div>

			{#if error}
				<div class="mb-4 rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
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
				<div class="flex items-center justify-center py-4" role="status" aria-live="polite">
					<Icon
						icon="lucide:loader-2"
						size="w-5 h-5"
						className="animate-spin text-indigo-600"
						ariaHidden={true}
					/>
					<span class="ml-2 text-sm text-gray-600">Adding symbol...</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
