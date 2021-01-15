/*
 * mdld implemented in CodiMD 1.6 web front-end
 */

import { debounce } from 'lodash';
// const abbr = require('./markdown-it-mdld-abbr')

import { mdldRender, queryTagPlugin } from './mdld-render';

import { KB } from './KB';
import { NoteResultProcessor } from './NoteResultProcessor';
import { windowDoc, display, $x } from './util';
import Finder from './finder';

import { MetaResultMap, Quad } from './defs';
import Views from './views/views';
import { PATH_SEARCH, PATH_TITLE, UPDATING, PATH_SELECT } from './dom-paths';

const qdkb = new KB(document.location.origin);
export const finder = new Finder(qdkb, 'path');
const views = new Views(finder);
const nrp = new NoteResultProcessor(qdkb);
const noteId = windowDoc();
// used to toggle last display results
let lastDisplayResults;
export const switchables = {};

/*
 * Web functions
 */

const formatResult = ({ noteId, result, type }, cutPath) => {
  const path = finder.findNotePath(noteId);
  const title = result.hits
    ? result.hits.map((f) => `${f.field}: ${f.text || f.quad[f.field]}`).join('\n')
    : 'text result';
  return `<a title="${title}" class="path-note-match path-note-match-${type}" href="${noteId}${
    document.location.search
  }" target="_blank">${cutPath ? path.replace(cutPath.what, cutPath.with(path)) : path}</a>`;
};
/*
 * update the displayed search results
 */
function updateSearchResultDisplay(
  allResults,
  cutPath?: { what: string; with: (string) => string },
  lastPath = undefined
) {
  const merged = [];
  // merge
  // eslint-disable-next-line no-restricted-syntax
  for (const aResult of allResults) {
    if (typeof aResult === 'string') {
      merged.push({ html: aResult });
      // eslint-disable-next-line no-continue
      continue;
    }
    Object.keys(aResult.results as MetaResultMap).forEach((nid) => {
      const result = aResult.results[nid];
      const existing = merged.find((m) => m.noteId === nid);
      if (existing) {
        existing.result.hits = [...existing.result.hits, ...result.hits];
        existing.type = 'merged';
      } else {
        merged.push({ noteId: nid, type: aResult.type, result });
      }
    });
  }
  const html = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const aResult of merged) {
    if (aResult.html) {
      html.push(aResult.html);
      // eslint-disable-next-line no-continue
      continue;
    }
    html.push(formatResult(aResult, cutPath));
  }
  document.getElementById('path-search-results').innerHTML = html.join(' ');
  lastDisplayResults = lastPath;
}

/*
 * Clear the result if a path element is re-clicked, otherwise display the path element
 */

function displayPathElement(pathElement) {
  if (pathElement === lastDisplayResults) {
    updateSearchResultDisplay([]);
    return;
  }
  const { found: results } = finder.find(`matching predicate:path from ${pathElement}`);
  const pathDisplay = {
    what: `${pathElement}/`,
    with: (path) => (path.replace(`${pathElement}/`, '').includes('/') ? '📂' : '🖹'),
  };
  updateSearchResultDisplay([{ type: 'path', results }], pathDisplay, pathElement);
}

/*
 * Update the remote search results
 */
function updateRemoteSearch(value, localSearchResults) {
  if (value.length < 1) {
    return;
  }
  fetch(`/me/notes/search/${encodeURIComponent(value)}`).then(async (response) => {
    const remoteResults: MetaResultMap = await response.json();
    updateSearchResultDisplay([localSearchResults, { type: 'remote', results: remoteResults }]);
  });
}

/*
 * update search on input
 */
const cueUpdateRemoteSearch = debounce(updateRemoteSearch, 500);

function pathSearch(value) {
  if (value.length < 1) {
    cueUpdateRemoteSearch.cancel();
    updateSearchResultDisplay([]);
    return;
  }
  const { found: results } = finder.find(`where ${value}`);
  const localSearchResults = { type: 'meta', results };
  updateSearchResultDisplay([localSearchResults, `<div class="${UPDATING}">retrieving</div>`]);
  cueUpdateRemoteSearch(value, localSearchResults);
}

/*
 *  Set up the path search for key presses
 */
function setupPathSearch() {
  document
    .getElementById(PATH_SEARCH)
    .addEventListener('input', () => pathSearch((<HTMLInputElement>document.getElementById(PATH_SEARCH)).value));
}

/*
 * capture control-k for search
 */
