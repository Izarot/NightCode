// Audio manager for the game
(function() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = initAudio();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            switch(type) {
                case 'mix':
                    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.2);
                    break;
                case 'perfect':
                    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
                    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.3);
                    break;
                case 'miss':
                    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.2);
                    break;
            }
        } catch(e) {
            console.log('Audio not available:', e);
        }
    }

    function startMusic() {
        // Placeholder for background music
        console.log('Background music would start here');
    }

    window.playSound = playSound;
    window.startMusic = startMusic;
})();
