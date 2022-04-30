import { h } from 'preact';

export default ({ cms }) => (
  <nav className="navbar navbar-expand-md navbar-light bg-white" aria-label="Fourth navbar example">
    <div className="container-fluid">
      <a id="logo" keys="url,toggle" className="navbar-brand" href="/">
        <img src="/static/logo.jpg" alt="Les 4 saisons" height="64" />
      </a>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label={cms.text('logo.toggle')}>
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarCollapse">
        <cms.List id="items" className="navbar-nav me-auto mb-2 mb-md-0">
          {(item, i) => (
            <li key={i} className="nav-item">
              <item.Link className="nav-link active" aria-current="page" />
            </li>
          )}
        </cms.List>
        <form>
          <input className="form-control" type="text" placeholder="Search" aria-label="Search" />
        </form>
      </div>
    </div>
  </nav>
);