import { h } from 'preact';

export default function Home({ cms }) {
  return (
    <div className="container">
      <h1><cms.Text id="title" /></h1>
      

    </div>
  )
}
