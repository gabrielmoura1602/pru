// Gera a pasta www/ que o Capacitor empacota dentro do APK:
//   src/index.html  -> www/index.html
//   src/native.js   -> www/native.js (empacotado com esbuild, inclui os plugins)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
fs.copyFileSync(path.join(root, 'src', 'index.html'), path.join(www, 'index.html'));

esbuild.buildSync({
  entryPoints: [path.join(root, 'src', 'native-bridge.js')],
  bundle: true,
  format: 'iife',
  target: 'chrome90',
  minify: true,
  outfile: path.join(www, 'native.js'),
});

console.log('www/ pronto');
