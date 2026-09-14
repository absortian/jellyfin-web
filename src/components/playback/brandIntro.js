import Screenfull from 'screenfull';
import './brandIntro.scss';

const LOGO_URL = 'assets/img/absorflix/logo.svg';
const AUDIO_URL = 'assets/audio/absorflix/intro.mp3';
const DEFAULT_DURATION = 4200;

export function shouldShowBrandIntro(item, fullscreen) {
    return fullscreen !== false && item?.MediaType === 'Video'
        && !['TvChannel', 'LiveTvChannel', 'Trailer'].includes(item.Type);
}

export function introCancelledError() {
    const error = new Error('Brand intro cancelled');
    error.name = 'AbortError';
    return error;
}

/** Resolves before the feature starts; cancellation rejects without starting it. */
export function showBrandIntro({ volume = 1, muted = false, skipLabel }) {
    const overlay = document.createElement('div');
    overlay.className = 'absorflixIntro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Absorflix');
    overlay.setAttribute('aria-modal', 'true');

    const logo = document.createElement('img');
    logo.className = 'absorflixIntro-logo';
    logo.src = LOGO_URL;
    logo.alt = 'Absorflix';
    overlay.appendChild(logo);

    const lights = document.createElement('div');
    lights.className = 'absorflixIntro-lights';
    lights.setAttribute('aria-hidden', 'true');
    overlay.appendChild(lights);

    const skip = document.createElement('button');
    skip.className = 'absorflixIntro-skip';
    skip.type = 'button';
    skip.textContent = skipLabel;
    overlay.appendChild(skip);

    const audio = new Audio(AUDIO_URL);
    audio.preload = 'auto';
    audio.volume = volume;
    audio.muted = muted;
    const previousFocus = document.activeElement;
    let settled = false;
    let started = false;
    let endTimer;
    let resolveIntro;
    let rejectIntro;
    const finished = new Promise((resolve, reject) => {
        resolveIntro = resolve;
        rejectIntro = reject;
    });

    function finish(cancelled = false) {
        if (settled) return;
        settled = true;
        clearTimeout(startTimer);
        clearTimeout(endTimer);
        audio.removeEventListener('playing', start);
        audio.removeEventListener('error', silentStart);
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        window.removeEventListener('popstate', cancel);
        window.removeEventListener('hashchange', cancel);
        window.removeEventListener('pagehide', cancel);
        document.removeEventListener('keydown', onKeyDown, true);
        overlay.remove();
        if (previousFocus?.isConnected && previousFocus.focus) previousFocus.focus();
        if (cancelled) rejectIntro(introCancelledError());
        else resolveIntro();
    }

    function cancel() {
        finish(true);
    }

    function start() {
        if (settled || started) return;
        started = true;
        clearTimeout(startTimer);
        const duration = Number.isFinite(audio.duration) ?
            Math.max(3000, Math.min(audio.duration * 1000, 8000)) :
            DEFAULT_DURATION;
        overlay.style.setProperty('--intro-duration', `${duration}ms`);
        overlay.classList.add('absorflixIntro-playing');
        endTimer = setTimeout(() => finish(), duration);
    }

    function silentStart() {
        // A missing file or autoplay restriction must never block the feature.
        audio.pause();
        start();
    }

    function onKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            finish();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            skip.focus();
        }
    }

    skip.addEventListener('click', () => finish());
    audio.addEventListener('playing', start);
    audio.addEventListener('error', silentStart);
    window.addEventListener('popstate', cancel);
    window.addEventListener('hashchange', cancel);
    window.addEventListener('pagehide', cancel);
    document.addEventListener('keydown', onKeyDown, true);
    const fullscreen = Screenfull.isEnabled && Screenfull.element;
    const parent = fullscreen && fullscreen.tagName !== 'VIDEO' ? fullscreen : document.body;
    parent.appendChild(overlay);
    skip.focus();
    const startTimer = setTimeout(silentStart, 1200);
    // Older media implementations can throw synchronously from play().
    // eslint-disable-next-line sonarjs/no-try-promise
    try {
        const playPromise = audio.play();
        if (playPromise) playPromise.catch(silentStart);
    } catch {
        silentStart();
    }
    return { finished, cancel };
}
