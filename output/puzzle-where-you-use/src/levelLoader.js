export async function loadLevel(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Failed to load level ' + path);
  return await response.json();
}