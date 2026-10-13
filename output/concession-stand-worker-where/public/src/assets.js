// Asset management
class AssetManager {
    static async load() {
        this.images = {};
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        
        // Load placeholder images (we'll generate simple shapes)
        this.images.worker = await this.createWorkerSprite();
        this.images.grill = await this.createStationSprite('#CC5500', 'Grill');
        this.images.bun = await this.createStationSprite('#E8C58D', 'Bun');
        this.images.register = await this.createStationSprite('#00FFE0', 'Register');
        this.images.customer = await this.createCustomerSprite();
        
        // Generate sound effects
        this.sounds.cook = this.createCookSound();
        this.sounds.assemble = this.createAssembleSound();
        this.sounds.error = this.createErrorSound();
        this.sounds.chaching = this.createChachingSound();
        
        return true;
    }
    
    static async createWorkerSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00FFE0';
        ctx.fillRect(8, 8, 16, 16);
        return new Image();
    }
    
    static async createStationSprite(color, label) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 64, 64);
        ctx.fillStyle = '#000';
        ctx.font = '10px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(label, 32, 34);
        const img = new Image();
        img.src = canvas.toDataURL();
        await new Promise(resolve => img.onload = resolve);
        return img;
    }
    
    static async createCustomerSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF2E88';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(12, 12, 2, 0, Math.PI * 2);
        ctx.arc(20, 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, 20, 3, 0, Math.PI);
        ctx.stroke();
        const img = new Image();
        img.src = canvas.toDataURL();
        await new Promise(resolve => img.onload = resolve);
        return img;
    }
    
    static createCookSound() {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        oscillator.type = 'noise';
        oscillator.frequency.value = 100;
        gain.gain.value = 0.01;
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        return { oscillator, gain, start: () => { oscillator.start(); gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5); }, stop: () => { gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1); setTimeout(() => oscillator.stop(), 100); } };
    }
    
    static createAssembleSound() {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gain.gain.value = 0.1;
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        return { oscillator, gain, play: () => { oscillator.start(); gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1); setTimeout(() => oscillator.stop(), 100); } };
    }
    
    static createErrorSound() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator1.frequency.value = 200;
        oscillator2.frequency.value = 300;
        gain.gain.value = 0.1;
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(this.audioContext.destination);
        return { oscillator1, oscillator2, gain, play: () => { oscillator1.start(); oscillator2.start(); gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1); setTimeout(() => { oscillator1.stop(); oscillator2.stop(); }, 100); } };
    }
    
    static createChachingSound() {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = 400;
        gain.gain.value = 0.1;
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        return { oscillator, gain, play: () => { oscillator.start(); gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2); setTimeout(() => oscillator.stop(), 200); } };
    }
}

export { AssetManager };