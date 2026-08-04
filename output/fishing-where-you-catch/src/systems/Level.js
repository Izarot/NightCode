export class LevelManager {
  constructor() {
    this.zones = ['Coastal', 'Mid-Ocean', 'Deep Sea', 'Polluted Bay', 'Renewal Zone'];
    this.currentZone = 0;
    this.currentLevel = 0;
  }
  nextLevel() {
    this.currentLevel++;
    if (this.currentLevel >= 5) {
      this.currentLevel = 0;
      this.currentZone = (this.currentZone + 1) % this.zones.length;
    }
  }
}
