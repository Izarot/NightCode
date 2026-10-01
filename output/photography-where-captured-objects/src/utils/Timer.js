export class Timer {
  constructor(duration) {
    this.duration = duration;
    this.time = duration;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;
    this.time -= dt;
    if (this.time <= 0) {
      this.time = 0;
      this.finished = true;
    }
  }

  reset(duration = this.duration) {
    this.duration = duration;
    this.time = duration;
    this.finished = false;
  }

  isFinished() {
    return this.finished;
  }

  getTimeString() {
    const t = Math.max(0, Math.floor(this.time));
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
