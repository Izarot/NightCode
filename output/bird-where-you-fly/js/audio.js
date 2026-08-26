/* ============================================
   Web Audio API Sound Effects Engine
   ============================================ */
const AudioEngine = (() => {
    let ctx = null;
    let muted = false;

    const ensureContext = () => {
        if (!ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) ctx = new Ctx();
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    };

    const playTone = (freq, duration, type = 'sine', volume = 0.15, detune = 0) => {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        try {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            gain.gain.setValueAtTime(0, c.currentTime);
            gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
            osc.connect(gain).connect(c.destination);
            osc.start();
            osc.stop(c.currentTime + duration);
        } catch (e) {
            // Silent fail on audio errors
        }
    };

    const playNoise = (duration, volume = 0.08) => {
        if (muted) return;
        const c = ensureContext();
        if (!c) return;
        try {
            const bufferSize = c.sampleRate * duration;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const source = c.createBufferSource();
            source.buffer = buffer;
            const gain = c.createGain();
            gain.gain.value = volume;
            const filter = c.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            source.connect(filter).connect(gain).connect(c.destination);
            source.start();
        } catch (e) {
            // Silent fail
        }
    };

    return {
        init: ensureContext,
        bounce: () => playTone(440 + Math.random() * 200, 0.1, 'square', 0.08),
        pickup: () => {
            playTone(880, 0.08, 'sine', 0.12);
            setTimeout(() => playTone(1320, 0.1, 'sine', 0.1), 60);
        },
        hit: () => {
            playNoise(0.3, 0.15);
            playTone(80, 0.4, 'sawtooth', 0.2);
        },
        start: () => {
            playTone(523, 0.1, 'sine', 0.12);
            setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 100);
            setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
        },
        gameOver: () => {
            playTone(330, 0.2, 'sawtooth', 0.15);
            setTimeout(() => playTone(247, 0.2, 'sawtooth', 0.15), 200);
            setTimeout(() => playTone(196, 0.4, 'sawtooth', 0.15), 400);
        },
        toggleMute: () => {
            muted = !muted;
            return muted;
        }
    };
})();
