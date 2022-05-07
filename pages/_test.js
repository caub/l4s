import { h } from 'preact';

export default function Home({ cms }) {
  return (
    <div className="container">
      <div className="px-4 pt-5 my-5 text-center border-bottom">
        <h1 className="display-4 fw-bold"><cms.Text id="title" /></h1>
        <div className="col-lg-6 mx-auto">
          <div className="lead mb-4"><cms.Text markdown id="subtitle" /></div>
          <div className="d-grid gap-3 d-sm-flex justify-content-sm-center mb-5">
            <cms.Link id="btn1" type="button" className="btn btn-primary btn-lg px-4" />
            <cms.Link id="btn2" type="button" className="btn btn-outline-secondary btn-lg px-4" />
          </div>
        </div>
        <div className="container px-5">
          <cms.Image id="thumb" className="img-fluid border rounded-3 shadow-lg mb-4" width="700" height="500" loading="lazy" />

          <cms.Image id="thumb2" className="img-fluid border rounded-3 shadow-lg mb-4" height="500" loading="lazy" />
        </div>
      </div>

      <section id="feat" className="container">
        <cms.List
          id="items"
          className="row row-cols-1 row-cols-md-3 g-4"
        >
          {item => (
            <li key={item.id()} className="col">
              <div className="card h-100 text-center">
                <item.Object
                  keys="icon"
                  className="card-img-top"
                  style={{ right: 1, top: 1 }}
                  help={{ icon: 'icon css class from https://icons.getbootstrap.com/' }}
                >
                  <i className={`bi-${item.text('icon')} card-img-top text-primary`} role="img" aria-label={item.text('label')} style={{ fontSize: '2em' }} />
                </item.Object>
                <div className="card-body">
                  <h5 className="card-title"><item.Text id="title" /></h5>
                  <item.Text id="text" as="p" markdown inline className="card-text" />
                </div>
              </div>
            </li>
          )}
        </cms.List>
      </section>

      <section id="more" className="container">
        <cms.Text markdown id="text" />
      </section>
    </div>
  )
}
