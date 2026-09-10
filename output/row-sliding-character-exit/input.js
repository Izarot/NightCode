const Input = (() => {
  const state = { left: false, right: false, pause: false, justPaused: false };
  function keydown(e) {
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') state.left=true;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') state.right=true;
    if(e.key===' ') { e.preventDefault(); state.justPaused = true; }
  }
  function keyup(e) {
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') state.left=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') state.right=false;
  }
  function touchStart(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    if(x < rect.width/2) state.left = true; else state.right = true;
  }
  function touchEnd(e) { state.left = false; state.right = false; }
  function touchMove(e) { e.preventDefault(); }
  let canvas;
  function init(c) { canvas = c; window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); canvas.addEventListener('touchstart', touchStart, {passive:false}); canvas.addEventListener('touchend', touchEnd); canvas.addEventListener('touchmove', touchMove, {passive:false}); }
  function poll() { const p = state.justPaused; state.justPaused = false; return { left: state.left, right: state.right, pause: p }; }
  return { init, poll };
})();