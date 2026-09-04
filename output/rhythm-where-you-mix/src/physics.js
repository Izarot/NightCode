// Physics calculations for obstacle movement
(function() {
    const Vector2 = {
        add: function(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
        sub: function(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
        multiply: function(a, s) { return { x: a.x * s, y: a.y * s }; },
        magnitude: function(v) { return Math.sqrt(v.x * v.x + v.y * v.y); },
        normalize: function(v) {
            var mag = Vector2.magnitude(v);
            return mag > 0 ? { x: v.x / mag, y: v.y / mag } : { x: 0, y: 0 };
        }
    };

    function moveObstacle(obstacle, speed) {
        obstacle.x += obstacle.vx || speed;
        obstacle.y += obstacle.vy || 0;
        return obstacle;
    }

    function checkCollision(a, b, radius) {
        var dist = Vector2.magnitude(Vector2.sub(a, b));
        return dist < radius;
    }

    window.Vector2 = Vector2;
    window.moveObstacle = moveObstacle;
    window.checkCollision = checkCollision;
})();