function setupAttentionKey() {
  document.getElementsByTagName('body')[0].onkeydown = (event) => {
    if (event.key === 'k' && event.ctrlKey) {
      document.getElementById(PATH_SEARCH).focus();
      return false;
    }
    return true;
  };
}
/*
 * Links
 */
function updateLinks() {
  const anchors = $x('//*[@id="doc"]/*/a');
  let currentPath;
  // find the path of the current note
  if (qdkb.statements[noteId]) {
    currentPath = finder.findNotePath(noteId);
  }
  anchors.forEach((anchor) => {
    let href = anchor.getAttribute('href').replace(document.location.origin, '');
    if (href.startsWith('#') || href.indexOf('://') > 0) {
      // #heading or offsite
      return;
    }

    if (!href.startsWith('/') && currentPath) {
      href = `${currentPath.substr(0, currentPath.lastIndexOf('/'))}/${href}`;
    }

    let dest = finder.findPathNote(href);
    if (dest) {
      if (!(dest as string).startsWith('/')) {
        dest = `/${dest}`;
      }
      anchor.href = dest + document.location.search;
    } else {
      // it's not found or already mapped
      console.info('no dest', dest, href);
    }
  });
}

export function applyToPathTitle(func: (any) => void) {
  const pathTitle = document.getElementById(PATH_TITLE);
  if (pathTitle) {
    func(pathTitle);
  }
}

/*
 * Path title
 * update the path title with path elements
 * path elements are clickable to show as search results
 */
function updatePathTitle() {
  if (document.getElementById(PATH_TITLE)) {
    document.getElementById(PATH_TITLE).classList.remove(UPDATING);
    const path = finder.findNotePath(noteId);
    const others = finder.findPathNotes(path).length - 1;
    let pathTitle = [];
    if (!path) {
      document.getElementById(PATH_TITLE).innerHTML = 'Note has no path';
      return;
    }
    path.split('/').reduce((a, p) => {
      a = [...a, p];
      pathTitle.push(`<span class="path-select" data-path="${a.join('/')}">${p}/</span>`);
      return a;
    }, []);
    // show a + indicator and link to path if other notes have this path
    if (others > 0) {
      pathTitle.push(` <span class="path-select" data-path="${path}">+${others}</span>`);
    }
    applyToPathTitle((title) => (title.innerHTML = pathTitle.join('')));
    // show search for path elements
    Array.from(document.getElementsByClassName(PATH_SELECT)).forEach((p) => {
      (<HTMLInputElement>p).addEventListener('click', (event) => {
        event.stopPropagation();
        displayPathElement(p.getAttribute('data-path'));
      });
    });
  }
}

/*
 * Update anything based on data
 */
function updateDataBased() {
  views.updateQueries();
  updateLinks();
  updatePathTitle();
  console.info('qdkb1', qdkb, 'note', qdkb.statements[noteId]);
}

const cueUpdateLinks = debounce(updateDataBased, 1000, { maxWait: 5000 });

/*
 * Update notes from remote
 */
function updateNotes() {
  fetch('/me/notes').then(async (response) => {
    const remoteNotes = await response.json();
    qdkb.statements = remoteNotes.noteData;
    qdkb.schemas = remoteNotes.schemas;
    updateDataBased();
  });
}

// FIXME does not work
function setupClickTask() {
  if (document.getElementById('mdld-modal')) {
    const { $ } = window as any;
    $('#mdld-modal').modal({
      keyboard: true,
      show: false,
    });
    (window as any).clickTask = (meta) => {
      const { date, subject, source, object, blank } = JSON.parse(decodeURIComponent(meta));
      document.getElementById('mdld-modal-header').innerHTML = display(
        finder,
        { subject, source, blank } as Quad,
        'subject'
      );
      $('#mdld-modal').modal('show');
      document.getElementById('mdld-modal-body').innerHTML = JSON.stringify(date) + ' from ' + object;
      return false;
    };
  }
}

export async function bootmdld(md) {
  if (!document.getElementById(PATH_SEARCH)) {
    console.info('no mdld place found');
    return;
  }
  // md.use(abbr)
  md.use(mdldRender); // needed to render link values
  console.log(queryTagPlugin);
  md.use(queryTagPlugin);

  md.ldrender = (content) => {
    nrp.setMDLD(content, noteId);
    const res = md.render(content);
    views.needsUpdate();
    cueUpdateLinks();
    return res;
  };
  // kickoff - this calls doUpdateLinks
  await updateNotes();
  (window as any).finder = finder;
  setupPathSearch();
  setupAttentionKey();
  setupClickTask();
}
