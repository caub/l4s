require('dotenv/config');
const express = require('express');
const { h, render } = require('preact');
const babel = require('@babel/core');
const fs = require('fs');
const basicAuth = require('basic-auth');
const compression = require('compression');
const contents = require('./contents');
const layout =  require('./layout');
const b2 = require('./b2');
require('@babel/register')({
  only: [`${__dirname}/components`],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'h',
      pragmaFrag: 'Fragment',
    }]
  ]
});
const { default: Block } = require('./components/block');
const { default: App } = require('./components/app');


process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log('IMPORTANT', origin, err);
});

const app = express().disable('x-powered-by');

app.get('/healthz', (req, res) => res.end());

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => { // https redirect
    const protocol = req.headers['x-forwarded-proto'];
    if (protocol && protocol !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
  app.use(compression());
}

app.use('/static', express.static(__dirname + '/public', process.env.NODE_ENV === 'production' && {
  redirect: false,
  index: false,
  maxAge: '30d',
}));
app.use('/static', express.static(__dirname + '/assets', process.env.NODE_ENV === 'production' && {
  immutable: true,
  redirect: false,
  index: false,
  maxAge: '30d',
}));
app.get('/nde_modules',
  (req, res, next) => req.query.edit !== undefined ? next() : res.status(404).end(),
  express.static(__dirname + '/components'),
  express.static(__dirname + '/pages'),
);
app.get('/modules/*', (req, res) => {
  if (req.query.edit === undefined) return res.status(404).end();
  // TODO validate path / security

  req.set('Content-Type', 'text/javascript');

  babel.transformFileAsync(req.url.slice(8), {
    plugins: [
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'h',
        pragmaFrag: 'Fragment',
      }]
    ]
  })
    .then(({ code }) => res.send(code))
    .catch(err => {
      console.error(err);
      res.send(err.message);
    });
});

// TODO fix
app.use('/bootstrap-icons.woff2', express.static(__dirname + '/assets', { index: '/bootstrap-icons.woff2' }));
app.use('/bootstrap-icons.woff', express.static(__dirname + '/assets', { index: '/bootstrap-icons.woff' }));

app.use(require('express-request-language')({
  languages: ['fr', 'en'],
  queryName: 'lang',
}));

function checkAuth(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();

  const credentials = basicAuth(req);
  if (credentials && `${credentials.name}:${credentials.pass}` === process.env.ADMIN_CREDS) return next();

  res.header('WWW-Authenticate', 'Basic realm=""');
  res.sendStatus(401);
}
app.use((req, res, next) => {
  if (req.query.edit !== undefined && process.env.NODE_ENV === 'production') {
    const credentials = basicAuth(req);
    if (`${credentials?.name}:${credentials?.pass}` !== process.env.ADMIN_CREDS) {
      res.header('WWW-Authenticate', 'Basic realm=""');
      res.sendStatus(401);
    }
  }
  next();
});

app.route('/api/contents')
  .all(express.json({ limit: '500kb' }))
  .patch((req, res) => {
    contents.update(req.language || 'en', req.body)
      .then(() => res.end())
      .catch(err => res.status(400).json({ error: err }));
  });
app.route('/api/upload')
  .post(async (req, res) => {
    if (!req.query.name) return res.status(400).json({ error: 'Missing file name' });
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
      if (chunks.reduce((a, c) => a + c.length, 0) > 2_048_000) {
        return res.status(400).json({ error: 'File too large (>2MB)' });
      }
    }
    b2.upload({ body: Buffer.concat(chunks), name: req.query.name, type: req.headers['content-type'] })
      .then((url) => res.json({ url }))
      .catch(err => {console.error(err); res.status(400).json({ error: err }); });
  });

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  next();
});

async function renderPage(path, req) {
  const { default: Page } = require(`./components/_${path}.js`);
  const content = await contents.load(req.language, ['common', path]);
  const cms = new Block({ content, editMode: req.query.edit !== undefined });
  const meta = cms.get(`${path}.meta`);

  const app = h(App, { cms },
    h(Page, { cms: cms.block(path) })
  );

  return layout({
    req,
    path,
    ...meta, // title, description, image
    children: render(app),
    content,
  });
}

// regular pages
app.get('*', async function (req, res, next) {
  const path = req.url.slice(1).split('?', 1)[0].replace(/\/$/, '') || 'index'; // trim leading / and trailing /
  const found = fs.existsSync(`./pages/${path}.js`);

  if (!found) return next();

  try {
    res.send(await renderPage(path, req));
  } catch (err) {
    next(err);
  }
});

// 404's
app.use(async function (req, res, next) {
  try {
    res.status(404).send(await renderPage('_notFound', req));
  } catch (err) {
    next(err);
  }
});

// error handler
app.use(async function (err, req, res, next) {
  try {
    console.error('ERR', err);
    res.status(500).send(await renderPage('_error', req));
  } catch (err) {
    console.error(err);
  }
});

const server = app.listen(process.env.PORT || 3000);

server.on('close', () => {
  console.log('closing server');
});

