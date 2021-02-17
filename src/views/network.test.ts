import MD from 'markdown-it';

import { mdld } from '../mdld';
import { KB } from '../KB';
import Finder from '../finder';
import * as network from './network';
export {};

const test = `# Heading one

[:linksTo](<Heading two>)

# Heading two

[:linksTo](<Heading one>)

# Heading three

[:linksTo](Heading-two)

`;

describe('generate network', () => {
  it('renders a network', () => {
    const kb = new KB('http://nicer.info');
    const md = MD({ kb }).use(mdld);

    kb.source = '/test';
    md.render(test);
    const finder = new Finder(kb);
    const results = finder.find('A network from /test');
    const { nodes, edges } = network.resultsToNodesAndEdges(results);
    expect(nodes).toEqual([
      {
        id: 1,
        label: 'heading-one',
        title: 'Heading two',
        subject: 'heading-one',
      },
      {
        id: 2,
        label: 'heading-two',
        title: 'Heading one',
        subject: 'heading-two',
      },
      {
        id: 3,
        label: 'heading-three',
        title: 'Heading-two',
        subject: 'heading-three',
      },
    ]);
    expect(edges).toEqual([
      {
        from: 1,
        to: 2,
        label: 'linksTo',
      },
      {
        from: 2,
        to: 1,
        label: 'linksTo',
      },
      {
        from: 3,
        to: 2,
        label: 'linksTo',
      },
    ]);
  });
});
