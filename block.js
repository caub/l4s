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
    as: As = this.editMode ? 'span' : Fragment,
    ...rest
  }) => {
    const text = this.text(id, vars);

    if (markdown) {
      return createElement(As, {
        ...this.editMode && { 'data-block': `md:${this.id(id)}` },
        ...rest,
        dangerouslySetInnerHTML: { __html: inline ? md.renderInline(text) : md.render(text) }
      });
    }

    return createElement(As, {
      ...this.editMode && { 'data-block': `text:${this.id(id)}` },
      ...rest
    }, text);
  }

  List = ({ id, vars, as: As = 'ul', keys = 'title', orderBy, children, ...rest }) => {
    const listContent = this.get(id) || { [Date.now()]: {} };

    const orderFn = orderBy ? (a, b) => (listContent[a][orderBy] || a) - (listContent[b][orderBy] || b) : undefined;

    const listKeys = Object.keys(listContent).sort(orderFn);

    return createElement(
      As,
      {
        ...this.editMode && { 'data-block': `list:${this.id(id)};${keys}` },
        ...rest
      },
      listKeys.map((key, index) => {
        const item = this.block(`${id}.${key}`);

        return cloneElement(children(item, index), { key });
      })
    );
  }

  Object = ({ id, keys, as: As = this.editMode ? 'div' : Fragment, children, ...rest }) => {
    return createElement(As, {
      ...this.editMode && { 'data-block': `obj:${this.id(id)};${keys}` },
      ...rest
    }, children);
  }

  Image = ({ id, alt, ...rest }) => {
    const url = this.text(id);

    if (!this.editMode && !url) return null;

    return createElement('img', {
      src: this.editMode && (!url || url[0] === '[')
        ? 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
        : url,
      loading: 'lazy',
      alt: alt?.trim(),
      ...this.editMode && { 'data-block': `img:${this.id(id)}`, style: { minWidth: 50, maxWidth: '100%' } },
      ...rest,
    });
  }

  Link = ({ id, children, as: As, ...rest }) => {
    const data = this.get(id) || {};
    const href = data.url || rest.href;
    const rel = data.rel || rest.rel;
    const target = data.target || rest.target;

    return this.prototype.Object.call(this, {
      id,
      keys: 'url,text,rel,target',
      as: As,
      ...this.editMode && !data.text && { style: { width: 10, height: 10 } }, 
      children: createElement('a', { href, rel, target, ...rest }, data.text || children)
    });
  }
}
