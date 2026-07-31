function showResult(won) {
  const overlay = document.createElement('div');
  overlay.id = 'resultOverlay';
  overlay.innerHTML = won
    ? `<h1>Victory!</h1><p>Score: ${hud.score}</p><p>Stars: ★★★</p>`
    : `<h1>Defeat</h1><p>Score: ${hud.score}</p><p>Stars: ★★</p>`;
  document.body.appendChild(overlay);
}