export class UISystem {
  constructor(canvas, placement) {
    this.canvas = canvas;
    this.placement = placement;
    this.tileTray = document.createElement('div');
    this.tileTray.id = 'tileTray';
    this.tileTray.style.position = 'absolute';
    this.tileTray.style.bottom = '10px';
    this.tileTray.style.left = '50%';
    this.tileTray.style.transform = 'translateX(-50%)';
    this.tileTray.style.display = 'flex';
    this.tileTray.style.gap = '5px';
    document.body.appendChild(this.tileTray);
    this._populateTray();
  }
  _populateTray() {
    const types = ['forest','water','mountain','grass'];
    types.forEach(type => {
      const div = document.createElement('div');
      div.className = 'tile';
      div.textContent = type[0].toUpperCase();
      div.dataset.type = type;
      div.onclick = () => {
        this.placement.setSelected(type);
        // highlight
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(t=>t.style.opacity='1');
        div.style.opacity='0.7';
      };
      this.tileTray.appendChild(div);
    });
  }
}