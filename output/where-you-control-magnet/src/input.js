export function initInput(canvas) {
    const input = {
        keys: new Set(),
        mouse: { x: null, y: null }
    };
    
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        input.keys.add(e.code);
        e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
        input.keys.delete(e.code);
    });
    
    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        input.mouse.x = e.clientX - rect.left;
        input.mouse.y = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mouseleave', () => {
        input.mouse.x = null;
        input.mouse.y = null;
    });
    
    // Touch events for mobile
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        input.mouse.x = touch.clientX - rect.left;
        input.mouse.y = touch.clientY - rect.top;
    }, { passive: false });
    
    return input;
}