import base64url from 'base64url';

import { MetaResultMap, Quad, QuadHit } from './defs';

// https://schema.org/DataType
export const is = {
  // eslint-disable-next-line no-restricted-globals
  Numeric: (input: any) => !isNaN(parseFloat(input)) && isFinite(input),
  URL: (input: any) => input.indexOf('://') > 0 || input.indexOf(' ') < 1,
  Boolean: (input: any) => input.toString() === 'true' || input.toString() === 'false',
  Date: (input: any) => Date.parse(input) > 0,
  Time: (input: any) => input.match(/^\d\d:\d\d:\d\d$/),
  Text: (input: any) => input === null || input === undefined || typeof input === 'string',
};

export const windowDoc = () => document.location.pathname.replace(/^\//, '');
export const guessType = (input: any) => {
  if (input === null || input === undefined) {
    return 'Text';
  }
  return Object.keys(is).find((w) => !!is[w](input)) || 'Text';
};

export const $x = function $x(path) {
  const xpath = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const temp = [];
  for (let i = xpath.snapshotLength - 1; i >= 0; i--) {
    temp.push(xpath.snapshotItem(i));
  }
  return temp;
};

export const uriPath = (uri: string) => uri.substr(0, uri.lastIndexOf('/'));

export const htmlsafe = (str) => str.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// let's reproduce this a third time
export const encodeNoteId = (id) => {
  // remove dashes in UUID and encode in url-safe base64
  const str = id.replace(/-/g, '');
  const hexStr = Buffer.from(str, 'hex');
  return base64url.encode(hexStr);
};

export function flattenHits(found: MetaResultMap): Quad[] {
  const f = Object.keys(found).reduce((all, i) => [...all, ...(found[i].hits as QuadHit[]).map((q) => q.quad)], []);
  return f;
}

/*
 * return the unique terms of type from found
 */

export function getUnique(type, found: MetaResultMap) {
  const allTypes = [];
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  Object.entries(found).forEach(([, r]) => {
    ((<unknown>r.hits) as QuadHit[])?.forEach((h) => {
      allTypes.push(h.quad[type]);
    });
  });
  return allTypes.filter(onlyUnique);
}

/*
 * Basic display of a quad
 */
export function display(finder, quad: Quad, field) {
  const what = quad[field];
  let show = what;
  let dest = what;

  if (show.startsWith('/uploads/')) {
    show = `<img src="${show}" alt="${what}"></img>`;
  } else if (field === 'subject' || field === 'object') {
    if (quad.blank) {
      const [w, f] = what.split('#');
      const src = (quad.blank && finder.findNotePath(quad.source)) || w;
      dest = f ? `${src}#${f}` : src;
    } else {
      show = finder.findNotePath(what) || what;
    }
  } else if (field === 'source') {
    show = finder.findNotePath(what) || what;
  } else if (field === 'object') {
    dest = finder.findPathNote(what);
  }
  const { search } = window.location;
  const withSearch = dest?.includes('#') ? dest.replace(/#/, `${search}#`) : dest + search;
  return `<a href="${withSearch}" target="_blank" title="${what}">${show}</a>`;
}

export function parseDate(inp) {
  let d;
  if (!inp) {
    d = new Date();
  } else if (inp.match(/^fall /i)) {
    d = new Date('Sept 22, ' + inp.replace(/[^\d]/g, ''));
  } else if (inp.match(/^\d{4}$/)) {
    d = new Date('Jan 1, ' + inp);
  } else {
    d = new Date(inp);
  }

  return d;
}
