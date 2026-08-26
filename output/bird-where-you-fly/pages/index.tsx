import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Position {
  x: number;
  y: number;
}

interface GameObject {
  position: Position;
  size: number;
  active: boolean;
}

interface Obstacle extends GameObject {
  speed: number;
}

interface Coin extends GameObject {
  value: number;
}

// Sound Manager using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  playJump(): void {
    this.playTone(400, 0.1, 'square', 0.2);
    setTimeout(() => this.playTone(600, 0.1, 'square', 0.15), 50);
  }

  playCollect(): void {
    this.playTone(880, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.25), 80);
  }

  playHit(): void {
    this.playTone(150, 0.3, 'sawtooth', 0.4);
    this.playTone(100, 0.4, 'square', 0.3);
  }

  playGameOver(): void {
    this.playTone(400, 0.2, 'square', 0.3);
    setTimeout(() => this.playTone(300, 0.2, 'square', 0.25), 150);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.2), 300);
  }
}

// High Score Manager using LocalStorage
const HIGH_SCORE_KEY = 'speedrunner_high_score';

class HighScoreManager {
  static getHighScore(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  static setHighScore(score: number): boolean {
    if (typeof window === 'undefined') return false;
    const currentHigh = this.getHighScore();
    if (score > currentHigh) {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      return true;
    }
    return false;
  }
}

export default function SpeedRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [time, setTime] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const soundManagerRef = useRef<SoundManager | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Game state refs for animation loop
  const playerRef = useRef<GameObject>({ position: { x: 100, y: 300 }, size: 40, active: true });
  const coinsRef = useRef<Coin[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const gravityRef = useRef(0.6);
  const jumpForceRef = useRef(-14);
  const velocityRef = useRef({ x: 0, y: 0 });
  const coinSpawnTimerRef = useRef(0);
  const obstacleSpawnTimerRef = useRef(0);
  const difficultyRef = useRef(1);

  // Vibrant Color Palette
  const colors = {
    background: '#1a0a2e',
    backgroundGradient: ['#1a0a2e', '#16213e', '#0f3460'],
    player: '#00ff88',
    playerGlow: '#00ff8855',
    coin: '#ffd700',
    coinGlow: '#ffd70055',
    obstacle: '#ff3366',
    obstacleGlow: '#ff336655',
    particle: ['#00ff88', '#ffd700', '#ff3366', '#00d4ff', '#ff6b35'],
    text: '#ffffff',
    textGlow: '#00ff88',
    ui: '#e94560',
    timer: '#00d4ff',
  };

  // Initialize
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    setHighScore(HighScoreManager.getHighScore());

    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = Math.min(containerWidth * 0.75, window.innerHeight * 0.7);
        setDimensions({ width: containerWidth, height: containerHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = {
      position: { x: 100, y: dimensions.height / 2 },
      size: 40,
      active: true,
    };
    coinsRef.current = [];
    obstaclesRef.current = [];
    particlesRef.current = [];
    velocityRef.current = { x: 0, y: 0 };
    gravityRef.current = 0.6;
    jumpForceRef.current = -14;
    coinSpawnTimerRef.current = 0;
    obstacleSpawnTimerRef.current = 0;
    difficultyRef.current = 1;
    setScore(0);
    setTime(0);
    setIsNewHighScore(false);
    lastTimeRef.current = 0;
  }, [dimensions]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    soundManagerRef.current?.playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => soundManagerRef.current?.playTone(659, 0.1, 'sine', 0.3), 100);
    setTimeout(() => soundManagerRef.current?.playTone(784, 0.2, 'sine', 0.3), 200);
  }, [resetGame]);

  const createParticles = (x: number, y: number, count: number, color?: string) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color || colors.particle[Math.floor(Math.random() * colors.particle.length)],
      });
    }
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return;

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    setTime(prev => prev + deltaTime);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const player = playerRef.current;
    const keys = keysRef.current;

    // Update difficulty over time
    difficultyRef.current = 1 + Math.floor(time / 15) * 0.2;

    // Player controls
    const isJumping = keys.has(' ') || keys.has('ArrowUp') || keys.has('w') || keys.has('W');
    
    if (isJumping && player.position.y >= height - player.size - 10) {
      velocityRef.current.y = jumpForceRef.current;
      soundManagerRef.current?.playJump();
      createParticles(player.position.x + player.size / 2, player.position.y + player.size, 5, colors.player);
    }

    // Apply gravity
    velocityRef.current.y += gravityRef.current;
    player.position.y += velocityRef.current.y;

    // Ground collision
    if (player.position.y > height - player.size - 10) {
      player.position.y = height - player.size - 10;
      velocityRef.current.y = 0;
    }

    // Ceiling collision
    if (player.position.y < 0) {
      player.position.y = 0;
      velocityRef.current.y = 0;
    }

    // Spawn coins
    coinSpawnTimerRef.current += deltaTime;
    if (coinSpawnTimerRef.current > 1.5 / difficultyRef.current) {
      coinSpawnTimerRef.current = 0;
      coinsRef.current.push({
        position: { x: width + 20, y: Math.random() * (height - 100) + 30 },
        size: 25,
        active: true,
        value: 10,
      });
    }

    // Spawn obstacles
    obstacleSpawnTimerRef.current += deltaTime;
    if (obstacleSpawnTimerRef.current > 2.5 / difficultyRef.current) {
      obstacleSpawnTimerRef.current = 0;
      const obstacleHeight = 40 + Math.random() * 60;
      obstaclesRef.current.push({
        position: { x: width + 20, y: height - obstacleHeight - 10 },
        size: obstacleHeight,
        active: true,
        speed: 5 + difficultyRef.current * 1.5,
      });
    }

    // Update coins
    coinsRef.current = coinsRef.current.filter(coin => {
      coin.position.x -= 4 * difficultyRef.current;

      // Collision detection
      const dx = (player.position.x + player.size / 2) - (coin.position.x + coin.size / 2);
      const dy = (player.position.y + player.size / 2) - (coin.position.y + coin.size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < (player.size + coin.size) / 2 && coin.active) {
        coin.active = false;
        setScore(prev => prev + coin.value);
        soundManagerRef.current?.playCollect();
        createParticles(coin.position.x, coin.position.y, 8, colors.coin);
        return false;
      }

      return coin.position.x > -coin.size;
    });

    // Update obstacles
    for (const obstacle of obstaclesRef.current) {
      obstacle.position.x -= obstacle.speed;

      // Collision detection with player
      const playerBox = {
        left: player.position.x,
        right: player.position.x + player.size,
        top: player.position.y,
        bottom: player.position.y + player.size,
      };

      const obstacleBox = {
        left: obstacle.position.x,
        right: obstacle.position.x + 30,
        top: obstacle.position.y,
        bottom: obstacle.position.y + obstacle.size,
      };

      if (
        playerBox.right > obstacleBox.left &&
        playerBox.left < obstacleBox.right &&
        playerBox.bottom > obstacleBox.top &&
        playerBox.top < obstacleBox.bottom
      ) {
        soundManagerRef.current?.playHit();
        createParticles(player.position.x + player.size / 2, player.position.y + player.size / 2, 20, colors.obstacle);
        
        const isNew = HighScoreManager.setHighScore(score);
        if (isNew) {
          setHighScore(score);
          setIsNewHighScore(true);
        }
        
        soundManagerRef.current?.playGameOver();
        setGameState('gameover');
        return;
      }
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.position.x > -50);

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Render
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.backgroundGradient[0]);
    gradient.addColorStop(0.5, colors.backgroundGradient[1]);
    gradient.addColorStop(1, colors.backgroundGradient[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid lines for depth
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Ground
    ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.fillRect(0, height - 10, width, 10);
    ctx.fillStyle = colors.player;
    ctx.fillRect(0, height - 5, width, 5);

    // Draw coins
    for (const coin of coinsRef.current) {
      // Glow
      ctx.shadowColor = colors.coin;
      ctx.shadowBlur = 20;
      ctx.fillStyle = colors.coin;
      ctx.beginPath();
      ctx.arc(coin.position.x + coin.size / 2, coin.position.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(coin.position.x + coin.size / 2, coin.position.y + coin.size / 2, coin.size / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw obstacles
    for (const obstacle of obstaclesRef.current) {
      ctx.shadowColor = colors.obstacle;
      ctx.shadowBlur = 15;
      ctx.fillStyle = colors.obstacle;
      ctx.fillRect(obstacle.position.x, obstacle.position.y, 30, obstacle.size);
      ctx.shadowBlur = 0;

      // Pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < obstacle.size; i += 15) {
        ctx.fillRect(obstacle.position.x, obstacle.position.y + i, 30, 5);
      }
    }

    // Draw particles
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.shadowColor = colors.player;
    ctx.shadowBlur = 25;
    ctx.fillStyle = colors.player;
    ctx.fillRect(player.position.x, player.position.y, player.size, player.size);
    ctx.shadowBlur = 0;

    // Player face
    ctx.fillStyle = '#000';
    ctx.fillRect(player.position.x + 10, player.position.y + 12, 6, 6);
    ctx.fillRect(player.position.x + 24, player.position.y + 12, 6, 6);
    ctx.fillRect(player.position.x + 12, player.position.y + 26, 16, 4);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, dimensions, score, time]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = 0;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Emoji Favicon via meta tag - actual favicon.ico can't be set inline */}
      <div className="hidden">🏃</div>
      
      <div ref={containerRef} className="relative w-full max-w-3xl">
        {/* Timer */}
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="text-cyan-400 font-mono text-lg" style={{ textShadow: '0 0 10px #00d4ff' }}>
            ⏱️ {formatTime(time)}
          </div>
        </div>

        {/* Score */}
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="text-yellow-400 font-bold text-xl" style={{ textShadow: '0 0 10px #ffd700' }}>
            🪙 {score}
          </div>
        </div>

        {/* High Score */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="text-green-400 font-mono text-sm" style={{ textShadow: '0 0 10px #00ff88' }}>
            🏆 BEST: {highScore}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="rounded-xl shadow-2xl border-4 border-purple-500"
          style={{
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.3)',
          }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 rounded-xl">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 mb-4" style={{ textShadow: '0 0 30px rgba(0, 255, 136, 0.5)' }}>
              🏃 Speed Runner
            </h1>
            <p className="text-gray-300 mb-2 text-center px-4">
              Collect coins, avoid obstacles, survive!
            </p>
            <p className="text-gray-400 mb-8 text-sm">
              Controls: SPACE / UP / W to jump
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold text-xl rounded-full hover:from-green-400 hover:to-cyan-400 transform hover:scale-105 transition-all duration-200"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
            >
              🎮 Start Game
            </button>
            {highScore > 0 && (
              <p className="mt-4 text-yellow-400" style={{ textShadow: '0 0 10px #ffd700' }}>
                Your Best: {highScore} coins
              </p>
            )}
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 rounded-xl">
            <h2 className="text-4xl font-bold text-red-500 mb-4" style={{ textShadow: '0 0 20px rgba(255, 51, 102, 0.5)' }}>
              💀 Game Over!
            </h2>
            {isNewHighScore && (
              <p className="text-yellow-400 text-2xl mb-2 animate-pulse" style={{ textShadow: '0 0 15px #ffd700' }}>
                🎉 NEW HIGH SCORE! 🎉
              </p>
            )}
            <div className="text-white mb-2">
              <span className="text-cyan-400">⏱️ Time: </span>
              <span className="font-mono">{formatTime(time)}</span>
            </div>
            <div className="text-white mb-8">
              <span className="text-yellow-400">🪙 Coins: </span>
              <span className="font-bold text-xl">{score}</span>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold text-xl rounded-full hover:from-green-400 hover:to-cyan-400 transform hover:scale-105 transition-all duration-200"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 flex gap-4">
        <button
          onTouchStart={() => keysRef.current.add(' ')}
          onTouchEnd={() => keysRef.current.delete(' ')}
          onMouseDown={() => keysRef.current.add(' ')}
          onMouseUp={() => keysRef.current.delete(' ')}
          onMouseLeave={() => keysRef.current.delete(' ')}
          className="w-20 h-20 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full text-3xl font-bold text-white shadow-lg active:scale-95 transition-transform"
          style={{ boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)' }}
        >
          ⬆️
        </button>
      </div>

      <p className="text-gray-500 mt-4 text-sm">
        🔊 Sound effects enabled | 💾 High score saved locally
      </p>
    </div>
  );
}