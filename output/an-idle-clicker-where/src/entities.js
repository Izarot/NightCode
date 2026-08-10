export class EntityManager {
    constructor() {
        this.avatar = { x: 320, y: 240, vx: 0, vy: 0, radius: 12, state: 'idle' };
        this.currencies = [];
        this.particles = [];
        this.spawnCurrencies(20);
    }

    spawnCurrencies(count) {
        for (let i = 0; i < count; i++) {
            this.currencies.push(this.createCurrency());
        }
    }

    createCurrency() {
        return {
            x: Math.random() * 600 + 20,
            y: Math.random() * 400 + 20,
            radius: 8,
            collected: false
        };
    }

    update(dt, economy, inputManager, renderer) {
        // Update avatar physics
        const input = inputManager.getMovementInput();
        const maxSpeed = 150;
        const acc = 800;
        const dec = 1200;

        // Apply acceleration/deceleration
        if (input.dx !== 0 || input.dy !== 0) {
            this.avatar.vx += input.dx * acc * dt;
            this.avatar.vy += input.dy * acc * dt;
        } else {
            // Deceleration
            if (this.avatar.vx > 0) this.avatar.vx -= dec * dt;
            if (this.avatar.vx < 0) this.avatar.vx += dec * dt;
            if (this.avatar.vy > 0) this.avatar.vy -= dec * dt;
            if (this.avatar.vy < 0) this.avatar.vy += dec * dt;
        }

        // Dash
        if (input.dash) {
            this.avatar.vx *= 2;
            this.avatar.vy *= 2;
            inputManager.dashCooldown = 0.5;
        }

        // Clamp velocity
        const speed = Math.sqrt(this.avatar.vx ** 2 + this.avatar.vy ** 2);
        if (speed > maxSpeed) {
            this.avatar.vx = (this.avatar.vx / speed) * maxSpeed;
            this.avatar.vy = (this.avatar.vy / speed) * maxSpeed;
        }

        // Update position
        this.avatar.x += this.avatar.vx * dt;
        this.avatar.y += this.avatar.vy * dt;

        // Screen wrap
        if (this.avatar.x < 0) this.avatar.x = 640;
        if (this.avatar.x > 640) this.avatar.x = 0;
        if (this.avatar.y < 0) this.avatar.y = 480;
        if (this.avatar.y > 480) this.avatar.y = 0;

        // Check currency collection
        this.checkCurrencyCollection(economy, inputManager);

        // Update particles
        this.updateParticles(dt);
    }

    checkCurrencyCollection(economy, inputManager) {
        const click = inputManager.getClick();
        if (!click) return;

        for (let currency of this.currencies) {
            if (currency.collected) continue;

            const dx = click.x - currency.x;
            const dy = click.y - currency.y;
            const dist = Math.sqrt(dx ** 2 + dy ** 2);

            if (dist < 30) { // Click radius
                economy.addCurrency(currency.value || 1);
                currency.collected = true;
                this.spawnParticle(currency.x, currency.y, '#FFD700');
                this.currencies.splice(this.currencies.indexOf(currency), 1);
                this.currencies.push(this.createCurrency());
            }
        }
    }

    spawnParticle(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                alpha: 1,
                size: 2 + Math.random() * 3,
                color: color,
                life: 0.5
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= dt / p.life;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    save() {
        return {
            avatar: { x: this.avatar.x, y: this.avatar.y },
            currencies: this.currencies.filter(c => !c.collected)
        };
    }

    loadFromSave(data) {
        if (data.entityManager?.avatar) {
            this.avatar.x = data.entityManager.avatar.x;
            this.avatar.y = data.entityManager.avatar.y;
        }
    }
}