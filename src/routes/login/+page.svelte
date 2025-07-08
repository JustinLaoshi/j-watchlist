<script lang="ts">
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/sessionStore';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	let email = '';
	let password = '';
	let isLoading = false;
	let error = '';

	// Subscribe to session store.
	$: ({ isLoading, error: sessionError } = $sessionStore);

	// Redirect if already authenticated.
	onMount(() => {
		if ($sessionStore.isAuthenticated) {
			goto('/watchlists');
		}
	});

	// Watch for session errors.
	$: if (sessionError) {
		error = sessionError;
	}

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}

		try {
			await sessionStore.login(email, password);
			goto('/watchlists');
		} catch (err) {
			// Error is handled by the store.
		}
	}

	function clearError() {
		error = '';
		sessionStore.clearError();
	}
</script>

<svelte:head>
	<title>Login - Stock Watchlist</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8"
	role="main"
	id="main-content"
>
	<div class="w-full max-w-md space-y-8">
		<div>
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
				<Icon
					icon="lucide:bar-chart-3"
					size="w-8 h-8"
					className="text-indigo-600"
					ariaHidden={true}
				/>
			</div>
			<h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to your account
			</h1>
			<p class="mt-2 text-center text-sm text-gray-600">
				Access your stock watchlists and real-time market data
			</p>
		</div>

		<form
			class="mt-8 space-y-6"
			on:submit|preventDefault={handleLogin}
			aria-label="Sign in form"
		>
			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						on:input={clearError}
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Email address"
						aria-describedby="email-error"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={password}
						on:input={clearError}
						class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Password"
						aria-describedby="password-error"
					/>
				</div>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-4" role="alert" aria-live="polite" id="form-error">
					<div class="flex">
						<div class="flex-shrink-0">
							<Icon
								icon="lucide:alert-circle"
								size="w-5 h-5"
								className="text-red-400"
								ariaHidden={true}
							/>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">
								{error}
							</h3>
						</div>
					</div>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					aria-describedby={error ? 'form-error' : undefined}
				>
					{#if isLoading}
						<Icon
							icon="lucide:loader-2"
							size="w-5 h-5"
							className="animate-spin -ml-1 mr-3 text-white"
							ariaHidden={true}
						/>
						<span aria-live="polite">Signing in...</span>
					{:else}
						Sign in
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
