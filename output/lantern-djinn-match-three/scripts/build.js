// Build automation script
import fs from 'fs';
const build = () => {
  console.log('Building Reaction Master...');
  if (!fs.existsSync('dist')) { fs.mkdirSync('dist'); }
  const filesToCopy = ['index.html', 'README.md'];
  const dirsToCopy = ['config', 'src', 'scripts'];
  filesToCopy.forEach(file => { if (fs.existsSync(file)) { fs.copyFileSync(file, 'dist/' + file); console.log('Copied ' + file); } });
  dirsToCopy.forEach(dir => { if (fs.existsSync(dir)) { fs.cpSync(dir, 'dist/' + dir, { recursive: true }); console.log('Copied ' + dir + '/'); } });
  console.log('Build complete!');
};
build();
