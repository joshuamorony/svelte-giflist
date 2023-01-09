import type { Settings } from '$lib/interfaces';
import { Storage } from '@ionic/storage';
import { BehaviorSubject, from, Observable, shareReplay, switchMap, take, tap } from 'rxjs';

let hasLoaded = false;

const ionicStorage = new Storage();
const storage$ = from(ionicStorage.create()).pipe(shareReplay(1));

const load$: Observable<Settings> = storage$.pipe(
	switchMap((storage) => from(storage.get('settings'))),
	tap(() => (hasLoaded = true)),
	shareReplay(1)
);

const _settings$ = new BehaviorSubject<Settings>({
	sort: 'hot',
	perPage: 10
});

export const settings$ = _settings$.asObservable();

export const init = () => {
	load$.pipe(take(1)).subscribe((settings) => {
		if (settings) {
			_settings$.next(settings);
		}
	});
};

export const save = (settings: Settings) => {
	_settings$.next(settings);

	if (hasLoaded) {
		storage$.pipe(take(1)).subscribe((storage) => {
			storage.set('settings', settings);
		});
	}
};
