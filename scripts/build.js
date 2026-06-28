const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/pax.js'), 'utf8');

fs.writeFileSync(path.join(root, 'dist/pax.js'), src);

const esm = src.replace(
  /var _pax = new \$pax\(\);\nvar pax = _pax\._view\(\);\nvar app = _pax\.apps;\nwindow\.addEventListener\('DOMContentLoaded', function\(\) \{\n  pax\.init\(\);\n\}\);/,
  `var _pax = new $pax();
var pax = _pax._view();
var app = _pax.apps;
function paxReady() { pax.init(); }
if (typeof window !== 'undefined') {
  window.pax = pax;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', paxReady);
  } else {
    paxReady();
  }
}
export default pax;
export { pax };`
);

fs.writeFileSync(path.join(root, 'dist/pax.esm.js'), esm);

async function minifyFile(input, output) {
  const result = await minify(fs.readFileSync(input, 'utf8'), { compress: true, mangle: true });
  fs.writeFileSync(output, result.code);
}

(async function() {
  await minifyFile(path.join(root, 'dist/pax.js'), path.join(root, 'dist/pax.min.js'));
  await minifyFile(path.join(root, 'dist/pax.esm.js'), path.join(root, 'dist/pax.esm.min.js'));
  console.log('Built dist/pax.js, dist/pax.min.js, dist/pax.esm.js, dist/pax.esm.min.js');
})();
