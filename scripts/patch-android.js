// Roda depois de "cap add android". Ajusta o projeto Android gerado:
//  - permissões de notificação e alarme exato no AndroidManifest
//  - targetSdk 34 (evita o modo tela-cheia forçado do Android 15, que cobriria o topo do app)
//  - número de versão crescente (para atualizar o app sem desinstalar)
//  - ícones do app e ícone das notificações
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const android = path.join(root, 'android');
if (!fs.existsSync(android)) {
  console.error('Pasta android/ não encontrada. Rode "npx cap add android" antes.');
  process.exit(1);
}

// 1) Manifest -------------------------------------------------------------
const manifestPath = path.join(android, 'app/src/main/AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
const perms = [
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.WAKE_LOCK" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
];
const missing = perms.filter(function (p) {
  const name = p.match(/android:name="([^"]+)"/)[1];
  return manifest.indexOf(name) === -1;
});
if (missing.length) {
  manifest = manifest.replace('<application', missing.join('\n    ') + '\n\n    <application');
  fs.writeFileSync(manifestPath, manifest);
}

// 2) targetSdk ------------------------------------------------------------
const varsPath = path.join(android, 'variables.gradle');
if (fs.existsSync(varsPath)) {
  let v = fs.readFileSync(varsPath, 'utf8');
  v = v.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 34');
  fs.writeFileSync(varsPath, v);
}

// 3) versionCode / versionName -------------------------------------------
const gradlePath = path.join(android, 'app/build.gradle');
let g = fs.readFileSync(gradlePath, 'utf8');
const run = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + run);
g = g.replace(/versionName\s+"[^"]*"/, 'versionName "1.0.' + run + '"');
fs.writeFileSync(gradlePath, g);

// 4) ícones ---------------------------------------------------------------
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(function (e) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  });
}
copyDir(path.join(root, 'resources/android/res'), path.join(android, 'app/src/main/res'));

console.log('Projeto Android ajustado (versionCode ' + run + ').');
