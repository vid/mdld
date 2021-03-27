import { TFindResult } from '../finder';
import { flattenHits, parseDate } from '../util';
import { Quad } from '../defs';

interface IQuadWithDate {
  subject: string;
  quad: Quad;
  date?: Date;
  label: string;
}

export class Gantt {
  finder: any;
  constructor(finder) {
    this.finder = finder;
  }
  bare(what) {
    return what.replace(/#.*/, '');
  }
  asLabel(what) {
    return (this.finder.findNotePath(what) || what).replace(/.*\//, '');
  }
  asTag(what) {
    return encodeURIComponent(what).replace(/[^\w]/g, '_');
  }

  // return a list of unique subjects, sorted by date
  // FIXME this is overly complex and probably not useful
  subjectsByDate(found: Quad[]): IQuadWithDate[] {
    const unique = found.map((r) => this.asLabel(r.subject)).filter((r, i, a) => a.indexOf(r) === i);
    const sbd = unique.map((u) => {
      const date = found.find((f) => f.subject === u && f.predicate === 'date');

      const dm = date ? { date: parseDate(date.object) } : {};
      return { subject: u, label: this.asLabel(u), quad: date, ...dm };
    });

    const sorted = sbd.sort((a, b) => a.date - b.date);

    return sorted;
  }

  ganttDate(d) {
    return [d.getFullYear(), ...[d.getMonth() + 1, d.getDate()].map((a) => String(a).padStart(2, '0'))].join('-');
  }
  generateGantt(results: TFindResult, title: string) {
    const found = flattenHits(results.found);
    const NL = `\n       `;
    let gantt = `gantt
       dateFormat YYYY-MM-DD
       title ${title || 'Gantt view'}`;

    const subjects = this.subjectsByDate(found);
    let lastSection: string | undefined = undefined;
    subjects.forEach(({ subject, label, date }) => {
      const predicates = found
        .filter((afound) => afound.subject === subject)
        .reduce<{ [name: string]: string }>((all, r) => ({ ...all, [r.predicate]: r.object }), {});
      const renderFields: { [index: string]: any } = {
        status: () => predicates.status,
        name: () => predicates.name || this.asTag(label),
        start: () => date && this.ganttDate(date),
        after: () => predicates.after && 'after ' + this.asTag(predicates.after),
        duration: () => (predicates.duration ? predicates.duration : '2d'), // 2d is min to see line marker
      };
      const desc = Object.entries(renderFields)
        .map(([, func]) => func())
        .map((f) => (f ? f + ',' : ''))
        .join(' ')
        .padEnd(20)
        .replace(/, *$/, '');
      if (predicates.section !== lastSection) {
        lastSection = predicates.section;
        gantt += NL + `section ${predicates.section}`;
      }

      gantt += NL + (predicates.name || label.replace(/#.*/, '').padEnd(20)) + ':' + desc;
    });
    gantt += `\n`;
    subjects.forEach(({ date, label, quad }) => {
      // NB their parser stops on )
      const click = NL + `click ${this.asTag(label)} call clickTask("${encodeURI(JSON.stringify({ date, ...quad }))}")`;
      gantt += click;
    });

    return gantt;
  }
}
