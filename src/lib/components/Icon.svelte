<script lang="ts">
	import Icon from '@iconify/svelte';

	export let icon: string;
	export let size: string = 'w-5 h-5';
	export let className: string = '';

	$: classes = `${size} ${className}`;
</script>

<Icon {icon} class={classes} />
