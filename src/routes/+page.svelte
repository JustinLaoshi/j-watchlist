<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/sessionStore';
	import Icon from '$lib/components/Icon.svelte';

	onMount(() => {
		// Redirect based on authentication status
		if ($sessionStore.isAuthenticated) {
			goto('/watchlists');
		} else {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Stock Watchlist</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="text-center">
		<Icon icon="lucide:bar-chart-3" size="w-12 h-12" className="mx-auto text-indigo-600" />
		<h2 class="mt-4 text-lg font-medium text-gray-900">Loading...</h2>
		<p class="mt-2 text-sm text-gray-500">Redirecting to your dashboard</p>
	</div>
</div>
