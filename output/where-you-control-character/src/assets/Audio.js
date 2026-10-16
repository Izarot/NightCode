export class Audio {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicOscillators = [];
        this.musicInterval = null;
        
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = 0.15;
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 0.3;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    playSound(name) {
        if (!this.enabled || !this.audioContext) return;
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        switch(name) {
            case 'start':
                this.playTone(440, 0.1, 'square', now);
                this.playTone(554, 0.1, 'square', now + 0.05);
                this.playTone(659, 0.2, 'square', now + 0.1);
                break;
            case 'gameover':
                this.playTone(330, 0.3, 'sawtooth', now);
                this.playTone(247, 0.5, 'sawtooth', now + 0.2);
                break;
            case 'collision':
                this.playNoise(0.1, now);
                break;
            case 'point':
                this.playTone(880, 0.05, 'sine', now);
                break;
        }
    }

    playTone(frequency, duration, type, when) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0.5, when);
        gain.gain.exponentialRampToValueAtTime(0.01, when + duration);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(when);
        osc.stop(when + duration);
    }

    playNoise(duration, when) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, when);
        gain.gain.exponentialRampToValueAtTime(0.01, when + duration);
        
        source.connect(gain);
        gain.connect(this.sfxGain);
        source.start(when);
    }

    playMusic() {
        if (!this.enabled || !this.audioContext) return;
        this.resumeContext();
        this.stopMusic();
        
        const notes = [
            { freq: 220, dur: 0.5 },
            { freq: 247, dur: 0.5 },
            { freq: 294, dur: 0.5 },
            { freq: 330, dur: 0.5 },
            { freq: 294, dur: 0.5 },
            { freq: 247, dur: 0.5 },
            { freq: 220, dur: 1 },
        ];
        
        let time = this.audioContext.currentTime + 0.1;
        
        const playSequence = () => {
            if (!this.enabled) return;
            
            for (const note of notes) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = note.freq;
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur);
                
                osc.connect(gain);
                gain.connect(this.musicGain);
                
                osc.start(time);
                osc.stop(time + note.dur);
                
                this.musicOscillators.push(osc);
                
                time += note.dur;
            }
            
            // Loop
            this.musicInterval = setTimeout(playSequence, notes.reduce((sum, n) => sum + n.dur, 0) * 1000);
        };
        
        playSequence();
    }

    stopMusic() {
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
        
        for (const osc of this.musicOscillators) {
            try { osc.stop(); } catch (e) {}
        }
        this.musicOscillators = [];
    }

    pauseMusic() {
        this.stopMusic();
    }

    resumeMusic() {
        this.playMusic();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else if (this.game.state === 'playing') {
            this.playMusic();
        }
    }
}