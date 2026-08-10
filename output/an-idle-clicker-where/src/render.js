export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.particles = [];
        this.fontLoaded = false;
        this.loadFonts();
    }

    loadFonts() {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        this.fontLoaded = true;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBackground() {
        // Parallax gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0A0A0A');
        gradient.addColorStop(1, '#1A1A2E');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Distant hills
        this.ctx.fillStyle = '#00E5FF';
        this.ctx.globalAlpha = 0.1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height * 0.7);
        this.ctx.lineTo(this.canvas.width * 0.3, this.canvas.height * 0.5);
        this.ctx.lineTo(this.canvas.width * 0.6, this.canvas.height * 0.65);
        this.ctx.lineTo(this.canvas.width, this.canvas.height * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    renderAvatar/avatar) {
        const { x, y, radius } = avatar;
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    renderCurrency(currencies) {
        currencies.forEach(currency => {
            this.ctx.save();
            this.ctx.translate(currency.x, currency.y);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center');
            this.ctx.fillText('🪙', 0, 0);
            this.ctx.restore();
        });
    }

    renderUI(economy, entityManager) {
        const { currency, clickValue, rps, upgrades } = economy;
        const scale = this.canvas.width / 640;

        // Resource counter
        this.ctx.save();
        this.ctx.font = `bold ${28 * scale}px 'Montserrat', Arial`; 
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(`Currency: ${currency.toFixed(2)}`, this.canvas.width / 2, 30);
        this.ctx.fillText(`Currency: ${currency.toFixed(2)}`, this.canvas.width / 2, 30);
        this.ctx.restore();

        // RPS display
        this.ctx.save();
        this.ctx.font = `16 * scale}px 'Montserrat', Arial`;
        this.ctx.fillStyle = '#00E5FF';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`RPS: ${rps.toFixed(2)}`, this.canvas.width - 20, 30);
        this.ctx.fillText(`Click: +${clickValue}`, this.canvas.width - 20, 50);
        this.ctx.restore();

        // Upgrade panel
        this.renderUpgradePanel(upgrades, scale);
    }

    renderUpgradePanel(upgrades, scale) {
        const panelX = this.canvas.width - 280;
        const panelY = this.canvas.height - 200;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX - 10, panelY - 10, 270, 210);
        this.ctx.restore();

        let y = panelY;
        Object.entries(upgrades).forEach(([id, upgrade]) => {
            const buttonWidth = 100;
            const buttonHeight = 30;
            const buttonX = panelX + 150;
            const buttonY = y + 5;

            // Button background
            this.ctx.save();
            this.ctx.fillStyle = upgrade.purchased ? '#4CAF50' : '#2196F3';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            this.ctx.restore();

            // Button text
            this.ctx.save();
            this.ctx.font = `${12 * scale}px 'Montserrat', Arial`;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(upgrade.purchased ? 'Owned' : `Buy (${upgrade.cost.toFixed(0)})`, buttonX + buttonWidth / 2, buttonY + 20);
            this.ctx.restore();

            y += 40;
        });
    }

    renderParticles(particles) {
        particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
}