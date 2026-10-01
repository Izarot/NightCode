import { Engine } from '../core/Engine';

class Renderer {
    private ctx: CanvasRenderingContext2D;
    private camera = { x: 0, y: 0, trauma: 0 };

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })!;
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    private resize() {
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        this.canvas.style.width = `${1920 * scale}px`;
        this.canvas.style.height = `${1080 * scale}px`;
    }

    public render(engine: Engine) {
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, 1920, 1080);
        
        // Camera follow with deadzone
        const player = engine.Player;
        const deadzoneW = 1920 * 0.3;
        const deadzoneH = 1080 * 0.3;
        const targetX = player.x - 960;
        const targetY = player.y - 540;
        
        if (player.x > 960 + deadzoneW/2) this.camera.x += (targetX - deadzoneW/2 - this.camera.x) * 0.1;
        else if (player.x < 960 - deadzoneW/2) this.camera.x += (targetX + deadzoneW/2 - this.camera.x) * 0.1;
        if (player.y > 540 + deadzoneH/2) this.camera.y += (targetY - deadzoneH/2 - this.camera.y) * 0.1;
        else if (player.y < 540 - deadzoneH/2) this.camera.y += (targetY + deadzoneH/2 - this.camera.y) * 0.1;
        
        // Screen shake
        this.camera.trauma *= 0.95;
        const shakeX = (Math.random() - 0.5) * this.camera.trauma * 20;
        const shakeY = (Math.random() - 0.5) * this.camera.trauma * 20;
        
        ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
        
        // Render layers
        this.renderBackground(ctx);
        this.renderPlatforms(ctx, engine);
        this.renderPlayer(ctx, player);
        this.renderFX(ctx);
    }

    private renderBackground(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, '#161B22');
        gradient.addColorStop(1, '#0D1117');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1920, 1080);
    }

    private renderPlatforms(ctx: CanvasRenderingContext2D, engine: Engine) {
        engine.Platforms.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
        });
    }

    private renderPlayer(ctx: CanvasRenderingContext2D, player: any) {
        // Player body
        ctx.fillStyle = '#58A6FF';
        ctx.beginPath();
        ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#E6EDF3';
        ctx.beginPath();
        ctx.arc(player.x - 8, player.y - 8, 4, 0, Math.PI * 2);
        ctx.arc(player.x + 8, player.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderFX(ctx: CanvasRenderingContext2D) {
        // Vignette
        const vignette = ctx.createRadialGradient(960, 540, 300, 960, 540, 900);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1920, 1080);
    }

    public addScreenShake(amount: number) {
        this.camera.trauma = Math.min(1, this.camera.trauma + amount);
    }
}

export { Renderer };