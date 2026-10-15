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
    // ---------------------------------------------------------------- agents
    {
      num: '3.6', kind: 'Model', name: 'Schelling’s segregation model',
      statement: String.raw`Agents of two kinds live on a grid with some empty cells. An agent is content if at least a fraction $t$ of its occupied neighbours are like itself; discontented agents move to a random empty cell. Even a mild preference ($t \approx 1/3$, happy as a minority) drives the city to strong segregation — a macro pattern nobody chose.`,
      caption: String.raw`Press ▶ or Step; change the tolerance $t$ at any time (the run resumes). The segregation index is the mean fraction of like neighbours: about $0.5$ for a random mix.`,
      viz(v) {
        const s = v.stage({ height: 330, weight: 1 }), ts = v.stage({ height: 330, weight: 1.15, axes: 'box', xlabel: 'step', title: 'segregation index and unhappy fraction' });
        let A = null; const tol = v.slider('tolerance $t$', 0, 0.9, 0.35, { step: 0.01, onChange: () => A.resume() });
        A = v.agents(s, { ...v.automata('schelling', { tolerance: () => tol.value, density: 0.9 }), size: 50, seed: 7, speed: 6 });
        v.render(() => { A.draw(); A.plot(ts, { series: ['segregation', 'unhappy'], colors: { segregation: 'purple', unhappy: 'red' }, minWindow: 40 }); ts.hline(A.history.segregation[0], { color: 'muted', dash: [4, 4], width: 1 }); });
        v.legend([['blue', 'kind A'], ['orange', 'kind B'], ['purple', 'segregation index'], ['red', 'unhappy fraction'], ['muted', 'initial (random) index', { dash: true }]]);
        v.readout(() => `step ${A.t} · segregation index **${v.fix(A.stats.segregation, 3)}** (start ${v.fix(A.history.segregation[0], 3)}) · unhappy ${v.fix(100 * A.stats.unhappy, 1)}%${A.model.done ? ' · **everyone is content**' : ''}`);
      },
    },
    {
      num: '3.7', kind: 'Model', name: 'An epidemic on a lattice',
      statement: String.raw`In a lattice SIR model each susceptible cell is infected by each infected neighbour with probability $\beta$ per step, and infected cells recover with probability $\gamma$. Because infection can only travel to neighbours, the epidemic is a slow expanding front: it peaks lower and later than the well-mixed (mean-field) prediction with the same contacts. It invades only if the chance $T = \beta/(\beta + \gamma - \beta\gamma)$ of passing the infection to a given neighbour exceeds the bond-percolation threshold of the lattice ($\approx 0.25$ with 8 neighbours).`,
      caption: String.raw`Five infected cells start the outbreak. Dashed curves: the mean-field model in which every cell sees the average density of infected among its 8 neighbours. Push $T$ below $0.25$ (e.g. $\beta = 0.03$) and the outbreak dies, although the mean-field model still predicts an epidemic.`,
      viz(v) {
        const s = v.stage({ height: 330 }), ts = v.stage({ height: 330, weight: 1.15, axes: 'box', xlabel: 'step', title: 'fractions S, I, R' });
        const beta = v.slider('$\\beta$ (per contact)', 0.01, 0.5, 0.12, { step: 0.01 }), gamma = v.slider('$\\gamma$ (recovery)', 0.02, 0.5, 0.1, { step: 0.01 });
        const A = v.agents(s, { ...v.automata('sir', { beta: () => beta.value, gamma: () => gamma.value, seeds: 5, center: true }), size: 100, seed: 3, speed: 15 });
        const mf = () => { // discrete-time mean field with the same update probabilities
          const out = { S: [], I: [], R: [] }; let S = 1 - 5 / 1e4, I = 5 / 1e4, R = 0; const n = Math.max(200, A.t + 1);
          for (let t = 0; t < n; t++) { out.S.push([t, S]); out.I.push([t, I]); out.R.push([t, R]); const inf = S * (1 - (1 - beta.value) ** (8 * I)), rec = gamma.value * I; S -= inf; I += inf - rec; R += rec; }
          return out;
        };
        v.render(() => {
          A.draw(); A.plot(ts, { minWindow: 200 });
          const M = mf(); for (const k of ['S', 'I', 'R']) ts.path(M[k], { color: { S: 'blue', I: 'red', R: 'faint' }[k], width: 1.3, dash: [5, 4], alpha: 0.8 });
        });
        v.legend([['blue', 'susceptible'], ['red', 'infected'], ['faint', 'recovered'], ['muted', 'mean-field model', { dash: true }]]);
        v.readout(() => { const I = A.history.I, peak = Math.max(...I), tp = A.history.t[I.indexOf(peak)], b = beta.value, g = gamma.value, T = b / (b + g - b * g); return `$T = ${v.fix(T, 2)}$ ${T > 0.25 ? '> 0.25' : '< 0.25'} · step ${A.t} · infected now ${v.fix(100 * A.stats.I, 1)}% · peak ${v.fix(100 * peak, 1)}% at step ${tp} · ever infected ${v.fix(100 * (A.stats.I + A.stats.R), 1)}%${A.model.done ? ' · **outbreak over**' : ''}`; });
      },
    },
    {
      num: '3.8', kind: 'Model', name: 'Flocking from local rules (boids)',
      statement: String.raw`Each bird steers by three local rules — keep apart from very close neighbours, match the heading of those it sees, drift towards their centre. With alignment, a disordered crowd self-organises into coherent flocks: the polarisation $|\sum v_i| / \sum |v_i|$ rises from near $0$ towards $1$. Without alignment it never does.`,
      caption: String.raw`Continuous agents in a periodic box (spatial hashing finds neighbours). Set alignment to $0$ to break the flock.`,
      viz(v) {
        const s = v.stage({ height: 300, weight: 1.4 }), ts = v.stage({ height: 300, axes: 'box', xlabel: 'step', title: 'polarisation' });
        const al = v.slider('alignment', 0, 0.2, 0.06, { step: 0.005 });
        const A = v.agents(s, { ...v.automata('boids', { align: () => al.value, n: 260 }), seed: 5, speed: 50 });
        v.render(() => { A.draw(); A.plot(ts, { series: ['order'], colors: { order: 'purple' }, names: { order: 'polarisation' }, minWindow: 300 }); });
        v.readout(() => `step ${A.t} · polarisation **${v.fix(A.stats.order, 3)}** (a random crowd of 260 gives about ${v.fix(1 / Math.sqrt(260), 2)})`);
      },
    },
    // ---------------------------------------------------------------- curves
    {
      num: '3.9', kind: 'Model', name: 'A per-unit tax and its deadweight loss',
      statement: String.raw`A tax $t$ per unit drives a wedge between the price buyers pay, $P_b$, and the price sellers keep, $P_s = P_b - t$. Trade falls from $Q^*$ to $Q_t$; part of the lost surplus becomes tax revenue $tQ_t$, the rest — the **deadweight loss** — is lost to everyone. For linear curves $\mathrm{DWL} = \tfrac12\, t\,(Q^* - Q_t)$.`,
      caption: String.raw`Drag the four handles to reshape demand and supply; slide the tax (negative = subsidy) or switch to a price ceiling or floor. Every area is integrated numerically.`,
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 106], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P' });
        const pol = v.select('policy', ['tax', 'ceiling', 'floor'], 'tax', { onChange: (m) => { if (m === 'ceiling') cap.set(38); if (m === 'floor') cap.set(66); } });
        const t = v.slider('tax $t$', -20, 40, 18, { step: 0.5 }), cap = v.slider('price limit', 5, 95, 38, { step: 0.5 });
        const E = v.curves(s, {
          demand: { linear: [[8, 92], [92, 14]] }, supply: { linear: [[8, 14], [92, 82]] },
          tax: () => (pol.value === 'tax' ? t.value : 0), ceiling: () => (pol.value === 'ceiling' ? cap.value : null), floor: () => (pol.value === 'floor' ? cap.value : null),
        });
        v.render(() => { t.el.hidden = pol.value !== 'tax'; cap.el.hidden = pol.value === 'tax'; E.draw(); });
        v.legend([['blue', 'consumer surplus'], ['orange', 'producer surplus'], ['green', 'tax revenue'], ['red', 'deadweight loss']]);
        v.readout(() => {
          const r = E.result; if (!r) return 'Curves do not cross in view.'; const f = (x) => v.fix(x, 1);
          const D = E.D, S = E.S, lin = Math.abs(D(30) - 2 * D(50) + D(70)) < 1e-9 && Math.abs(S(30) - 2 * S(50) + S(70)) < 1e-9;
          const tri = r.binding === 'tax' || r.binding === 'subsidy' ? ` = ½·t·ΔQ = ${f(0.5 * t.value * (r.q0 - r.q))}${lin ? ' ✓' : ' (curves are not linear)'}` : '';
          return `$Q^* = ${f(r.q0)}$, $Q = ${f(r.q)}$ · CS ${f(r.cs)} · PS ${f(r.psur)} · ${r.rev < 0 ? 'subsidy cost' : 'revenue'} ${f(Math.abs(r.rev))} · **DWL ${f(r.dwl)}**${tri} · CS + PS + revenue + DWL = ${f(r.total + r.dwl)} = free-market surplus ${f(r.total0)}${r.shortage ? ` · shortage ${f(r.shortage)}` : ''}${r.excess ? ` · unsold ${f(r.excess)}` : ''}`;
        });
      },
    },
    {
      num: '3.10', kind: 'Model', name: 'A Cobb–Douglas consumer',
      statement: String.raw`A consumer with utility $U(x, y) = x^{\alpha} y^{1-\alpha}$ and income $m$ chooses the bundle on the budget line $p_x x + p_y y = m$ that reaches the highest indifference curve. At an interior optimum the indifference curve is tangent to the budget line, $\mathrm{MRS} = U_x/U_y = p_x/p_y$, and Cobb–Douglas demand is $x^* = \alpha m/p_x$, $y^* = (1-\alpha)m/p_y$: a fixed share $\alpha$ of income goes to $x$.`,
      caption: String.raw`Drag either intercept to change one price (the budget line pivots about the other intercept). Switch the preferences to see a corner solution (perfect substitutes) and a kink (perfect complements).`,
      viz(v) {
        const s = v.stage({ x: [-0.4, 20], y: [-0.4, 20], height: 360, axes: 'box', xlabel: 'x', ylabel: 'y' });
        const pref = v.select('preferences', [{ value: 'cobb-douglas', label: 'Cobb–Douglas' }, { value: 'substitutes', label: 'substitutes' }, { value: 'complements', label: 'complements' }, { value: 'quasilinear', label: 'quasilinear' }], 'cobb-douglas');
        const al = v.slider('$\\alpha$', 0.1, 0.9, 0.4, { step: 0.01 });
        const E = v.curves(s, { utility: () => 0, income: 24, prices: [2, 1.6], alpha: () => al.value, beta: () => (pref.value === 'quasilinear' ? 1 : pref.value === 'complements' ? 1.5 : 1) });
        v.render(() => { E.spec.utility = pref.value; E.spec.alpha = pref.value === 'quasilinear' ? () => 6 * al.value : pref.value === 'complements' ? 1 : () => al.value; al.el.hidden = pref.value === 'complements'; E.draw(); });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curves'], ['green', 'optimal bundle']]);
        v.readout(() => {
          const C = E.consumer, o = C.opt, f = (x) => v.fix(x, 2);
          const cd = pref.value === 'cobb-douglas' ? ` · formula: $\\alpha m/p_x = ${f(al.value * C.m / C.px)}$, $(1-\\alpha)m/p_y = ${f((1 - al.value) * C.m / C.py)}$` : '';
          const pv = pref.value, tail = pv === 'complements' ? ' · at the kink the MRS is undefined: the optimum is where $x = 1.5\,y$' : pv === 'substitutes' ? ` · MRS $= ${f(C.mrs)}$ everywhere ${C.mrs < C.ratio ? '< ' : '> '}$p_x/p_y = ${f(C.ratio)}$: a corner, spend everything on ${C.mrs < C.ratio ? '$y$' : '$x$'}` : ` · MRS $= ${f(C.mrs)}$ = $p_x/p_y = ${f(C.ratio)}$ (tangency)`;
          return `$p_x = ${f(C.px)}$, $p_y = ${f(C.py)}$, $m = ${C.m}$ · optimum $(x^*, y^*) = (${f(o.x)}, ${f(o.y)})$, $U^* = ${f(o.u)}$${tail}${cd}`;
        });
      },
    },
    {
      num: '3.11', kind: 'Concept', name: 'Frontiers, cost curves and inequality',
      statement: String.raw`Three workhorse diagrams. A **production possibility frontier** bowed outwards means rising opportunity cost. **Marginal cost** cuts average variable and average total cost at their minima. The **Lorenz curve** plots the share of income held by the poorest fraction of people; the **Gini coefficient** is twice the area between it and the line of equality.`,
      caption: String.raw`PPF: drag the bundle $A$ inside, onto or beyond the frontier; the slider sets the curvature. Costs: the slider sets the fixed cost. Lorenz: the slider sets the spread of a log-normal income sample.`,
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 340, axes: 'box' });
        const mode = v.select('', [{ value: 'ppf', label: 'PPF' }, { value: 'cost', label: 'cost curves' }, { value: 'lorenz', label: 'Lorenz / Gini' }], 'ppf');
        const k = v.slider('parameter', 0, 1, 0.5, { step: 0.01 });
        const P = v.curves(s, { frontier: { a: 8, b: 7, k: () => 1 + 2.5 * k.value, point: [5, 5] } }), C = v.curves(s, {});
        const r = v.rng(4), z = Array.from({ length: 400 }, () => r.normal());
        let out = '';
        v.render(() => {
          const m = mode.value; P.front.h.visible = m === 'ppf';
          s.setTicks(null, null);
          if (m === 'ppf') { s.setView([0, 10], [0, 10]); s.o.xlabel = 'guns'; s.o.ylabel = 'butter'; P.draw(); const F = P.frontier; out = `$(x/a)^k + (y/b)^k = 1$ with $k = ${v.fix(F.k, 2)}$ · $A$ is **${F.status}** the frontier · opportunity cost of one more unit of $x$: ${v.fix(F.cost, 2)} units of $y$`; }
          if (m === 'cost') {
            s.setView([0, 40], [0, 60]); s.o.xlabel = 'q'; s.o.ylabel = 'cost per unit';
            const K = v.econ('costs', { F: 50 + 400 * k.value, a: 20, b: -1.2, c: 0.03 });
            C.curve(K.MC, { color: 'red', label: 'MC', domain: [0.5, 40] }); C.curve(K.AC, { color: 'blue', label: 'AC', domain: [2, 40] }); C.curve(K.AVC, { color: 'teal', label: 'AVC', domain: [0.5, 40] }); C.draw();
            s.dot(K.minAVC.q, K.minAVC.value, { color: 'teal', r: 4.5 }); s.dot(K.minAC.q, K.minAC.value, { color: 'blue', r: 4.5 });
            out = `min AVC at $q = ${v.fix(K.minAVC.q, 2)}$ where MC = ${v.fix(K.MC(K.minAVC.q), 3)} = AVC ${v.fix(K.minAVC.value, 3)} · min AC at $q = ${v.fix(K.minAC.q, 2)}$ where MC = ${v.fix(K.MC(K.minAC.q), 3)} = AC ${v.fix(K.minAC.value, 3)}`;
          }
          if (m === 'lorenz') {
            s.setView([0, 1], [0, 1]); s.setTicks([0.2, 0.4, 0.6, 0.8], [0.2, 0.4, 0.6, 0.8]); s.o.xlabel = 'population share'; s.o.ylabel = 'income share';
            const sig = 0.1 + 1.4 * k.value, inc = z.map((u) => Math.exp(sig * u)), G = C.lorenz(inc), exact = erf(sig / 2); // = 2Φ(σ/√2) − 1
            out = `log-normal incomes, $\\sigma = ${v.fix(sig, 2)}$ · sample Gini **${v.fix(G, 3)}** · population value $2\\Phi(\\sigma/\\sqrt2) - 1 = ${v.fix(exact, 3)}$`;
          }
        });
        function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return Math.sign(x) * y; }
        v.readout(() => out);
      },
    },
  ],
};
