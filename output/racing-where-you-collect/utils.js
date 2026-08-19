export function createVector(x = 0, y = 0) {
  return {
    x,
    y,
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    },
    sub(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    },
    mul(s) {
      this.x *= s;
      this.y *= s;
      return this;
    },
    clone() {
      return { x: this.x, y: this.y };
    }
  };
}

export function loadImages(sources) {
  return new Promise((resolve, reject) => {
    const images = {};
    let loaded = 0;
    const total = Object.keys(sources).length;
    for (const key in sources) {
      const img = new Image();
      img.src = sources[key];
      img.onload = () => {
        images[key] = img;
        if (++loaded === total) resolve(images);
      };
      img.onerror = () => reject(new Error('Failed to load image: ' + sources[key]));
    }
  });
}

export function loadAudio(sources) {
  return new Promise((resolve, reject) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffers = {};
    let loaded = 0;
    const total = Object.keys(sources).length;
    for (const key in sources) {
      fetch(sources[key])
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => {
          buffers[key] = decoded;
          if (++loaded === total) resolve({ audioCtx, buffers });
        })
        .catch(e => reject(e));
    }
  });
}

export function saveHighScore(score) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('gearDriftHighScore', score);
  }
}

export function loadHighScore() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('gearDriftHighScore');
  }
  return null;
}