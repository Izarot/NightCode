// UI: Radial Menu, Tooltips, Pause
function sel(s){selected=s;document.querySelectorAll('.btn').forEach(b=>b.classList.remove('sel'));document.querySelector(`[onclick="sel('${s}')"]`).classList.add('sel');}
function updateHUD(){document.getElementById('wave').textContent=wave;document.getElementById('energy').textContent=energy;document.getElementById('lives').textContent='❤️'.repeat(lives);}
function updateTimer(t){document.getElementById('time').textContent=t.toFixed(2);}
function updateHS(hs){document.getElementById('hs').textContent=hs;}
let hs=localStorage.getItem('highscore')||0;
function saveHS(score){if(score>hs){hs=score;localStorage.setItem('highscore',hs);updateHS(hs);}}
