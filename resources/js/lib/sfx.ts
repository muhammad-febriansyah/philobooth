/**
 * Lightweight Web Audio API sound effects for the kiosk capture flow.
 * Sounds are synthesized on the fly so we don't ship audio assets.
 */

type Ctx = AudioContext | null;

let ctx: Ctx = null;

function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (ctx) {
        return ctx;
    }

    const W = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
    };
    const AC = W.AudioContext ?? W.webkitAudioContext;

    if (!AC) {
        return null;
    }

    ctx = new AC();

    return ctx;
}

export function unlockAudio(): void {
    const c = getCtx();

    if (c && c.state === 'suspended') {
        c.resume().catch(() => {});
    }
}

export function playBeep(freq = 880, duration = 0.12, volume = 0.18): void {
    const c = getCtx();

    if (!c) {
        return;
    }

    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
}

/**
 * DSLR-style "cekrek" shutter: two crisp clicks (mirror up + shutter close)
 * separated by a brief gap. Built from short band-passed noise bursts so it
 * cuts through without sounding like a buzz.
 */
export function playShutter(): void {
    const c = getCtx();

    if (!c) {
        return;
    }

    playClick(c, c.currentTime, 1800, 0.025, 0.5);
    playClick(c, c.currentTime + 0.08, 1200, 0.045, 0.55);
}

function playClick(
    c: AudioContext,
    at: number,
    centerFreq: number,
    duration: number,
    volume: number,
): void {
    const sampleCount = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, sampleCount, c.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < sampleCount; i++) {
        // White-noise burst with steep linear decay = transient "tick".
        data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const src = c.createBufferSource();
    src.buffer = buf;

    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = centerFreq;
    bp.Q.value = 1.4;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    src.connect(bp).connect(gain).connect(c.destination);
    src.start(at);
    src.stop(at + duration + 0.02);
}

/**
 * Two-note rising chime used to mark "record done" / "clip saved".
 */
export function playChime(): void {
    playBeep(660, 0.1, 0.16);
    setTimeout(() => playBeep(990, 0.16, 0.18), 90);
}
