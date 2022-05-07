import { h } from 'preact';
import { styled } from '@stitches/react';


const Container = styled('div', {
  display: 'grid',
});

export default ({ cms }) => (
  <div className="container d-flex flex-wrap justify-content-between pt-3 pt-md-5 pb-2 gap-4">
    <cms.List id="sections" as="div" className="d-flex gap-2">
      {(item, i) => (
        <div key={i}>
          <h5 className="mb-4 py-3"><item.Text id="title" /></h5>
          <item.List id="items" className="nav flex-column gap-3">
            {(subitem, j) => (
              <li key={j} className="nav-item"><subitem.Link id="link" className="nav-link p-0 text-muted" /></li>
            )}
          </item.List>
        </div>
      )}
    </cms.List>

    <form className="col-md-4">
      <h5 className="mb-4 py-3"><cms.Text id="contact.title" /></h5>
      <cms.Text markdown inline id="contact.subtitle" />
      <cms.Object id="form" fields={{ url: {}, email: {}, message: {}, send: {} }} action={cms.text('form.url')} method="POST" className="mt-2">
        <input type="email" className="form-control mb-2" placeholder={cms.text('form.email')} />
        <textarea type="message" className="form-control mb-3" placeholder={cms.text('form.message')} />
        <button className="btn btn-primary rounded-pill">{cms.text('form.send')}</button>
      </cms.Object>
    </form>
  </div>
)