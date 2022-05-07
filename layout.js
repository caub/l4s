const fs = require('fs');
const { getCssText } = require('./stitches.config');

const cssFileName = fs.readdirSync(__dirname + '/assets').find(n => n.endsWith('.css'));


module.exports = function Html({
  req,
  path,
  title = 'Not found',
  description,
  image = '/static/logo.jpg',
  children,
  content,
}) {
  const canonicalUrl = `${process.env.SERVER_URL || ''}/${path}${req.query.lang && req.query.lang !== 'fr' ? '?lang=' + req.query.lang : ''}`;

  return (
    `<!DOCTYPE html><html lang="${req.language}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
        <title>${title}</title>

        <link rel="canonical" href="${canonicalUrl}" />
        <meta name="description" content="${description}" />
        <meta name="referrer" content="unsafe-url" />

        <meta name="og:title" content="${title}" />
        <meta name="og:description" content="${description}" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta name="og:image" content="${image}" />
        
        <meta property="og:site_name" content="Les 4 saisons" />
        <meta property="og:type" content="website" />

        <link rel="icon" href="/static/icon.png" />

        ${cssFileName ? `<link rel="preload" as="style" href="${'/static/' + cssFileName}" />
<link rel="stylesheet" href="${'/static/' + cssFileName}" />` : ''}

        ${req.query.edit !== undefined ? '' : `<style id="stitches">${getCssText()}</style>`}
      </head>

      <body>
        <div id="app">${req.query.edit !== undefined ? '' : children}</div>

        <script type="importmap">
        {
          "imports": {
            "@stitches/react": "/modules/@stitches/react/dist/index.mjs",
            "lodash-es": "/modules/lodash-es/lodash.js",
            "marked": "/modules/marked/lib/marked.esm.js",
            "preact": "/modules/preact/dist/preact.module.js",
            "preact/hooks": "/modules/preact/hooks/dist/hooks.module.js",
            "react": "/modules/preact/compat/dist/compat.module.js"
          }
        }
        </script>

        ${req.query.edit !== undefined ? `<script type="application/json" id="__content">${JSON.stringify(content || {})}</script>
<script type="module">
import { h, render } from 'preact';
import Editor from './components/editor.js';

render(h(Editor, {path: '${path}'}), document.getElementById('app'));
</script>` : ''}
      </body>
    </html>`
  );
}
