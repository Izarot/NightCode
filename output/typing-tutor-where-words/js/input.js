// Input handling and game logic
let inputBuffer = '';
let score = 0;
let combo = 1;
let lives = 3;
let strikes = 0;
let totalKeys = 0;
let correctKeys = 0;
let lastActiveWord = null;
function initInput() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            return;
        }
        if (e.key.length !== 1) return; // Only single characters
        const key = e.key.toUpperCase();
        totalKeys++;
        // Find active word or first word starting with key
        let targetWord = words.find(w => w.active && w.typed < w.text.length && w.text[w.typed] === key);
        if (!targetWord) {
            targetWord = words.find(w => w.typed === 0 && w.text[0] === key);
            if (targetWord) {
                targetWord.active = true;
                lastActiveWord = targetWord;
            }
        }
        if (targetWord) {
            targetWord.typed++;
            correctKeys++;
            soundCorrect();
            if (targetWord.typed === targetWord.text.length) {
                // Word destroyed
                score += targetWord.text.length * 10 * combo;
                combo++;
                updateHUD();
                explodeParticles(targetWord.x, targetWord.y, '#00F0FF');
                soundWordDestroy();
                targetWord.active = false;
                words.splice(words.indexOf(targetWord), 1);
            }
        } else {
            // Strike
            strikes++;
            combo = 1;
            triggerScreenShake();
            soundStrike();
            document.body.style.background = '#FF0055';
            setTimeout(() => document.body.style.background = '#0B0C2A', 100);
            if (strikes >= 3) {
                gameOver();
            }
        }
        updateHUD();
    });
}
function updateHUD() {
    document.getElementById('score').textContent = 'SCORE: ' + score;
    document.getElementById('combo').textContent = 'COMBO: x' + combo;
    document.getElementById('lives').textContent = 'LIVES: ' + '●'.repeat(lives);
    const acc = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;
    document.getElementById('accuracy').textContent = 'ACC: ' + acc + '%';
    const accEl = document.getElementById('accuracy');
    if (acc > 90) accEl.style.color = '#00FF00';
    else if (acc > 70) accEl.style.color = '#F2FF00';
    else accEl.style.color = '#FF0055';
}
function loseLife() {
    lives--;
    if (lives <= 0) gameOver();
    updateHUD();
}
function gameOver() {
    // Save high score
    const highScore = localStorage.getItem('skyTyperHighScore') || 0;
    if (score > highScore) localStorage.setItem('skyTyperHighScore', score);
    alert('GAME OVER\nScore: ' + score + '\nHigh Score: ' + highScore);
    location.reload();
}