<script lang="ts">
	import type { SvelteSubject } from '$lib/utils/subject';

	export var subreddit$: SvelteSubject<string>;
</script>

<input type="text" bind:value={$subreddit$} />

<style>
	input {
		color: #000;
	}
</style>
