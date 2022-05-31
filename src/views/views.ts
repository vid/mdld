import { allFields } from '../KB';
import Finder, { TFindResult } from '../finder';
import { display, flattenHits, getUnique } from '../util';
import { switchables, applyToPathTitle } from '../web';
import { UPDATING, Q_PLACEHOLDER, Q_QUERY, Q_RESULTS } from '../dom-paths';
import { generateGantt } from './gantt';
import { generateNetwork, generateHierarchy } from './network';
import { generateSummary } from './summary';

export default class Views {
  finder: Finder;

  constructor(finder: Finder) {
    this.finder = finder;
  }

  updateQueryResults(i, results) {
    i.getElementsByClassName(Q_RESULTS)[0].innerHTML = results;
    i.getElementsByClassName(Q_QUERY)[0].classList.remove(UPDATING);
  }

  updateQueries() {
    const queries = document.getElementsByClassName(Q_PLACEHOLDER);
    console.log('updating', queries);
    let n = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const i of queries as any) {
      n += 1;
      const q = i.getElementsByClassName(Q_QUERY)[0].innerHTML;
      try {
        const results: TFindResult = this.finder.find(q.replace(/[\[\]]/g, ''));
        const { found, including, output } = results;
        const using = getUnique('predicate', found);
        let outputPre = '';
        const fields = including || allFields;
        const view = switchables[q] || output[0] || 'count';
        if (output.length > 1) {
          const ia = (type) => (view === type ? ' view-selected' : '');
          outputPre = output
            .map((o) => ` <button class="switchable${ia(o)}" data-q="${q}" data-type="${o}">${o}</button>`)
            .join('\n');
        }
        if (view === 'concept') {
          this.updateQueryResults(i, `${outputPre}<span />`);
        } else if (view === 'summary') {
          const { output: summary } = generateSummary(this.finder, found, using);
          this.updateQueryResults(i, outputPre + summary);
        } else if (view === 'table') {
          let res = '';
          const quads = flattenHits(found);
          quads.forEach((quad) => {
            res += '<tr><td>' + fields.map((f) => display(this.finder, quad, f)).join('</td><td>') + '</td></tr>\n';
          });
          const thead = '<tr><th>' + fields.join('</th><th>') + '</th></tr>\n';
          this.updateQueryResults(i, `${outputPre}<table>${thead}<tbody>${res}</tbody></table>`);
        } else if (view === 'debug') {
          this.updateQueryResults(
            i,
            `${outputPre}<div><pre>${JSON.stringify(flattenHits(found), null, 2)}</pre></div>`
          );
        } else if (view === 'hierarchy') {
          const where = `hierarchy-${n}`;
          const { output, after } = generateHierarchy(results, this.finder, where);
          this.updateQueryResults(i, outputPre + output);
          after();
        } else if (view === 'network') {
          const where = `network-${n}`;
          const { output, after } = generateNetwork(results, this.finder, where);
          this.updateQueryResults(i, outputPre + output);
          after();
        } else if (view === 'gantt') {
          const { output, after } = generateGantt(results, this.finder);
          this.updateQueryResults(i, outputPre + output);
          after();
        } else if (view === 'count') {
          const count = Object.keys(found).reduce((all, f) => {
            return found[f] && found[f].hits ? all + found[f].hits.length : all;
          }, 0);
          this.updateQueryResults(i, `${outputPre}<p>${count} found</p>`);
        } else {
          console.error('unknown view', view);
        }
        Array.from(document.getElementsByClassName('switchable')).forEach((p) => {
          const el = <HTMLInputElement>p;
          el.addEventListener('click', (event) => {
            switchables[el.getAttribute('data-q')] = el.getAttribute('data-type');
            this.updateQueries();
          });
        });
      } catch (e) {
        console.error(e);
        this.updateQueryResults(i, `<div class="alert alert-danger">${e}</div>`);
      }
    }
  }

  /*
   * Cause queries to signal they need updating
   */
  needsUpdate() {
    applyToPathTitle((title) => title.classList.add(UPDATING));
    const queries = document.getElementsByClassName(Q_PLACEHOLDER);
    for (let i of queries as any) {
      i.getElementsByClassName(Q_QUERY)[0].classList.add(UPDATING);
    }
  }
}
