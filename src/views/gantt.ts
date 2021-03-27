const mermaid = require('mermaid');
// this library has a dependency with an export which causes jest problems.

import { Gantt } from './Gantt-class';

export function generateGantt(results, finder) {
  const gantt = new Gantt(finder);
  const res = gantt.generateGantt(results, 'gantt');
  return {
    output: `<div class="mermaid">${res}</div>`,
    after: () => {
      mermaid.initialize({
        securityLevel: 'loose',
        startOnLoad: true,
      });
      mermaid.contentLoaded();
    },
  };
}
