import { flattenHits } from '../util';
import { MetaResultMap } from '../defs';
import { display } from '../util';

export function generateSummary(finder, found: MetaResultMap, using: string[]) {
  const quads = flattenHits(found);
  const predicates = using || quads.reduce((all, q) => {
    if (!all.includes(q.predicate)) {
      return [...all, q.predicate];
    }
    return all;
  }, []);
  const subjects = quads.reduce((all, q) => {
    if (!all.includes(q.subject)) {
      return [...all, q.subject];
    }
    return all;
  }, []);
  const thead = ['<tr>', '<th>subject</th>', ...predicates.map(p => `<th>${p}</th>`), '</tr>\n'].join('\n');
  let tbody = '<tbody>\n';
  for (let s of subjects) {
    const qs = quads.filter(q => q.subject === s);
    tbody += `<tr><td>${s}</td>`;
    for (let p of predicates) {
      const q = qs.filter(q => q.predicate === p);
      tbody += `<td>${q.map(i => display(finder, i, 'object')).join('<br />')}</td>`;
    }
    tbody += '<tr>\n';
  }
  tbody += '</tbody>'
  return { output: `<table>${thead}${tbody}</table>` };
}

