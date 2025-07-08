// Base API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cert.tastyworks.com';

// Common headers for API requests
export const getAuthHeaders = (token: string) => ({
	Authorization: token,
	Accept: 'application/json',
	'User-Agent': 'j-watchlist/1.0'
});

export const getContentHeaders = () => ({
	'Content-Type': 'application/json',
	Accept: 'application/json',
	'User-Agent': 'j-watchlist/1.0'
});
