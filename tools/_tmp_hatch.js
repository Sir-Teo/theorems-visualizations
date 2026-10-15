export default { collection: 'physio', chapter: 99, items: [ { num: '99.1', kind: 'Concept', name: 't', viz(v) {
  const s = v.stage({ x: [-50, 50], y: [-2, 42], equal: true, axes: false, height: 290 });
  v.render(() => { s.clip(() => { for (let k = -60; k < 60; k += 2) s.line(k, 0, k + 50, 50, { color: 'muted', width: 1 }); }, [-5, 5], [0, 5]); s.rect(-40, 10, -20, 20, { fill: 'blue', hatch: true, evenodd: true }); });
} } ] };
