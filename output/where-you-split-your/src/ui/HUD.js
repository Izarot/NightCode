export class HUD {
    constructor(hudElement) {
        this.hud = hudElement;
    }
    update(data) {
        this.hud.textContent = `Fragments: ${data.fragmentCount} | Mass: ${data.mass.toFixed(2)}`;
    }
}
