import MD from 'markdown-it';

import { flattenHits } from './util';
import Finder from './finder';
import { KB } from './KB';
import { mdld } from './mdld';

const origin = 'https://nicer.info';

const tests = {
  [`${origin}/werk/w1`]: `
[:path](/path1/me)
[t1:todo](follow-up)
[t2:prop](follow-up)`,
  [`${origin}/werk/w2`]: `
[:path](/other)
[t3:todo](follow-up)
[t4:todo](assign)`,
  [`${origin}/home/h1`]: `
[:path](/other)
[h1:todo](follow-up)
[h2:todo](relax)`,
};

let kb;

beforeEach(() => {
  kb = new KB('https://nicer.info');
  const md = MD({ kb }).use(mdld);
  Object.entries(tests).forEach(([t, text]) => {
    // FIXME not the nicest way to carry doc name
    kb.source = t;
    md.render(text);
  });
});

// paths
test('findNotePath', () => {
  const finder = new Finder(kb);
  const path = finder.findNotePath('/werk/w1');
  expect(path).toBe('/path1/me');
});
test('findPathNote', () => {
  const finder = new Finder(kb);
  const path = finder.findPathNote('/other');
  expect(path).toBe('/werk/w2');
});
test('findPathNotes', () => {
  const finder = new Finder(kb);
  const path = finder.findPathNotes('/other');
  expect(path).toEqual(['/werk/w2', '/home/h1']);
});

// queries
test('A table using "using"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table using todo');
  expect(Object.keys(found).length).toBe(3);
  
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(2);
  expect(found['/home/h1'].hits.length).toBe(2);
});
test('A table using "matching"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table matching follow-up');
 
  expect(Object.keys(found).length).toBe(3);
  expect(found['/werk/w1'].hits.length).toBe(2);
  expect(found['/werk/w2'].hits.length).toBe(1);
  expect(found['/home/h1'].hits.length).toBe(1);
});
test('A table using "matching" with a field', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table matching predicate:todo');
  expect(Object.keys(found).length).toBe(3);
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(2);
  expect(found['/home/h1'].hits.length).toBe(2);
});
test('A table using "from"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table from source:/werk/');
  expect(Object.keys(found).length).toBe(2);
  expect(found['/werk/w1'].hits.length).toBe(3);
  expect(found['/werk/w2'].hits.length).toBe(3);
});
test('A table using "from" from a path', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table from source:/path1/');
  expect(Object.keys(found).length).toBe(1);
  expect(found['/werk/w1'].hits.length).toBe(3);
});
test('A table using "matching" and "from"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table matching predicate:todo from source:/werk/');
  expect(Object.keys(found).length).toBe(2);
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(2);
});
test('A table using "and"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table matching predicate:todo and object:follow-up');
  expect(Object.keys(found).length).toBe(3);
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(1);
  expect(found['/home/h1'].hits.length).toBe(1);
});
test('A concept', () => {
  const finder = new Finder(kb);
  finder.find('A concept Todos matching predicate:todo');
  const concepts = Object.keys(kb.concepts);
  expect(concepts.length).toBe(1);
  expect(kb.concepts[concepts[0]].findists).toEqual([{ inFields: ['predicate'], q: 'todo', type: 'matching' }]);
});
test('A table using a concept', () => {
  const finder = new Finder(kb);
  finder.find('A concept Todos matching predicate:todo');
  const { found } = finder.find('A table of Todos');
  expect(Object.keys(found).length).toBe(3);
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(2);
  expect(found['/home/h1'].hits.length).toBe(2);
});
test('A table using a concept and "from"', () => {
  const finder = new Finder(kb);
  finder.find('A concept Todos matching predicate:todo from source:/home/');
  const { found } = finder.find('A table of Todos');
  expect(Object.keys(found).length).toBe(1);
  expect(found['/home/h1'].hits.length).toBe(2);
});
test('A table using a concept, "from" and "and"', () => {
  const finder = new Finder(kb);
  finder.find('A concept Todos matching predicate:todo from source:/home/ and object:relax');
  const { found } = finder.find('A table of Todos');
  expect(Object.keys(found).length).toBe(1);
  expect(found['/home/h1'].hits.length).toBe(1);
});
test('A table using "using"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table using todo from source:/home/h1');
  const hits = flattenHits(found);
  expect(hits.length).toEqual(2);
  expect(hits.every((h) => h.predicate === 'todo')).toBe(true);
});
test('A table using "without"', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A table without todo from source:/home/h1');
  const hits = flattenHits(found);
  expect(hits.length).toEqual(1);
  expect(hits.every((h) => h.predicate === 'todo')).toBe(false);
});
test('A table using including', () => {
  const finder = new Finder(kb);
  const { including } = finder.find('A table including object,source');
  expect(including).toEqual(['object', 'source']);
});
test('Removes punctuation spaces', () => {
  const finder = new Finder(kb);
  const { including, found } = finder.find('A table matching predicate: todo including object, source');
  expect(including).toEqual(['object', 'source']);
  expect(Object.keys(found).length).toBe(3);
  expect(found['/werk/w1'].hits.length).toBe(1);
  expect(found['/werk/w2'].hits.length).toBe(2);
  expect(found['/home/h1'].hits.length).toBe(2);
});

test('A network', () => {
  const finder = new Finder(kb);
  const { found } = finder.find('A network matching predicate: todo');
  expect(Object.keys(found).length).toBe(3);
});

// A table matching predicate:todo with concept
