import { writable } from 'svelte/store';
import { authAPI, type AuthResponse } from '$lib/api/auth';

export interface User {
	id: string;
	email: string;
	username: string;
}

export interface SessionState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

// Initialize session from localStorage
const getInitialSession = (): SessionState => {
	if (typeof window === 'undefined') {
		// Server-side rendering - start unauthenticated
		return {
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
			error: null
		};
	}

	// Clean up any invalid tokens
	let token = localStorage.getItem('authToken');
	if (token === 'undefined' || token === 'null') {
		localStorage.removeItem('authToken');
		localStorage.removeItem('user');
		token = null;
	}

	// Check if user is already logged in from localStorage
	const userStr = localStorage.getItem('user');

	if (token && userStr && token !== 'undefined') {
		try {
			const user = JSON.parse(userStr);

			return {
				user: user,
				token: token,
				isAuthenticated: true,
				isLoading: false,
				error: null
			};
		} catch (error) {
			console.error('Failed to parse user from localStorage:', error);
			// Clear invalid data
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
		}
	}

	// No valid session found
	return {
		user: null,
		token: null,
		isAuthenticated: false,
		isLoading: false,
		error: null
	};
};

// Create the session store
const createSessionStore = () => {
	const { subscribe, set, update } = writable<SessionState>(getInitialSession());

	return {
		subscribe,

		// Login action
		async login(email: string, password: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));
			try {
				const response: AuthResponse = await authAPI.login(email, password);
				// Validate token before storing
				if (!response.token) {
					throw new Error('No token received from login');
				}
				// Store in localStorage
				localStorage.setItem('authToken', response.token);
				localStorage.setItem('user', JSON.stringify(response.user));
				// Update store
				const newState = {
					user: response.user,
					token: response.token,
					isAuthenticated: true,
					isLoading: false,
					error: null
				};
				set(newState);
				return response;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Login failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// Logout action
		async logout() {
			try {
				await authAPI.logout();
			} catch (error) {
				console.error('Logout error:', error);
			} finally {
				// Clear localStorage
				localStorage.removeItem('authToken');
				localStorage.removeItem('user');

				// Update store
				set({
					user: null,
					token: null,
					isAuthenticated: false,
					isLoading: false,
					error: null
				});
			}
		},

		// Refresh token action
		async refreshToken() {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response: AuthResponse = await authAPI.refreshToken();

				// Update localStorage
				localStorage.setItem('authToken', response.token);
				localStorage.setItem('user', JSON.stringify(response.user));

				// Update store
				set({
					user: response.user,
					token: response.token,
					isAuthenticated: true,
					isLoading: false,
					error: null
				});

				return response;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));

				// If refresh fails, logout
				await this.logout();
				throw error;
			}
		},

		// Clear error
		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		// Check if token is valid (helper method)
		isTokenValid(): boolean {
			const token = localStorage.getItem('authToken');
			if (!token) return false;

			// You could add JWT expiration check here
			// For now, just check if token exists
			return true;
		},

		// Get current token (helper method)
		getToken(): string | null {
			return localStorage.getItem('authToken');
		},

		// Restore session from localStorage (helper method)
		restoreSession() {
			const token = localStorage.getItem('authToken');
			const userStr = localStorage.getItem('user');

			if (token && userStr) {
				try {
					const user = JSON.parse(userStr);
					set({
						user: user,
						token: token,
						isAuthenticated: true,
						isLoading: false,
						error: null
					});
					return true;
				} catch (error) {
					console.error('Failed to restore session:', error);
					return false;
				}
			}
			return false;
		}
	};
};

export const sessionStore = createSessionStore();
