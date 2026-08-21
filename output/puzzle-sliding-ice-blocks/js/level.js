export async function loadLevel(num){
  const res = await fetch(`levels/level${num}.json`);
  return res.json();
}
