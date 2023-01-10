<script lang="ts">
	import { getGifs, isLoading$ } from '$lib/data-access/reddit';
	import { SvelteSubject } from '$lib/utils/subject';
	import { IonPage } from 'ionic-svelte';
	import { BehaviorSubject, combineLatest, map } from 'rxjs';
	import { onMount } from 'svelte';
	import GifList from './ui/gif-list.svelte';
	import SearchBar from './ui/search-bar.svelte';

	const currentlyLoadingGifs$ = new BehaviorSubject<string[]>([]);
	const loadedGifs$ = new BehaviorSubject<string[]>([]);
	const subreddit$ = new SvelteSubject<string>('gifs');

	const gifs$ = combineLatest([getGifs(subreddit$), currentlyLoadingGifs$, loadedGifs$]).pipe(
		map(([gifs, currentlyLoadingGifs, loadedGifs]) =>
			gifs.map((gif) => ({
				...gif,
				loading: currentlyLoadingGifs.includes(gif.permalink),
				dataLoaded: loadedGifs.includes(gif.permalink)
			}))
		)
	);

	const setLoading = (permalink: string) => {
		// Add the gifs permalink to the loading array
		currentlyLoadingGifs$.next([...currentlyLoadingGifs$.value, permalink]);
	};

	const setLoadingComplete = (permalinkToComplete: string) => {
		loadedGifs$.next([...loadedGifs$.value, permalinkToComplete]);

		currentlyLoadingGifs$.next([
			...currentlyLoadingGifs$.value.filter((permalink) => !loadedGifs$.value.includes(permalink))
		]);
	};

	const person = { name: 'Josh' };
	$: personName = person.name;

	const testSubject$ = new SvelteSubject<string>('init');

	onMount(() => {
		testSubject$.subscribe((val) => console.log(val));

		setInterval(() => {
			testSubject$.next('yo');
		}, 5000);
	});
</script>

<IonPage>
	<ion-header>
		<ion-toolbar color="primary">
			<SearchBar {subreddit$} />
		</ion-toolbar>
		{#if $isLoading$}
			<ion-progress-bar color="dark" type="indeterminate" reversed={true} />
		{/if}
	</ion-header>
	<ion-content>
		<input bind:value={$testSubject$} />
		{person.name}
		{personName}
		<button on:click={() => (person.name = 'Dave')}>Update</button>
		<GifList
			gifs={$gifs$}
			on:gifLoadStart={(event) => setLoading(event.detail.permalink)}
			on:gifLoadComplete={(event) => setLoadingComplete(event.detail.permalink)}
		/>
	</ion-content>
</IonPage>
