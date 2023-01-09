<script lang="ts">
	import { IonPage } from 'ionic-svelte';
	import { BehaviorSubject, combineLatest, map } from 'rxjs';
	import { getGifs, isLoading$ } from '$lib/data-access/reddit';
	import SearchBar from './ui/search-bar.svelte';
	import GifList from './ui/gif-list.svelte';
	import { SvelteSubject } from '$lib/utils/subject';

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
</script>

<IonPage>
	<ion-header>
		<ion-toolbar color="primary">
			<SearchBar {subreddit$} />
		</ion-toolbar>
		{#if $isLoading$}
			<ion-progress-bar data-test="loading-bar" color="dark" type="indeterminate" reversed={true} />
		{/if}
	</ion-header>
	<ion-content>
		<GifList
			gifs={$gifs$}
			on:gifLoadStart={(event) => setLoading(event.detail.permalink)}
			on:gifLoadComplete={(event) => setLoadingComplete(event.detail.permalink)}
		/>
	</ion-content>
</IonPage>
