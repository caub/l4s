function h(type, props) {
  const el = document.createElement(type);
  Object.assign(el, props);
  return (...children) => { el.append(...children); return el; };
}

const style = h('style')(`
[data-wx-text]:hover {
  outline: 1px auto #f002;
}
[data-wx-text][contenteditable=true] {
  outline: 1px auto #f00e;
}

[data-wx-text]:empty {
  min-width: 50px;
  min-height: 1em;
  display: inline-block;
}


.wx-block {
  position: absolute;
  background-color: #fffb;
  backdrop-filter: blur(20px);
  top: 1px;
  right: 1px;
  z-index: 99999997
}
.wx-block > summary {
  text-transform: uppercase;
  text-align: right;
  font-size: .75rem;
}
.wx-block > dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .25rem .5rem;
  margin-bottom: 0;
  padding: 2px;
  text-align: left;
  box-shadow: 0 1px 2px 1px #0002;
}
.wx-block > dl > dd {
  grid-column-start: 2;
  margin-bottom: 0;
}
.wx-block .form-control-sm {
  padding: 2px;
  min-height: 1.5rem;
}
.wx-block .form-control-sm[type="number"] {
  width: 4rem;
}

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
  width: 120px;
  height: 32px;
  backdrop-filter: blur(20px);
}
.wx-publish textarea:focus-visible {
  height: calc(100vh - 6px);
  width: calc(50vw - 50px);
  background-color: #fffa;
}
`);

document.head.append(style);

const app = document.getElementById('app');

const publishButton = h('button', { className: 'show btn btn-sm btn-success position-absolute' })('Publish');
const publishEdit = h('textarea', { className: 'form-control form-control-sm' })();
const publishContainer = h('div', { className: 'wx-publish' })(
  publishEdit,
  publishButton,
);

document.body.append(publishContainer);

function getEdit() {
  if (publishEdit.value === '') return {};
  const dataJson = `{
${publishEdit.value.replace(/^([\w.]+)/gm, '  "$1":').replace(/(?<!^)$/gm, ',').replace(/,$/, '')}
}`;

  try {
    return JSON.parse(dataJson);
  } catch {
    console.error('Invalid json', dataJson);
    return {};
  }
}
function setEdit(key, value) {
  const data = getEdit();
  data[key] = value;
  publishEdit.value = JSON.stringify(data, null, 2)
    .replace(/^{\n/, '')
    .replace(/\n}$/, '')
    .replace(/,$/gm, '')
    .replace(/^ {2}"([\w.]+)":/gm, '$1');
  publishContainer.style.display = Object.keys(data).length === 0 ? 'none' : '';
}
function clearEdit() {
  publishEdit.value = '';
  publishContainer.style.display = 'none';
}

publishButton.onclick = async () => {
  const data = getEdit();
  if (Object.keys(data).length === 0) return;
  if (!window.confirm(`Publish ${Object.keys(data).length} updates?`)) return;

  for (const [key, value] of Object.entries(data)) {
    const uploadEl = value?.startsWith('@{') && app.querySelector(`input[type="file"][data-wx-upload="${key}"]`);
    if (uploadEl?.files[0]) {
      const r = await fetch(`/api/upload?name=${uploadEl.files[0].name}`, {
        method: 'POST',
        body: uploadEl.files[0]
      }).then(r => r.json());
      data[key] = r.url;
    }
  }

  fetch('/api/content/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async r => {
      if (!r.ok) return window.alert(await r.text());
      clearEdit();
    });
};


app.addEventListener('click', e => {
  const el = e.target.closest('[data-wx-text]');
  if (el) {
    const initialInnerHTML = el.innerHTML;
    el.contentEditable = true;
    el.focus();
    el.addEventListener('blur', () => {
      el.contentEditable = false;
      if (el.innerHTML === initialInnerHTML) return;
      setEdit(el.dataset.wxText, el.innerHTML);
    }, { once: true });
  }
});

app.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-wx-upload]')) {
    setEdit(el.dataset.wxUpload, `@{${el.files[0].name}}`);
    el.src = URL.createObjectURL(el.files[0]);
  }
});

