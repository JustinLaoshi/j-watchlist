import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '$app/environment': resolve(__dirname, 'src/mocks/app-environment.js'),
      '$lib': resolve(__dirname, 'src/lib'),
    },
  },
}); 