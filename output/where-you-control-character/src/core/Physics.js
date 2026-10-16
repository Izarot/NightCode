export class Physics {
    static checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static checkCircleRect(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width/2);
        const distY = Math.abs(circle.y - rect.y - rect.height/2);
        
        if (distX > (rect.width/2 + circle.radius)) return false;
        if (distY > (rect.height/2 + circle.radius)) return false;
        
        if (distX <= (rect.width/2)) return true;
        if (distY <= (rect.height/2)) return true;
        
        const dx = distX - rect.width/2;
        const dy = distY - rect.height/2;
        return (dx*dx + dy*dy) <= (circle.radius*circle.radius);
    }

    static checkCircleCircle(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distSq = dx*dx + dy*dy;
        const radiusSum = c1.radius + c2.radius;
        return distSq <= radiusSum * radiusSum;
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }
}