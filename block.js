const { createElement, Fragment, cloneElement } = require('react');
const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
});
const LinkifyIt = require('linkify-it');


LinkifyIt.prototype.normalize = function normalize(match) {
  // https://github.com/markdown-it/linkify-it/blob/master/index.js#L614
  if (!match.schema) { match.url = 'https://' + match.url.toLowerCase(); }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};

// md.linkify
//   .add('blog:', { // just an idea
//     validate: /^[\w-]{3,}/,
//     normalize(match) {
//       const blogKey = match.url.replace(/^blog:/, '');
//       const blog = cms.get(`blogPost_${blogKey}`)
//       match.url = `${process.env.SERVER_URL || 'https://...'}/blog/${blogKey}`;
//       match.text = blog?.title || blogKey;
//     }
//   });

exports.Block = class Block {
  constructor({ path, content, editMode }) {
    this.path = path;
    this.content = content;
    this.editMode = editMode;
  }

  id(path) {
    return [this.path, path].filter(Boolean).join('.');
  }

  get(path) {
    const result = path.split('.').reduce((o, k) => o?.[k], this.content);

    if (result === undefined && !this.path && this.editMode) {
      const section = path.split('.')[0];
      const loadedSections = Object.keys(this.content || {});

      if (!loadedSections.includes(section)) {
        console.warn(`Tried to access unloaded section: ${section}`);
      }
    }

    return result;
  }

  text(path) {
    const text = this.get(path);

    if (text === undefined) {
      return this.editMode ? `[${path}]` : '';
    }

    if (typeof text !== 'string') {
      console.warn(`Tried to get object as string: ${path}`);
      return this.editMode ? `[${path}]` : '';
    }

    return text;
  }

  block(path) {
    const blockPath = this.id(path);
    const blockContent = this.get(path);
    return new Block({ path: blockPath, content: blockContent, editMode: this.editMode });
  }

  Text = ({
    id,
    vars,
    markdown,
    inline,
    as: As = markdown ? (inline ? 'p' : 'div') : (this.editMode ? 'span' : Fragment),
    ...rest
  }) => {
    const text = this.text(id, vars);

    if (markdown) {
      return createElement(As, {
        ...this.editMode && { 'data-wx-text': this.id(id) },
        ...rest,
        dangerouslySetInnerHTML: { __html: this.editMode ? text : inline ? md.renderInline(text) : md.render(text) }
      });
    }

    return createElement(As, {
      ...this.editMode && { 'data-wx-text': this.id(id) },
      ...rest
    }, text);
  }

  List = ({ id, as: As = 'ul', orderBy, children, ...rest }) => {
    const listData = this.get(id) || [];

    if (orderBy) listData.sort((a, b) => a[orderBy]- b[orderBy]);

    return createElement(
      As,
      rest,
      listData.map((data, index) => {
        const item = this.block(`${id}.${index}`);

        return children(item, index);
      }),
      this.editMode && children(this.block(`${id}.${listData.length}`), listData.length),
    );
  }

  Object = ({ id, keys, uploadable = [], index, help, as: As = this.editMode ? 'div' : Fragment, children, className = '', ...rest }) => {
    return createElement(As, {
      key: index,
      ...rest,
      ...this.editMode && { 'className': `position-relative ${className}` },
    },
      children,
      this.editMode && createElement('details', { className: 'wx-block text-muted rounded-1' },
        createElement('summary', {}, help || `${id} props`),
        createElement('dl', {className: 'border border-light'},
          ...keys.split(',').map(key => createElement(
            Fragment, 
            {key}, 
            createElement('dt', {}, key),
            createElement('dd', {}, this.Text({ id: [id, key].filter(Boolean).join('.')})),
            uploadable.includes(key) && createElement('dd', {}, createElement('input', { type: 'file', 'data-wx-upload': this.id([id, key].filter(Boolean).join('.')), className: 'form-control form-control-sm' })),
          )),
        )
      )
    );
  }

  Image = ({ id, ...rest }) => {
    const data = this.get(id) || {};

    if (!this.editMode && !data.url) return null;

    return this.Object({
      id,
      keys: 'url,alt',
      uploadable: ['url'],
      children: createElement('img', {
        src: this.editMode && !data.url
          ? 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
          : data.url,
        loading: 'lazy',
        alt: data.alt,
        ...this.editMode && { style: { minHeight: 32, maxWidth: '100%' } },
        ...rest,
      })
    });
  }

  Button = ({ id, children, as: As, ...rest }) => {
    const data = this.get(id) || {};

    return this.Object({
      id,
      keys: 'text',
      as: As,
      children: createElement('button', rest, data.text || children)
    });
  }

  Link = ({ id, children, as: As, ...rest }) => {
    const data = this.get(id) || {};
    const href = data.url || rest.href;
    const rel = data.rel || rest.rel;
    const target = data.target || rest.target;

    return this.Object({
      id,
      keys: 'url,text,rel,target',
      as: As,
      children: createElement('a', { href, rel, target, ...rest }, data.text || children)
    });
  }
}
