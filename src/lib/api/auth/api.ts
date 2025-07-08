import { API_BASE_URL, getAuthHeaders, getContentHeaders } from '../shared/config';
import { handleApiError } from '../shared/utils';
import type { AuthResponse } from './types';

// Helper function to extract session token from response.
const extractSessionToken = (sessionData: any): string => {
	const token =
		sessionData.data?.['session-token'] ||
		sessionData.data?.sessionToken ||
		sessionData.sessionToken ||
		sessionData.token ||
		sessionData.data?.token;

	if (!token) {
		throw new Error('No session token received from server');
	}

	return token;
};

// Helper function to create user object.
const createUserFromEmail = (email: string) => ({
	id: `user-${Date.now()}`,
	email,
	username: email.split('@')[0]
});

export const authAPI = {
	async login(email: string, password: string): Promise<AuthResponse> {
		const requestBody = { login: email, password, remember: false };

		const response = await fetch(`${API_BASE_URL}/sessions`, {
			method: 'POST',
			headers: getContentHeaders(),
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			await handleApiError(response, 'Login failed');
		}

		const sessionData = await response.json();
		const sessionToken = extractSessionToken(sessionData);
		const user = createUserFromEmail(email);

		return { token: sessionToken, user };
	},

	async logout(): Promise<void> {
		const token = localStorage.getItem('authToken');
		if (!token) return;

		try {
			await fetch(`${API_BASE_URL}/sessions`, {
				method: 'DELETE',
				headers: getAuthHeaders(token)
			});
		} finally {
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
		}
	},

	async refreshToken(): Promise<AuthResponse> {
		// For now, just return the current token.
		// Tastytrade sessions typically don't need refresh.
		const token = localStorage.getItem('authToken');
		const userStr = localStorage.getItem('user');

		if (!token || !userStr) {
			throw new Error('No valid session found');
		}

		const user = JSON.parse(userStr);
		return { token, user };
	}
};
