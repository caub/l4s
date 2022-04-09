require('dotenv/config');
const express = require('express');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fs = require('fs');
const basicAuth = require('basic-auth');
const compression = require('compression');
const content = require('./content');
const b2 = require('./b2');
require('@babel/register')({ only: [`${__dirname}/components`, `${__dirname}/pages`] }); // uses .babelrc


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

// TODO fix
app.use('/bootstrap-icons.woff2', express.static(__dirname + '/assets', {index: '/bootstrap-icons.woff2'}));
app.use('/bootstrap-icons.woff', express.static(__dirname + '/assets', {index: '/bootstrap-icons.woff'}));

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

app.route('/api/content')
  .all(express.json({ limit: '500kb' }))
  .patch((req, res) => {
    content.update(req.language || 'en', req.body)
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
    b2.upload({body: Buffer.concat(chunks), name: req.query.name, type: req.headers['content-type']})
      .then((url) => res.json({ url }))
      .catch(err => {console.error(err); res.status(400).json({ error: err }); });
  });

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  next();
});

async function renderPage(page, params) {
  const component = require(`./pages/${page}`);
  const componentProps = await component.getServerSideProps?.(params);

  if (componentProps === null) return null; // used for 404's

  const app = React.createElement(component.default, { ...params, ...componentProps });

  return `<!DOCTYPE html>${renderToStaticMarkup(app)}`;
}

// regular pages
app.get('*', async function (req, res, next) {
  const path = req.url.slice(1).split('?', 1)[0].replace(/\/$/, ''); // trim leading / and trailing /
  const found = fs.existsSync(`./pages/${path || 'index'}.js`);

  if (!found) return next();

  const canonicalUrl = `/${path}${req.query.lang && req.query.lang !== 'en' ? '?lang=' + req.query.lang : ''}`;

  try {
    res.send(await renderPage(path, { req, canonicalUrl }));
  } catch (err) {
    next(err);
  }
});

// 404's
app.use(async function (req, res, next) {
  try {
    res.status(404).send(await renderPage('_error', { status: 404, req }));
  } catch (err) {
    next(err);
  }
});

// error handler
app.use(async function (err, req, res, next) {
  try {
    console.error('ERR', err);
    res.status(500).send(await renderPage('_error', { status: 500, err, req }));
  } catch (err) {
    console.error(err);
  }
});

const server = app.listen(process.env.PORT || 3000);

server.on('close', () => {
  console.log('closing server');
});

