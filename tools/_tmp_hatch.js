export default { collection: 'physio', chapter: 99, items: [
 { num: '99.1', kind: 'Concept', name: 't', viz(v) {
  const s = v.stage({ x: [-50, 50], y: [-2, 42], equal: true, axes: false, height: 200 });
  v.render(() => { s.rect(-40, 10, -20, 20, { fill: 'blue', hatch: true, evenodd: true }); });
 } },
 { num: '99.2', kind: 'Concept', name: 't', viz(v) {
  const s = v.stage({ x: [-50, 50], y: [-2, 42], equal: true, axes: false, height: 200 });
  v.render(() => { s.line(0,0,10,10); s.rect(-40, 10, -20, 20, { fill: 'blue', hatch: true }); });
 } },
 { num: '99.3', kind: 'Concept', name: 't', viz(v) {
  const s = v.stage({ x: [-50, 50], y: [-2, 42], equal: true, axes: false, height: 200 });
  v.render(() => { s.clip(() => {}, [0, 1], [0, 1]); s.rect(-40, 10, -20, 20, { fill: 'blue', hatch: true }); });
 } } ] };
