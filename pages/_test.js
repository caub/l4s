import Layout from '../components/layout';
import { load } from '../content';
import { Block } from '../block';


export async function getServerSideProps({ req }) {
  const content = await load(req.language, ['common', '_test']);
  const cms = new Block({ content, editMode: req.query.edit !== undefined });
  return { cms, req };
}

export default function Home({ cms, ...props }) {
  const page = cms.block('_test');

  return (
    <Layout meta={page.block('meta')} {...props}>
      <div className="px-4 pt-5 my-5 text-center border-bottom">
        <h1 className="display-4 fw-bold"><page.Text id="title" /></h1>
        <div className="col-lg-6 mx-auto">
          <div className="lead mb-4"><page.Text markdown id="subtitle" /></div>
          <div className="d-grid gap-3 d-sm-flex justify-content-sm-center mb-5">
            <page.Link id="btn1" type="button" className="btn btn-primary btn-lg px-4" />
            <page.Button id="btn2" type="button" className="btn btn-outline-secondary btn-lg px-4" />
          </div>
        </div>
        <div className="container px-5">
          <page.Image id="thumb" className="img-fluid border rounded-3 shadow-lg mb-4" alt="Example image" width="700" height="500" loading="lazy" />
        </div>
      </div>

      <section id="feat" className="container">
        <page.List id="items" keys="icon,title,text" className="row row-cols-1 row-cols-md-3 g-4">
          {item => (
            <li key={item.id()} className="col">
              <div className="card h-100 text-center">
                <item.Object keys="icon" className="card-img-top" help={<>icon props <a href="https://icons.getbootstrap.com/"><i className="bi-arrow-up-right-circle" role="img" /></a></>}>
                  <i className={`bi-${item.text('icon')} card-img-top text-primary`} role="img" aria-label={item.text('label')} style={{ fontSize: '2em' }} />
                </item.Object>
                <div className="card-body">
                  <h5 className="card-title"><item.Text id="title" /></h5>
                  <cms.Text id="text" as="p" markdown inline className="card-text" />
                </div>
              </div>
            </li>
          )}
        </page.List>
      </section>

      <section id="more" className="container">
        <page.Text markdown id="text" />
      </section>
    </Layout>
  )
}
