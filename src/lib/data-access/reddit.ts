import { settings$ } from '$lib/data-access/settings';
import type { RedditPagination, RedditPost } from '$lib/interfaces';
import {
	BehaviorSubject,
	catchError,
	combineLatest,
	concatMap,
	debounceTime,
	distinctUntilChanged,
	EMPTY,
	expand,
	map,
	scan,
	startWith,
	switchMap,
	tap
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export const isLoading$ = new BehaviorSubject(false);

const pagination$ = new BehaviorSubject<RedditPagination>({
	after: null,
	totalFound: 0,
	retries: 0,
	infiniteScroll: null
});

export const getGifs = (formValues: BehaviorSubject<string>) => {
	// Start with a default emission of 'gifs', then only emit when
	// subreddit changes
	const subreddit$ = formValues.pipe(
		tap((val) => console.log(val)),
		debounceTime(300),
		distinctUntilChanged(),
		startWith(formValues.value),
		// Reset pagination values
		tap(() =>
			pagination$.next({
				after: null,
				totalFound: 0,
				retries: 0,
				infiniteScroll: null
			})
		)
	);

	return combineLatest([subreddit$, settings$]).pipe(
		switchMap(([subreddit, settings]) => {
			// Fetch Gifs
			const gifsForCurrentPage$ = pagination$.pipe(
				tap(() => isLoading$.next(true)),
				concatMap((pagination) =>
					fetchFromReddit(subreddit, settings.sort, pagination.after, settings.perPage).pipe(
						// Keep retrying until we have enough valid gifs to fill a page
						// 'expand' will keep repeating itself as long as it returns
						// a non-empty observable
						expand((res, index) => {
							const validGifs = res.gifs.filter((gif) => gif.src !== null);
							const gifsRequired = res.gifsRequired - validGifs.length;
							const maxAttempts = 10;

							// Keep trying if all criteria is met
							// - we need more gifs to fill the page
							// - we got at least one gif back from the API
							// - we haven't exceeded the max retries
							const shouldKeepTrying = gifsRequired > 0 && res.gifs.length && index < maxAttempts;

							if (!shouldKeepTrying) {
								pagination.infiniteScroll?.complete();
								isLoading$.next(false);
							}

							return shouldKeepTrying
								? fetchFromReddit(
										subreddit,
										settings.sort,
										res.gifs[res.gifs.length - 1].name,
										gifsRequired
								  )
								: EMPTY; // Return an empty observable to stop retrying
						})
					)
				),
				// Filter out any gifs without a src, and don't return more than the amount required
				// NOTE: Even though expand will keep repeating, each result of expand will be passed
				// here immediately without waiting for all expand calls to complete
				map((res) => res.gifs.filter((gif) => gif.src !== null).slice(0, res.gifsRequired))
			);

			// Every time we get a new batch of gifs, add it to the cached gifs
			const allGifs$ = gifsForCurrentPage$.pipe(
				scan((previousGifs, currentGifs) => [...previousGifs, ...currentGifs])
			);

			return allGifs$;
		})
	);
};

export const nextPage = (infiniteScrollEvent: Event, after: string) => {
	pagination$.next({
		after,
		totalFound: 0,
		retries: 0,
		infiniteScroll: infiniteScrollEvent?.target as HTMLIonInfiniteScrollElement
	});
};

const fetchFromReddit = (
	subreddit: string,
	sort: string,
	after: string | null,
	gifsRequired: number
) => {
	return fromFetch(
		`https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=100` +
			(after ? `&after=${after}` : '')
	).pipe(
		switchMap((response) => response.json()),
		// Convert response into the gif format we need
		// AND keep track of how many gifs we want from the API
		map((res) => ({
			gifs: convertRedditPostsToGifs(res.data.children),
			gifsRequired
		})),

		// If there is an error, just return an empty observable
		// This prevents the stream from breaking
		catchError(() => EMPTY)
	);
};

const convertRedditPostsToGifs = (posts: RedditPost[]) => {
	return posts.map((post) => ({
		src: getBestSrcForGif(post),
		author: post.data.author,
		name: post.data.name,
		permalink: post.data.permalink,
		title: post.data.title,
		thumbnail: post.data.thumbnail,
		comments: post.data.num_comments,
		loading: false
	}));
};

const getBestSrcForGif = (post: RedditPost) => {
	// If the source is in .mp4 format, leave unchanged
	if (post.data.url.indexOf('.mp4') > -1) {
		return post.data.url;
	}

	// If the source is in .gifv or .webm formats, convert to .mp4 and return
	if (post.data.url.indexOf('.gifv') > -1) {
		return post.data.url.replace('.gifv', '.mp4');
	}

	if (post.data.url.indexOf('.webm') > -1) {
		return post.data.url.replace('.webm', '.mp4');
	}

	// If the URL is not .gifv or .webm, check if media or secure media is available
	if (post.data.secure_media?.reddit_video) {
		return post.data.secure_media.reddit_video.fallback_url;
	}

	if (post.data.media?.reddit_video) {
		return post.data.media.reddit_video.fallback_url;
	}

	// If media objects are not available, check if a preview is available
	if (post.data.preview?.reddit_video_preview) {
		return post.data.preview.reddit_video_preview.fallback_url;
	}

	// No useable formats available
	return null;
};
