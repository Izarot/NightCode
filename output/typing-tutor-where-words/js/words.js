// Word management and spawning
const words = [];
const wordList = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'DAD', 'MOM', 'RUN', 'FUN', 'SUN', 'BAT', 'CAT', 'HAT', 'MAT', 'RAT', 'SAT', 'EAT', 'DRINK', 'FLY', 'SWIM', 'JUMP', 'CLIMB', 'WALK', 'TALK', 'PLAY', 'WORK', 'HELP', 'GOOD', 'GAME', 'SKY', 'TYPE', 'FAST', 'SLOW', 'BIG', 'SMALL', 'HIGH', 'LOW'];
let spawnTimer = 0;
let spawnInterval = 2000; // ms
let currentWave = 0;
let fallSpeed = 0.15;
let wordLengthRange = [3, 4];
function spawnWord() {
    const len = Math.floor(Math.random() * (wordLengthRange[1] - wordLengthRange[0] + 1)) + wordLengthRange[0];
    let word = '';
    for (let i = 0; i < len; i++) {
        word += wordList[Math.floor(Math.random() * wordList.length)].charAt(Math.floor(Math.random() * wordList.length));
    }
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = -20;
    words.push({ text: word, x, y, typed: 0, active: false });
}
function updateWords(dt) {
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
        spawnWord();
        spawnTimer = 0;
    }
    words.forEach(w => {
        w.y += fallSpeed * dt * 60;
        w.x += Math.sin(w.y * 0.01) * 0.5;
    });
    // Remove words that reach bottom
    for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].y > canvas.height) {
            words.splice(i, 1);
            // Penalty: lose a life
            loseLife();
        }
    }
    // Wave progression
    currentWave += dt;
    if (currentWave > 30000) {
        currentWave = 0;
        fallSpeed *= 1.15;
        spawnInterval /= 2;
        wordLengthRange = [5, 6];
        soundWaveBreach();
    }
}