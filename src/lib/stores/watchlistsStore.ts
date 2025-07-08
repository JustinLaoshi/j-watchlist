import { writable, derived } from 'svelte/store';
import { watchlistsAPI, type Watchlist } from '$lib/api/watchlists';
import { sessionStore } from './sessionStore';

export interface WatchlistsState {
	watchlists: Watchlist[];
	isLoading: boolean;
	error: string | null;
	selectedWatchlistName: string | null;
}

// Create the watchlists store.
const createWatchlistsStore = () => {
	const { subscribe, set, update } = writable<WatchlistsState>({
		watchlists: [],
		isLoading: false,
		error: null,
		selectedWatchlistName: null
	});

	return {
		subscribe,

		// Load all watchlists.
		async loadWatchlists() {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const watchlists = await watchlistsAPI.getWatchlists();

				// Filter out any watchlists with undefined names.
				const validWatchlists = watchlists.filter((wl) => wl.name);

				// Restore selected watchlist from localStorage if it exists and is valid.
				let selectedWatchlistName = localStorage.getItem('selectedWatchlistName');
				if (
					!selectedWatchlistName ||
					!validWatchlists.some((wl) => wl.name === selectedWatchlistName)
				) {
					selectedWatchlistName = validWatchlists.length > 0 ? validWatchlists[0].name : null;
				}

				update((state) => ({
					...state,
					watchlists: validWatchlists,
					isLoading: false,
					selectedWatchlistName
				}));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load watchlists';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Create a new watchlist.
		async createWatchlist(name: string) {
			if (!name || !name.trim()) {
				throw new Error('Watchlist name is required');
			}

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const newWatchlist = await watchlistsAPI.createWatchlist(name.trim());

				// Validate that the created watchlist has a name.
				if (!newWatchlist.name) {
					throw new Error('Failed to create watchlist: API returned undefined name');
				}

				update((state) => ({
					...state,
					watchlists: [...state.watchlists.filter((wl) => wl.name), newWatchlist],
					isLoading: false,
					selectedWatchlistName: newWatchlist.name
				}));
				return newWatchlist;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to create watchlist';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Add symbol to watchlist.
		async addSymbolToWatchlist(watchlistName: string, symbol: string) {
			if (!watchlistName) {
				throw new Error('Watchlist name is required');
			}

			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const updatedWatchlist = await watchlistsAPI.addSymbolToWatchlist(watchlistName, symbol);

				update((state) => {
					const newWatchlists = state.watchlists.map((wl) =>
						wl.name === watchlistName ? updatedWatchlist : wl
					);
					return {
						...state,
						watchlists: newWatchlists,
						isLoading: false
					};
				});
				return updatedWatchlist;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to add symbol';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Remove symbol from watchlist.
		async removeSymbolFromWatchlist(watchlistName: string, symbol: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const updatedWatchlist = await watchlistsAPI.removeSymbolFromWatchlist(
					watchlistName,
					symbol
				);
				update((state) => ({
					...state,
					watchlists: state.watchlists.map((wl) =>
						wl.name === watchlistName ? updatedWatchlist : wl
					),
					isLoading: false
				}));
				return updatedWatchlist;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to remove symbol';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Delete watchlist.
		async deleteWatchlist(watchlistName: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				await watchlistsAPI.deleteWatchlist(watchlistName);
				update((state) => {
					const newWatchlists = state.watchlists.filter((wl) => wl.name !== watchlistName);
					return {
						...state,
						watchlists: newWatchlists,
						isLoading: false,
						selectedWatchlistName: newWatchlists.length > 0 ? newWatchlists[0].name : null
					};
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to delete watchlist';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Select a watchlist.
		selectWatchlist(watchlistName: string) {
			localStorage.setItem('selectedWatchlistName', watchlistName);
			update((state) => ({ ...state, selectedWatchlistName: watchlistName }));
		},

		// Clear error.
		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		// Get all symbols from all watchlists.
		getAllSymbols(): string[] {
			let symbols: string[] = [];
			subscribe((state) => {
				symbols = state.watchlists.flatMap((wl) => wl.symbols);
			})();
			return [...new Set(symbols)]; // Remove duplicates.
		},

		// Get selected watchlist.
		getSelectedWatchlist(): Watchlist | null {
			let selectedWatchlist: Watchlist | null = null;
			subscribe((state) => {
				selectedWatchlist =
					state.watchlists.find((wl) => wl.name === state.selectedWatchlistName) || null;
			})();
			return selectedWatchlist;
		}
	};
};

export const watchlistsStore = createWatchlistsStore();

// Derived stores for convenience.
export const selectedWatchlist = derived(watchlistsStore, ($watchlistsStore) => {
	return (
		$watchlistsStore.watchlists.find((wl) => wl.name === $watchlistsStore.selectedWatchlistName) ||
		null
	);
});

export const allSymbols = derived(watchlistsStore, ($watchlistsStore) => {
	const symbols = $watchlistsStore.watchlists.flatMap((wl) => wl.symbols);
	return [...new Set(symbols)]; // Remove duplicates.
});
