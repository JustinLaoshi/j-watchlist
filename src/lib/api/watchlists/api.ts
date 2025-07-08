import { API_BASE_URL, getAuthHeaders, getContentHeaders } from '../shared/config';
import { handleApiError } from '../shared/utils';
import type { TastytradeResponse } from '../shared/types';
import type { Watchlist } from './types';

// Helper function to transform watchlist data from API.
const transformWatchlistData = (data: any, watchlistName?: string): Watchlist => {
	// Handle nested data structure (like {data: {...}, context: '...'}).
	const actualData = data.data || data;

	// Use the provided watchlistName if available, otherwise try to extract from data.
	const name =
		watchlistName ||
		actualData.name ||
		actualData['watchlist-name'] ||
		actualData['group-name'] ||
		'Unnamed Watchlist';

	// Extract symbols from watchlist-entries.
	const symbols = actualData['watchlist-entries']
		? actualData['watchlist-entries'].map((entry: any) => entry.symbol || entry['symbol'])
		: [];

	const result = {
		name: name,
		symbols: symbols,
		createdAt: actualData.createdAt || actualData['created-at'] || new Date().toISOString(),
		updatedAt: actualData.updatedAt || actualData['updated-at'] || new Date().toISOString()
	};

	return result;
};

export const watchlistsAPI = {
	async getWatchlists(): Promise<Watchlist[]> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		const response = await fetch(`${API_BASE_URL}/watchlists`, {
			headers: getAuthHeaders(token)
		});

		if (!response.ok) {
			throw new Error(`API failed: ${response.status}`);
		}

		const responseData: TastytradeResponse<{ items: any[] }> = await response.json();
		return responseData.data.items.map((item: any) => transformWatchlistData(item));
	},

	async createWatchlist(name: string): Promise<Watchlist> {
		if (!name || !name.trim()) {
			throw new Error('Watchlist name is required');
		}

		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		const response = await fetch(`${API_BASE_URL}/watchlists`, {
			method: 'POST',
			headers: { ...getContentHeaders(), ...getAuthHeaders(token) },
			body: JSON.stringify({
				name: name.trim(),
				'group-name': 'default',
				'order-index': 0,
				'watchlist-entries': []
			})
		});

		if (!response.ok) {
			throw new Error(`API failed: ${response.status}`);
		}

		const responseData = await response.json();

		// Check if the response is wrapped in a data field (like other Tastytrade responses).
		const data = responseData.data || responseData;

		const transformed = transformWatchlistData(data);

		// Validate that the transformed watchlist has a name.
		if (!transformed.name) {
			throw new Error('API returned watchlist with undefined name');
		}

		return transformed;
	},

	async addSymbolToWatchlist(watchlistName: string, symbol: string): Promise<Watchlist> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		if (!watchlistName) {
			throw new Error('Watchlist name is required');
		}

		try {
			// First get the current watchlist to see its structure.
			const getResponse = await fetch(
				`${API_BASE_URL}/watchlists/${encodeURIComponent(watchlistName)}`,
				{
					headers: getAuthHeaders(token)
				}
			);

			if (!getResponse.ok) {
				throw new Error(`Failed to get watchlist: ${getResponse.status}`);
			}

			const currentWatchlistResponse = await getResponse.json();

			// Handle nested data structure for the current watchlist.
			const currentWatchlist = currentWatchlistResponse.data || currentWatchlistResponse;

			// Add the new symbol to the existing entries.
			const currentEntries = currentWatchlist['watchlist-entries'] || [];
			const newEntry = {
				symbol,
				'instrument-type': 'Equity'
			};

			// Check if symbol already exists.
			if (!currentEntries.some((entry: any) => entry.symbol === symbol)) {
				currentEntries.push(newEntry);
			}

			// Update the entire watchlist using the watchlistName parameter directly.
			const updateResponse = await fetch(
				`${API_BASE_URL}/watchlists/${encodeURIComponent(watchlistName)}`,
				{
					method: 'PUT',
					headers: { ...getContentHeaders(), ...getAuthHeaders(token) },
					body: JSON.stringify({
						name: watchlistName,
						'group-name': currentWatchlist['group-name'] || 'default',
						'order-index': currentWatchlist['order-index'] || 0,
						'watchlist-entries': currentEntries
					})
				}
			);

			if (!updateResponse.ok) {
				throw new Error(`Failed to update watchlist: ${updateResponse.status}`);
			}

			const data = await updateResponse.json();
			return transformWatchlistData(data, watchlistName);
		} catch (error) {
			throw error;
		}
	},

	async removeSymbolFromWatchlist(watchlistName: string, symbol: string): Promise<Watchlist> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		try {
			// First get the current watchlist to see its structure.
			const getResponse = await fetch(
				`${API_BASE_URL}/watchlists/${encodeURIComponent(watchlistName)}`,
				{
					headers: getAuthHeaders(token)
				}
			);

			if (!getResponse.ok) {
				throw new Error(`Failed to get watchlist: ${getResponse.status}`);
			}

			const currentWatchlistResponse = await getResponse.json();

			// Handle nested data structure for the current watchlist.
			const currentWatchlist = currentWatchlistResponse.data || currentWatchlistResponse;

			// Remove the symbol from the entries.
			const currentEntries = currentWatchlist['watchlist-entries'] || [];
			const filteredEntries = currentEntries.filter((entry: any) => entry.symbol !== symbol);

			// Update the entire watchlist using the watchlistName parameter directly.
			const updateResponse = await fetch(
				`${API_BASE_URL}/watchlists/${encodeURIComponent(watchlistName)}`,
				{
					method: 'PUT',
					headers: { ...getContentHeaders(), ...getAuthHeaders(token) },
					body: JSON.stringify({
						name: watchlistName,
						'group-name': currentWatchlist['group-name'] || 'default',
						'order-index': currentWatchlist['order-index'] || 0,
						'watchlist-entries': filteredEntries
					})
				}
			);

			if (!updateResponse.ok) {
				throw new Error(`Failed to update watchlist: ${updateResponse.status}`);
			}

			const data = await updateResponse.json();
			return transformWatchlistData(data, watchlistName);
		} catch (error) {
			throw error;
		}
	},

	async deleteWatchlist(watchlistName: string): Promise<void> {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		try {
			// Delete using the watchlist name.
			const response = await fetch(
				`${API_BASE_URL}/watchlists/${encodeURIComponent(watchlistName)}`,
				{
					method: 'DELETE',
					headers: getAuthHeaders(token)
				}
			);

			if (!response.ok) {
				throw new Error(`API failed: ${response.status}`);
			}
		} catch (error) {
			throw error;
		}
	}
};
