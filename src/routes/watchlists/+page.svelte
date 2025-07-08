<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/sessionStore';
	import { watchlistsStore, selectedWatchlist } from '$lib/stores/watchlistsStore';
	import WatchlistTable from '../../components/WatchlistTable.svelte';
	import AddSymbolDropdown from '../../components/AddSymbolDropdown.svelte';
	import AddWatchlistDropdown from '../../components/AddWatchlistDropdown.svelte';
	import WatchlistSelector from '../../components/WatchlistSelector.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let showAddWatchlistModal = false;
	let showAddSymbolDropdown = false;
	let isSymbolDropdownClosing = false;
	let isInitialLoad = true;

	// Subscribe to stores
	$: ({ user } = $sessionStore);
	$: ({ watchlists, isLoading, error } = $watchlistsStore);
	$: currentWatchlist = $selectedWatchlist;

	// Load data on mount
	onMount(async () => {
		if (!$sessionStore.isAuthenticated) {
			goto('/login');
			return;
		}

		try {
			await watchlistsStore.loadWatchlists();
		} catch (error) {
			console.error('Failed to load watchlists:', error);
		} finally {
			isInitialLoad = false;
		}
	});

	async function handleLogout() {
		await sessionStore.logout();
		goto('/login');
	}

	function handleWatchlistSelect(watchlistName: string) {
		watchlistsStore.selectWatchlist(watchlistName);
	}

	function handleAddWatchlist() {
		showAddWatchlistModal = !showAddWatchlistModal;
	}

	function handleAddSymbol() {
		if (showAddSymbolDropdown) {
			isSymbolDropdownClosing = true;
			showAddSymbolDropdown = false;
			setTimeout(() => { isSymbolDropdownClosing = false; }, 100);
		} else if (!isSymbolDropdownClosing) {
			showAddSymbolDropdown = true;
		}
	}

	function closeModals() {
		showAddWatchlistModal = false;
		showAddSymbolDropdown = false;
	}

	async function handleDeleteWatchlist(watchlistName: string) {
		if (!confirm('Are you sure you want to delete this watchlist? This action cannot be undone.')) {
			return;
		}

		try {
			await watchlistsStore.deleteWatchlist(watchlistName);
		} catch (error) {
			console.error('Failed to delete watchlist:', error);
		}
	}
</script>

<svelte:head>
	<title>Watchlists - Stock Watchlist</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex items-center">
					<div class="flex flex-shrink-0 items-center">
						<Icon icon="lucide:bar-chart-3" size="w-8 h-8" className="text-indigo-600" />
						<span class="ml-2 text-xl font-bold text-gray-900">Stock Watchlist</span>
					</div>
				</div>

				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-700">Welcome, {user?.username || user?.email}</span>
					<button on:click={handleLogout} class="text-sm text-gray-500 hover:text-gray-700">
						Sign out
					</button>
				</div>
			</div>
		</div>
	</nav>

	<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<!-- Error Alert -->
		{#if error}
			<div class="mb-6 rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<Icon icon="lucide:alert-circle" size="w-5 h-5" className="text-red-400" />
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">
							{error}
						</h3>
					</div>
					<div class="ml-auto pl-3">
						<button
							on:click={() => watchlistsStore.clearError()}
							class="text-red-400 hover:text-red-600"
						>
							<span class="sr-only">Dismiss</span>
							<Icon icon="lucide:x" size="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Watchlist Selector -->
		<div class="mb-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<label for="watchlist-select" class="text-sm font-medium text-gray-700">
						Select Watchlist:
					</label>
					<WatchlistSelector
						{watchlists}
						selectedWatchlistName={$watchlistsStore.selectedWatchlistName}
						on:select={(event) => watchlistsStore.selectWatchlist(event.detail.watchlistName)}
					/>
				</div>
				<div class="flex space-x-3">
					<div class="relative inline-block">
						<button
							on:click|stopPropagation={handleAddWatchlist}
							class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							<Icon icon="lucide:plus" size="w-4 h-4" className="-ml-1 mr-2" />
							New Watchlist
						</button>
						<AddWatchlistDropdown isOpen={showAddWatchlistModal} on:close={closeModals} />
					</div>

					{#if currentWatchlist && currentWatchlist.name}
						<div class="relative inline-block">
							<button
								on:click|stopPropagation={handleAddSymbol}
								disabled={isLoading}
								class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Icon icon="lucide:plus" size="w-4 h-4" className="-ml-1 mr-2" />
								Add Symbol
								<span class="ml-1 inline-block w-3 text-center">
									{#if showAddSymbolDropdown}
										▼
									{:else}
										▶
									{/if}
								</span>
							</button>
							<AddSymbolDropdown
								watchlistName={currentWatchlist.name}
								isOpen={showAddSymbolDropdown}
								on:close={() => (showAddSymbolDropdown = false)}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Main Content -->
		{#if isInitialLoad}
			<div class="flex items-center justify-center py-12">
				<Icon icon="lucide:loader-2" size="w-8 h-8" className="animate-spin text-indigo-600" />
			</div>
		{:else if watchlists.length === 0}
			<div class="py-12 text-center">
				<Icon icon="lucide:bar-chart-3" size="w-12 h-12" className="mx-auto text-gray-400" />
				<h3 class="mt-2 text-sm font-medium text-gray-900">No watchlists</h3>
				<p class="mt-1 text-sm text-gray-500">Get started by creating your first watchlist.</p>
				<div class="mt-6">
					<button
						on:click={handleAddWatchlist}
						class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					>
						<Icon icon="lucide:plus" size="w-4 h-4" className="-ml-1 mr-2" />
						New Watchlist
					</button>
				</div>
			</div>
		{:else if currentWatchlist}
			<div class="overflow-hidden bg-white shadow sm:rounded-md">
				<div class="px-4 py-5 sm:px-6">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div>
								<h3 class="text-lg leading-6 font-medium text-gray-900">
									{currentWatchlist.name}
								</h3>
								<p class="mt-1 max-w-2xl text-sm text-gray-500">
									{currentWatchlist.symbols.length} {currentWatchlist.symbols.length === 1 ? 'symbol' : 'symbols'} • Last updated {new Date(
										currentWatchlist.updatedAt
									).toLocaleDateString()}
								</p>
							</div>
							{#if isLoading}
								<Icon
									icon="lucide:loader-2"
									size="w-4 h-4"
									className="animate-spin text-indigo-600"
								/>
							{/if}
						</div>
						<button
							on:click={() => handleDeleteWatchlist(currentWatchlist.name)}
							disabled={isLoading}
							class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Icon icon="lucide:trash-2" size="w-4 h-4" className="-ml-1 mr-2" />
							Delete Watchlist
						</button>
					</div>
				</div>

				{#if currentWatchlist.symbols.length > 0}
					<WatchlistTable watchlist={currentWatchlist} />
				{:else}
					<div class="py-12 text-center">
						<Icon icon="lucide:bar-chart-3" size="w-12 h-12" className="mx-auto text-gray-400" />
						<h3 class="mt-2 text-sm font-medium text-gray-900">No symbols</h3>
						<p class="mt-1 text-sm text-gray-500">Add symbols to start tracking their prices.</p>
						<div class="mt-6">
							<button
								on:click={handleAddSymbol}
								class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
							>
								<Icon icon="lucide:plus" size="w-4 h-4" className="-ml-1 mr-2" />
								Add Symbol
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Modals -->
</div>
