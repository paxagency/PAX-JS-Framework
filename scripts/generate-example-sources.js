const fs = require('fs');
const path = require('path');

const files = [
  'hello.html', 'change.html', 'data.html', 'todoBasic.html', 'todo.html',
  'todoAdvanced.html', 'load.html', 'depends.html', 'tables.html',
  'parentChild.html', 'parentChildInstances.html', 'routing.html',
  'routingAutomated.html', 'nav.html'
];

let out = 'window.PAX_EXAMPLE_SOURCES={\n';
files.forEach(function(f) {
  const src = fs.readFileSync(path.join(__dirname, '../examples', f), 'utf8');
  out += JSON.stringify(f) + ':' + JSON.stringify(src) + ',\n';
});
out += '};\n';

const dest = path.join(__dirname, '../docs/example-sources.js');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log('Wrote ' + dest);
