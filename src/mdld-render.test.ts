import MD from 'markdown-it';
import { Q_PLACEHOLDER } from './dom-paths';

import { mdldRender, queryTagPlugin } from './mdld-render';

it('displays label', () => {
  const mdr = MD();
  const expected = '<p><a href="eh%20huh">[hello] eh huh</a></p>';
  const test = '[hello:there](<eh huh>)';
  mdr.use(mdldRender);
  const value = mdr.render(test);
  expect(value.trim()).toEqual(expected);
});

it('displays schema if no label', () => {
  const mdr = MD();
  const expected = '<p><a href="eh%20huh">[there] eh huh</a></p>';
  const test = '[:there](<eh huh>)';
  mdr.use(mdldRender);
  const value = mdr.render(test);
  expect(value.trim()).toEqual(expected);
});

it('displays from text', () => {
  const mdr = MD();
  const expected = '<p>This is a test <a href="eh%20huh">[hello] eh huh</a>, well: ok?</p>';
  const test = 'This is a test [hello:there](<eh huh>), well: ok?';
  mdr.use(mdldRender);
  const value = mdr.render(test);
  expect(value.trim()).toEqual(expected);
});

it('renders A queries', () => {
  const mdr = MD();
  mdr.use(queryTagPlugin);
  mdr.use(mdldRender);
  const test = '[A table from /]';
  const value = mdr.render(test);
  expect(value.trim()).toContain(Q_PLACEHOLDER);
});
