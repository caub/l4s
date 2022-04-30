const fs = require('fs');


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

        ${process.env.NODE_ENV === 'production' ? '<script></script>' : ''}

        ${cssFileName ? `<link rel="preload" as="style" href="${'/static/' + cssFileName}" />
<link rel="stylesheet" href="${'/static/' + cssFileName}" />` : ''}
      </head>

      <body>
        <div id="app">${children}</div>

        ${req.query.edit !== undefined ? `<script type="application/json">${JSON.stringify(content)}</script>
<script type="importmap">
{
  "imports": {
    "preact": "/node_modules/preact/dist/preact.module.js"
  }
}
</script>
<script type="module" src="/static/editor.js"></script>` : ''}
      </body>
    </html>`
  );
}
