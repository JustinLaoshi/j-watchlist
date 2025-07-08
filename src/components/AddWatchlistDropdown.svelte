<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { watchlistsStore } from '$lib/stores/watchlistsStore';
	import Icon from '$lib/components/Icon.svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	let name = '';
	let isLoading = false;
	let error = '';

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Please enter a watchlist name';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await watchlistsStore.createWatchlist(name.trim());
			dispatch('close');
			name = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create watchlist';
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		if (!isLoading) {
			dispatch('close');
			name = '';
			error = '';
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (!browser) return;
		const target = event.target as HTMLElement;
		if (!target.closest('.add-watchlist-dropdown')) {
			handleClose();
		}
	}

	// Close dropdown when clicking outside
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
			handleClose();
		} else if (event.key === 'Enter' && isOpen) {
			handleSubmit();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="add-watchlist-dropdown absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg"
		style="min-width: 384px;"
	>
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center">
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100"
					>
						<Icon icon="lucide:plus" size="w-5 h-5" className="text-indigo-600" />
					</div>
					<div class="ml-3">
						<h3 class="text-base leading-6 font-semibold text-gray-900">Create New Watchlist</h3>
						<p class="text-sm text-gray-500">Enter a name for your new watchlist.</p>
					</div>
				</div>
				<button
					on:click={handleClose}
					disabled={isLoading}
					class="text-gray-400 hover:text-gray-600 disabled:opacity-50"
				>
					<Icon icon="lucide:x" size="w-5 h-5" />
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div>
					<label for="watchlist-name" class="mb-2 block text-sm font-medium text-gray-700">
						Watchlist Name
					</label>
					<input
						type="text"
						id="watchlist-name"
						bind:value={name}
						disabled={isLoading}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
						placeholder="e.g., Tech Stocks, Dividend Payers"
						autocomplete="off"
					/>
				</div>

				{#if error}
					<div class="rounded-md bg-red-50 p-4">
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

				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={handleClose}
						disabled={isLoading}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading}
						class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isLoading}
							<Icon icon="lucide:loader-2" size="w-4 h-4" className="animate-spin -ml-1 mr-2" />
							Creating...
						{:else}
							Create Watchlist
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
