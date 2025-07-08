<script lang="ts">
	import Icon from '@iconify/svelte';

	export let icon: string;
	export let size: string = 'w-5 h-5';
	export let className: string = '';
	export let ariaHidden: boolean = false;

	$: classes = `${size} ${className}`;
</script>

<Icon {icon} class={classes} aria-hidden={ariaHidden} />
