export class Assets {
  constructor() {
    this.sounds = {};
  }
  async load() {
    this.sounds.click = await this.loadSound('click');
    this.sounds.attach = await this.loadSound('attach');
    this.sounds.error = await this.loadSound('error');
  }
  loadSound(name) {
    return new Promise((resolve) => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.onload = () => resolve(audio);
    });
  }
  play(name) {
    const sound = this.sounds[name];
    if (sound) {
      sound.cloneNode().play();
    }
  }
}
