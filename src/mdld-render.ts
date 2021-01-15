/* eslint-disable no-continue */
import { Q_PLACEHOLDER, Q_QUERY, UPDATING, Q_RESULTS } from './dom-paths';

export const mdldRender = (md) => {
  function linkRender(tokens, idx) {
    if (tokens[idx].type === 'link_open' && tokens[idx + 1].content?.includes(':')) {
      const [link, text] = tokens.slice(idx, idx + 2);

      const [label, schema] = text.content.split(/:(?!\/)/);
      const value = decodeURIComponent(link.attrs[0][1]);
      tokens[idx + 1].content = `[${label || schema}] ${value}`;
    }
  }
  function scan(state) {
    for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx -= 1) {
      if (state.tokens[blkIdx].type !== 'inline') {
        continue;
      }

      const inlineTokens = state.tokens[blkIdx].children;

      for (let i = inlineTokens.length - 1; i >= 0; i -= 1) {
        if (inlineTokens[i].type !== 'link_open') {
          continue;
        }

        linkRender(inlineTokens, i);
      }
    }
  }

  md.core.ruler.push('mdld-render', scan);
};
const R_QUERY = /^\[An? .*?\]/;

// FIXME this should be a markdown-it-regex but that wasn't working, so
export const queryTagPlugin = (md) => {
  function scan(state) {
    for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx -= 1) {
      if (state.tokens[blkIdx].type === 'inline' && state.tokens[blkIdx].content.match(R_QUERY)) {
        const token = state.tokens[blkIdx].children[0];
        const match = token.content.match(R_QUERY)[0];
        token.content = `<div class="${Q_PLACEHOLDER}"><span class="${Q_QUERY} ${UPDATING}">${match}</span><span class="${Q_RESULTS}"></span></div>`;
        token.type = 'html_inline';
      }
    }
  }

  md.core.ruler.push('mdld-query', scan);
};
