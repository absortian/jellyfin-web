import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNativeBrandIntro } from './nativeBrandIntro';
import { introCancelledError, showBrandIntro } from './brandIntro';

vi.mock('./brandIntro', async importOriginal => ({
    ...await importOriginal(),
    showBrandIntro: vi.fn()
}));

describe('Android native player handoff', () => {
    let finish;
    let cancel;
    const options = {
        player: { id: 'exoplayer', isLocalPlayer: true },
        item: { MediaType: 'Video', Type: 'Movie' },
        fullscreen: true,
        enabled: true,
        skipLabel: 'Saltar intro'
    };

    beforeEach(() => {
        vi.mocked(showBrandIntro).mockImplementation(() => {
            const finished = new Promise((resolve, reject) => {
                finish = resolve;
                cancel = () => reject(introCancelledError());
            });
            return { finished, cancel };
        });
    });

    it.each(['exoplayer', 'externalplayer'])('finishes the intro before opening %s', async id => {
        const start = vi.fn().mockResolvedValue('started');
        const runner = createNativeBrandIntro();
        const result = runner.play({ ...options, player: { ...options.player, id } }, start);
        expect(start).not.toHaveBeenCalled();
        finish();
        await expect(result).resolves.toBe('started');
        expect(start).toHaveBeenCalledOnce();
    });

    it('does not launch the native player after stopping', async () => {
        const start = vi.fn();
        const runner = createNativeBrandIntro();
        const result = runner.play(options, start);
        const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
        runner.cancel();
        await rejected;
        expect(start).not.toHaveBeenCalled();
    });

    it('cancels a previous selection when another item is selected', async () => {
        const startOld = vi.fn();
        const startNew = vi.fn();
        const runner = createNativeBrandIntro();
        const first = runner.play(options, startOld);
        const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
        const second = runner.play(options, startNew);
        finish();
        await second;
        await rejected;
        expect(startOld).not.toHaveBeenCalled();
        expect(startNew).toHaveBeenCalledOnce();
    });

    it.each([
        { player: { id: 'htmlvideoplayer', isLocalPlayer: true } },
        { player: { id: 'exoplayer', isLocalPlayer: false } },
        { enabled: false },
        { fullscreen: false },
        { item: { MediaType: 'Video', Type: 'TvChannel' } }
    ])('bypasses web players, casting, SyncPlay and live/background playback: %o', async override => {
        vi.mocked(showBrandIntro).mockClear();
        const start = vi.fn();
        await createNativeBrandIntro().play({ ...options, ...override }, start);
        expect(showBrandIntro).not.toHaveBeenCalled();
        expect(start).toHaveBeenCalledOnce();
    });
});
