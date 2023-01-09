export interface RedditPagination {
	after: string | null;
	totalFound: number;
	retries: number;
	infiniteScroll: HTMLIonInfiniteScrollElement | null;
}
