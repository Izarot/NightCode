// Entities module for NEXUS INFILTRATOR
export function initEntities(ctx, gameState, physics, hacking) {
  const player = {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    velX: 0,
    velY: 0,
    onGround: false,
    canJump: true,
    wallSliding: false,
    touchingWall: false,
    dashing: false,
    dashDirection: 0,
    dashTimer: 0,
    dashReady: true,
    dashCooldownTimer: 0,
    color: '#00ffff',
    health: 100,
    energy: 100
  };

  gameState.player = player;

  const platforms = [
    { x: 0, y: 500, width: 800, height: 20 },
    { x: 200, y: 400, width: 100, height: 20 },
    { x: 400, y: 300, width: 100, height: 20 }
  ];

  const collectibles = [
    { x: 250, y: 370, width: 16, height: 16, collected: false },
    { x: 450, y: 270, width: 16, height: 16, collected: false }
  ];

  return {
    update: (delta, keys) => {
      // Player movement
      if (keys['ArrowLeft'] || keys['KeyA']) {
        physics.accelerate(player, -1, delta);
      } else if (keys['ArrowRight'] || keys['KeyD']) {
        physics.accelerate(player, 1, delta);
      } else {
        physics.decelerate(player, delta);
      }

      // Jump
      if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
        if (physics.jump(player)) {
          // Play jump sound
        }
      }

      // Dash
      if (keys['ShiftLeft'] || keys['ShiftRight']) {
        let dir = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) dir = -1;
        if (keys['ArrowRight'] || keys['KeyD']) dir = 1;
        if (dir !== 0) {
          physics.dash(player, dir);
        }
      }

      // Apply physics
      physics.applyGravity(player, delta);

      // Update position
      player.x += player.velX * delta;
      player.y += player.velY * delta;

      // Collision detection
      player.onGround = false;
      player.touchingWall = false;

      for (const platform of platforms) {
        if (player.y + player.height > platform.y &&
            player.y < platform.y + platform.height &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width) {
          if (player.velY > 0) {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.onGround = true;
            player.canJump = true;
          }
        }
      }

      // Collectibles
      for (const item of collectibles) {
        if (!item.collected &&
            player.x + player.width > item.x &&
            player.x < item.x + item.width &&
            player.y + player.height > item.y &&
            player.y < item.y + item.height) {
          item.collected = true;
          gameState.score += 100;
        }
      }

      // Update physics state
      physics.update(delta, gameState);
    },
    render: () => {
      // Draw platforms
      ctx.fillStyle = '#00aaaa';
      for (const platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }

      // Draw collectibles
      for (const item of collectibles) {
        if (!item.collected) {
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(item.x, item.y, item.width, item.height);
        }
      }

      // Draw player
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Draw player glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;
    }
  };
}
