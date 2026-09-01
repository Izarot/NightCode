// Web Audio API synthesized sounds for PolyGone

let audioContext = null;
let audioNodes = {};

function initAudio(ctx) {
    audioContext = ctx;
    
    // Create master gain
    audioNodes.masterGain = ctx.createGain();
    audioNodes.masterGain.gain.value = 0.3;
    audioNodes.masterGain.connect(ctx.destination);
    
    // Create reverb
    audioNodes.reverb = ctx.createConvolver();
    audioNodes.reverbGain = ctx.createGain();
    audioNodes.reverbGain.gain.value = 0.1;
    
    // Generate impulse response for reverb
    const impulseLength = ctx.sampleRate * 0.5;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for(let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for(let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
    }
    audioNodes.reverb.buffer = impulse;
    audioNodes.reverb.connect(audioNodes.reverbGain);
    audioNodes.reverbGain.connect(audioNodes.masterGain);
}

function playSound(type) {
    if(!audioContext) return;
    
    // Resume context if suspended
    if(audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const now = audioContext.currentTime;
    
    switch(type) {
        case 'shoot':
            playShootSound(now);
            break;
        case 'hit':
            playHitSound(now);
            break;
        case 'split':
            playSplitSound(now);
            break;
    }
}

function playShootSound(time) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(220, time + 0.1);
    
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(audioNodes.masterGain);
    gain.connect(audioNodes.reverb);
    
    osc.start(time);
    osc.stop(time + 0.1);
}

function playHitSound(time) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.2);
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(audioNodes.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.2);
}

function playSplitSound(time) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.setValueAtTime(660, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(880, time + 0.15);
    
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(audioNodes.masterGain);
    gain.connect(audioNodes.reverb);
    
    osc.start(time);
    osc.stop(time + 0.2);
}