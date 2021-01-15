const { windowDoc, guessType, uriPath } = require('./util');

export const mdld = (md, opts: { heading?: string } = {}) => {
  md.core.ruler.after('inline', 'mdld-link', function (state) {
    const { kb }: { kb } = md.options;
    if (!kb) {
      throw Error('no kb');
    }
    let nextHeading = false;

    state.tokens.forEach((blockToken) => {
      const source = kb.source || windowDoc();
      const withFragment = (what) => what + (opts.heading ? `#${opts.heading.replace(/ /g, '-').toLowerCase()}` : '');
      if (nextHeading) {
        opts.heading = blockToken.content;
        nextHeading = false;
        //           const SPATH = 'xpath';
        // let fullschema = kb.withSchema(SPATH, uriPath(source), 'Text');
        // const spath = { subject: withFragment(source), predicate: fullschema, object: source, source, blank: true };
        // console.log(SPATH, opts.heading, spath);
        // kb.addQuad(spath);
      } else if (blockToken.type === 'heading_open') {
        nextHeading = true;
      }
      let value;
      if (blockToken.type === 'inline' && blockToken.children) {
        blockToken.children.forEach((token) => {
          // markdown-it parsing types
          const { type } = token;
          if (type === 'link_open') {
            for (let [k, v] of token.attrs) {
              if (k === 'href') {
                value = decodeURIComponent(v);
              }
            }
          } else if (type === 'image') {
            if (token.attrs && token.attrs[0] && token.attrs[0] && token.attrs[0][0] === 'src') {
              value = token.attrs[0][1];
            } else {
              value = token.children[0]?.content;
            }
            if (!value) {
              console.log('could not find image', token);
            }
          }
          // value is extracted from children
          if (type === 'text' || type === 'image') {
            if (!value) {
              return false;
            }
            const { content } = token;
            const [label, schemaIn, inType] =
              content.indexOf(':') > -1 ? content.split(/:(?!\/)/) : [content, 'link', undefined];
            const location = uriPath(source);
            const schema = schemaIn?.replace(/\;.*/, '');
            let fullschema = kb.withSchema(schema, location, inType || guessType(value));
            const [subject, predicate, object] = [label || source, fullschema, value];
            kb.addQuad({ subject: withFragment(subject), predicate, object, source, blank: !!label });
          }
        });
      }
    });
    return false;
  });
};
