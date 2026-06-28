const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');
const copies = ['index.html', 'dist', 'examples', 'docs'];

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

copies.forEach(function(name) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, path.join(out, name), { recursive: true });
});

console.log('Wrote public/ for Vercel');
