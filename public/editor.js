function h(type, props) {
  const el = document.createElement(type);
  Object.assign(el, props);
  return (...children) => { el.append(...children); return el; };
}

const style = h('style')(`
._wx_editBtn {
  position: absolute;
  left: -1000px;
  z-index: 99999999;
  border: 0;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: #0008 1px 1px 2px;
  width: 25px;
  height: 25px;
  padding: 0;
}

[data-block]:hover {
  outline: 1px auto #f002;
}
[data-block][contenteditable=true] {
  outline: 1px auto #f00e;
}

[data-block]:empty {
  min-width: 50px;
  min-height: 1em;
}

._wx_publishBtn {
  position: fixed;
  right: 15px;
  bottom: 15px;
  z-index: 99999998;
}
._wx_publishBtn:not(.show) {
  display: none;
}
input[type="file"] {
  visibilty: hidden;
  opacity: 0;
  position: absolute;
}

`);

document.head.append(style);

const editButton = h('button', { className: '_wx_editBtn' })();
const publishButton = h('button', { className: '_wx_publishBtn btn btn-sm btn-success' })('Publish');
const uploadButton = h('input', { type: 'file' })();

const editor = h('div', { className: '_wx_editor' })(editButton, publishButton, uploadButton);

document.body.append(editor);

window._wx_data = {};

publishButton.onclick = async () => {
  if (Object.keys(window._wx_data).length === 0) return;

  const confirmData = Object.fromEntries(Object.entries(window._wx_data).map(([k, v]) => [k, v instanceof File ? `🔗${v.name}` : v]));

  if (!window.confirm(JSON.stringify(confirmData, null, 2))) {
    // TODO undo dom changes
    publishButton.classList.remove('show');
    return;
  }

  for (const [key, value] of Object.entries(window._wx_data)) {
    if (value instanceof File) {
      const r = await fetch(`/api/upload?name=${value.name}`, {
        method: 'POST',
        body: value
      }).then(r => r.json());
      window._wx_data[key] = r.url;
    }
  }

  fetch('/api/content/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(window._wx_data),
  })
    .then(async r => {
      if (!r.ok) return window.alert(await r.text());
      // TODO undo dom changes
      publishButton.classList.remove('show');
    });
};

// document.addEventListener('focusout', e => {
//   console.log('blurred', e.target);
// });

document.addEventListener('click', e => {
  const el = e.target.closest('[data-block]');
  if (el) {
    const initialInnerHTML = el.innerHTML;
    // TODO fix markdown, should switch to msyntax on click
    const [blockType, blockId, blockKeys] = el.dataset.block.split(/[:;]/g);

    switch (blockType) {
      case 'text':
      case 'md': {
        el.contentEditable = true;
        el.focus();

        el.addEventListener('blur', () => {
          el.contentEditable = false;
          if (el.innerHTML === initialInnerHTML) return;
          window._wx_data[blockId] = el.innerHTML;
          publishButton.classList.add('show');
        }, { once: true });
        break;
      }

      case 'img': {
        uploadButton.click();
        uploadButton.addEventListener('change', () => {
          window._wx_data[blockId] = uploadButton.files[0];
          el.src = URL.createObjectURL(uploadButton.files[0]);
          publishButton.classList.add('show');
        }, { once: true });

        break;
      }


      case 'obj':
      case 'list': {
        const vals = window.prompt(blockKeys.split(',').join(' / '));
        const containerId = blockType === 'list' ? `${blockId}.${el.childElementCount}` : blockId;
        window._wx_data[containerId] = Object.fromEntries(blockKeys.split(',').map((k, i) => [k, vals.split(' / ')[i]]));
        publishButton.classList.add('show');
        break;
      }

      default: throw new Error(`unknown block type ${blockType}`);
    }
  }
});


