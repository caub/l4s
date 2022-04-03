const express = require('express');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const fs = require('fs');
const basicAuth = require('basic-auth');
const compression = require('compression');
const content = require('./content');
require('@babel/register')({ only: [`${__dirname}/components`, `${__dirname}/pages`] }); // uses .babelrc

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

app.use(require('express-request-language')({
  languages: ['fr', 'en'],
  queryName: 'lang',
}));


app.use('/api', express.json({ limit: '500kb' }), (req, res, next) => {
  const credentials = basicAuth(req);
  if (process.env.NODE_ENV !== 'production' || `${credentials.name}:${credentials.pass}` === process.env.ADMIN_CREDS) {
    return next();
  }
  res.header('WWW-Authenticate', 'Basic realm=""');
  res.sendStatus(401);
});
app.route('/api/content')
  .patch((req, res) => {
    content.update(req.language || 'en', req.body)
      .then(() => res.end())
      .catch(err => res.status(400).json({ error: err }));
  });

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  next();
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log('IMPORTANT', origin, err);
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
    res.status(500).send(await renderPage('_error', { status: 500, err, req }));
  } catch (err) {
    console.error(err);
  }
});

const server = app.listen(process.env.PORT || 3000);

server.on('close', () => {
  console.log('closing server');
});

