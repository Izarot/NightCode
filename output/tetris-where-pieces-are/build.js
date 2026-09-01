// Simple bundler: concatenates src files in dependency order
import fs from 'fs';
import path from 'path';

const order = [
  'src/utils/Storage.js',
  'src/utils/Grid.js',
  'src/utils/Collision.js',
  'src/pieces/TetrominoDefinitions.js',
  'src/pieces/RotationSRS.js',
  'src/pieces/PieceFactory.js',
  'src/core/Audio.js',
  'src/core/Input.js',
  'src/core/Renderer.js',
  'src/ui/Hud.js',
  'src/core/GameEngine.js',
  'src/main.js'
];

let bundle = '// Cubetris bundle - auto-generated\n';
for (const file of order) {
  const content = fs.readFileSync(file, 'utf-8');
  bundle += `\n// ===== ${file} =====\n${content}\n`;
}

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/bundle.js', bundle);
console.log('Bundle created: dist/bundle.js (' + bundle.length + ' bytes)');
