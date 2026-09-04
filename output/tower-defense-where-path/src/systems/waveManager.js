import { state } from '../state.js';
import { createScout } from '../entities/scout.js';
import { playSound } from '../utils/audio.js';

export function startWave() {
  state.wave++;
  if (state.wave > state.maxWaves) {
    state.victory = true;
    const score = Math.floor(state.energy * 100 + (30000 - state.speedrunTime));
    if (score > state.highScore) {
      state.highScore = score;
      localStorage.setItem('trailblaze_highscore', score.toString());
    }
    return;
  }
  state.waveStatus = 'SCOUTING...';
  state.waveActive = true;
  state.scoutsToSpawn = 5 + state.wave * 2;
  state.spawnTimer = 0;
  state.buildPhaseTimer = 0;
  playSound('wave_start');
}

export function updateWave(dt) {
  if (state.waveStatus === 'BUILD PHASE') {
    state.buildPhaseTimer -= dt;
    if (state.buildPhaseTimer <= 0) {
      startWave();
    }
    return;
  }

  if (state.waveActive) {
    if (state.scoutsToSpawn > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const spawnCount = Math.min(2, state.scoutsToSpawn);
        for (let i = 0; i < spawnCount; i++) {
          const hw = state.highways[Math.floor(Math.random() * state.highways.length)];
          if (hw) {
            const s = createScout(hw.nodes[0].x, hw.nodes[0].y, 30 + state.wave * 15);
            s.path = hw.nodes;
            s.nodeIndex = 0;
            state.scouts.push(s);
          }
        }
        state.scoutsToSpawn -= spawnCount;
        state.spawnTimer = state.spawnInterval / Math.max(1, state.wave * 0.3);
      }
    } else if (state.scouts.length === 0) {
      // Wave complete
      state.waveActive = false;
      if (state.wave >= state.maxWaves) {
        state.victory = true;
        const score = Math.floor(state.energy * 100 + Math.max(0, 600 - state.speedrunTime));
        if (score > state.highScore) {
          state.highScore = score;
          localStorage.setItem('trailblaze_highscore', score.toString());
        }
        playSound('victory');
      } else {
        state.waveStatus = 'BUILD PHASE';
        state.buildPhaseTimer = 15;
        state.energy += 200 + state.wave * 50;
        playSound('wave_end');
      }
    }
  }
}
