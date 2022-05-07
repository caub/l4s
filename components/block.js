import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { marked } from 'marked';
import { styled } from '@stitches/react';
import Input from './input.js';


const Details = styled('details', {
  position: 'absolute',
  backgroundColor: '#fffd',
  backdropFilter: 'blur(20px)',
  top: '-18px',
  left: '1px',
  zIndex: 99999997,

  '&:not([open])': {
    visibility: 'hidden',
    pointerEvents: 'none',
  },

  '> summary': {
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    fontSize: '.75rem',
  },
  '> summary::marker': {
    display: 'none',
    content: '""',
  },
  '> summary::before': {
    content: '"✏️"',
  },
  'form': {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(150px, 1fr)',
    gap: '.25rem .5rem',
    marginBottom: 0,
    padding: '2px',
    textAlign: 'left',
    boxShadow: '0 1px 2px 1px #0002',
  },
  'button': {
    gridColumnStart: 2,
    marginBottom: 0,
    justifySelf: 'end',
  },
  '.form-control-sm': {
    padding: '2px',
    minHeight: '1.5rem',
  },
  '.form-control-sm[type="number"]': {
    width: '4rem',
  },
});

const ObjectContainer = styled('div', {
  minWidth: '1.5rem',
  minHeight: '1.5rem',

  '&:hover': {
    outline: '1px auto #f002',
  },

  [`&:hover ${Details}`]: {
    visibility: 'visible',
    pointerEvents: 'auto',
  }
});

const TextStyled = styled('span', {
  '&:hover': {
    outline: '1px auto #f002',
  },
  '&[contenteditable=true]': {
    outline: '1px auto #f00e',
  },

  '&:empty': {
    minWidth: '50px',
    minHeight: '1em',
    display: 'inline-block',
  },
});

const Icon = styled('i', {
  display: 'inline-block',
  width: '1.5rem',
  fontSize: '90%',
  verticalAlign: 'middle',
});


export default class Block {
  constructor({ path, content, editMode, update }) {
    this.path = path;
    this.content = content;
    this.editMode = editMode;
    this.update = update;
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
    return new Block({
      path: blockPath,
      content: blockContent,
      editMode: this.editMode,
      update: this.update,
    });
  }


  Text = ({
    id,
    vars,
    markdown,
    inline,
    as: As = this.editMode ? TextStyled : markdown ? (inline ? 'p' : 'div') : Fragment,
    ...rest
  }) => {
    const text = this.text(id, vars);

    const click = (e) => {
      const el = e.target;
      const initialInnerHTML = el.innerHTML;
      el.contentEditable = true;
      el.focus();
      el.addEventListener('blur', () => {
        el.contentEditable = false;
        if (el.innerHTML === initialInnerHTML) return;
        this.update({ [this.id(id)]: el.innerHTML });
      }, { once: true });
    }

    if (markdown) {
      return (
        <As
          {...this.editMode && { as: inline ? 'p' : 'div', onClick: click  }}
          {...rest}
          dangerouslySetInnerHTML={{ __html: this.editMode ? text : inline ? marked.parseInline(text) : marked.parse(text) }}
        />
      );
    }

    return (
      <As {...this.editMode && { onClick: click }} {...rest}>
        {text}
      </As>
    );
  }

  List = ({ id, as: As = 'ul', orderBy, children, ...rest }) => {
    const listData = this.get(id) || {};
    const listKeys = Object.keys(listData);

    if (orderBy) listKeys.sort((a, b) => listData[a][orderBy]- listData[b][orderBy]);

    return (
      <As {...rest}>
        {listKeys.map((key) => {
          const keyId = [id, key].filter(Boolean).join('.');
          const item = this.block(keyId);

          return children(item, key);
        })}
        {this.editMode && children(this.block(`${id}.${listKeys.length}`), listKeys.length)}
      </As>
    );
  }

  Object = ({ id, fields, uploadable = [], as: As = this.editMode ? ObjectContainer : Fragment, children, className = '', ...rest }) => {
    const handleSubmit = this.editMode && (e => {
      e.preventDefault();

      this.update(Object.fromEntries([...e.target.elements].filter(el => el.name).map(el => [el.name, el.value])));

      e.target.closest('details').toggleAttribute('open');
    });

    return (
      <As {...rest} className={className} {...this.editMode && { className: `position-relative ${className}` }}>
        {children}
        {this.editMode && (
          <Details className="text-muted">
            <summary />
            <form className="border border-light" onSubmit={handleSubmit}>
              {Object.entries(fields).map(([key, field]) => {
                const keyId = [id, key].filter(Boolean).join('.');
                const fullId = this.id(keyId);

                return (
                  <Fragment key={key}> 
                    <label htmlFor={fullId}>{key}</label>
                    <Input
                      id={fullId}
                      name={fullId}
                      {...field}
                      value={this.get(keyId)}
                      placeholder={`[${keyId}]`}
                      className="form-control form-control-sm"
                    />
                  </Fragment>
                );
              })}
              <button className="btn btn-default btn-sm">Save</button>
            </form>
          </Details>
        )}
      </As>
    );
  }

  Image = ({ id, fields = { url: { type: 'file', required: true }, alt: {} }, ...rest }) => {
    const data = this.get(id) || {};

    if (!this.editMode && !data.url) return null;

    return (
      <this.Object id={id} fields={fields}>
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

  Link = ({ id, children, as: As, fields = { text: { required: true }, url: { pattern: '(\\w+:|/).*' }, icon: {}, target: {} }, ...rest }) => {
    const data = this.get(id) || {};
    const href = data.url || rest.href;
    const target = data.target || rest.target;
    const icon = data.icon || rest.icon;
    const content = (
      <>
        {icon && <Icon className={icon} role="img" />}
        {data.text || children}
      </>
    );

    return (
      <this.Object id={id} fields={fields} as={As} {...this.editMode && { className: 'h-100' }}>
        {href
          ? <a href={href} target={target} {...rest}>{content}</a>
          : content
        }
      </this.Object>
    );
  }
}
