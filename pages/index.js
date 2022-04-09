import Layout from '../components/layout';
import { load } from '../content';
import { Block } from '../block';


export async function getServerSideProps({ req }) {
  const content = await load(req.language, ['common', 'home']);
  const cms = new Block({ content, editMode: req.query.edit !== undefined });
  return { cms, req };
}

export default function Home({ cms, ...props }) {
  const page = cms.block('home');

  return (
    <Layout meta={page.block('meta')} {...props}>
      <h1><page.Text id="title" /></h1>
    </Layout>
  )
}
