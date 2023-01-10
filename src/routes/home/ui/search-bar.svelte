<script lang="ts">
	import type { SvelteSubject } from '$lib/utils/subject';

	export let subreddit$: SvelteSubject<string>;
</script>

<input type="text" bind:value={$subreddit$} />

<style>
	input {
		width: 100%;
		color: #000;
	}
</style>
