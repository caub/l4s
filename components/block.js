import { h, Fragment } from 'preact';
import { marked } from 'marked';

export default class Block {
  constructor({ path, content, editMode }) {
    this.path = path;
    this.content = content;
    this.editMode = editMode;
  }

  id(path) {
    return [this.path, path].filter(Boolean).join('.');
  }

  get(path) {
    const result = path ? path.split('.').reduce((o, k) => o?.[k], this.content) : this.content;

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
      return (
        <As
          {...this.editMode && { 'data-wx-text': this.id(id) }}
          {...rest}
          dangerouslySetInnerHTML={{ __html: this.editMode ? text : inline ? marked.parseInline(text) : marked.parse(text) }}
        />
      );
    }

    return (
      <As {...this.editMode && { 'data-wx-text': this.id(id) }} {...rest}>
        {text}
      </As>
    );
  }

  List = ({ id, as: As = 'ul', orderBy, children, ...rest }) => {
    const listData = this.get(id) || [];

    if (orderBy) listData.sort((a, b) => a[orderBy]- b[orderBy]);

    if (typeof listData?.map !== 'function') {
      console.error('incorrect list data', listData);
      return null;
    }

    return (
      <As {...rest}>
        {listData.map((data, index) => {
          const item = this.block(`${id}.${index}`);

          return children(item, index);
        })}
        {this.editMode && children(this.block(`${id}.${listData.length}`), listData.length)}
      </As>
    );
  }

  Object = ({ id, keys, uploadable = [], index, help, as: As = this.editMode ? 'div' : Fragment, children, className = '', ...rest }) => {
    return (
      <As key={index} {...rest} {...this.editMode && { 'className': `position-relative ${className}` }}>
        {children}
        {this.editMode && (
          <details className="wx-block text-muted" data-wx-path={this.id(id)}>
            <summary />
            <dl className="border border-light">
              {keys.split(',').map(key => (
                <Fragment key={key}> 
                  <dt title={help?.[key]}>{key}</dt>
                  <dd><this.Text id={[id, key].filter(Boolean).join('.')} /></dd>
                  {uploadable.includes(key) && (
                    <dd>
                      <input
                        type="file"
                        data-wx-upload={this.id([id, key].filter(Boolean).join('.'))}
                        className="form-control form-control-sm"
                      />
                    </dd>
                  )}
                </Fragment>
              ))}
            </dl>
          </details>
        )}
      </As>
    );
  }

  Image = ({ id, keys = 'url,alt', ...rest }) => {
    const data = this.get(id) || {};

    if (!this.editMode && !data.url) return null;

    return (
      <this.Object id={id} keys={keys} uploadable={['url']}>
        <img
          src={this.editMode && !data.url
            ? 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
            : data.url
          }
          loading="lazy"
          alt={data.alt}
          {...this.editMode && { style: { minHeight: 32, maxWidth: '100%' } }}
          {...rest}
        />
      </this.Object>
    );
  }

  Button = ({ id, children, as: As, keys = 'text', ...rest }) => {
    const data = this.get(id) || {};

    return (
      <this.Object id={id} keys={keys} as={As}>
        <button {...rest}>{data.text || children}</button>
      </this.Object>
    );
  }

  Link = ({ id, children, as: As, keys = 'url,text,rel,target', ...rest }) => {
    const data = this.get(id) || {};
    const href = data.url || rest.href;
    const rel = data.rel || rest.rel;
    const target = data.target || rest.target;

    return (
      <this.Object id={id} keys={keys} as={As}>
        <a href={href} rel={rel} target={target} {...rest}>{data.text || children}</a>
      </this.Object>
    );
  }
}
