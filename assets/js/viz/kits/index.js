// Visualization kits: higher-level building blocks exposed on the viz API as v.<name>(...).
// Each kit module exports a factory make(api, rt, ...args); register it in KITS below.
// Content never imports kits directly — it calls v.<name>(...). See AUTHORING.md §5 and docs/kits.md.
import graph, { graphs } from './graph.js';
import steps from './steps.js';
import table from './table.js';

export const KITS = {
  graph,   // v.graph(stage, spec) → Graph: node-link diagrams, layouts, editing, bfs/dfs/dijkstra/topoSort/mst/maxflow
  graphs,  // v.graphs(name, ...args) → {nodes, edges, layout} generators (random, grid, complete, cycle, petersen, …)
  steps,   // v.steps({frames, code, speed}) → step-through player with pseudocode + notes
  table,   // v.table(stage, spec) → grids of cells: DP, Cayley, payoff, truth and transition tables
};
