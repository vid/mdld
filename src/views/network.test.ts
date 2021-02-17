import MD from 'markdown-it';

import { mdld } from '../mdld';
import { KB } from '../KB';
import Finder from '../finder';
import * as network from './network';
export {}

const test = `# Heading one

[:linksTo](Heading two)

# Heading two

[:linksTo](Heading one)

# Heading three

[:linksTo](Heading two)

`;

describe('generate summary', () => {
  const kb = new KB('http://nicer.info');
  const md = MD({ kb }).use(mdld);

  kb.source = '/test';
  md.render(test);
  it('renders a summary', () => {
    const finder = new Finder(kb);
    const results = finder.find('A summary from /test using duration,after,date');
    const res = network.resultsToNodesAndEdges(results)
    expect(res).toEqual({});
});
});
