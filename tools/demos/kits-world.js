// Demos for the world kits (globe, timeline, agents, curves, tree) — shaped like a chapter file.
// Render one: tools/harness.html?file=tools/demos/kits-world.js&id=demo-3.1&theme=light
export default {
  collection: 'demo',
  chapter: 3,
  title: 'World kit demos',
  items: [
    // ---------------------------------------------------------------- globe
    {
      num: '3.1', kind: 'Concept', name: 'Map projections and Tissot’s indicatrix',
      statement: String.raw`No flat map of the sphere keeps both angles and areas (Gauss's *Theorema Egregium*: the sphere has curvature, the plane has none). **Mercator** is conformal — small circles stay circles — but scales lengths by $\sec\varphi$ and areas by $\sec^2\varphi$; **equal-area** maps keep every area but shear shapes.`,
      caption: String.raw`Every red ellipse is the image of the same small circle (radius 6°) under the projection's Jacobian. Drag the probe $P$ on either map, drag a map to recentre it, and pick the right-hand projection.`,
      viz(v) {
        const L = v.stage({ height: 330, title: 'Mercator (conformal)' }), R = v.stage({ height: 330 });
        const G1 = v.globe(L, { projection: 'mercator', center: [10, 0], graticule: 30 });
        const G2 = v.globe(R, { projection: 'mollweide', center: [10, 0], graticule: 30 });
        const names = ['mollweide', 'lambert', 'robinson', 'equirectangular', 'orthographic', 'stereographic', 'gnomonic', 'azimuthalEquidistant', 'transverseMercator'];
        const short = { mollweide: 'Mollweide', lambert: 'Lambert', robinson: 'Robinson', equirectangular: 'Equirect.', orthographic: 'Ortho.', stereographic: 'Stereo.', gnomonic: 'Gnomonic', azimuthalEquidistant: 'Equidist.', transverseMercator: 'Transv.' };
        const sel = v.select('', names.map((n) => ({ value: n, label: short[n] })), 'mollweide');
        const P = G1.handle(15, 62, { label: 'P', color: 'accent' }); G2.handle(P);
        v.render(() => {
          G2.set({ projection: sel.value, center: sel.value === 'transverseMercator' ? [G2.center[0], 0] : G2.center });
          const az = G2.P.type === 'az';
          R.setTitle(`${G2.P.label}${G2.P.equalArea ? ' (equal-area)' : G2.P.conformal ? ' (conformal)' : ''}`);
          for (const G of [G1, G2]) {
            G.draw();
            G.tissot({ step: 30, lat: G.P.type === 'az' ? [-75, 75] : [-60, 60], radius: 6, fillAlpha: 0.2 });
            G.indicatrix(P, { radius: 6, color: 'accent', fill: 'accent', fillAlpha: 0.25, axes: true });
          }
          if (az) G2.dot(G2.center, { r: 3, color: 'ink' });
        });
        v.legend([['red', 'Tissot indicatrix (radius 6°)'], ['accent', 'indicatrix at $P$ (with principal axes)']]);
        v.readout(() => {
          const a = G1.distortion(P), b = G2.distortion(P), f = (x) => v.fix(x, 3), sec = 1 / Math.cos(P.lat * Math.PI / 180);
          const right = b ? `${G2.P.label}: $a = ${f(b.a)}$, $b = ${f(b.b)}$, area × $${f(b.area)}$, $\\omega = ${v.fix(b.omega, 1)}^\\circ$` : `${G2.P.label}: $P$ is outside the map`;
          return `$P = (${v.fix(P.lon, 1)}^\\circ, ${v.fix(P.lat, 1)}^\\circ)$ · Mercator: $a = b = ${f(a.a)}$ ($\\sec\\varphi = ${f(sec)}$), area × $${f(a.area)}$ ($\\sec^2\\varphi = ${f(sec * sec)}$), $\\omega = ${v.fix(a.omega, 2)}^\\circ$ · ${right}`;
        });
      },
    },
    {
      num: '3.2', kind: 'Concept', name: 'Great circle versus rhumb line',
      statement: String.raw`The shortest path between two points on a sphere is the minor arc of the **great circle** through them; its length is $2R\arcsin\sqrt{\sin^2\frac{\Delta\varphi}{2} + \cos\varphi_1\cos\varphi_2\sin^2\frac{\Delta\lambda}{2}}$ (haversine formula). A **rhumb line** keeps a constant compass bearing: it is straight on a Mercator map but longer, spiralling towards the pole.`,
      caption: String.raw`Drag $A$ and $B$ on the globe or on the Mercator map (drag elsewhere to rotate/pan). Green: great circle (dashed: the whole circle). Red dashed: rhumb line.`,
      viz(v) {
        const L = v.stage({ height: 330, title: 'Orthographic globe' }), R = v.stage({ height: 330, title: 'Mercator' });
        const G1 = v.globe(L, { projection: 'orthographic', center: [-30, 45], graticule: 15 });
        const G2 = v.globe(R, { projection: 'mercator', center: [-20, 0], graticule: 30 });
        const A = G1.handle(-74.0, 40.7, { label: 'A', color: 'accent' }), B = G1.handle(37.6, 55.8, { label: 'B', color: 'orange' });
        G2.handle(A); G2.handle(B);
        let gc = 0, rl = 0, sum = 0;
        v.render(() => {
          for (const G of [G1, G2]) { G.draw(); gc = G.greatCircle(A, B, { full: true }); rl = G.rhumbLine(A, B); }
          const pts = v.geo('interpolate', [A.lon, A.lat], [B.lon, B.lat], 2000); sum = 0;
          for (let i = 1; i < pts.length; i++) sum += v.geo('centralAngle', pts[i - 1], pts[i]) * Math.PI / 180 * v.geo('EARTH_KM');
        });
        v.legend([['green', 'great circle'], ['red', 'rhumb line', { dash: true }]]);
        v.readout(() => `great circle: **${G1.km(gc)}** (haversine; summing 2000 pieces of the drawn arc: ${G1.km(sum)}) · initial bearing $${v.fix(v.geo('bearing', A, B), 1)}^\\circ$ · rhumb line: **${G1.km(rl)}** at a constant $${v.fix(v.geo('rhumb', A, B).bearing, 1)}^\\circ$ · the rhumb line is ${v.fix((rl / gc - 1) * 100, 1)}% longer`);
      },
    },
    {
      num: '3.3', kind: 'Model', name: 'Plates rotate about an Euler pole',
      statement: String.raw`On a sphere every rigid motion of a plate is a rotation about an axis through the centre (Euler's rotation theorem). Points of the plate move along small circles about the **Euler pole**, with speed $v = \omega R \sin\Delta$, where $\Delta$ is the angular distance from the pole: zero at the pole, largest $90^\circ$ away.`,
      caption: String.raw`Slide back in time to close the South Atlantic: South America is rotated about Bullard's 1965 pole (drag the pole $E$ to try another). Arrows: present-day velocities of South America relative to Africa; drag $Q$ to read the speed. (A single stage pole is a simplification.)`,
      viz(v) {
        const s = v.stage({ height: 400, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-20, 0], graticule: 30 });
        const E = G.handle(-30.6, 44, { label: 'E', color: 'purple' }), Q = G.handle(-45, -10, { label: 'Q', color: 'gold' });
        const time = v.slider('time before present (Myr)', 0, 130, 60, { step: 1 });
        const SA = G.landmass('South America'), AF = G.landmass('Africa'), TOTAL = 57, OMEGA = TOTAL / 130; // °, °/Myr
        v.render(() => {
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.12, alpha: 0.35 });
          G.polygon(AF, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.4 });
          for (let t = 20; t < time.value; t += 20) G.polygon(v.geo('rotate', SA, E, OMEGA * t), { color: 'teal', width: 0.8, alpha: 0.45 });
          G.polygon(v.geo('rotate', SA, E, OMEGA * time.value), { fill: 'teal', fillAlpha: 0.4, color: 'teal', width: 1.6 });
          G.smallCircle(E, v.geo('centralAngle', E, Q), { color: 'gold', width: 1, dash: [3, 4], alpha: 0.8 });
          G.velocities(E, -OMEGA, { points: v.geo('rotate', [[-60, -5], [-50, -12], [-40, -10], [-60, -20], [-50, -25], [-65, -30], [-58, -35], [-70, -40], [-70, -48], [-68, -8], [-55, 2], [-70, 3]], E, OMEGA * time.value), scale: 30 });
          const vq = v.geo('velocity', Q, E, -OMEGA);
          G.arrow(Q, v.geo('rotate', Q, E, -OMEGA * 30), { color: 'gold', width: 2.4 });
          G.dot(E, { r: 2, color: 'purple' });
          s.corner(`${time.value} Myr ago · rotation ${v.fix(OMEGA * time.value, 1)}°`, 'tl');
          void vq;
        });
        v.legend([['orange', 'Africa (held fixed)'], ['teal', 'South America (faint: every 20 Myr)'], ['purple', 'velocity relative to Africa'], ['gold', 'flow line of $Q$', { dash: true }]]);
        v.readout(() => {
          const d = v.geo('centralAngle', Q, E), vq = v.geo('velocity', Q, E, -OMEGA);
          return `$\\omega = ${v.fix(OMEGA, 3)}^\\circ$/Myr about $E = (${v.fix(E.lon, 1)}^\\circ, ${v.fix(E.lat, 1)}^\\circ)$ · at $Q$: $\\Delta = ${v.fix(d, 1)}^\\circ$, $v = \\omega R\\sin\\Delta = ${v.fix(vq.speed, 1)}$ mm/yr towards azimuth $${v.fix(vq.azimuth, 0)}^\\circ$`;
        });
      },
    },
    // ---------------------------------------------------------------- timeline
    {
      num: '3.4', kind: 'Concept', name: 'Deep time on a logarithmic axis',
      statement: String.raw`The universe is about $13.8$ billion years old, the Earth $4.5$ billion, our species $300\,000$ years, writing about $5\,000$. On a linear axis all of human history occupies the last $0.0002\%$; on a logarithmic axis of *years ago* every factor of ten — from a decade to ten billion years — gets the same width.`,
      caption: String.raw`Switch scales to see the squeeze. Drag the red cursor (or wheel/drag to zoom and pan); click an event or era. The readout places the cursor on the "cosmic calendar" that compresses $13.8$ Gyr into one year.`,
      viz(v) {
        const s = v.stage({ height: 380, full: true });
        const ev = [['Big Bang', '13.8 Ga', 1], ['first stars', '13.6 Ga'], ['Sun forms', '4.6 Ga'], ['Earth and Moon', '4.5 Ga', 1], ['oldest zircons', '4.4 Ga'], ['stromatolites', '3.5 Ga', 1], ['Great Oxidation', '2.4 Ga'], ['eukaryotes', '1.8 Ga'], ['Snowball Earth', '720 Ma'], ['Cambrian explosion', '539 Ma', 1], ['land plants', '470 Ma'], ['tetrapods', '375 Ma'], ['end-Permian extinction', '252 Ma'], ['dinosaurs', '233 Ma'], ['K–Pg extinction', '66 Ma', 1], ['hominins', '7 Ma'], ['Homo erectus', '1.9 Ma'], ['Homo sapiens', '300 ka', 1], ['cave art', '45 ka'], ['farming', '11.7 ka'], ['writing', '3200 BCE', 1], ['printing press', '1450'], ['steam engine', '1712'], ['Moon landing', '1969'], ['World Wide Web', '1991']];
        const T = v.timeline(s, { scale: 'log', range: ['13.8 Ga', '10 yr ago'], cursor: '66 Ma', minAgo: 10, events: ev.map(([label, t, p]) => ({ label, t, priority: p || 0, color: p ? 'accent' : 'blue' })), spans: v.timelines('geologic') });
        const sc = v.select('axis', [{ value: 'log', label: 'log (years ago)' }, { value: 'linear', label: 'linear' }], 'log', { onChange: (x) => T.setScale(x) });
        v.render(() => T.draw());
        v.readout(() => {
          const ago = T.present - T.cursor, f = Math.max(0, 1 - ago / 13.8e9), day = f * 365, M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], L = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          let m = 0, d = day; while (m < 11 && d >= L[m]) { d -= L[m]; m++; }
          const hh = (d % 1) * 24, clock = `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`;
          const sp = T.spansAt().map((x) => x.label).reverse().join(', ') || 'before the Earth';
          const sel = T.selected ? ` · selected: **${T.selected.label}** (${T.fmt(T.selected.year ?? T.selected.y0)}${T.selected.y1 != null ? ' – ' + T.fmt(T.selected.y1) : ''})` : '';
          return `cursor **${T.fmt(T.cursor)}** — ${sp} · cosmic calendar: ${M[m]} ${Math.floor(d) + 1}, ${clock}${sel}`;
        });
        void sc;
      },
    },
    {
      num: '3.5', kind: 'Concept', name: 'What the printing press needed',
      statement: String.raw`Inventions have **enabling dependencies**: Gutenberg's press (c. 1450) combined paper (China, 2nd century), the screw press (Roman wine and olive presses), movable type and oil-based ink. The same web of prerequisites runs from the steam engine to the World Wide Web.`,
      caption: String.raw`A broken time axis gives the last three centuries the room they need. Arcs run from a prerequisite to what it enabled; click any invention to light up everything it depended on, directly or indirectly.`,
      viz(v) {
        const s = v.stage({ height: 330, full: true });
        const E = [['paper', 'Paper (Cai Lun)', 105], ['screw', 'Screw press', 50], ['type', 'Movable type', 1040], ['ink', 'Oil-based ink', 1440], ['press', 'Printing press', 1450, 1],
          ['newcomen', 'Steam engine', 1712], ['watt', 'Watt’s condenser', 1769], ['loco', 'Locomotive', 1804], ['volta', 'Battery', 1800], ['magnet', 'Electromagnet', 1825], ['telegraph', 'Telegraph', 1837, 1], ['dynamo', 'Dynamo', 1866],
          ['phone', 'Telephone', 1876], ['lamp', 'Light bulb', 1879], ['hertz', 'Radio waves', 1887], ['radio', 'Radio', 1895], ['tube', 'Vacuum tube', 1904], ['transistor', 'Transistor', 1947, 1], ['ic', 'Integrated circuit', 1958], ['arpanet', 'ARPANET', 1969], ['micro', 'Microprocessor', 1971], ['www', 'World Wide Web', 1991, 1]];
        const links = [['paper', 'press'], ['screw', 'press'], ['type', 'press'], ['ink', 'press'], ['newcomen', 'watt'], ['watt', 'loco'], ['volta', 'magnet'], ['volta', 'telegraph'], ['magnet', 'telegraph'], ['magnet', 'dynamo'], ['telegraph', 'phone'], ['dynamo', 'lamp'], ['telegraph', 'radio'], ['hertz', 'radio'], ['lamp', 'tube'], ['tube', 'radio'], ['tube', 'transistor'], ['transistor', 'ic'], ['ic', 'micro'], ['ic', 'arpanet'], ['phone', 'arpanet'], ['arpanet', 'www'], ['micro', 'www']];
        const T = v.timeline(s, {
          scale: 'broken', segments: [{ from: -250, to: 1500, weight: 1.15 }, { from: 1690, to: 2000, weight: 3 }],
          events: E.map(([id, label, t, p]) => ({ id, label, t, priority: p || 0 })), links,
          spans: [{ from: -206, to: 220, label: 'Han dynasty', color: 'red' }, { from: 960, to: 1279, label: 'Song', color: 'orange' }, { from: 1760, to: 1840, label: 'Industrial Revolution', color: 'gold' }, { from: 1947, to: 2000, label: 'Information age', color: 'teal' }],
        });
        T.selected = T.event('press');
        v.render(() => T.draw());
        v.readout(() => {
          const e = T.selected; if (!e || e.year === undefined) return 'Click an invention to see what it needed.';
          const need = [...T.ancestors(e.id)].map((k) => T.event(k).label), led = [...T.descendants(e.id)].map((k) => T.event(k).label);
          return `**${e.label}** (${T.fmt(e.year)}) · needed: ${need.length ? need.join(', ') : 'nothing on this chart'} · enabled: ${led.length ? led.join(', ') : '—'}`;
        });
      },
    },
  ],
};
