export class RNG {
    constructor(seed) {
        this.seed = seed || Math.random() * 1000000;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    range(min, max) {
        return this.next() * (max - min) + min;
    }
}