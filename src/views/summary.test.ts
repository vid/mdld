import MD from 'markdown-it';

import { mdld } from '../mdld';
import { KB } from '../KB';
import Finder from '../finder';
import { getUnique } from '../util';
import * as summary from './summary';

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
[t3:after](t1)
[t3:after](t2)
`;

describe('generate summary', () => {
  const kb = new KB('http://nicer.info');
  const md = MD({ kb }).use(mdld);

  kb.source = '/test';
  md.render(test);
  it('renders a summary', () => {
    const finder = new Finder(kb);
    const results = finder.find('A summary from /test using duration,after,date');
    const using = getUnique('predicate', results.found);
    const res = summary.generateSummary(finder, results.found, using);

    expect(res).toEqual({
      output: `<table><tr>
<th>subject</th>
<th>date</th>
<th>duration</th>
<th>after</th>
</tr>
<tbody>
<tr><td>t1#s1</td><td><a href="June 1, 1965" target="_blank" title="June 1, 1965">June 1, 1965</a></td><td><a href="4" target="_blank" title="4">4</a></td><td></td><tr>
<tr><td>t2#s2</td><td><a href="Fall 1964" target="_blank" title="Fall 1964">Fall 1964</a></td><td><a href="5" target="_blank" title="5">5</a></td><td><a href="/test/text#s1" target="_blank" title="/test/text#s1">/test/text#s1</a></td><tr>
<tr><td>t3#s3</td><td><a href="1964" target="_blank" title="1964">1964</a></td><td><a href="9" target="_blank" title="9">9</a></td><td><a href="t1" target="_blank" title="t1">t1</a><br /><a href="t2" target="_blank" title="t2">t2</a></td><tr>
</tbody></table>`,
    });
  });
});

describe('generate summary using without', () => {
  const kb = new KB('https://nicer.info');
  const md = MD({ kb }).use(mdld);

  kb.source = '/test';
  md.render(test);
  it('renders a summary', () => {
    const finder = new Finder(kb);
    const results = finder.find('A summary from /test without date');
    const using = getUnique('predicate', results.found);
    const res = summary.generateSummary(finder, results.found, using);

    expect(res).toEqual({
      output: `<table><tr>
<th>subject</th>
<th>duration</th>
<th>after</th>
</tr>
<tbody>
<tr><td>t1#s1</td><td><a href="4" target="_blank" title="4">4</a></td><td></td><tr>
<tr><td>t2#s2</td><td><a href="5" target="_blank" title="5">5</a></td><td><a href="/test/text#s1" target="_blank" title="/test/text#s1">/test/text#s1</a></td><tr>
<tr><td>t3#s3</td><td><a href="9" target="_blank" title="9">9</a></td><td><a href="t1" target="_blank" title="t1">t1</a><br /><a href="t2" target="_blank" title="t2">t2</a></td><tr>
</tbody></table>`,
    });
  });
});
