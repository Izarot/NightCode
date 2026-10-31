export function initAudio() {
    let audioContext = null;
    
    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }
    
    function playSound(frequency, duration, type = 'sine', volume = 0.3) {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }
    
    return {
        playCollectionSound() {
            playSound(800, 0.2, 'square', 0.2);
            setTimeout(() => playSound(1200, 0.1, 'square', 0.1), 100);
        },
        
        playHazardSound() {
            playSound(100, 0.5, 'sawtooth', 0.3);
            playSound(50, 0.3, 'sawtooth', 0.3);
        },
        
        playPowerUpSound() {
            playSound(400, 0.3, 'triangle', 0.2);
            setTimeout(() => playSound(600, 0.3, 'triangle', 0.2), 100);
            setTimeout(() => playSound(800, 0.3, 'triangle', 0.2), 200);
        }
    };
}