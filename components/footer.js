import { h } from 'preact';

export default ({ cms }) => (
  <div className="container py-5">
    <cms.List id="sections" as="div" className="row">
      {(item, i) => (
        <div key={i} className="col-2">
          <h5>Section</h5>
          <item.List id="items" className="nav flex-column">
            {(subitem, j) => (
              <li key={j} className="nav-item mb-2"><subitem.Link id="link" className="nav-link p-0 text-muted" /></li>
            )}
          </item.List>
        </div>
      )}
    </cms.List>
    <div className="row">
      <div className="col-4 offset-1">
        <form>
          <h5><cms.Text id="subscribe.title" /></h5>
          <cms.Text markdown inline id="subscribe.subtitle" />
          <div className="d-flex w-100 gap-2">
            <label htmlFor="newsletter" className="visually-hidden"><cms.Text id="subscribe.email" /></label>
            <input id="newsletter" type="text" className="form-control" placeholder="you@gmail.com" />
            <cms.Button id="subscribe.btn" className="btn btn-primary" type="button" />
          </div>
        </form>
      </div>
    </div>

    <div className="d-flex justify-content-between py-4 my-4 border-top">
      <cms.Text markdown inline id="company.text" />
      <cms.List id="social"  className="list-unstyled d-flex">
        {(item, i) => (
          <li key={i} className="ms-3">
            <item.Link id="link" keys="url,icon" className="link-dark"><i className={item.text('icon')} role="img" style={{ fontSize: 24 }} /></item.Link>
          </li>
        )}
      </cms.List>
    </div>
  </div>
)