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
._wx_editBtn.text::after, ._wx_editBtn.md::after {
  content: "✏️";
}
._wx_editBtn.img::after {
  content: "✒️"; 
}
._wx_editBtn.obj::after, ._wx_editBtn.list::after {
  content: "🔩";
}

[data-block][contenteditable=true] {
  outline: 1px auto #f00e;
}

._wx_publishBtn {
  position: fixed;
  right: 15px;
  bottom: 15px;
  z-index: 99999998;
  border: 0;
  background: #fff;
}
._wx_publishBtn:not(.show) {
  display: none;
}


`);

document.head.append(style);

const editButton = h('button', { className: '_wx_editBtn' })();
const publishButton = h('button', { className: '_wx_publishBtn' })('Publish');


const editor = h('div', { className: '_wx_editor' })(editButton, publishButton);

document.body.append(editor);

publishButton.onclick = () => {
  if (!sessionStorage.getItem('_wx_data')) return;

  fetch('/api/content/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: sessionStorage.getItem('_wx_data')
  })
    .then(async r => {
      if (!r.ok) return window.alert(await r.text());
      close();
    });
};

document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-block]');
  if (el) {
    const [blockType, blockId, blockKeys] = el.dataset.block.split(/[:;]/g);
    editButton.className=`_wx_editBtn ${blockType}`;
    console.log('_', el);
    const rect = el.getBoundingClientRect();
    editButton.style.left = rect.left + scrollX + 'px';
    editButton.style.top = rect.top - editButton.offsetHeight + scrollY + 'px';
    editButton.onclick = () => {
      if (blockType !== 'text') throw new Error('todo');

      el.contentEditable = true;
      el.focus();

      el.addEventListener('blur', () => {
        el.contentEditable = false;
        editButton.style.left = '';
        editButton.style.top = '';
        const data = JSON.parse(sessionStorage.getItem('_wx_data') || '{}');
        sessionStorage.setItem('_wx_data', JSON.stringify({ ...data, [blockId]: el.textContent }));
        publishButton.classList.add('show');
      }, { once: true });
    };
  }
  else if (e.target !== editButton && !document.activeElement?.matches('[data-block]')) {
    editButton.style.left = '';
    editButton.style.top = '';
    editButton.onclick = null;
  }
});
