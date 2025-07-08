<script lang="ts">
	import { onMount } from 'svelte';

	export let candles: { time: number; open: number; high: number; low: number; close: number }[] =
		[];

	let chartDiv: HTMLDivElement;

	onMount(async () => {
		// @ts-expect-error: No types for plotly.js-dist.
		const Plotly = (await import('plotly.js-dist')).default;
		Plotly.newPlot(
			chartDiv,
			[
				{
					x: candles.map((c) => new Date(c.time * 1000)),
					open: candles.map((c) => c.open),
					high: candles.map((c) => c.high),
					low: candles.map((c) => c.low),
					close: candles.map((c) => c.close),
					type: 'candlestick'
				}
			],
			{
				margin: { t: 16, r: 16, l: 32, b: 32 },
				xaxis: { type: 'date' }
			},
			{ displayModeBar: false }
		);
	});
</script>

<div bind:this={chartDiv} style="width:100%;height:400px;"></div>
