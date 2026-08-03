export class Gear {
    constructor(x, y, radius, rotationSpeed, targetAngle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = 0;
        this.rotationSpeed = rotationSpeed;
        this.targetAngle = targetAngle;
        this.isAligned = false;
    }

    update() {
        const diff = Math.abs((this.rotation % 360) - this.targetAngle);
        const normalizedDiff = diff > 180 ? 360 - diff : diff;
        this.isAligned = normalizedDiff <= 5;
    }

    rotate(amount) {
        this.rotation = (this.rotation + amount) % 360;
    }

    snap() {
        this.rotation = Math.round(this.rotation / 90) * 90;
    }
}

export class GearManager {
    constructor() {
        this.gears = [
            new Gear(200, 150, 40, 10, 0),
            new Gear(600, 150, 60, 20, 45),
            new Gear(400, 450, 30, 30, 90)
        ];
        this.powerLevel = 0;
    }

    update() {
        let alignedCount = 0;
        this.gears.forEach(g => {
            g.update();
            if (g.isAligned) alignedCount++;
        });

        const targetPower = (alignedCount / this.gears.length) * 100;
        // Smooth power meter transition
        if (this.powerLevel < targetPower) this.powerLevel += 0.5;
        else if (this.powerLevel > targetPower) this.powerLevel -= 1;
        
        // Clamp
        this.powerLevel = Math.max(0, Math.min(100, this.powerLevel));
    }

    interact(mx, my, type) {
        for (const gear of this.gears) {
            const dist = Math.sqrt((mx - gear.x)**2 + (my - gear.y)**2);
            if (dist < gear.radius + 10) {
                if (type === 'rotate') gear.rotate(gear.rotationSpeed);
                else gear.snap();
                return;
            }
        }
    }

    getPowerLevel() {
        return this.powerLevel;
    }
}