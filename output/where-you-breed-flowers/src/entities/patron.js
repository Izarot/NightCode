export class PatronSystem {
    constructor() {
        this.patrons = [];
        this.nextPatronTime = 90; // seconds
        this.targets = [
            { L0: 5, L1: 80, L2: 6, L3: 2, L4: 50, L5: 1, L6: 3, L7: 2 },
            { L0: 6, L1: 90, L2: 4, L3: 1, L4: 30, L5: 0, L6: 0, L7: 3 }
        ];
    }

    update(dt) {
        this.nextPatronTime -= dt;
        if (this.nextPatronTime <= 0) {
            this.spawnPatron();
            this.nextPatronTime = 90;
        }
    }

    spawnPatron() {
        const target = this.targets[Math.floor(Math.random() * this.targets.length)];
        this.patrons.push({
            target,
            timeLeft: 30, // seconds to match
            reward: 100
        });
    }
}