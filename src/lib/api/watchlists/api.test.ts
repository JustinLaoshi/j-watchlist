// @ts-nocheck
import { watchlistsAPI } from './api';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

global.fetch = jest.fn();

describe('watchlistsAPI', () => {
	beforeEach(() => {
		(fetch as jest.Mock).mockClear();
	});

	it('calls getWatchlists endpoint and parses response', async () => {
		(fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { items: [{ name: 'test', 'watchlist-entries': [] }] } })
		});
		localStorage.setItem('authToken', 'abc');
		const result = await watchlistsAPI.getWatchlists();
		expect(result[0].name).toBe('test');
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/watchlists'), expect.any(Object));
	});
});
