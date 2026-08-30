export class Accessibility {
    constructor() {
        this.colorblindMode = false;
        this.slowMotion = false;
    }

    toggleColorblind() {
        this.colorblindMode = !this.colorblindMode;
    }

    toggleSlowMotion() {
        this.slowMotion = !this.slowMotion;
    }
}