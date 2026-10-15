// Science kit demos — worked examples of v.phasePlane, v.fields, v.quantum, v.mol and v.circuit, shaped like a chapter file.
// Render one: tools/harness.html?file=tools/demos/kits-science.js&id=demo-2.1&theme=light   (id = `demo-${num}`)

const PI = Math.PI;
const piTicks = (k0, k1) => { const out = []; for (let k = k0; k <= k1; k++) out.push([k * PI, k === 0 ? '0' : `${k < 0 ? '−' : ''}${Math.abs(k) === 1 ? '' : Math.abs(k)}π`]); return out; };

export default {
  collection: 'demo',
  chapter: 2,
  title: 'Science kit demos',
  items: [
    // ---------------------------------------------------------------- phase plane
    {
      num: '2.1', kind: 'Model', name: 'Lotka–Volterra predator–prey cycles',
      statement: String.raw`Prey $x$ and predators $y$ obey $\dot x = \alpha x - x y$, $\dot y = x y - \gamma y$. Besides the saddle at the origin there is one interior equilibrium $(\gamma, \alpha)$, and the quantity $H = x - \gamma\ln x + y - \alpha\ln y$ is conserved, so the equilibrium is a **center** and every orbit is a closed cycle. Prey crowding, $\alpha x(1 - x/K)$, destroys the conserved quantity and turns the center into a stable spiral.`,
      scope: String.raw`Well-mixed populations, no age structure; the closed cycles are structurally unstable: almost any perturbation of the model breaks them.`,
      caption: String.raw`**Click** to launch a trajectory (solid forward, faint backward); it stops once it closes up. Grey curves are level sets of $H$. Turn on crowding and the cycles spiral in.`,
      viz(v) {
        const s = v.stage({ x: [-0.25, 4.5], y: [-0.25, 3.5], height: 360, axes: 'box', xlabel: 'prey x', ylabel: 'predators y', xticks: [0, 1, 2, 3, 4], yticks: [0, 1, 2, 3] });
        const a = v.slider('$\\alpha$ (prey growth)', 0.4, 2, 1, { step: 0.01 }), g = v.slider('$\\gamma$ (predator death)', 0.4, 2, 1, { step: 0.01 });
        const crowd = v.toggle('prey crowding, $K = 6$', false);
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => [p.a * x * (p.crowd ? 1 - x / 6 : 1) - x * y, x * y - p.g * y],
          params: { a, g, crowd },
          H: (x, y, p) => (p.crowd ? NaN : x - p.g * Math.log(x) + y - p.a * Math.log(y)),
          contours: (p) => { const h0 = p.g - p.g * Math.log(p.g) + p.a - p.a * Math.log(p.a); return [0.03, 0.12, 0.27, 0.48, 0.75, 1.1, 1.55, 2.1, 2.8].map((d) => h0 + d); },
          seeds: [[1.9, 1], [2.9, 1]], trajColor: 'cycle', tMax: 80,
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => pp.draw());
        pp.legend();
        v.readout(() => {
          const tr = pp.trajectories[0], f = tr && tr.fwd;
          const orbit = !f ? '' : f.stop === 'closed orbit' ? ` · first trajectory: closed orbit, period $T = ${v.fix(f.period, 3)}$ (small-cycle limit $2\\pi/\\sqrt{\\alpha\\gamma} = ${v.fix(2 * PI / Math.sqrt(a.value * g.value), 3)}$)` : ` · first trajectory: ${f.stop}`;
          return pp.describe() + orbit;
        });
      },
    },
    {
      num: '2.2', kind: 'Model', name: 'The damped pendulum in phase space',
      statement: String.raw`With time in units of $\sqrt{L/g}$, a pendulum with linear friction obeys $\ddot\theta + b\dot\theta + \sin\theta = 0$. Its equilibria are $(k\pi, 0)$: hanging down ($k$ even) is a stable spiral for $b > 0$ and a center for $b = 0$; standing up ($k$ odd) is a saddle with eigenvalues $\lambda = \tfrac12\left(-b \pm \sqrt{b^2 + 4}\right)$. The energy $E = \tfrac12\omega^2 - \cos\theta$ obeys $\dot E = -b\,\omega^2 \le 0$.`,
      caption: String.raw`**Click** to launch trajectories. The saddles' separatrices are drawn (green: stable manifold, red: unstable); the dashed grey curve is the energy level of the saddles. Slide $b$ to $0$ to recover the frictionless pendulum.`,
      viz(v) {
        const s = v.stage({ x: [-2 * PI - 0.5, 2 * PI + 0.5], y: [-3.6, 3.6], height: 360, axes: 'box', xticks: piTicks(-2, 2), yticks: [-3, -2, -1, 0, 1, 2, 3], xlabel: 'θ', ylabel: 'ω' });
        const b = v.slider('damping $b$', 0, 1, 0.2, { step: 0.01 });
        const pp = v.phasePlane(s, {
          f: (x, y, t, p) => [y, -Math.sin(x) - p.b * y], params: { b },
          field: 'stream', nullclines: false, separatrices: true, H: (x, y) => y * y / 2 - Math.cos(x), contours: [],
          seeds: [[-4.6, 2.75]], trajColor: 'accent', tMax: 120,
        });
        v.button('Clear trajectories', () => pp.clear());
        v.render(() => pp.draw());
        pp.legend([['muted', 'saddle energy level $E = 1$', { dash: true }]]);
        v.readout(() => {
          const sad = pp.fixedPoints().find((f) => f.kind === 'saddle'), tr = pp.trajectories[0];
          const E = (p) => p[1] * p[1] / 2 - Math.cos(p[0]);
          const e = tr ? ` · launched at $E = ${v.fix(E([tr.x0, tr.y0]), 3)}$, ends (${tr.fwd.stop}) at $E = ${v.fix(E(tr.fwd.pts[tr.fwd.pts.length - 1]), 3)}$` : '';
          return `${pp.describe({ max: 3 })}${sad ? ` · saddle check: $\\tfrac12(-b\\pm\\sqrt{b^2+4}) = ${v.fix((-b.value + Math.sqrt(b.value ** 2 + 4)) / 2, 3)},\\ ${v.fix((-b.value - Math.sqrt(b.value ** 2 + 4)) / 2, 3)}$` : ''}${e}`;
        });
      },
    },
    // ---------------------------------------------------------------- fields
    {
      num: '2.3', kind: 'Law', name: "Gauss's law for a dipole",
      statement: String.raw`In the plane, a line charge $q$ produces $\mathbf E = \dfrac{q}{2\pi\varepsilon_0}\dfrac{\hat{\mathbf r}}{r}$ and the potential $\varphi = -\dfrac{q}{2\pi\varepsilon_0}\ln r$. For **every** closed curve $C$, the outward flux equals the enclosed charge: $\oint_C \mathbf E\cdot\mathbf n\,ds = q_{\text{enc}}/\varepsilon_0$, and the circulation $\oint_C \mathbf E\cdot d\mathbf s$ vanishes (the field is a gradient).`,
      caption: String.raw`Drag the charges and the green loop (centre and rim handles). Field lines leave $+$ charges in numbers proportional to $q$; red/blue curves are equipotentials. The readout integrates $\mathbf E\cdot\mathbf n$ around the loop numerically.`,
      viz(v) {
        const s = v.stage({ x: [-3.2, 3.2], y: [-2, 2], equal: true, height: 380, axes: false });
        const q2 = v.slider('$q_2$', -2, 2, -1, { step: 0.5 });
        const bg = v.select('background', ['potential', '|E|', 'none'], 'potential');
        const F = v.fields(s, {
          sources: [{ type: 'charge', x: -1, y: 0, q: 1 }, { type: 'charge', x: 1, y: 0, q: -1 }],
          lines: true, lineDensity: 10, equipotentials: { n: 16 }, heat: 'potential', loop: { type: 'circle', x: -1.35, y: 0.3, r: 0.85, handleAngle: 2.3 },
        });
        v.render(() => {
          F.setStrength(1, q2.value);
          F.draw({ heat: bg.value === 'none' ? false : bg.value === '|E|' ? 'magnitude' : 'potential' });
        });
        F.legend([['red', '$+$ charge', { dot: true }], ['blue', '$-$ charge', { dot: true }]]);
        v.readout(() => {
          const I = F.integrals(), enc = F.enclosed();
          return `flux $\\oint \\mathbf E\\cdot\\mathbf n\\,ds = ${v.fix(I.flux, 4)}$ · enclosed $q_{\\text{enc}}/\\varepsilon_0 = ${v.fix(enc.q, 4)}$ (units with $\\varepsilon_0 = 1$) · circulation $\\oint \\mathbf E\\cdot d\\mathbf s = ${v.fix(Math.abs(I.circulation) < 5e-10 ? 0 : I.circulation, 4)}$`;
        });
      },
    },
    // ---------------------------------------------------------------- quantum
    {
      num: '2.4', kind: 'Concept', name: 'Making a Bell state',
      statement: String.raw`A Hadamard on $q_0$ followed by a CNOT from $q_0$ to $q_1$ turns $|00\rangle$ into the Bell state $\tfrac{1}{\sqrt2}\left(|00\rangle + |11\rangle\right)$. Measuring gives $00$ or $11$ with probability $\tfrac12$ each, perfectly correlated, while each qubit on its own is maximally mixed: its reduced Bloch vector has length $0$ and its entanglement entropy is 1 bit.`,
      caption: String.raw`Step through the circuit with the slider or by clicking a gate. Bars show probabilities (colour = phase); the last step samples 1000 measurements (black ticks). The Bloch sphere shows $q_0$ alone: after the CNOT its vector shrinks to the centre.`,
      viz(v) {
        const Q = v.quantum();
        const qc = Q.circuit(2).h(0).cx(0, 1).measure();
        const sd = v.stage({ height: 150, axes: false, full: true });
        const sa = v.stage({ height: 270, axes: false, weight: 1.25, title: 'Measurement probabilities' });
        const s3 = v.stage3d({ height: 270, range: 1.55, title: 'Bloch vector of $q_0$ alone' });
        const step = v.slider('step', 0, 3, 3, { int: true, fmt: (k) => ['start', 'after H', 'after CNOT', 'measured'][k] });
        const rng = v.rng(2024); let counts = null, countsAt = -1;
        v.button('Resample', () => { countsAt = -1; });
        v.render(() => {
          const k = step.value, ops = k === 3 ? qc.length : k, psi = qc.state(ops);
          if (k === 3 && countsAt !== 3) { counts = psi.sample(1000, rng); countsAt = 3; }
          Q.diagram(sd, qc, { step: ops, onPick: (j) => step.set(Math.min(3, j)) });
          Q.amplitudes(sa, psi, { counts: k === 3 ? counts : null });
          Q.bloch(s3, psi, { qubit: 0 });
        });
        v.readout(() => {
          const k = step.value, psi = qc.state(k === 3 ? qc.length : k), r = Math.hypot(...psi.bloch(0));
          const c = k === 3 && counts ? ` · 1000 shots: ${Object.entries(counts.counts).map(([b, n]) => `$${b}$: ${n}`).join(', ')}` : '';
          return `$|\\psi\\rangle = ${psi.ket()}$ · $P(00) = ${v.fix(psi.prob('00'), 3)}$, $P(11) = ${v.fix(psi.prob('11'), 3)}$ · $|\\vec r_{q_0}| = ${v.fix(r, 3)}$, entropy $S(\\rho_{q_0}) = ${v.fix(psi.entropy(0), 3)}$ bit${c}`;
        });
      },
    },
    {
      num: '2.5', kind: 'Concept', name: 'Rotations on the Bloch sphere',
      statement: String.raw`$R_x(\theta) = e^{-i\theta X/2}$ rotates the Bloch vector by $\theta$ about the $x$-axis, so $R_x(\theta)|0\rangle = \cos\tfrac\theta2|0\rangle - i\sin\tfrac\theta2|1\rangle$ sweeps the great circle in the $yz$-plane and $P(1) = \sin^2\tfrac\theta2$. A following $R_z(\varphi)$ rotates about $z$: it changes only the relative phase, never the probabilities.`,
      caption: String.raw`Drag $\theta$ (gold trail: the path of the state as $\theta$ grows from $0$) and $\varphi$; drag the sphere to rotate it. Bar heights are $|a|$, colours their phase.`,
      viz(v) {
        const Q = v.quantum();
        const sd = v.stage({ height: 92, axes: false, full: true });
        const s3 = v.stage3d({ height: 320, range: 1.5, yaw: -0.95, pitch: 0.32 });
        const sa = v.stage({ height: 320, axes: false, weight: 0.75, title: 'Amplitudes' });
        const th = v.slider('$\\theta$', 0, 2 * PI, 2 * PI / 3, { step: 0.01 }), ph = v.slider('$\\varphi$', -3.14, 3.14, 0, { step: 0.01 });
        const qc = Q.circuit(1).rx(th.value, 0).rz(ph.value, 0).measure();
        v.render(() => {
          qc.setTheta(0, th.value).setTheta(1, ph.value);
          const psi = qc.state(), trail = [];
          for (let k = 0; k <= 60; k++) trail.push(Q.circuit(1).rx(th.value * k / 60, 0).rz(ph.value, 0).state().bloch(0));
          Q.diagram(sd, qc, { step: 2, left: 70 });
          Q.bloch(s3, psi, { trail, angles: true });
          Q.amplitudes(sa, psi, { mode: 'amp' });
        });
        v.readout(() => {
          const psi = qc.state(), [x, y, z] = psi.bloch(0);
          return `$|\\psi\\rangle = ${psi.ket(3)}$ · Bloch vector $(${v.fix(x, 3)}, ${v.fix(y, 3)}, ${v.fix(z, 3)})$ · $P(1) = ${v.fix(psi.prob(1), 4)}$, $\\sin^2\\tfrac\\theta2 = ${v.fix(Math.sin(th.value / 2) ** 2, 4)}$`;
        });
      },
    },
    // ---------------------------------------------------------------- molecules
    {
      num: '2.6', kind: 'Concept', name: 'Molecular shapes in 3D',
      statement: String.raw`Electron pairs around a central atom repel and spread out (VSEPR): water's two lone pairs squeeze the H–O–H angle from the tetrahedral $109.5^\circ$ to $104.5^\circ$, ammonia's one lone pair to $106.7^\circ$; benzene is a flat hexagon whose six C–C bonds are all $1.397$ Å, between a single ($1.54$ Å) and a double bond ($1.34$ Å).`,
      caption: String.raw`Drag either panel to rotate it. Choose the right-hand molecule; dashed half-bonds mark the delocalised (aromatic) ring. Distances and angles in the readout are computed from the 3D coordinates.`,
      viz(v) {
        const Mo = v.mol();
        const sL = v.stage3d({ height: 320, range: 1.25, axes: false, title: 'Water, H₂O', weight: 0.8, yaw: -0.3, pitch: 0.25 });
        const sR = v.stage3d({ height: 320, range: 3, axes: false, yaw: -0.5, pitch: 0.75, title: 'From the built-in library' });
        const names = { C6H6: 'Benzene, C₆H₆', NH3: 'Ammonia, NH₃', CH4: 'Methane, CH₄', CO2: 'Carbon dioxide, CO₂', C2H4: 'Ethylene, C₂H₄', SF6: 'Sulfur hexafluoride, SF₆', C2H5OH: 'Ethanol, C₂H₅OH' };
        const which = v.select('', Object.keys(names).map((k) => ({ value: k, label: names[k].split(',')[0] })), 'C6H6');
        const labels = v.toggle('element labels', true);
        v.render(() => {
          const M = Mo.get(which.value); let R = 0; for (const a of M.atoms) R = Math.max(R, Math.hypot(...a.pos.map((x, i) => x - M.atoms.reduce((s, b) => s + b.pos[i], 0) / M.atoms.length)));
          sR.zoom = 3 / Math.max(1.4, R + 0.7);
          Mo.draw3d(sL, 'H2O', { labels: labels.value });
          Mo.draw3d(sR, which.value, { labels: labels.value ? 'heavy' : false });
        });
        v.readout(() => {
          const k = which.value, M = Mo.get(k), b = M.bonds[0], heavy = M.bonds.find(([i, j]) => M.atoms[i].el !== 'H' && M.atoms[j].el !== 'H') || b;
          const ang = { NH3: [1, 0, 2], CH4: [1, 0, 2], CO2: [1, 0, 2], C2H4: [2, 0, 3], C6H6: [5, 0, 1], SF6: [1, 0, 3], C2H5OH: [0, 1, 2] }[k];
          return `water: O–H $= ${v.fix(Mo.distance('H2O', 0, 1), 3)}$ Å, ∠H–O–H $= ${v.fix(Mo.angle('H2O', 1, 0, 2), 1)}^\\circ$ · ${M.name} ($${Mo.formulaTeX(k)}$, $${v.fix(Mo.molarMass(k), 2)}$ g/mol): ${M.atoms[heavy[0]].el}–${M.atoms[heavy[1]].el} $= ${v.fix(Mo.distance(k, heavy[0], heavy[1]), 3)}$ Å` + (ang ? `, ∠${M.atoms[ang[0]].el}–${M.atoms[ang[1]].el}–${M.atoms[ang[2]].el} $= ${v.fix(Mo.angle(k, ...ang), 1)}^\\circ$` : '');
        });
      },
    },
    {
      num: '2.7', kind: 'Model', name: 'Molecular orbitals of H₂ — and why He₂ falls apart',
      statement: String.raw`Two 1s orbitals combine into a bonding orbital $\sigma_{1s} \propto \phi_A + \phi_B$, which piles up charge between the nuclei, and an antibonding $\sigma^*_{1s} \propto \phi_A - \phi_B$ with a nodal plane between them; the antibonding level is raised more than the bonding one is lowered. Electrons fill the levels from the bottom (Aufbau, Pauli), and the **bond order** $\tfrac12(n_{\text{bonding}} - n_{\text{antibonding}})$ predicts $\mathrm{H_2}$: 1, $\mathrm{H_2^+}$ and $\mathrm{He_2^+}$: ½, $\mathrm{He_2}$: 0 (unbound).`,
      scope: String.raw`Minimal-basis LCAO picture; level energies are schematic (eV), the orbital profiles are computed with hydrogen 1s functions at $R = 1.4\,a_0$.`,
      caption: String.raw`Pick a species: electrons are placed by Aufbau and Hund's rule. The right panel plots both molecular orbitals along the bond axis (normalised LCAO with overlap $S$).`,
      viz(v) {
        const Mo = v.mol();
        const s = v.stage({ height: 330, axes: false, weight: 1.2 });
        const sp = v.stage({ x: [-3.2, 3.2], y: [-0.85, 0.95], height: 330, axes: 'box', xticks: [-2, -1, 0, 1, 2], yticks: [-0.6, -0.3, 0, 0.3, 0.6], xlabel: 'z / a₀', ylabel: 'ψ', title: 'Along the bond axis' });
        const SP = { 'H2+': ['H', 1, 0, '\\mathrm{H_2^+}'], H2: ['H', 1, 1, '\\mathrm{H_2}'], 'H2-': ['H', 1, 2, '\\mathrm{H_2^-}'], 'He2+': ['He', 2, 1, '\\mathrm{He_2^+}'], He2: ['He', 2, 2, '\\mathrm{He_2}'] };
        const sel = v.select('species', Object.keys(SP).map((k) => ({ value: k, label: `$${SP[k][3]}$` })), 'H2');
        let info = null;
        v.render(() => {
          const [el, nl, nr, tex] = SP[sel.value], He = el === 'He', E0 = He ? -24.6 : -13.6;
          info = Mo.levels(s, {
            columns: [`$\\mathrm{${el}}\\ 1s$`, `$${tex}$`, `$\\mathrm{${el}}\\ 1s$`], unit: 'eV', energies: true, homo: true,
            levels: [{ E: E0, label: '1s', col: 0 }, { E: E0 - 1.9, label: '\\sigma_{1s}', col: 1, type: 'bonding' }, { E: E0 + 2.6, label: '\\sigma^*_{1s}', col: 1, type: 'antibonding' }, { E: E0, label: '1s', col: 2 }],
            electrons: { 0: nl, 1: nl + nr, 2: nr }, links: [[0, 1], [0, 2], [3, 1], [3, 2]], range: [E0 - 3, E0 + 3.5],
          });
          // LCAO profiles along z with nuclei at ±R/2
          const R = 1.4, phi = (z, c) => Math.exp(-Math.abs(z - c)) / Math.sqrt(PI), S = Math.exp(-R) * (1 + R + R * R / 3);
          const plus = (z) => (phi(z, -R / 2) + phi(z, R / 2)) / Math.sqrt(2 * (1 + S)), minus = (z) => (phi(z, -R / 2) - phi(z, R / 2)) / Math.sqrt(2 * (1 - S));
          sp.fn(plus, { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.12 });
          sp.fn(minus, { color: 'red', width: 2.4, fill: 'red', fillAlpha: 0.12 });
          sp.hline(0, { color: 'faint', width: 1 }); sp.vline(0, { color: 'red', dash: [4, 4], alpha: 0.6 });
          for (const c of [-R / 2, R / 2]) sp.dot(c, 0, { color: 'ink', r: 4.5 });
          sp.text('σ', -2.15, plus(-1.6) + 0.1, { color: 'green', math: true, size: 17 }); sp.text('σ*', 1.9, minus(1.6) - 0.12, { color: 'red', math: true, size: 17 });
          sp.text('nodal plane', 0.08, 0.86, { color: 'red', size: 11, align: 'left' });
        });
        v.readout(() => info ? `bond order $= ${info.bondOrder}$ ${info.bondOrder > 0 ? '(bound)' : '(no net bonding: the molecule falls apart)'} · unpaired electrons: ${info.unpaired} (${info.unpaired ? 'paramagnetic' : 'diamagnetic'}) · electronic energy $\\sum n_i E_i = ${v.fix(info.energy, 1)}$ eV vs separated atoms $${v.fix((SP[sel.value][1] + SP[sel.value][2]) * (SP[sel.value][0] === 'He' ? -24.6 : -13.6), 1)}$ eV` : '');
      },
    },
    {
      num: '2.8', kind: 'Concept', name: 'Hydrogen orbitals: phases and nodes',
      statement: String.raw`The hydrogen eigenfunctions are $\psi_{nlm} = R_{nl}(r)\,Y_{lm}(\theta,\varphi)$ with $R_{nl} \propto e^{-r/n}\,(2r/n)^l L^{(2l+1)}_{n-l-1}(2r/n)$. They have $n-l-1$ spherical (radial) nodes and $l$ angular nodes, and their energy $E_n = -13.6\text{ eV}/n^2$ depends on $n$ only.`,
      caption: String.raw`Slices through the nucleus: red $\psi > 0$, blue $\psi < 0$, dashed lines are nodes ($\psi = 0$). Change the orbitals, the slicing plane, or show the probability density $|\psi|^2$.`,
      viz(v) {
        const Mo = v.mol();
        const sl = v.stage({ x: [-13, 13], y: [-13, 13], equal: true, height: 330, xlabel: 'x', ylabel: 'z' });
        const sr = v.stage({ x: [-26, 26], y: [-26, 26], equal: true, height: 330, xlabel: 'x', ylabel: 'z' });
        const left = v.select('', ['2s', '2p_z', '2p_x'].map((k) => ({ value: k, label: `$${k.replace('p_', 'p_')}$` })), '2p_z');
        const right = v.select('', ['3p_z', '3d_{z^2}', '3d_{xz}', '3d_{x^2-y^2}', '4f_{z^3}'].map((k) => ({ value: k, label: `$${k}$` })), '3d_{z^2}');
        const plane = v.select('plane', ['xz', 'xy'], 'xz'), dens = v.toggle('$|\\psi|^2$', false);
        let A, B;
        v.render(() => {
          const lab = plane.value === 'xz' ? 'z' : 'y'; sl.o.ylabel = sr.o.ylabel = lab;
          const o = { plane: plane.value, mode: dens.value ? 'density' : 'psi' };
          A = Mo.orbitalSlice(sl, left.value, o); B = Mo.orbitalSlice(sr, right.value, o);
          sl.setTitle(`$${A.name}$ · $E_${A.n} = ${v.fix(A.E, 2)}$ eV`); sr.setTitle(`$${B.name}$ · $E_${B.n} = ${v.fix(B.E, 2)}$ eV`);
          for (const [s, X] of [[sl, A], [sr, B]]) s.corner(`${X.radialNodes} radial + ${X.angularNodes} angular node${X.radialNodes + X.angularNodes === 1 ? '' : 's'} · unit a₀`, 'bl', { size: 11.5 });
        });
        v.readout(() => A && B ? `$${A.name}$: $n-l-1 = ${A.radialNodes}$ radial, $l = ${A.angularNodes}$ angular · $${B.name}$: $${B.radialNodes}$ radial, $${B.angularNodes}$ angular · $\\langle r\\rangle = \\tfrac12\\left(3n^2 - l(l+1)\\right)a_0$ = ${v.fix((3 * A.n ** 2 - A.l * (A.l + 1)) / 2, 1)} and ${v.fix((3 * B.n ** 2 - B.l * (B.l + 1)) / 2, 1)} $a_0$` : '');
      },
    },
    // ---------------------------------------------------------------- circuits
    {
      num: '2.9', kind: 'Law', name: 'Charging a capacitor through a resistor',
      statement: String.raw`When the switch closes at $t = 0$, the capacitor voltage rises as $v_C(t) = V_0\left(1 - e^{-t/RC}\right)$ while the current decays as $i(t) = \tfrac{V_0}{R}e^{-t/RC}$. The time constant $\tau = RC$ is the time to reach $1 - e^{-1} \approx 63.2\%$ of the final voltage.`,
      caption: String.raw`The schematic is simulated (trapezoidal companion models). Wire colour is the node voltage, dots move with speed proportional to the current. Change $R$ and $C$: the curve keeps its shape in units of $\tau$.`,
      viz(v) {
        const s = v.stage({ x: [-1.6, 6.9], y: [-1, 3.95], equal: true, height: 290, axes: false, weight: 1 });
        const sp = v.stage({ x: [0, 500], y: [0, 5.6], height: 290, axes: 'box', xlabel: 't (ms)', ylabel: 'volts', weight: 1.1 });
        const V0 = 5;
        const C = v.circuit(s, [
          { type: 'V', id: 'V0', value: V0, at: [0, 3, 0, 0] },
          { type: 'SW', id: 'S', closedAt: 0, at: [0, 3, 2, 3], label: 't = 0' },
          { type: 'R', id: 'R', value: 1e3, at: [2, 3, 5, 3] },
          { type: 'C', id: 'C', value: 100e-6, at: [5, 3, 5, 0] },
          { type: 'W', at: [5, 0, 0, 0] }, { type: 'GND', at: [2.5, 0] },
          { type: 'label', at: [5, 3], text: '$v_C$', dx: 8, dy: -6 },
        ]);
        C.control('R', '$R$', 100, 10e3); C.control('C', '$C$', 10e-6, 1e-3);
        let tr = null, key = '';
        v.animate((t) => {
          const R = C.part('R').value, Cv = C.part('C').value, tau = R * Cv, k = `${R}|${Cv}`;
          if (k !== key) { key = k; tr = C.transient(5 * tau, tau / 200); }
          const time = (t % 6) / 6 * 5 * tau, snap = tr.at(time), nC = C.net.termNode.get('C').a;
          C.draw({ result: snap, t });
          sp.setView([0, 5 * tau * 1e3], [0, 5.6]);
          sp.hline(V0 * (1 - Math.exp(-1)), { color: 'muted', width: 1, dash: [2, 3] }); sp.text('63.2%', 5 * tau * 1e3, V0 * (1 - Math.exp(-1)), { dx: -6, dy: -9, color: 'muted', size: 11, align: 'right' });
          sp.vline(tau * 1e3, { color: 'muted', dash: [4, 4] }); sp.text('τ = RC', tau * 1e3, 5.35, { dx: -5, color: 'muted', size: 11.5, align: 'right' });
          sp.fn((x) => V0 * (1 - Math.exp(-x / 1e3 / tau)), { color: 'ink', width: 1.4, dash: [5, 4], alpha: 0.7 });
          sp.path(tr.series(nC).map(([tt, vv]) => [tt * 1e3, vv]), { color: 'accent', width: 2.4 });
          sp.path(Array.from(tr.t, (tt, j) => [tt * 1e3, tr.i.R[j] * R]), { color: 'orange', width: 2 });
          sp.vline(time * 1e3, { color: 'gold', width: 1.4 });
          sp.dot(time * 1e3, snap.V(nC), { color: 'accent', r: 4.5 }); sp.dot(time * 1e3, snap.I('R') * R, { color: 'orange', r: 4 });
        }, { period: 6 });
        v.legend([['accent', '$v_C$ simulated'], ['ink', '$V_0(1 - e^{-t/RC})$', { dash: true }], ['orange', '$i\\,R$ (current, scaled)'], ['gold', 'current dots']]);
        v.readout(() => {
          if (!tr) return '';
          const R = C.part('R').value, Cv = C.part('C').value, tau = R * Cv, nC = C.net.termNode.get('C').a, vt = tr.at(tau).V(nC);
          return `$\\tau = RC = ${v.fix(tau * 1e3, 1)}$ ms · simulated $v_C(\\tau) = ${v.fix(vt, 4)}$ V $= ${v.fix(vt / V0 * 100, 2)}\\%$ of $V_0$ (theory $63.21\\%$) · $i(0^+) = ${v.fix(tr.i.R[0] * 1e3, 3)}$ mA $= V_0/R$ · final energy $\\tfrac12 CV_0^2 = ${v.fix(0.5 * Cv * V0 * V0 * 1e3, 2)}$ mJ`;
        });
      },
    },
    {
      num: '2.10', kind: 'Law', name: 'Series RLC resonance',
      statement: String.raw`Driven by $V_0\cos\omega t$, a series RLC circuit carries a current of amplitude $|I| = V_0\big/\sqrt{R^2 + (\omega L - 1/\omega C)^2}$. It peaks at the resonance frequency $f_0 = \dfrac{1}{2\pi\sqrt{LC}}$, where the inductive and capacitive reactances cancel and the current is in phase with the drive; the quality factor $Q = \tfrac1R\sqrt{L/C}$ sets the width $\Delta f = f_0/Q$.`,
      caption: String.raw`The curve is an AC sweep of the drawn circuit (phasor MNA at 300 frequencies). Move the drive frequency $f$: the dots slosh back and forth with the current's amplitude and phase. Lower $R$ to sharpen the peak.`,
      viz(v) {
        const s = v.stage({ x: [-1.6, 6.8], y: [-1, 3.95], equal: true, height: 290, axes: false });
        const sp = v.stage({ x: [1.82, 4.55], y: [0, 110], height: 290, axes: 'box', xticks: [[2, '100 Hz'], [3, '1 kHz'], [4, '10 kHz']], xlabel: 'f', ylabel: '|I| (mA)', weight: 1.1 });
        const L = 10e-3, Cv = 1e-6, f0 = 1 / (2 * PI * Math.sqrt(L * Cv));
        const C = v.circuit(s, [
          { type: 'V', id: 'V', value: 1, ac: 1, at: [0, 3, 0, 0], label: '1 V ac' },
          { type: 'R', id: 'R', value: 10, at: [0, 3, 2.6, 3] },
          { type: 'L', id: 'L', value: L, at: [2.6, 3, 5.2, 3] },
          { type: 'C', id: 'C', value: Cv, at: [5.2, 3, 5.2, 0] },
          { type: 'W', at: [5.2, 0, 0, 0] }, { type: 'GND', at: [2.6, 0] },
        ]);
        const f = v.slider('drive $f$', 100, 30000, 1200, { log: true, fmt: (x) => `${x < 1000 ? x.toFixed(0) + ' Hz' : (x / 1000).toFixed(2) + ' kHz'}` });
        C.control('R', '$R$', 2, 100);
        let sweep = null, key = '';
        v.animate((t) => {
          const R = C.part('R').value;
          if (key !== String(R)) { key = String(R); sweep = C.sweep(100, 30000, 300, (r) => r.imag('R') * 1e3); }
          const res = C.ac(f.value);
          C.draw({ result: res, t, acRate: 0.5 });
          const pk = sweep.reduce((a, b) => (b.y > a.y ? b : a)), top = Math.max(1.15 * pk.y, 5);
          sp.setView([1.82, 4.55], [0, top]);
          sp.vline(Math.log10(f0), { color: 'muted', dash: [4, 4] }); sp.text('f₀ = 1/2π√LC', Math.log10(f0), top * 0.95, { dx: 5, color: 'muted', size: 11.5, align: 'left' });
          const half = pk.y / Math.SQRT2; sp.hline(half, { color: 'muted', width: 1, dash: [4, 4] });
          sp.path(sweep.map((p) => [Math.log10(p.f), p.y]), { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.08 });
          sp.vline(Math.log10(f.value), { color: 'gold', width: 1.4 });
          sp.dot(Math.log10(f.value), res.imag('R') * 1e3, { color: 'gold', r: 5 });
        });
        v.legend([['accent', '$|I|(f)$ from the AC sweep'], ['gold', 'drive frequency'], ['muted', '$|I|_{max}/\\sqrt2$ (half power)', { dash: true }]]);
        v.readout(() => {
          if (!sweep) return '';
          const R = C.part('R').value, res = C.ac(f.value), pk = sweep.reduce((a, b) => (b.y > a.y ? b : a)), Q = Math.sqrt(L / Cv) / R;
          const ph = (res.iphase('R') - res.phase('V')) * 180 / PI;
          return `predicted $f_0 = ${v.fix(f0, 1)}$ Hz, sweep peak at ${v.fix(pk.f, 0)} Hz with $|I| = ${v.fix(pk.y, 2)}$ mA ($V_0/R = ${v.fix(1e3 / R, 2)}$ mA) · at $f$: $|I| = ${v.fix(res.imag('R') * 1e3, 2)}$ mA, phase of $I$ vs drive $${v.fix(ph, 1)}^\\circ$ · $Q = ${v.fix(Q, 2)}$, $f_0/Q = ${v.fix(f0 / Q, 0)}$ Hz`;
        });
      },
    },

    // ---------------------------------------------------------------- more examples
    {
      num: '2.11', kind: 'Model', name: 'The Van der Pol oscillator and its limit cycle',
      statement: String.raw`$\ddot x - \mu(1 - x^2)\dot x + x = 0$ pumps energy in at small amplitude and dissipates it at large amplitude. For every $\mu > 0$ the origin is unstable and all other orbits approach a unique, isolated closed orbit — a **limit cycle** (Liénard's theorem). Its period grows from $2\pi$ (small $\mu$) to about $(3 - 2\ln 2)\,\mu$ (relaxation oscillations, large $\mu$).`,
      caption: String.raw`Two trajectories, one from inside and one from outside, converge onto the same cycle (integrated with adaptive RK45; each stops once successive returns agree to a fraction of a pixel). Gold dots ride along them. **Click** to add more.`,
      viz(v) {
        const s = v.stage({ x: [-4.2, 4.2], y: [-5.5, 5.5], height: 380, xlabel: 'x', ylabel: 'y = ẋ' });
        const mu = v.slider('$\\mu$', 0.1, 3, 1, { step: 0.05 });
        const pp = v.phasePlane(s, { f: (x, y, t, p) => [y, p.mu * (1 - x * x) * y - x], params: { mu }, method: 'rk45', seeds: [[0.3, 0], [-3.6, 4.8]], trajColor: 'cycle', tMax: 150 });
        v.button('Clear trajectories', () => pp.clear());
        v.animate((t) => pp.draw({ particles: true, t: t * 2 }));
        pp.legend([['gold', 'moving with the flow', { dot: true }]]);
        v.readout(() => {
          const c = pp.trajectories.map((tr) => tr.fwd).find((f) => f && f.stop === 'limit cycle'), m = mu.value;
          return `${pp.describe({ max: 1 })} · ${c ? `limit cycle reached, period $T = ${v.fix(c.period, 3)}$` : 'no cycle detected yet'} (small-$\\mu$ value $2\\pi = 6.283$, relaxation estimate $(3 - 2\\ln 2)\\mu = ${v.fix((3 - 2 * Math.log(2)) * m, 2)}$)`;
        });
      },
    },
    {
      num: '2.12', kind: 'Theorem', name: 'Circulation and flux of a vortex and a source (Stokes and Gauss in 2D)',
      statement: String.raw`For a planar velocity field built from point vortices (strength $\Gamma$), point sources (strength $m$) and a uniform stream, the circulation around any closed curve equals the total vortex strength inside, $\oint \mathbf u\cdot d\mathbf s = \sum \Gamma_{\text{in}}$ (Stokes), and the outflow equals the total source strength inside, $\oint \mathbf u\cdot\mathbf n\,ds = \sum m_{\text{in}}$ (divergence theorem): away from the points the flow is irrotational and incompressible.`,
      caption: String.raw`Drag the vortex, the source, and the four corners of the loop. Grey streamlines are evenly spaced; arrows on the loop show the component that is being integrated.`,
      viz(v) {
        const s = v.stage({ x: [-3, 3], y: [-1.9, 1.9], equal: true, height: 360, axes: false });
        const mode = v.select('loop arrows', [{ value: 'tangent', label: 'tangential (circulation)' }, { value: 'normal', label: 'normal (flux)' }], 'tangent');
        const U = v.slider('stream $U$', 0, 1.5, 0.6, { step: 0.05 });
        const F = v.fields(s, {
          sources: [{ type: 'vortex', x: -0.9, y: 0.1, gamma: 4 }, { type: 'source', x: 1.1, y: -0.2, m: 2.5 }],
          uniform: () => [U.value, 0], lines: false, streamlines: true, streamSep: 20,
          loop: { type: 'poly', pts: [[-1.9, -0.9], [0.1, -0.9], [0.1, 1.0], [-1.9, 1.0]] },
        });
        v.render(() => F.draw({ loopArrows: mode.value }));
        F.legend([['purple', 'vortex $\\Gamma = 4$', { dot: true }], ['teal', 'source $m = 2.5$', { dot: true }]]);
        v.readout(() => { const I = F.integrals(), e = F.enclosed(), z = (x) => (Math.abs(x) < 5e-9 ? 0 : x); return `circulation $\\oint \\mathbf u\\cdot d\\mathbf s = ${v.fix(z(I.circulation), 4)}$ vs $\\sum\\Gamma_{\\text{in}} = ${v.fix(e.gamma, 4)}$ · flux $\\oint \\mathbf u\\cdot\\mathbf n\\,ds = ${v.fix(z(I.flux), 4)}$ vs $\\sum m_{\\text{in}} = ${v.fix(e.q, 4)}$`; });
      },
    },
    {
      num: '2.13', kind: 'Law', name: 'The inverting amplifier and saturation',
      statement: String.raw`With an ideal op-amp, negative feedback holds the inverting input at virtual ground, so the input current $V_{in}/R_1$ must flow through $R_2$ and $V_{out} = -\dfrac{R_2}{R_1}V_{in}$, independent of the load. A real op-amp cannot swing beyond its supply rails: past $|V_{in}| = V_{rail}R_1/R_2$ the output saturates and the virtual ground is lost.`,
      caption: String.raw`Drag $V_{in}$ and change $R_2$. Wires are coloured by voltage (red positive, blue negative). Right: the transfer curve from DC solves of the drawn circuit (rails at $\pm 10$ V).`,
      viz(v) {
        const s = v.stage({ x: [-1.6, 8.4], y: [-1.3, 3.95], equal: true, height: 290, axes: false, weight: 1.2 });
        const sp = v.stage({ x: [-3, 3], y: [-14, 14], height: 290, axes: 'box', yticks: [-10, -5, 0, 5, 10], xticks: [-2, -1, 0, 1], xlabel: 'input (V)', ylabel: 'output (V)', weight: 0.9 });
        const C = v.circuit(s, [
          { type: 'V', id: 'Vin', value: 1, at: [0, 2, 0, 0] },
          { type: 'R', id: 'R1', name: 'R1', value: 1e3, at: [0, 2, 2.5, 2] }, { type: 'W', at: [2.5, 2, 3, 2] },
          { type: 'OA', id: 'U1', at: [4.5, 1.5], rails: [-10, 10], label: false },
          { type: 'W', at: [2.5, 2, 2.5, 3.2] }, { type: 'R', id: 'R2', value: 4.7e3, at: [2.5, 3.2, 6.6, 3.2] }, { type: 'W', at: [6.6, 3.2, 6.6, 1.5, 6, 1.5] },
          { type: 'R', id: 'RL', value: 1e4, at: [6.6, 1.5, 6.6, 0], labelSide: 1 },
          { type: 'W', at: [3, 1, 3, 0.4] }, { type: 'GND', at: [3, 0.4] }, { type: 'GND', at: [0, 0] }, { type: 'GND', at: [6.6, 0] },
          { type: 'label', at: [6.6, 1.5], text: '$V_{out}$', dx: 10, dy: -6 },
        ]);
        const vin = C.control('Vin', '$V_{in}$', -3, 3, { log: false, step: 0.01 }); C.control('R2', '$R_2$', 500, 20e3);
        let res;
        v.animate((t) => {
          res = C.draw({ result: C.dc(), t, vmax: 10 });
          const curve = []; const keep = C.part('Vin').value;
          for (let k = 0; k <= 120; k++) { C.part('Vin').value = -3 + 6 * k / 120; curve.push([C.part('Vin').value, C.dc().V(C.net.termNode.get('U1').out)]); }
          C.part('Vin').value = keep;
          sp.hband(-10, 10, { color: 'green', alpha: 0.05 }); sp.hline(10, { color: 'red', dash: [4, 4], width: 1 }); sp.hline(-10, { color: 'red', dash: [4, 4], width: 1 });
          sp.text('rail', 2.95, 11.2, { color: 'red', size: 11, align: 'right' });
          sp.path(curve, { color: 'accent', width: 2.4 }); sp.dot(keep, res.V(C.net.termNode.get('U1').out), { color: 'gold', r: 5 });
        });
        v.legend([['accent', 'transfer curve $V_{out}(V_{in})$'], ['red', 'supply rails', { dash: true }], ['gold', 'current dots / operating point']]);
        v.readout(() => {
          if (!res) return ''; const out = res.V(C.net.termNode.get('U1').out), m = res.V(C.net.termNode.get('U1').minus), g = -C.part('R2').value / C.part('R1').value;
          return `$V_{out} = ${v.fix(out, 3)}$ V, ideal $-\\tfrac{R_2}{R_1}V_{in} = ${v.fix(g * vin.value, 3)}$ V · inverting input $${v.fix(m * 1e3, 2)}$ mV ${Math.abs(out) >= 9.999 ? '(**saturated**: virtual ground lost)' : '(virtual ground)'} · load current $${v.fix(res.I('RL') * 1e3, 3)}$ mA`;
        });
      },
    },
    {
      num: '2.14', kind: 'Concept', name: 'A half-wave rectifier with a smoothing capacitor',
      statement: String.raw`A diode conducts only when forward biased (Shockley: $i = I_s(e^{v/V_T} - 1)$), so it passes the positive half-waves. A capacitor across the load charges to nearly the peak, $V_p - V_D$, and between peaks discharges through the load, leaving a ripple $\Delta V \approx \dfrac{V_p}{R C f}$.`,
      caption: String.raw`Transient simulation with Newton iterations for the diode. The dots flow only in short bursts near the peaks — the capacitor recharging. Increase $C$ to shrink the ripple.`,
      viz(v) {
        const s = v.stage({ x: [-2.4, 6.9], y: [-1, 3.6], equal: true, height: 270, axes: false });
        const sp = v.stage({ x: [0, 100], y: [-12.5, 12.5], height: 270, axes: 'box', yticks: [-10, -5, 0, 5, 10], xlabel: 't (ms)', ylabel: 'volts', weight: 1.2 });
        const C = v.circuit(s, [
          { type: 'V', id: 'Vs', wave: { type: 'sine', amp: 10, f: 50 }, ac: 10, label: '10 V, 50 Hz', at: [0, 2.6, 0, 0] },
          { type: 'D', id: 'D1', at: [0, 2.6, 3, 2.6], label: 'Shockley' }, { type: 'W', at: [3, 2.6, 5.2, 2.6] },
          { type: 'C', id: 'C1', value: 100e-6, at: [3, 2.6, 3, 0] }, { type: 'R', id: 'RL', value: 1e3, at: [5.2, 2.6, 5.2, 0] },
          { type: 'W', at: [5.2, 0, 0, 0] }, { type: 'GND', at: [1.5, 0] },
        ]);
        C.control('C1', '$C$', 1e-6, 1e-3);
        let tr = null, key = '';
        v.animate((t) => {
          const k = String(C.part('C1').value); if (k !== key) { key = k; tr = C.transient(0.1, 5e-5); }
          const time = (t % 8) / 8 * 0.1, snap = tr.at(time), out = C.net.termNode.get('RL').a, inn = C.net.termNode.get('Vs').a;
          C.draw({ result: snap, t: t * 0.5, vmax: 10 });
          sp.path(tr.series(inn).map(([a, b]) => [a * 1e3, b]), { color: 'muted', width: 1.4, dash: [4, 3] });
          sp.path(tr.series(out).map(([a, b]) => [a * 1e3, b]), { color: 'accent', width: 2.4 });
          sp.vline(time * 1e3, { color: 'gold', width: 1.4 }); sp.dot(time * 1e3, snap.V(out), { color: 'accent', r: 4.5 });
        });
        v.legend([['muted', 'source $v_s$', { dash: true }], ['accent', 'load voltage'], ['gold', 'current dots']]);
        v.readout(() => {
          if (!tr) return ''; const out = tr.v[C.net.termNode.get('RL').a], late = Array.from(out).slice(Math.floor(out.length * 0.6)), hi = Math.max(...late), lo = Math.min(...late);
          return `peak $${v.fix(hi, 2)}$ V (diode drop $${v.fix(10 - hi, 2)}$ V) · ripple $\\Delta V = ${v.fix(hi - lo, 2)}$ V vs estimate $V_p/(RCf) = ${v.fix(hi / (1e3 * C.part('C1').value * 50), 2)}$ V`;
        });
      },
    },
    {
      num: '2.15', kind: 'Algorithm', name: "Grover's search on two qubits",
      statement: String.raw`Grover's algorithm finds a marked item among $N$ in about $\tfrac\pi4\sqrt N$ queries. The **oracle** flips the sign of the marked basis state; the **diffusion** operator $2|s\rangle\langle s| - I$ reflects all amplitudes about their mean, so the marked amplitude grows. For $N = 4$ a single oracle + diffusion round finds the marked item with probability 1.`,
      caption: String.raw`Step through the circuit. Bar heights are $|a|$ and colours the phase: after the oracle the marked state turns orange (phase $\pi$); the diffusion then concentrates all amplitude on it.`,
      viz(v) {
        const Q = v.quantum();
        const sd = v.stage({ height: 150, axes: false, full: true });
        const sa = v.stage({ height: 250, axes: false, full: true });
        const marked = v.select('marked item', ['00', '01', '10', '11'], '11');
        const step = v.slider('step', 0, 18, 18, { int: true });
        const build = (m) => {
          const qc = Q.circuit(2).h(0).h(1); const flip = () => { for (const q of [0, 1]) if (m[q] === '0') qc.x(q); };
          flip(); qc.cz(0, 1); flip(); qc.h(0).h(1).x(0).x(1).cz(0, 1).x(0).x(1).h(0).h(1).measure(); return qc;
        };
        let qc = build('11'), cur = '11';
        v.render(() => {
          if (marked.value !== cur) { cur = marked.value; qc = build(cur); }
          const max = qc.length; if (step.value > max) step.set(max);
          const k = Math.min(step.value, max), psi = qc.state(k);
          Q.diagram(sd, qc, { step: k, onPick: (j) => step.set(j), colWidth: 62 });
          Q.amplitudes(sa, psi, { mode: 'amp' });
        });
        v.readout(() => { const psi = qc.state(Math.min(step.value, qc.length)); return `$|\\psi\\rangle = ${psi.ket(3)}$ · $P(${cur}) = ${v.fix(psi.prob(cur), 4)}$`; });
      },
    },
  ],
};
