// Build a lossless home-page view from the complete catalog. Every other route can request the full catalog.
// This contains the actual home data: collection/chapter counts, all landmark papers, bridge targets,
// the longest chain and the selected workhorses. No home section needs the complete node graph or statements.
export const HOME_JSON_BUDGET = 300000;
export function makeHomeCatalog(index, planned) {
  const byId = new Map([...index.items, ...planned].map(it => [it.id, it]));
  const cites = new Map(index.items.map(it => [it.id, 0]));
  for (const it of index.items) for (const id of it.deps) if (cites.has(id)) cites.set(id, cites.get(id) + 1);
  const deepest = index.items.reduce((a, b) => !a || b.depth > a.depth ? b : a, null), chain = [];
  for (let current = deepest; current;) {
    chain.unshift(current.id);
    current = current.deps.map(id => byId.get(id)).filter(Boolean).sort((a, b) => b.depth - a.depth)[0];
  }
  const perCol = new Map();
  const pillars = index.items.filter(it => it.kind !== 'Definition')
    .sort((a, b) => cites.get(b.id) - cites.get(a.id) || b.desc - a.desc)
    .filter(it => { const n = perCol.get(it.col) || 0; if (n >= 4) return false; perCol.set(it.col, n + 1); return true; }).slice(0, 12);
  const selected = new Set([...chain, ...pillars.map(it => it.id)]);
  for (const it of [...index.items, ...planned]) if (it.kind === 'Paper') selected.add(it.id);
  for (const B of index.bridges) for (const step of B.steps) selected.add(step.id);
  return {
    generated: index.generated, bootstrap: true,
    fields: index.fields, collections: index.collections, bridges: index.bridges,
    fieldEdges: index.fieldEdges, paperCount: index.paperCount, plannedCount: index.plannedCount,
    items: index.items.filter(it => selected.has(it.id)),
    planned: planned.filter(it => selected.has(it.id)),
    home: {
      itemCount: index.items.length, vizCount: index.items.filter(it => it.viz).length,
      edgeCount: index.items.reduce((sum, it) => sum + it.deps.length, 0), chain,
      pillars: pillars.map(it => it.id), cited: Object.fromEntries(pillars.map(it => [it.id, cites.get(it.id)])),
    },
  };
}
