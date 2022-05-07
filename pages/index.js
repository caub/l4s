import { h, Fragment } from 'preact';
import { styled } from '@stitches/react';


const Section = styled('section', {
  padding: '8rem 0',
  backgroundPosition: '0px 0px',
  backgroundSize: '100% auto',
});


export default function Home({ cms }) {
  return (
    <>
      <cms.Object id="hero" fields={{ url: { type: 'file' } }}>
        <Section style={{ backgroundImage: `url("${cms.get('hero.url')}")` }}>
          <div className="container">
            <h1 className="display-4 text-white text-capitalize"><cms.Text id="hero.title" /></h1>

            <cms.Text id="hero.subtitle" markdown inline className="lead mb-4 text-light fs-2 fw-normal"/>

            <cms.Link id="btn1" type="button" className="btn btn-light text-primary rounded-pill px-4 py-2" />
          </div>
        </Section>
      </cms.Object>
    </>
  )
}
