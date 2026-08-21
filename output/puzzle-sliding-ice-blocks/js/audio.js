const ctx = new (window.AudioContext || window.webkitAudioContext)();
const buffers = {};
export async function loadAudio(name,url){
  const resp = await fetch(url);
  const array = await resp.arrayBuffer();
  buffers[name] = await ctx.decodeAudioData(array);
}
export function playSound(name){
  const source = ctx.createBufferSource();
  source.buffer = buffers[name];
  source.connect(ctx.destination);
  source.start();
}
// Preload sounds
loadAudio('move','assets/sounds/move.wav');
loadAudio('complete','assets/sounds/ping.wav');
