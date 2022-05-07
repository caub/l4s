import { h } from 'preact';
import App from './components/app.js';

// const app = h(App, { cms },
//     h(Page, { cms: cms.block(path) })
//   );

function html(type, props) {
  const el = document.createElement(type);
  Object.assign(el, props);
  return (...children) => { el.append(...children); return el; };
}

const style = html('style')(`




.wx-publish {
  position: fixed;
  bottom: 4px;
  right: 6px;
  display: block;
  z-index: 99999998
}
.wx-publish button {
  right: 1px;
  bottom: 1px;
}
.wx-publish textarea {
  resize: horizontal;
  width: 50px;
  height: 32px;
  backdrop-filter: blur(20px);
}
.wx-publish textarea:focus-visible {
  height: calc(100vh - 6px);
  width: calc(50vw - 50px);
  background-color: #fffd;
}
`);

// document.head.append(style);

const publishButton = html('button', { className: 'show btn btn-sm btn-success position-absolute' })('Publish');
const publishEdit = html('textarea', { className: 'form-control form-control-sm' })();
const publishContainer = html('div', { className: 'wx-publish' })(
  publishEdit,
  publishButton,
);

document.body.append(publishContainer);

function getEdit() {
  if (publishEdit.value === '') return {};
  try {
    return JSON.parse(publishEdit.value);
  } catch {
    console.error('Invalid json', publishEdit.value);
    return {};
  }
}
function setEdit(key, value) {
  const data = getEdit();
  data[key] = value;
  publishEdit.value = JSON.stringify(data, null, 2);
  publishContainer.style.display = Object.keys(data).length === 0 ? 'none' : '';
}
function clearEdit() {
  publishEdit.value = '';
  publishContainer.style.display = 'none';
}

publishButton.onclick = async () => {
  const data = getEdit();
  if (Object.keys(data).length === 0) return;
  if (!window.confirm(`Publish ${JSON.stringify(data, null, 2)}`)) return;

  for (const [key, value] of Object.entries(data)) {
    const uploadEl = value?.startsWith('@{') && document.body.querySelector(`input[type="file"][data-wx-upload="${key}"]`);
    if (uploadEl?.files?.[0]) {
      const r = await fetch(`/api/upload?name=${uploadEl.files[0].name}`, {
        method: 'POST',
        body: uploadEl.files[0]
      }).then(r => r.json());
      data[key] = r.url;
    }
  }

  fetch('/api/contents', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async r => {
      if (!r.ok) return window.alert(await r.text());
      clearEdit();
    });
};


// document.body.addEventListener('click', e => {
//   const el = e.target.closest('[data-wx-text]');
//   if (el) {
//     const initialInnerHTML = el.innerHTML;
//     el.contentEditable = true;
//     el.focus();
//     el.addEventListener('blur', () => {
//       el.contentEditable = false;
//       if (el.innerHTML === initialInnerHTML) return;
//       setEdit(el.dataset.wxText, el.innerHTML);
//     }, { once: true });
//   }
// });

document.body.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-wx-upload]')) {
    setEdit(el.dataset.wxUpload, `@{${el.files[0].name}}`);
    el.src = URL.createObjectURL(el.files[0]);
  }
});

