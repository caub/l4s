import Layout from '../components/layout';
import { load } from '../content';
import { Block } from '../block';


export async function getServerSideProps({ req }) {
  const content = await load(req.language || 'en', ['common', 'home']);
  const cms = new Block({ content, editMode: req.query.edit !== undefined });
  return { cms, req };
}

export default function Home({ cms, ...props }) {
  const page = cms.block('home');

  return (
    <Layout meta={page.block('meta')} {...props}>
      <div className="px-4 pt-5 my-5 text-center border-bottom">
        <h1 className="display-4 fw-bold"><page.Text id="title" /></h1>
        <div className="col-lg-6 mx-auto">
          <div className="lead mb-4"><page.Text markdown id="subtitle" /></div>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
            <page.Link id="btn1" type="button" className="btn btn-primary btn-lg px-4 me-sm-3" />
            <page.Button id="btn2" type="button" className="btn btn-outline-secondary btn-lg px-4" />
          </div>
        </div>
        <div className="overflow-hidden" style={{ maxHeight: '30vh' }}>
          <div className="container px-5">
            <page.Image id="thumb" className="img-fluid border rounded-3 shadow-lg mb-4" alt="Example image" width="700" height="500" loading="lazy" />
          </div>
        </div>
      </div>

      <section id="feat" className="container">
        <page.List id="items" keys="icon,title,text" className="row gy-8 gx-sm-9 justify-content-center">
          {item => (
            <li key={item.id()} className="col-12 col-md-4 text-center">
              <item.Object keys="icon,title,text">
                <div className="icon text-primary mb-3">
                  <i className={`bi-${item.text('icon')}`} role="img" style={{ fontSize: '2em' }} />
                </div>

                <h3 className="h5 fw-bold">{item.text('title')}</h3>

                <p className="text-gray-700 mb-6 mb-md-0 text-justify">{item.text('text')}</p>
              </item.Object>
            </li>
          )}
        </page.List>
      </section>

      <section id="more" className="container"><page.Text markdown id="text" /></section>
    </Layout>
  )
}
