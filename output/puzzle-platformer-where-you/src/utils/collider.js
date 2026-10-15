export function checkAABB(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

export function resolveCollision(player, platform) {
    const playerBottom = player.y + player.height;
    const playerTop = player.y;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;

    let dx = 0;
    let dy = 0;

    if (playerBottom > platformTop && playerTop < platformBottom && playerRight > platformLeft && playerLeft < platformRight) {
        const overlapTop = playerBottom - platformTop;
        const overlapBottom = platformBottom - playerTop;
        const overlapLeft = playerRight - platformLeft;
        const overlapRight = platformRight - playerLeft;

        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
        if (minOverlap === overlapTop) {
            dy = -overlapTop;
        } else if (minOverlap === overlapBottom) {
            dy = overlapBottom;
        } else if (minOverlap === overlapLeft) {
            dx = -overlapLeft;
        } else if (minOverlap === overlapRight) {
            dx = overlapRight;
        }
    }

    return { dx, dy };
}
