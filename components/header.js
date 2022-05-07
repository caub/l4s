import { h } from 'preact';


const script = `const togglerButton = document.querySelector('.navbar-toggler');
const menu = document.querySelector('.navbar-collapse');
togglerButton.addEventListener('click', () => {
  const isCollapsed = togglerButton.classList.toggle('collapsed');
  togglerButton.ariaExpanded = isCollapsed;
  menu.classList.toggle('show', isCollapsed);

  function close(e) {
    if (e.key === 'Escape' || e.type === 'click') {
      togglerButton.classList.remove('collapsed');
      togglerButton.ariaExpanded = false;
      menu.classList.add('collapsing');
      setTimeout(() => {
        menu.classList.remove('collapsing');
        menu.classList.toggle('show', false);
      }, 500);
      window.removeEventListener('keydown', close);
    }
  }
  window.addEventListener('keydown', close);
});`;


export default ({ cms, req }) => (
  <nav className="navbar navbar-expand-md navbar-light bg-white shadow-sm" aria-label="Fourth navbar example">
    <div className="container-md align-items-stretch">
      <a id="logo" keys="url,toggle" className="navbar-brand p-2" href="/">
        <img src="/static/logo.jpg" alt="Les 4 saisons" height="64" />
      </a>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label={cms.text('toggleMenu')}>
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse align-items-stretch" id="navbarCollapse">
        <cms.List id="items" className="navbar-nav me-auto mb-2 mb-md-0 ps-5">
          {(item, i) => (
            <li key={i} className="nav-item">
              <item.Link className={`nav-link small h-100 d-flex align-items-center px-3 text-uppercase border-bottom border-4 ${req?.url === item.get('url') ? 'active border-primary' : 'border-transparent'}`} aria-current="page" />
            </li>
          )}
        </cms.List>
      </div>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </div>
  </nav>
);