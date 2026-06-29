const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { Window } = require('happy-dom');

function bootPax(html, register) {
  const window = new Window();
  const document = window.document;
  document.write('<!DOCTYPE html><html><head></head><body>' + html + '</body></html>');
  const code = fs.readFileSync(path.join(__dirname, '../dist/pax.js'), 'utf8');
  window.eval(code);
  if (register) register(window.pax);
  window.pax.init();
  return window;
}

const pkg = require('../package.json');

test('pax.version is set', () => {
  const window = bootPax('');
  assert.strictEqual(window.pax.version, pkg.version);
});

test('bind set updates text', () => {
  const window = bootPax(
    '<div app="home"><h1 bind="title"></h1></div>',
    function(pax) {
      pax.app('home', { data: { title: 'Hello' } });
    }
  );
  const el = window.document.querySelector('[bind="title"]');
  assert.strictEqual(el.textContent, 'Hello');
  window.pax.home.set('title', 'Updated');
  assert.strictEqual(el.textContent, 'Updated');
});

test('push appends list row without replacing first row', () => {
  const window = bootPax(
    '<div app="home"><ul bind="items"></ul></div>',
    function(pax) {
      pax.app('home', { data: { items: ['One'] } });
    }
  );
  const ul = window.document.querySelector('ul');
  const first = ul.children[0];
  window.pax.home.push('items', 'Two');
  assert.strictEqual(ul.children.length, 2);
  assert.strictEqual(ul.children[0], first);
  assert.strictEqual(ul.children[1].textContent, 'Two');
});

test('pop removes list row', () => {
  const window = bootPax(
    '<div app="home"><ul bind="items"></ul></div>',
    function(pax) {
      pax.app('home', { data: { items: ['One', 'Two'] } });
    }
  );
  const ul = window.document.querySelector('ul');
  window.pax.home.pop('items', 0);
  assert.strictEqual(ul.children.length, 1);
  assert.strictEqual(ul.children[0].textContent, 'Two');
});

test('show directive toggles visibility', () => {
  const window = bootPax(
    '<div app="home"><p id="msg" show="!items.length">Empty</p><ul bind="items"></ul></div>',
    function(pax) {
      pax.app('home', { data: { items: [] } });
    }
  );
  const msg = window.document.getElementById('msg');
  assert.notStrictEqual(msg.style.display, 'none');
  window.pax.home.push('items', 'A');
  assert.strictEqual(msg.style.display, 'none');
});

test('getVals returns app values', () => {
  const window = bootPax(
    '<div app="home"><input bind="name" type="text" value="Ann" /></div>',
    function(pax) {
      pax.app('home', { data: { name: 'Ann' } });
    }
  );
  const vals = window.pax.getVals('home', ['name']);
  assert.strictEqual(vals.name, 'Ann');
});

test('load error hook still boots app', async () => {
  const window = bootPax('<div app="home"></div>', function(pax) {
    pax.app('home', {
      load: {
        bad: {
          url: 'https://example.invalid/pax-test-404',
          error: function() {
            this.data.msg = 'fail';
          }
        }
      },
      template: '<p>{{this.msg}}</p>'
    });
  });
  await new Promise(function(resolve) { setTimeout(resolve, 800); });
  assert.strictEqual(window.document.querySelector('div[app="home"]').textContent, 'fail');
});
