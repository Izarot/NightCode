export class Economy {
    constructor(storage) {
        this.currency = 0;
        this.clickValue = 1;
        this.rps = 0;
        this.prestigePoints = 0;
        this.upgrades = {
            clickBoost: { name: 'Click +1', cost: 10, owned: 0, baseCost: 10, rps: 0, purchased: false },
            generator: { name: 'Generator +0.5 U/s', cost: 25, owned: 0, baseCost: 25, rps: 0.5, purchased: false }
        };
        this.storage = storage;
    }

    update(dt, inputManager) {
        // Add RPS
        this.currency += this.rps * dt;

        // Handle clicks
        const click = inputManager.getClick();
        if (click) {
            // Check if clicking near avatar
            const dx = click.x - inputManager.avatar?.x || 320;
            const dy = click.y - inputManager.avatar?.y || 240;
            const dist = Math.sqrt(dx ** 2 + dy ** 2);
            if (dist < 30) {
                this.addCurrency(this.clickValue);
            }
        }
    }

    addCurrency(amount) {
        this.currency += amount;
    }

    purchaseUpgrade(id) {
        const upgrade = this.upgrades[id];
        if (this.currency >= upgrade.cost) {
            this.currency -= upgrade.cost;
            upgrade.owned++;
            upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));

            if (id === 'clickBoost') {
                this.clickValue += 1;
            } else if (id === 'generator') {
                this.rps += upgrade.rps;
            }

            // Play purchase sound
            this.storage.audioManager?.play('buy');
            return true;
        }
        return false;
    }

    prestige() {
        const pp = Math.floor(this.currency / 1000);
        if (pp > 0) {
            this.prestigePoints += pp;
            this.currency = 0;
            this.clickValue = 1;
            this.rps = 0;
            this.prestigeMultiplier = 1 + (this.prestigePoints * 0.05);
            return true;
        }
        return false;
    }

    save() {
        return {
            currency: this.currency,
            clickValue: this.clickValue,
            rps: this.rps,
            prestigePoints: this.prestigePoints,
            upgrades: this.upgrades
        };
    }

    loadFromSave(data) {
        if (data) {
            this.currency = data.currency || 0;
            this.clickValue = data.clickValue || 1;
            this.rps = data.rps || 0;
            this.prestigePoints = data.prestigePoints || 0;
            if (data.upgrades) {
                Object.assign(this.upgrades, data.upgrades);
            }
        }
    }
}