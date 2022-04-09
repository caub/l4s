import fs from 'fs';

const cssFileName = fs.readdirSync(__dirname + '/../assets').find(n => n.endsWith('.css'));

export default function Html({
  req,
  meta,
  absCanonicalUrl,
  ogImage,
  children,
}) {
  return (
    <html lang={req.language || 'en'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5" />
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
        <title>{meta?.text('title') || 'Not found'}</title>

        {absCanonicalUrl && <link rel="canonical" href={absCanonicalUrl} />}
        <meta name="description" content={meta?.text('description')} />
        <meta name="referrer" content="unsafe-url" />

        <meta name="og:title" content={meta?.text('title')} />
        <meta name="og:description" content={meta?.text('description')} />
        <meta property="og:url" content={absCanonicalUrl} />
        {ogImage && <meta name="og:image" content={ogImage} />}
        
        <meta property="og:site_name" content="Les 4 saisons" />
        <meta property="og:type" content="website" />

        <link rel="icon" href="/static/icon.png" />

        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Tag Manager */}
            <script dangerouslySetInnerHTML={{
              __html: ``
            }} />
          </>
        )}

        {cssFileName && (
          <>
            <link rel="preload" as="style" href={'/static/' + cssFileName} />
            <link rel="stylesheet" href={'/static/' + cssFileName} />
          </>
        )}
      </head>

      <body>
        {req.query.edit !== undefined && meta && (
          <meta.Object keys="title,description" help="SEO tags" />
        )}

        <div id="app">{children}</div>

        {req.query.edit !== undefined && (
          <script
            src="/static/editor.js"
            data-lang={req.language}
          />
        )}
      </body>
    </html>
  );
}
