import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

import { display, flattenHits } from '../util';
import finder, { TFindResult } from '../finder';

const createLabel = (key) => key.replace(/.*\//, '').replace(/.*#/, '').replace(/-/g, ' ');

// normalize to kebab case because anchors use them
const idAsKey = (fkey) => fkey.replace(/.*#/, '').replace(/ /g, '-').toLowerCase();

export function resultsToNodesAndEdges(results: TFindResult) {
  const f = flattenHits(results.found);
  const cache = {};
  let seq = 0;
  let nodes = [];

  const getOrCreateNodeWithId = (fkey, labelIn?, titleIn?) => {
    const key = idAsKey(fkey);
    if (cache[key]) {
      return cache[key];
    }
    seq++;
    cache[key] = seq;
    const label = labelIn || createLabel(fkey);
    const title = titleIn ? createLabel(titleIn) : label;
    nodes.push({ id: seq, label, title, subject: key });
    return seq;
  };
  const updateNodeWithId = (fkey, type, value) => {
    const id = cache[idAsKey(fkey)];
    const toUpdate = nodes.find((n) => n.id === id);
    if (toUpdate) toUpdate[type] = value;
  };

  f.forEach((i) => {
    getOrCreateNodeWithId(i.subject, createLabel(i.subject), i.object);
  });
  let edges = f
    .filter((i) => {
      if (i.predicate.startsWith('n-')) {
        updateNodeWithId(i.subject, i.predicate.replace('n-', ''), i.object);
        return false;
      }
      return true;
    })
    .map((i) => {
      const to = getOrCreateNodeWithId(i.object);

      const from = getOrCreateNodeWithId(i.subject);

      return { from, to, label: i.predicate };
    });

  return { nodes, edges };
}

export function generateNetwork(results: TFindResult, finder: finder, where: string) {
  return this.generate(results, finder, where, { layout: { hierarchical: true } });
}
export function generateHierarchy(results: TFindResult, finder: finder, where: string) {
  return this.generate(results, finder, where);
}
export function generate(results: TFindResult, finder: finder, where: string, options = {}) {
  return {
    output: `<div style="min-height: 800px">
<div style="height: 800px" id="${where}"></div>
<h2 id="eventSpanContent"></h2>
<pre id="eventSpanHeading"></pre>
</div>`,
    after,
  };
  function after() {
    let { nodes, edges } = resultsToNodesAndEdges(results);

    const data = { nodes: new DataSet(nodes), edges: new DataSet<any>(edges) };

    const container = document.getElementById(where);

    const network = new Network(container, data, {
      ...options,
      interaction: { hover: true },
      nodes: { shape: 'box' },
      edges: { arrows: 'to' },
    });

    network.on('click', function (params) {
      var ids = params.nodes;
      var clickedNodes = data.nodes.get(ids);
      console.log('clicked nodes:', clickedNodes);
      document.getElementById('eventSpanHeading').innerHTML = clickedNodes
        .map((c) => display(finder, c, 'subject'))
        .join(' ');
      // document.getElementById("eventSpanContent").innerText = JSON.stringify(
      //   params,
      //   null,
      //   4
      // );
      // console.log(
      //   "click event, getNodeAt returns: " +
      //   this.getNodeAt(params.pointer.DOM)
      //   , '##', params
      // );
    });
    /*
    network.on("doubleClick", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "doubleClick event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("oncontext", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "oncontext (right click) event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("dragStart", function (params) {
      // There's no point in displaying this event on screen, it gets immediately overwritten
      params.event = "[original event]";
      console.log("dragStart Event:", params);
      console.log(
        "dragStart event, getNodeAt returns: " +
        this.getNodeAt(params.pointer.DOM)
      );
    });
    network.on("dragging", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "dragging event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("dragEnd", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "dragEnd event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
      console.log("dragEnd Event:", params);
      console.log(
        "dragEnd event, getNodeAt returns: " +
        this.getNodeAt(params.pointer.DOM)
      );
    });
    network.on("controlNodeDragging", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "control node dragging event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("controlNodeDragEnd", function (params) {
      params.event = "[original event]";
      document.getElementById("eventSpanHeading").innerText =
        "control node drag end event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
      console.log("controlNodeDragEnd Event:", params);
    });
    network.on("zoom", function (params) {
      document.getElementById("eventSpanHeading").innerText = "zoom event:";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("showPopup", function (params) {
      document.getElementById("eventSpanHeading").innerText =
        "showPopup event: ";
      document.getElementById("eventSpanContent").innerText = JSON.stringify(
        params,
        null,
        4
      );
    });
    network.on("hidePopup", function () {
      console.log("hidePopup Event");
    });
    network.on("select", function (params) {
      console.log("select Event:", params);
    });
    network.on("selectNode", function (params) {
      console.log("selectNode Event:", params);
    });
    network.on("selectEdge", function (params) {
      console.log("selectEdge Event:", params);
    });
    network.on("deselectNode", function (params) {
      console.log("deselectNode Event:", params);
    });
    network.on("deselectEdge", function (params) {
      console.log("deselectEdge Event:", params);
    });
    network.on("hoverNode", function (params) {
      console.log("hoverNode Event:", params);
    });
    network.on("hoverEdge", function (params) {
      console.log("hoverEdge Event:", params);
    });
    network.on("blurNode", function (params) {
      console.log("blurNode Event:", params);
    });
    network.on("blurEdge", function (params) {
      console.log("blurEdge Event:", params);
    });
    */
  }
}
