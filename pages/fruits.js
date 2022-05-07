import { h, Fragment } from 'preact';
import { styled } from '@stitches/react';


const SearchInput = styled('input', {
  width: '250px'
});

const Counter = styled('div', {
  display: 'flex',

  '& button': {
    padding: 0,
    width: '30px',
    fontSize: '1.5rem',
    position: 'relative',
    zIndex: 1,
  },
  '& input[type="number"]': {
    padding: '.25rem 0',
    width: '30px',
    border: 0,
    textAlign: 'center',
    fontWeight: 600,
    appearance: 'textfield',

    '&::-webkit-outer-spin-button,&::-webkit-inner-spin-button': {
      appearance: 'none',
      margin: 0,
    }
  },
});

const script = `
const list =  document.currentScript.previousElementSibling;
list.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.cart === '') {
    btn.classList.add('visually-hidden');
    btn.nextElementSibling.classList.remove('visually-hidden');
  }
  if (btn.dataset.inc === '') {
    btn.previousElementSibling.value = +btn.previousElementSibling.value + 1;
  }
  if (btn.dataset.dec === '') {
    btn.nextElementSibling.value = Math.max(+btn.nextElementSibling.min, +btn.nextElementSibling.value - 1);
  }
});
`;

export default function ({ cms }) {
  return (
    <div className="container mt-4">

      <cms.Object id="search" fields={{ placeholder: {} }}>
        <SearchInput type="search" className="form-control" id="search" placeholder={cms.text('search.placeholder')} />
      </cms.Object>

      <cms.List id="items" className="mt-3 row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols- g-4">
        {(item, i) => (
          <li key={i} className="col">
            <div className="card h-100">
              <item.Image id="img" className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title fw-normal"><item.Text id="title" /></h5>
                <item.Text id="infos" markdown inline className="card-text" />
              </div>
              <div className="card-footer d-flex justify-content-between align-items-center">
                {item.editMode
                  ? <input type="number" value={item.get('price') || ''} onChange={e => item.update({ [item.id('price')]: e.target.value })} className="form-control" style={{ width: 80 }} />
                  : <strong className="fs-5">{Intl.NumberFormat('fr', { style:'currency', currency: 'EUR' }).format(item.get('price') || 0)}</strong>
                }


                <button data-cart className="btn btn-primary">
                  <i role="img" className="bi-bag" />
                </button>
                <Counter data-counter className="visually-hidden">
                  <button className="btn btn-default" data-dec><i className="bi-dash" role="icon" /></button>
                  <input id={item.id()} type="number" className="form-control fs-5" value="1" min="0" />
                  <button className="btn btn-default" data-inc><i className="bi-plus" role="icon" /></button>
                </Counter>
              </div>
            </div>
          </li>
        )}
      </cms.List>

      <script dangerouslySetInnerHTML={{ __html: script }} />
    </div>
  )
}
