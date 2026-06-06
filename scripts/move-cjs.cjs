const fs = require('fs');
const path = require('path');

const distCjsPath = path.resolve(__dirname, '../dist-cjs');
const distPath = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Move .js files from dist-cjs to dist and rename to .cjs
fs.readdirSync(distCjsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const srcPath = path.join(distCjsPath, file);
    const destPath = path.join(distPath, file.replace('.js', '.cjs'));
    fs.renameSync(srcPath, destPath);
  } else if (file.endsWith('.map')) {
    // Move source maps as well
    const srcPath = path.join(distCjsPath, file);
    const destPath = path.join(distPath, file.replace('.js.map', '.cjs.map'));
    fs.renameSync(srcPath, destPath);
  }
});

// Remove the temporary dist-cjs directory
fs.rmSync(distCjsPath, { recursive: true, force: true });
