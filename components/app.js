import { h } from 'preact';
import Header from './header';
import Footer from './footer';


export default function ({ cms, children }) {
  return (
    <>
      <header>
        <Header cms={cms.block('common.header')}/>
      </header>

      <main className="flex-shrink-0">
        {children}
      </main>

      <footer className="mt-auto bg-light">
        <Footer cms={cms.block('common.footer')}/>
      </footer>
    </>
  )
}