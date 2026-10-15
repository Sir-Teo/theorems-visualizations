// Visualization kits: higher-level building blocks exposed on the viz API as v.<name>(...).
// Each kit module exports a factory make(api, rt, ...args); register it in KITS below.
// Content never imports kits directly — it calls v.<name>(...). See AUTHORING.md §5 and docs/kits.md.
import graph, { graphs } from './graph.js';
import steps from './steps.js';
import table from './table.js';
import globe, { geo } from './globe.js';
import timeline, { timelines } from './timeline.js';
import agents, { automata } from './agents.js';
import curves, { econ } from './curves.js';
import tree, { trees } from './tree.js';
import phasePlane from './pplane.js';
import fields from './fields.js';
import quantum from './quantum.js';
import mol from './mol.js';
import circuit from './circuit.js';

export const KITS = {
  graph,   // v.graph(stage, spec) → Graph: node-link diagrams, layouts, editing, bfs/dfs/dijkstra/topoSort/mst/maxflow
  graphs,  // v.graphs(name, ...args) → {nodes, edges, layout} generators (random, grid, complete, cycle, petersen, …)
  steps,   // v.steps({frames, code, speed}) → step-through player with pseudocode + notes
  table,   // v.table(stage, spec) → grids of cells: DP, Cayley, payoff, truth and transition tables
  globe,   // v.globe(stage, spec) → Globe: orthographic globe + 10 map projections, Tissot indicatrices, great circles/rhumb lines, Euler poles, coastlines (docs/kits-world.md)
  geo,     // v.geo(name, ...args) → spherical helpers: haversine, rhumb, rotate, velocity, projection, tissot, land, …
  timeline,  // v.timeline(stage, spec) → Timeline: linear / log (years ago) / broken time axes, events in lanes, spans, dependency arcs, cursor
  timelines, // v.timelines(name, ...args) → parse/format years ('66 Ma', '10,000 BCE'), ticks, lanes, geologic time scale spans
  // science kits (docs/kits-science.md); namespaces: v.quantum() / v.mol() return bound helpers, v.quantum('bloch', …) calls one
  phasePlane, // v.phasePlane(stage, spec) → planar ODEs: field/streamlines, nullclines, classified fixed points, click-launched trajectories, separatrices, H contours
  fields,     // v.fields(stage, spec) → 2D fields: draggable sources, field lines by flux, equipotentials, streamlines, heat maps, loop with live flux/circulation
  quantum,    // v.quantum() → {circuit(n), bloch(s3, ψ), diagram(s, qc), amplitudes(s, ψ), ket, state, …}: ≤ 6-qubit state-vector simulator + pictures
  mol,        // v.mol() → {draw3d(s3, mol), levels(s, spec), orbitalSlice(s, ψ), get, hydrogen, aufbau, …}: molecules, MO diagrams, hydrogen orbitals
  circuit,    // v.circuit(stage, parts) → schematic + MNA solver: dc(), ac(f), sweep(), transient(); voltage-coloured wires, current dots
  agents,    // v.agents(stage, spec) → cellular automata and agent-based models (grid or continuous), animated, with stats + A.plot(stage)
  automata,  // v.automata(name, params) → presets: life, schelling, sir, fire, voter, sandpile, walkers, gas, boids, contagion
  curves,    // v.curves(stage, spec) → economics diagrams: draggable supply/demand with tax/ceiling/floor and integrated surplus areas, indifference curves + budget, PPF, Lorenz/Gini
  econ,      // v.econ(name, ...args) → market, utility, optimum, mrs, contour, lorenz, gini, costs, simpson, root, monotone
  tree,      // v.tree(stage, spec) → phylogenies, language families, syntax/decision trees: rect/radial/tidy/unrooted layouts, collapsing, paths
  trees,     // v.trees(name, ...args) → newick, toNewick, upgma, nj, patristic, mrca, path, distance, midpoint, leaves
};
