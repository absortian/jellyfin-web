import { introCancelledError, shouldShowBrandIntro, showBrandIntro } from './brandIntro';

/** The official Android app hands control to these players from its WebView. */
export function createNativeBrandIntro() {
    let activeIntro;
    let request = 0;

    function cancel() {
        request++;
        activeIntro?.cancel();
        activeIntro = null;
    }

    async function play({ player, item, fullscreen, enabled, skipLabel }, startPlayback) {
        cancel();
        const currentRequest = request;
        const supported = player.isLocalPlayer
            && ['exoplayer', 'externalplayer'].includes(player.id);
        if (enabled && supported && shouldShowBrandIntro(item, fullscreen)) {
            const intro = showBrandIntro({ skipLabel, muted: player.isMuted?.() || false });
            activeIntro = intro;
            try {
                await intro.finished;
            } finally {
                if (activeIntro === intro) activeIntro = null;
            }
            if (currentRequest !== request) throw introCancelledError();
        }
        return startPlayback();
    }

    return { play, cancel };
}
