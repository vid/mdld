import { KB, allFields } from './KB';
import { QuadHit, MetaResultMap, Field } from './defs';
import { Tokenizer } from './tokenizer';

type Findist = { type: string; inFields: Field[]; q: string };
type Filter = { type: string; q: string; exclude?: boolean };
type HitFinder = { statements: MetaResultMap; q: string; inFields: string[]; noteId: string; hitFinder: any };
export type TFindResult = {
  found: MetaResultMap;
  including: string[];
  output: string[];
};

// eslint-disable-next-line @typescript-eslint/naming-convention
type tKB = any;

export default class Finder {
  kb: tKB = undefined;

  pathPredicate: string;

  constructor(kb: tKB, pathPredicate = 'path') {
    this.kb = kb;
    this.pathPredicate = pathPredicate;
  }

  find(qs: string): TFindResult {
    const { statements } = this.kb;
    const tokens = new Tokenizer(
      qs.replace(/^An? /, '').replace(/, /g, ',').replace(/\s\s+/g, ' ').replace(/: /g, ':').trim()
    );
    const output = [];
    let name;
    let including;
    let inConcept = false;
    // for use with and, or
    let last;
    let findists: Findist[] = [];
    let filters: Filter[] = [];
    let using: string[] = [];
    const addFindist = (type, findist) => {
      last = type;
      const includesField = findist.includes(':');
      const [fields, q] = includesField ? findist.split(':') : [allFields, findist];
      if (!q) {
        throw Error(`missing q from ${findist}`);
      }
      const newFindist: Findist = { type, inFields: includesField ? [fields] : fields, q };
      if (inConcept) {
        this.kb.concepts[name].findists.push(newFindist);
      } else {
        findists.push(newFindist);
      }
    };
    const addFilter = (type, q, exclude?) => {
      last = type;
      if (!q) {
        throw Error(`missing q from ${q}`);
      }
      const newFilter = { type, q, exclude };
      if (inConcept) {
        this.kb.concepts[name].filters.push(newFilter);
      } else {
        filters.push(newFilter);
      }
    };
    while (tokens.hasNext()) {
      const t = tokens.next();
      if (['table', 'summary', 'debug', 'network', 'gantt', 'count'].includes(t)) {
        output.push(t);
      } else if (t === 'concept') {
        name = tokens.next();
        inConcept = true;
        output.push(t);
        this.kb.concepts[name] = { findists: [], filters: [] };
      } else if (t === 'where') {
        addFindist(t, tokens.next());
      } else if (t === 'matching') {
        addFindist(t, tokens.next());
      } else if (t === 'from') {
        addFindist(t, tokens.next());
      } else if (t === 'and' && last) {
        addFindist(last, tokens.next());
      } else if (t === 'of') {
        const concept = tokens.next();
        findists = [...findists, ...this.kb.concepts[concept].findists];
        filters = [...filters, ...this.kb.concepts[concept].filters];
      } else if (t === 'including') {
        including = tokens.next();
        including = including.split(',').map((i) => i.trim());
      } else if (t === 'using') {
        // always overwrites
        using = tokens.next().split(',');
        addFilter(t, using);
      } else if (t === 'without') {
        // always overwrites
        using = tokens.next().split(',');
        addFilter(t, using, true);
      } else {
        console.error('unknown directive', t, qs, tokens);
        throw Error(`unknown directive ${t}`);
      }
    }
    let found: MetaResultMap = statements;
    findists.forEach((findist) => {
      found = this.findMatches(found, findist);
    });

    filters.forEach((filter) => {
      found = this.filter(found, filter);
    });

    return { found, including, output };
  }

  filter(found: MetaResultMap, { type, exclude, q: filter }: Filter): MetaResultMap {
    Object.entries(found).forEach(([f, r]) => {
      const newHits = ((<unknown>r.hits) as QuadHit[])?.reduce((all, h) => {
        if (filter.includes(h.quad.predicate)) {
          if (exclude) {
            return all;
          }
          return [...all, h];
        } else {
          if (exclude) {
            return [...all, h];
          }
          return all;
        }
      }, []);
      r.hits = newHits;
    });

    return found;
  }

  findFromMdld({ statements, q, inFields, noteId, hitFinder }: HitFinder) {
    let hits: QuadHit[] = [];
    statements[noteId].mdld.forEach((quad) => {
      let fields = [];
      inFields.forEach((field) => {
        if (hitFinder(quad[field], q)) {
          fields.push(field);
        }
      });
      if (fields.length > 0) {
        hits.push({ fields, quad });
      }
    });
    return hits;
  }

  findFromHits({ statements, q, inFields, noteId, hitFinder }: HitFinder) {
    let hits: QuadHit[] = [];
    inFields.forEach((field) => {
      statements[noteId].hits.forEach((hit: QuadHit) => {
        if (hitFinder(hit.quad[field], q)) {
          hits.push(hit);
        }
      });
    });
    return hits;
  }

  /*
  find the first object matching pathPredicate for id
  */
  findNotePath(id) {
    let fragment = '';
    if (id.includes('#')) {
      [id, fragment] = id.split('#');
      fragment = '#' + fragment;
    }
    const noteData = this.kb.statements[id];
    if (!noteData) {
      // console.error('missing mdld for id', id);
      return;
    }
    const path = noteData.mdld.find((d) => d.predicate === this.pathPredicate);
    if (path) {
      return path.object + fragment;
    }
  }

  findPathNote(path) {
    return this._findPathNote(path, 'find');
  }

  findPathNotes(path) {
    return this._findPathNote(path, 'filter');
  }

  private _findPathNote(path, type: 'find' | 'filter') {
    return Object.keys(this.kb.statements)[type]((n) => {
      return this.kb.statements[n].mdld.find((d) => d.predicate === 'path' && d.object === path);
    });
  }

  findMatches(statements: MetaResultMap, { type, inFields: inFields, q }: Findist): MetaResultMap {
    const matchRel: MetaResultMap = {};

    let hitFinder = (where, what) => where.toLowerCase().includes(what);
    if (type === 'where') hitFinder = (where, what) => where.toLowerCase().includes(what.toLowerCase());
    if (type === 'matching') hitFinder = (where, what) => where.toLowerCase() === what.toLowerCase();
    if (type === 'from')
      hitFinder = (where, what) => {
        if (what.length < 2) {
          throw Error('From length must be greater than 1');
        }
        // always accept absolute path
        if (where.startsWith(what)) {
          return true;
        }
        const notePath = this.findNotePath(where);
        if (notePath && notePath.startsWith(what)) {
          return true;
        }
        return false;
      };

    Object.keys(statements).forEach((noteId) => {
      const finder = !!statements[noteId].hits ? this.findFromHits : this.findFromMdld;
      let hits;
      try {
        hits = finder({ statements, q, inFields, noteId, hitFinder });
      } catch (e) {
        throw Error(
          `Query failed with ${e} ` + JSON.stringify({ fields: inFields, q, input: statements[noteId] }, null, 2)
        );
      }
      if (hits.length) {
        matchRel[noteId] = { ...statements[noteId], hits };
      }
    });
    return matchRel;
  }
}
