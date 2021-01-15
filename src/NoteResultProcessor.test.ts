import { NoteResultProcessor } from './NoteResultProcessor';
import { getOrigin } from './hedgedoc/server';
import { KB } from './KB';

const kb = () => new KB(getOrigin());

test('add tagged', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = 'Non tag. A tag: hello. More text.';
  const id = 'test';
  nrp.addTagged(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'URL', subject: id, predicate: 'A tag', object: 'hello', source: id },
  ]);
});
test('add tagged with no ending punctuation', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = 'Non tag. Source: https://something.something';
  const id = 'test';
  nrp.addTagged(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'URL', subject: id, predicate: 'Source', object: 'https://something.something', source: id },
  ]);
});
test('add tagged list item', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = `
Something something?

* Todo: format for text.

`;
  const id = 'test';
  nrp.addTagged(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'Text', subject: id, predicate: 'Todo', object: 'format for text', source: id },
  ]);
});
test('tagged with no text', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = `
Something something?

* Todo: .

`;
  const id = 'test';
  nrp.addTagged(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'URL', subject: id, predicate: 'Todo', object: '', source: id },
  ]);
});

test('adds questions', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = 'Non question. Like totally? More text.';
  const id = 'test';
  nrp.addQuestions(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'Text', subject: id, predicate: 'question', object: 'Like totally?', source: id },
  ]);
});
test('adds questions without list', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = `Non question. 
  
  * Like totally? 
  
  More text.`;
  const id = 'test';
  nrp.addQuestions(content, id);
  expect(nrp.kb.statements.test.mdld).toEqual([
    { _type: 'Text', subject: id, predicate: 'question', object: 'Like totally?', source: id },
  ]);
});
test('adds questions without uri', () => {
  const nrp = new NoteResultProcessor(kb());
  const content = `This is a uri https://somethingsomething.something/path?`;
  const id = 'test';
  nrp.addQuestions(content, id);
  expect(nrp.kb.statements.testld).toBeUndefined();
});
