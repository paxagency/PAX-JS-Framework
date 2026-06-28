# PAX JS Framework

Micro, HTML-first JavaScript framework — binding, routing, ajax, no build step.

**[Full documentation →](index.html)** · [npm](https://www.npmjs.com/package/pax-js-framework) · MIT License

## Quick start

```html
<div app="home">
  <h1 bind="title"></h1>
  <ul bind="items"></ul>
  <button onclick="pax.home.add()">Add</button>
</div>
<script src="dist/pax.js"></script>
<script>
  pax.app('home', {
    data: { title: 'My List', items: [] },
    add: function() { this.push('items', 'New item'); }
  });
</script>
```

1. Include `dist/pax.js` (or `dist/pax.min.js` for production)
2. Mark HTML with `app="name"` and `bind="field"`
3. Register with `pax.app('name', { … })`

## Install

```bash
npm install pax-js-framework
```

```html
<script src="node_modules/pax-js-framework/dist/pax.min.js"></script>
```

ES module:

```javascript
import pax from 'pax-js-framework/dist/pax.esm.js';
```

## Develop

```bash
npm install
npm test          # build + smoke tests
npm run build     # src → dist (js, min, esm)
npm run docs:sources   # refresh embedded example code in index.html
```

## Run docs & examples locally

```bash
python3 -m http.server 8080
# http://localhost:8080/          — documentation
# http://localhost:8080/examples/hello.html
```

## Deploy docs on Vercel

The repo includes `vercel.json`. Vercel serves the `public/` folder, which is generated at build time from `index.html`, `dist/`, `examples/`, and `docs/`.

1. Import the GitHub repo in [Vercel](https://vercel.com)
2. Framework preset: **Other** (or let `vercel.json` drive the build)
3. Deploy — build runs `npm run vercel-build`, output is `public/`

Locally preview the Vercel output:

```bash
npm run vercel-build
python3 -m http.server 8080 --directory public
```

## Documentation

See **[index.html](index.html)** for the full guide: binding, lists, templates, `show`/`hide`/`attr:`, lifecycle, ajax, routing, and live examples.

## Changelog

See [CHANGELOG.md](CHANGELOG.md). **1.0.0** — stable release with directives, incremental list updates, tests, and ESM/types support.
