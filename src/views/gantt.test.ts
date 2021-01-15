import { mdld } from '../mdld';
import { KB } from '../KB';
import Finder from '../finder';
import { Gantt } from './Gantt-class';
import { flattenHits } from '../util';

export {};
const test = `# S1


[t1:date](<June 1, 1965>)
[t1:duration](4)

# S2

[t2:date](<Fall 1964>)
[t2:duration](5)
[t2:after](/test/text#s1)

# S3

[t3:date](<1964>)
[t3:duration](9)
`;

describe('Sort quads', () => {
  it('sorts quads', () => {
    const kb = new KB('https://nicer.info');
    const md = require('markdown-it')({ kb }).use(mdld);

    kb.source = '/test';
    md.render(test);
    const finder = new Finder(kb);
    const gantt = new Gantt(finder);
    const results = finder.find('A gantt from /test using duration,after,date');
    const found = flattenHits(results.found);
    // FIXME should be 7
    expect(found.length).toBe(7);
    const sorted = gantt.subjectsByDate(found);
    expect(sorted.length).toBe(3);
  });
});

describe('Gantt diagram', () => {
  const kb = new KB('https://nicer.info');
  const md = require('markdown-it')({ kb }).use(mdld);

  kb.source = '/test';
  md.render(test);
  it('gets a gantt chart', () => {
    const finder = new Finder(kb);
    const gantt = new Gantt(finder);
    const results = finder.find('A gantt from /test using duration,after,date');
    const markdown = gantt.generateGantt(results, 'wtw');

    expect(markdown).toEqual(`gantt
       dateFormat YYYY-MM-DD
       title wtw
       t3                  : t3_23s3, 1964-01-01,  9
       t2                  : t2_23s2, 1964-09-22, after _2Ftest_2Ftext_23s1, 5
       t1                  : t1_23s1, 1965-06-01,  4

       click t3_23s3 call clickTask("%7B%22date%22:%221964-01-01T05:00:00.000Z%22,%22subject%22:%22t3#s3%22,%22predicate%22:%22date%22,%22object%22:%221964%22,%22source%22:%22/test%22,%22blank%22:true,%22_type%22:%22Numeric%22%7D")
       click t2_23s2 call clickTask("%7B%22date%22:%221964-09-22T05:00:00.000Z%22,%22subject%22:%22t2#s2%22,%22predicate%22:%22date%22,%22object%22:%22Fall%201964%22,%22source%22:%22/test%22,%22blank%22:true,%22_type%22:%22Text%22%7D")
       click t1_23s1 call clickTask("%7B%22date%22:%221965-06-01T05:00:00.000Z%22,%22subject%22:%22t1#s1%22,%22predicate%22:%22date%22,%22object%22:%22June%201,%201965%22,%22source%22:%22/test%22,%22blank%22:true,%22_type%22:%22Text%22%7D")`);
  });
});
