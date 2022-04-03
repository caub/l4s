

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

        {/*        <link rel="preload" as="style" href={cssPath} />
        <link rel="stylesheet" href={cssPath} />*/}
      </head>

      <body>
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
