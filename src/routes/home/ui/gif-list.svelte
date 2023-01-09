<script lang="ts">
	import type { Gif } from '$lib/interfaces';
	import { Browser } from '@capacitor/browser';
	import { createEventDispatcher } from 'svelte';
	
	import { chatbubbles } from 'ionicons/icons';

	export let gifs: Gif[] | undefined;

	const dispatch = createEventDispatcher();

	const gifLoadStart = (permalink: string) => {
		dispatch('permalink', permalink);
	};

	const gifLoadComplete = (permalink: string) => {
		dispatch('permalink', permalink);
	};

	const playVideo = (ev: Event, gif: Gif) => {
		const video = ev.target as HTMLVideoElement;

		if (video.readyState === 4) {
			if (video.paused) {
				video.play();
			} else {
				video.pause();
			}
		} else {
			if (video.getAttribute('data-event-loaddeddata') !== 'true') {
				gifLoadStart(gif.permalink);
				video.load();

				const handleVideoLoaded = async () => {
					gifLoadComplete(gif.permalink);
					await video.play();
					video.removeEventListener('loadeddata', handleVideoLoaded);
				};

				video.addEventListener('loadeddata', handleVideoLoaded);
				video.setAttribute('data-event-loadeddata', 'true');
			}
		}
	};

	const showComments = (gif: Gif) => {
		Browser.open({
			toolbarColor: '#fff',
			url: `https://reddit.com/${gif.permalink}`,
			windowName: '_system'
		});
	};
</script>

<ion-list>
	{#if gifs}
		{#each gifs as gif (gif.permalink)}
			<div class="gif">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<ion-item
					button
					detail={false}
					data-test="gif-list-item"
					on:click={(event) => playVideo(event, gif)}
				>
					{#if gif.loading}
						<ion-spinner color="light" />
					{/if}
					<div
						style={!gif.dataLoaded
							? 'filter: blur(3px) brightness(0.6); transform: scale(1.1);'
							: ''}
						style:background={'url(' + gif.thumbnail + ') 50% 50% / cover no-repeat'}
						class="preload-background"
					>
						<video playsinline loop={true} muted={true} src={gif.src} />
					</div>
					<ion-label>{gif.title}</ion-label>
				</ion-item>
				<ion-list-header>
					<ion-label> {gif.title} </ion-label>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<ion-button data-test="gif-comments-button" on:click={() => showComments(gif)}>
						<ion-icon icon={chatbubbles} />
						{gif.comments}
					</ion-button>
				</ion-list-header>
			</div>
		{/each}
	{/if}
</ion-list>

<style>
	ion-list {
		padding: 0;
	}

	ion-label {
		margin: 0;
		padding: 10px 0;
		overflow: auto;
	}

	.gif ion-item {
		--inner-padding-end: 0;
		--padding-start: 0;
		position: relative;
	}

	.gif ion-spinner {
		margin: auto;
		position: absolute;
		left: 0px;
		right: 0px;
		z-index: 1;
		background-color: var(--ion-color-dark);
		border: 10px solid var(--ion-color-dark);
		border-radius: 5px;
		padding: 20px;
	}

	ion-list-header {
		align-items: center;
		background-color: var(--ion-color-light);
		border-bottom: 10px solid var(--ion-color-medium);
	}

	ion-list-header ion-button {
		margin: 0;
	}

	.preload-background {
		width: 100%;
		height: auto;
	}

	video {
		width: 100%;
		height: auto;
		margin: auto;
		background: transparent;
	}
</style>
