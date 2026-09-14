import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shouldShowBrandIntro, showBrandIntro } from './brandIntro';

describe('Absorflix playback intro', () => {
    let audio;
    let intro;

    beforeEach(() => {
        vi.useFakeTimers();
        audio = document.createElement('audio');
        Object.defineProperty(audio, 'duration', { value: 4.063492 });
        vi.spyOn(audio, 'play').mockImplementation(() => {
            audio.dispatchEvent(new Event('playing'));
            return Promise.resolve();
        });
        vi.spyOn(audio, 'pause').mockImplementation(() => undefined);
        vi.spyOn(audio, 'load').mockImplementation(() => undefined);
        vi.stubGlobal('Audio', function () {
            return audio;
        });
    });

    afterEach(async () => {
        if (intro) {
            const finished = intro.finished.catch(() => undefined);
            intro.cancel();
            await finished;
        }
        intro = undefined;
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('waits for the intro before allowing the feature to start, with the saved volume', async () => {
        intro = showBrandIntro({ volume: 0.25, muted: true, skipLabel: 'Saltar intro' });
        const playFeature = vi.fn();
        intro.finished.then(playFeature);
        expect(audio.volume).toBe(0.25);
        expect(audio.muted).toBe(true);
        expect(document.querySelector('img').getAttribute('src')).toBe('assets/img/absorflix/logo.svg');
        await vi.advanceTimersByTimeAsync(4000);
        expect(playFeature).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(64);
        expect(playFeature).toHaveBeenCalledOnce();
        expect(document.querySelector('.absorflixIntro')).toBeNull();
        expect(audio.pause).toHaveBeenCalled();
    });

    it('skips immediately and restores keyboard focus', async () => {
        const playButton = document.createElement('button');
        document.body.appendChild(playButton);
        playButton.focus();
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        document.querySelector('.absorflixIntro-skip').click();
        await intro.finished;
        expect(document.activeElement).toBe(playButton);
        await vi.runAllTimersAsync();
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(document.querySelector('.absorflixIntro')).toBeNull();
    });

    it('does not start the feature when navigation cancels the intro', async () => {
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        const result = expect(intro.finished).rejects.toMatchObject({ name: 'AbortError' });
        window.dispatchEvent(new Event('popstate'));
        await result;
        expect(document.querySelector('.absorflixIntro')).toBeNull();
        await vi.runAllTimersAsync();
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(document.querySelector('.absorflixIntro')).toBeNull();
    });

    it('continues if the browser rejects audio autoplay', async () => {
        audio.play.mockRejectedValue(new Error('NotAllowedError'));
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        await vi.runAllTimersAsync();
        await expect(intro.finished).resolves.toBeUndefined();
        expect(document.querySelector('.absorflixIntro')).toBeNull();
    });

    it('bounds the wait when audio never loads', async () => {
        audio.play.mockReturnValue(new Promise(() => undefined));
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        await vi.advanceTimersByTimeAsync(5300);
        await expect(intro.finished).resolves.toBeUndefined();
    });

    it('cleans up on an explicit stop without allowing playback', async () => {
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        const result = expect(intro.finished).rejects.toMatchObject({ name: 'AbortError' });
        intro.cancel();
        intro.cancel();
        await result;
        expect(audio.pause).toHaveBeenCalledOnce();
        await vi.runAllTimersAsync();
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(document.querySelector('.absorflixIntro')).toBeNull();
    });

    it('supports Escape to skip and traps focus during the intro', async () => {
        intro = showBrandIntro({ skipLabel: 'Saltar intro' });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
        expect(document.activeElement).toBe(document.querySelector('.absorflixIntro-skip'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await intro.finished;
    });

    it('includes movies and episodes, including resume, but excludes background and live media', () => {
        expect(shouldShowBrandIntro({ MediaType: 'Video', Type: 'Movie' }, true)).toBe(true);
        expect(shouldShowBrandIntro({ MediaType: 'Video', Type: 'Episode' }, true)).toBe(true);
        for (const type of ['TvChannel', 'LiveTvChannel', 'Trailer']) {
            expect(shouldShowBrandIntro({ MediaType: 'Video', Type: type }, true)).toBe(false);
        }
        expect(shouldShowBrandIntro({ MediaType: 'Audio' }, true)).toBe(false);
        expect(shouldShowBrandIntro({ MediaType: 'Video' }, false)).toBe(false);
    });
});
