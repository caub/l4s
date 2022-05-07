import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { styled } from '@stitches/react';
import App from './app.js';
import Block from './block.js';
import _ from 'lodash-es';


const Container = styled('div', {
  position: 'fixed',
  right: 0,
  bottom: 0,
});


const initialContent = JSON.parse(document.getElementById('__content').textContent);


export default function Editor({ path }) {
  const [changes, setChanges] = useState({}); // flat changes to content
  const [page, setPage] = useState();

  let content = initialContent;
  for (const [key, value] of Object.entries(changes)) {
    _.set(content, key, value);
  }

  const cms = new Block({
    content,
    editMode: true,
    update: o => setChanges(cs => ({ ...cs, ...o })),
  });

  useEffect(() => {
    import(`../pages/${path}.js`).then(({ default: Page }) => {
      setPage(<Page cms={cms.block(path)} />);
    });
  }, []);

  const publish = async (e) => {
    const data = { ...changes };
    if (!window.confirm(`Publish ${JSON.stringify(data, null, 2)}`)) return;

    for (const [key, value] of Object.entries(data)) {
      const uploadEl = value?.startsWith('blob:') && document.body.querySelector(`img[src="${value}"] + details input[type="file"]`);
      if (uploadEl?.files?.[0]) {
        const r = await fetch(`/api/upload?name=${uploadEl.files[0].name}`, {
          method: 'POST',
          body: uploadEl.files[0]
        }).then(r => r.json());
        data[key] = r.url;
      }
    }

    fetch('/api/contents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(async r => {
        if (!r.ok) return window.alert(await r.text());
        setChanges({});
      });
  };

  return (
    <>
      <App cms={cms}>
        {page}
      </App>
      <Container className="m-1">
        {Object.keys(changes).length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={publish}
          >
            Publish
          </button>
        )}

      </Container>
    </>
  );
}