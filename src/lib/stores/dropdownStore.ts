import { writable } from 'svelte/store';

// Holds the id of the currently open dropdown, or null if none are open
export const openDropdown = writable<string | null>(null);
