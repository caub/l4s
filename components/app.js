import { h, Fragment } from 'preact';
import Header from './header.js';
import Footer from './footer.js';


export default function ({ cms, req, children }) {
  return (
    <>
      <header>
        <Header cms={cms.block('common.header')} req={req} />
      </header>

      <main className="flex-shrink-0 mb-5">
        {children}
      </main>

      <footer className="mt-auto bg-light">
        <Footer cms={cms.block('common.footer')}/>
      </footer>
    </>
  )
}