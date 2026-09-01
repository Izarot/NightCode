const Modals = {
  show(title, body, onClose) {
    const m = document.getElementById('modal');
    m.innerHTML = `<div class="modal-box"><h2 style="color:var(--accent)">${title}</h2><p>${body}</p><button class="btn ok" onclick="Modals.hide();${onClose || ''}">OK</button></div>`;
    m.classList.remove('hidden');
  },
  hide() { document.getElementById('modal').classList.add('hidden'); },
  news(msg) {
    const n = document.createElement('div');
    n.className = 'news';
    n.style.cssText = 'position:absolute;top:60px;right:10px;background:var(--panel);padding:.5em 1em;border-left:3px solid var(--accent);border-radius:4px;z-index:15;font-size:.85em;';
    n.textContent = msg;
    document.getElementById('app').appendChild(n);
    Audio.alert();
    setTimeout(() => n.remove(), 3500);
  }
};
