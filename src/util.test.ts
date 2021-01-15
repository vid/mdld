import MD from 'markdown-it';

import { mdld } from './mdld';
import { KB } from './KB';
import { MetaResultMap } from './defs';
import Finder from './finder';
import { display, flattenHits } from './util';

it('flattens found', () => {
  const kb = new KB('https://nicer.info');
  const md = MD({ kb }).use(mdld);

  // FIXME not the nicest way to carry doc name
  kb.source = 'test';
  md.render(`[:val](1)\n[:val](2)`);

  const finder = new Finder(kb);
  const res = finder.find('matching predicate:val');
  const found = flattenHits(res.found);
  expect(found.length).toBe(2);
  expect(found).toEqual([
    { _type: 'Numeric', object: '1', predicate: 'val', source: 'test', subject: 'test', blank: false },
    { _type: 'Numeric', object: '2', predicate: 'val', source: 'test', subject: 'test', blank: false },
  ]);
});

it('flattens found 2', () => {
  const hits = {
    'aUJSkO-sQlisryigqjb7bw': {
      mdld: [],
      hits: [
        {
          fields: ['source'],
          quad: {
            subject: 'a',
            predicate: 'a',
            object: 'prop',
            source: 'aUJSkO-sQlisryigqjb7bw',
            blank: true,
            _type: 'URL',
          },
        },
        {
          fields: ['subject', 'object', 'source'],
          quad: {
            subject: 'aUJSkO-sQlisryigqjb7bw',
            predicate: 'path',
            object: '/test/graph/network',
            source: 'aUJSkO-sQlisryigqjb7bw',
            _type: 'URL',
          },
        },
      ],
    },
  };
  const found = flattenHits(hits as MetaResultMap);
  expect(found.length).toBe(2);
});

xit('display blank as fragment', () => {
  const kb = new KB('https://nicer.info');
  const md = MD({ kb }).use(mdld);
  const finder = new Finder(kb);
  kb.source = 'test';
  md.render(`# S1
[hi:val](1)

# S2

[hi:val](2)
`);
  const quad = flattenHits(finder.find('matching object:1').found)[0];

  const d = display(finder, quad, 'subject');
  expect(d).toBe(`<a href="test" target="_blank" title="hi#s1">hi#s1</a>`);
});
