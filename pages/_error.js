import Layout from '../components/layout';


// export async function getServerSideProps({ req }) {
//   const cms = await load(['common', 'errors'], {
//     editMode: req.query.edit !== undefined,
//     lang: req.language || 'en',
//   });
//   return { cms, req };
// }

export default function Error({ cms, status, err, ...props }) {
  return (
    <Layout cms={cms} {...props}>
      <div className="container">
        <h1 className="text-center h2" style={{ marginTop: 200 }}>Error {status} :/</h1>
        {!process.env.NODE_ENV && err && <pre>{err.stack}</pre>}
      </div>
    </Layout>
  )
}
