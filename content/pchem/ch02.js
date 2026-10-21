// Physical Chemistry — Chapter 2: The first law and thermochemistry
import { R } from './ch02.shared.js';

// work done ON the gas (J) along a polyline in (V litres, p bar): w = −∫p dV, with 1 L·bar = 100 J
const workOn = (pts) => { let w = 0; for (let i = 1; i < pts.length; i++) w -= 100 * (pts[i][1] + pts[i - 1][1]) / 2 * (pts[i][0] - pts[i - 1][0]); return w; };
const bez = (A, C, B, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]; });

export default {
  collection: 'pchem',
  chapter: 2,
  title: 'The first law and thermochemistry',
  summary: String.raw`Energy is conserved: the internal energy of a system changes only by the heat and work that cross its boundary. Enthalpy is the bookkeeping device for processes at constant pressure, heat capacities measure how it changes with temperature, and because both are state functions, reaction enthalpies can be combined like algebra through Hess's law. Adiabatic and throttling expansions show the first law at work in engines and refrigerators.`,
  items: [
    {
      num: '2.1', kind: 'Law', name: 'First law of thermodynamics',
      statement: String.raw`Every closed system has a state function, the internal energy $U$, whose change in any process equals the energy transferred to it as heat $q$ and as work $w$ (both counted positive when they enter the system):
$$\Delta U = q + w .$$
For an isolated system $\Delta U = 0$, and for a cyclic process $q = -w$: no engine can deliver more work than the heat it absorbs. Individually $q$ and $w$ depend on the path; only their sum depends on the end states alone.`,
      idea: String.raw`The law is the empirical statement that "perpetual motion of the first kind" is impossible, which Joule's paddle-wheel experiments turned into a number: the same temperature rise needs the same mechanical work however it is delivered, so heat and work are two ways of moving one conserved quantity. If $\Delta U$ depended on the path one could loop between two states and gain energy each lap. In mechanics (mech-3.6) conservation of energy holds for forces that derive from a potential; thermodynamics extends it by letting energy cross the boundary as heat as well (thermo-1.11).`,
      caption: String.raw`A tenth of a mole of gas goes from the fixed state A to the state B you drag. Three fixed routes and one curved route (drag C to bend it) are drawn; the bars on the right give $q$, $w$ and $\Delta U$ for each. The heat and the work change from route to route and trade off, but the green $\Delta U$ bars are always the same height. Switch to a diatomic gas and every $\Delta U$ grows by the same factor 5/3.`,
      deps: ['mech-3.6', 'thermo-1.11'],
      refs: ['Atkins 2A', 'M–S ch. 19'],
      tags: ['energy', 'heat', 'work'],
      credit: 'Mayer, 1842; Joule, 1843–1850; Helmholtz, 1847',
      scope: String.raw`Closed systems (no matter crossing the boundary); non-relativistic energies; $U$ includes all internal (thermal, chemical, nuclear) energy but not the system's bulk kinetic or potential energy. The picture uses a perfect gas, whose $U$ depends on $T$ only.`,
      viz(v) {
        const A = [2.5, 1.0];
        const sp = v.stage({ x: [0.8, 6.5], y: [0, 3.3], axes: 'box', gutter: true, xlabel: 'V / L', ylabel: 'p / bar', height: 360, title: 'four routes from A to B' });
        const sb = v.stage({ x: [0.4, 4.6], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'route', ylabel: 'energy / J', height: 360, title: 'heat, work and energy change',
          xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4']] });
        const gas = v.select('gas', [{ value: 3, label: 'monatomic ($C_V = \\tfrac32R$)' }, { value: 5, label: 'diatomic ($C_V = \\tfrac52R$)' }], 3);
        const shade = v.select('shade work of route', ['1', '2', '3', '4'], '3');
        const B = sp.handle(5.2, 1.9, { color: 'accent', label: 'B', r: 8, constrain: { x: [1.2, 6.2], y: [0.35, 3.1] } });
        const C = sp.handle(3.6, 2.7, { color: 'gold', label: 'C', r: 6, constrain: { x: [0.9, 6.3], y: [0.1, 3.2] } });
        const cols = ['orange', 'purple', 'teal', 'gold'];
        let rows = [];
        v.render(() => {
          const Bp = [B.x, B.y];
          const routes = [[A, [Bp[0], A[1]], Bp], [A, [A[0], Bp[1]], Bp], [A, Bp], bez(A, [C.x, C.y], Bp)];
          const dU = gas.value / 2 * 100 * (Bp[0] * Bp[1] - A[0] * A[1]);
          rows = routes.map((r) => { const w = workOn(r); return { w, q: dU - w, dU }; });
          const k = +shade.value - 1;
          const pr = routes[k];
          sp.poly([...pr, [Bp[0], 0], [A[0], 0]], { fill: cols[k], fillAlpha: 0.16, stroke: false });
          routes.forEach((r, i) => { sp.path(r, { color: cols[i], width: i === k ? 3 : 1.8 }); const m = r[Math.floor(r.length * (i === 2 ? 0.35 : 0.5))]; sp.text(String(i + 1), m[0], m[1], { color: cols[i], size: 13, dy: -9, dx: i === 1 ? -9 : 0 }); });
          sp.dot(A[0], A[1], { r: 6, color: 'ink', label: 'A', labelPos: 'sw' });
          sp.corner(`ΔU = ${v.fix(dU, 0)} J (same for every route)`, 'tr');
          const m = Math.max(100, ...rows.flatMap((r) => [Math.abs(r.w), Math.abs(r.q), Math.abs(r.dU)])) * 1.15;
          sb.setView([0.4, 4.6], [-m, m]);
          sb.hline(0, { color: 'muted', width: 1 });
          rows.forEach((r, i) => [[r.q, 'orange'], [r.w, 'accent'], [r.dU, 'green']].forEach(([val, col], j) => {
            const x0 = i + 1 + (j - 1) * 0.27 - 0.12;
            sb.rect(x0, 0, x0 + 0.24, val, { fill: col, fillAlpha: 0.75, color: col });
          }));
        });
        v.legend([['orange', '$q$ heat in', { area: true }], ['accent', '$w$ work on gas', { area: true }], ['green', '$\\Delta U = q + w$', { area: true }]]);
        v.readout(() => rows.map((r, i) => `route ${i + 1}: $q = ${v.fix(r.q, 0)}$ J, $w = ${v.fix(r.w, 0)}$ J, $q + w = ${v.fix(r.q + r.w, 0)}$ J`).join('\n'));
      },
    },
    {
      num: '2.2', kind: 'Definition', name: 'Expansion work: reversible and irreversible',
      statement: String.raw`When a system changes volume against an external pressure $p_\text{ex}$ the work done on it is
$$ w = -\int p_\text{ex}\,\mathrm dV .$$
For expansion against a constant $p_\text{ex}$ this is $-p_\text{ex}\Delta V$. If the external pressure is always adjusted to equal the gas pressure (a *reversible* change, one that an infinitesimal change in $p_\text{ex}$ would run backwards) the work is $-\int p\,\mathrm dV$, which for $n$ moles of a perfect gas at temperature $T$ is $-nRT\ln(V_2/V_1)$. Among all ways of getting from $V_1$ to $V_2$ at that $T$, the gas does the most work by the reversible route and a compression costs the least.`,
      idea: String.raw`The work is the area under the curve of external pressure against volume. The gas can never push harder than its own pressure, so $p_\text{ex}\le p = nRT/V$ during an expansion and the area under $p_\text{ex}$ lies inside the area under the isotherm. A one-step expansion drops $p_\text{ex}$ straight to the final pressure; each extra step trims off a sliver, and in the limit of infinitely many the staircase hugs the isotherm. Running the logic backwards, compression needs $p_\text{ex}\ge p$, so every irreversible compression costs more than the reversible one. For positive volumes, the fundamental theorem of calculus (pma-6.21) evaluates the integral of the perfect-gas pressure (pchem-1.4) using its logarithmic antiderivative.`,
      caption: String.raw`One mole of perfect gas at 300 K expands (or is compressed) between two volumes in $k$ steps; each step is a fixed external pressure equal to the pressure the gas has at the end of the step. Drag the step slider: the blue rectangles are the work, the hatched sliver is the work forfeited relative to the isotherm, and the curve on the right shows the work converging to $nRT\ln(V_2/V_1)$ from below (expansion) or from above (compression).`,
      deps: ['pchem-2.1', 'pchem-1.4', 'pma-6.21'],
      refs: ['Atkins 2A', 'M–S ch. 19'],
      tags: ['work', 'reversibility'],
      scope: String.raw`Perfect gas, isothermal (thermal contact with a bath at $T$), frictionless piston, equal volume steps. The maximum-work comparison assumes the same initial and final equilibrium states, the same thermal bath and pressure–volume work only.`,
      viz(v) {
        const T = 300, nRT = R * T / 100;          // L·bar
        const dir = v.select('process', [{ value: 'exp', label: 'expansion' }, { value: 'cmp', label: 'compression' }], 'exp');
        const ratio = v.slider('$V_2/V_1$ (or $V_1/V_2$)', 2, 20, 10, { step: 0.5 });
        const nst = v.slider('steps $k$', 1, 40, 3, { int: true });
        const sp = v.stage({ x: [0.6, 20], y: [0, 30], axes: 'box', gutter: true, xlabel: 'V / L', ylabel: 'p / bar', height: 340, title: 'staircase of external pressure' });
        const sw = v.stage({ x: [0, 41], y: [0, 7], axes: 'box', gutter: true, xlabel: 'number of steps k', ylabel: '|w| / kJ', height: 340, title: 'work against the number of steps' });
        const stepWork = (k, r, d) => {                 // kJ, positive number
          let s = 0;
          for (let j = 1; j <= k; j++) {
            const Vj = 1 + (r - 1) * j / k, dV = (r - 1) / k;
            s += (d === 'exp' ? nRT / Vj : nRT / (r - (r - 1) * j / k)) * dV;
          }
          return s / 10;
        };
        let info = {};
        v.render(() => {
          const r = ratio.value, k = nst.value, d = dir.value, rev = nRT * Math.log(r) / 10;
          sp.setView([0.6, r * 1.05], [0, nRT / 1 * 1.15]);
          sp.fn((V) => nRT / V, { color: 'ink', width: 2.2, domain: [0.6, r * 1.05] });
          for (let j = 1; j <= k; j++) {
            const Va = 1 + (r - 1) * (j - 1) / k, Vb = 1 + (r - 1) * j / k;
            if (d === 'exp') { const pe = nRT / Vb; sp.rect(Va, 0, Vb, pe, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 }); sp.rect(Va, pe, Vb, nRT / Va, { fill: 'red', fillAlpha: 0.25, hatch: true, stroke: false }); }
            else { const Vx = r - (r - 1) * (j - 1) / k, Vy = r - (r - 1) * j / k, pe = nRT / Vy; sp.rect(Vy, 0, Vx, pe, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1 }); sp.rect(Vy, nRT / Vx, Vx, pe, { fill: 'red', fillAlpha: 0.25, hatch: true, stroke: false }); }
          }
          sp.vline(1, { color: 'muted', dash: true }); sp.vline(r, { color: 'muted', dash: true });
          const w = stepWork(k, r, d);
          info = { w, rev, k, r, d };
          sw.setView([0, 41], [0, Math.max(7, rev * 1.25, stepWork(1, r, 'cmp') * 1.05)]);
          const ks = Array.from({ length: 40 }, (_, i) => i + 1);
          sw.hline(rev, { color: 'green', width: 2, dash: true });
          sw.path(ks.map((kk) => [kk, stepWork(kk, r, d)]), { color: 'accent', width: 2 });
          sw.dot(k, w, { r: 7, color: 'gold' });
          sw.tex('nRT\\ln(V_2/V_1)', 24, rev, { color: 'green', size: 13, dy: -12 });
        });
        v.legend([['ink', 'isotherm $p = nRT/V$'], ['accent', 'work done in the $k$ steps', { area: true }], ['red', 'work lost to irreversibility', { area: true }]]);
        v.readout(() => {
          const { w, rev, k, r, d } = info;
          return d === 'exp'
            ? `Expansion ${v.fix(r, 1)}-fold in $k=${k}$ steps: gas does $${v.fix(w, 3)}$ kJ of work; the reversible limit $nRT\\ln ${v.fix(r, 1)} = ${v.fix(rev, 3)}$ kJ is ${v.fix(100 * w / rev, 0)}% attained. Since $\\Delta U = 0$ the heat absorbed is the same amount.`
            : `Compression ${v.fix(r, 1)}-fold in $k=${k}$ steps: the surroundings must do $${v.fix(w, 3)}$ kJ, against the reversible minimum $${v.fix(rev, 3)}$ kJ (${v.fix(100 * w / rev, 0)}%); the excess leaves as extra heat.`;
        });
      },
    },
    {
      num: '2.3', kind: 'Theorem', name: 'State functions and exact differentials',
      statement: String.raw`A property is a *state function* when its value depends only on the present state of the system, equivalently when its change around every closed loop vanishes, $\oint \mathrm dX = 0$. Its differential $\mathrm dX = P\,\mathrm dV + Q\,\mathrm dp$ is then *exact*, and on a simply connected region of the state space this holds if and only if
$$\Big(\frac{\partial P}{\partial p}\Big)_V = \Big(\frac{\partial Q}{\partial V}\Big)_p .$$
The internal energy is a state function; the heat and work increments $đq$ and $đw$ are not, and for a perfect gas $\oint đq = -\oint đw = \oint p\,\mathrm dV$, the area enclosed by the loop on a $p$–$V$ diagram.`,
      idea: String.raw`The first law (2.1) says $\mathrm dU = đq + đw$ is the same between any two states, so $\oint \mathrm dU = 0$ is just path-independence; for a differential form on the $(V,p)$ plane, path-independence on a simply connected region is the classical equivalence between exactness, vanishing loop integrals and equality of mixed partials (pma-9.41 for the gradient test, pma-10.39 for the Stokes/Green argument). For a perfect gas $U = \tfrac f2 pV$ gives $P = \tfrac f2 p$, $Q = \tfrac f2 V$ and the two partials agree, whereas $đq = \tfrac f2 V\mathrm dp + (\tfrac f2+1)p\,\mathrm dV$ fails the test by exactly $1$, and Green's theorem turns that failure into the enclosed area.`,
      caption: String.raw`Drag the four corners to draw any closed loop on the $p$–$V$ diagram (a clockwise loop is an engine). The curves on the right follow the running totals of $U$, $q$ and $w$ round the loop: $U$ always returns to zero, while $q$ and $w$ come back to the enclosed area. Reverse the direction and the net heat and work change sign. Shrink the loop to a line and they vanish too.`,
      deps: ['pchem-2.1', 'pma-9.41', 'pma-10.39'],
      refs: ['Atkins 2D', 'M–S ch. 19'],
      tags: ['state function', 'exact differential'],
      viz(v) {
        const sp = v.stage({ x: [1, 6], y: [0.3, 3.2], axes: 'box', gutter: true, xlabel: 'V / L', ylabel: 'p / bar', height: 350, title: 'a closed loop on the pV diagram' });
        const sc = v.stage({ x: [0, 4], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'distance round the loop (edges)', ylabel: 'running total / J', height: 350, title: 'running totals' });
        const H = [[2, 1.2], [2.6, 2.7], [4.8, 2.1], [4.2, 0.8]].map((q, i) => sp.handle(q[0], q[1], { color: 'accent', r: 7, label: 'ABCD'[i] }));
        const rev = v.toggle('counter-clockwise', false);
        const gas = v.select('gas', [{ value: 3, label: 'monatomic' }, { value: 5, label: 'diatomic' }], 3);
        let res = {};
        v.render(() => {
          let P = H.map((h) => [h.x, h.y]); if (rev.value) P = [P[0], P[3], P[2], P[1]];
          const f = gas.value / 2, N = 24;
          const U = (p) => f * 100 * p[0] * p[1];
          const pts = [], cu = [], cq = [], cw = [];
          let w = 0, u0 = U(P[0]);
          for (let e = 0; e < 4; e++) {
            const a = P[e], b = P[(e + 1) % 4];
            for (let i = 0; i <= N; i++) {
              const t = i / N, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
              const wi = -100 * (a[1] + q[1]) / 2 * (q[0] - a[0]);
              pts.push(e + t); cw.push(w + wi); cu.push(U(q) - u0); cq.push(U(q) - u0 - (w + wi));
            }
            w += -100 * (a[1] + b[1]) / 2 * (b[0] - a[0]);
          }
          const area = 100 * P.reduce((s, p, i) => { const q = P[(i + 1) % 4]; return s + (p[0] * q[1] - q[0] * p[1]) / 2; }, 0);
          res = { w, q: -w, dU: cu[cu.length - 1], area };
          sp.poly(P, { fill: w < 0 ? 'orange' : 'accent', fillAlpha: 0.18, color: 'ink', width: 2 });
          for (let e = 0; e < 4; e++) { const a = P[e], b = P[(e + 1) % 4]; sp.arrow(a[0] + (b[0] - a[0]) * 0.45, a[1] + (b[1] - a[1]) * 0.45, a[0] + (b[0] - a[0]) * 0.58, a[1] + (b[1] - a[1]) * 0.58, { color: 'ink', head: 9 }); }
          const m = Math.max(50, ...cu.map(Math.abs), ...cq.map(Math.abs), ...cw.map(Math.abs)) * 1.15;
          sc.setView([0, 4], [-m, m]);
          sc.hline(0, { color: 'muted' });
          for (let e = 1; e < 4; e++) sc.vline(e, { color: 'grid' });
          sc.path(pts.map((x, i) => [x, cu[i]]), { color: 'green', width: 2.6 });
          sc.path(pts.map((x, i) => [x, cq[i]]), { color: 'orange', width: 2.2 });
          sc.path(pts.map((x, i) => [x, cw[i]]), { color: 'accent', width: 2.2 });
          sc.dot(4, cu[cu.length - 1], { r: 6, color: 'green' }); sc.dot(4, cq[cq.length - 1], { r: 6, color: 'orange' }); sc.dot(4, cw[cw.length - 1], { r: 6, color: 'accent' });
        });
        v.legend([['green', '$U - U_A$'], ['orange', '$q$ so far'], ['accent', '$w$ so far']]);
        v.readout(() => {
          const f = gas.value / 2;
          return `Round the loop: $\\oint \\mathrm dU = ${v.fix(res.dU, 6)}$ J, $\\oint đw = ${v.fix(res.w, 1)}$ J, $\\oint đq = ${v.fix(res.q, 1)}$ J; the enclosed area is $${v.fix(Math.abs(res.area), 1)}$ J (${res.area < 0 ? 'clockwise: the gas does work' : 'counter-clockwise: work is done on the gas'}).\nExactness test on $(\\mathrm dV,\\mathrm dp)$: for $\\mathrm dU$, $\\partial P/\\partial p = ${v.fix(f, 1)}$ and $\\partial Q/\\partial V = ${v.fix(f, 1)}$ (equal, exact); for $đq$, $\\partial P/\\partial p = ${v.fix(f + 1, 1)}$ but $\\partial Q/\\partial V = ${v.fix(f, 1)}$ (unequal, inexact).`;
        });
      },
    },
    {
      num: '2.5', kind: 'Definition', name: 'Heat capacities and Cp − Cv',
      statement: String.raw`The heat capacity at constant volume, $C_V = (\partial U/\partial T)_V$, and at constant pressure, $C_p = (\partial H/\partial T)_p$, measure the heat needed per kelvin in the two modes ($q_V = \Delta U$, $q_p = \Delta H$). They differ because at constant pressure part of the heat goes into expansion work (and into the energy needed to pull the molecules apart):
$$C_p - C_V = \frac{T V\alpha^2}{\kappa_T},\qquad \alpha = \frac1V\Big(\frac{\partial V}{\partial T}\Big)_p,\quad \kappa_T = -\frac1V\Big(\frac{\partial V}{\partial p}\Big)_T .$$
For a perfect gas $\alpha = 1/T$ and $\kappa_T = 1/p$, so $C_{p,m} - C_{V,m} = R$.`,
      idea: String.raw`Write $H = U + pV$ and differentiate at constant pressure: $C_p - C_V = [(\partial U/\partial V)_T + p](\partial V/\partial T)_p$. Two thermodynamic identities turn this into the displayed form: the internal pressure $(\partial U/\partial V)_T$ vanishes for a perfect gas, leaving $p(\partial V/\partial T)_p = nR$, and in general the Maxwell relation behind $\alpha^2/\kappa_T$ expresses the same quantity through measurable response coefficients. Liquids and solids barely expand, so $\alpha$ is tiny and $C_p \approx C_V$; gases expand a lot and the difference is a sizeable fraction of $C_p$. This builds on enthalpy (thermo-1.14) and on heat capacities in general (thermo-1.13).`,
      caption: String.raw`Pour the same heat into one mole of the chosen substance once at constant volume and once at constant pressure; the left panel shows the two temperature rises, and the right panel the share of each joule at constant $p$ that goes into $U$ ($C_V/C_p$). For the perfect gases the difference is exactly $R$; for liquids it is computed from the expansivity and compressibility. Choose *custom liquid* and set the four sliders yourself.`,
      deps: ['pchem-2.1', 'thermo-1.14', 'thermo-1.13'],
      refs: ['Atkins 2B', 'M–S ch. 19'],
      tags: ['heat capacity', 'enthalpy'],
      scope: String.raw`Closed system of one phase and fixed composition. Liquid data are values near 298 K and 1 bar; the numbers for water, benzene and mercury are from memory of standard tables and meant to be illustrative.`,
      viz(v) {
        // α /K⁻¹, κ_T /Pa⁻¹, Vm /cm³, Cp /(J/K/mol)
        const SUB = {
          He: { name: 'helium (gas)', gas: 5 / 2 * R }, N2: { name: 'nitrogen (gas)', gas: 29.12 },
          water: { name: 'water', a: 2.07e-4, k: 4.52e-10, V: 18.07, Cp: 75.3 }, benzene: { name: 'benzene', a: 1.24e-3, k: 9.6e-10, V: 89.4, Cp: 136 },
          mercury: { name: 'mercury', a: 1.81e-4, k: 4.0e-11, V: 14.8, Cp: 28.0 }, custom: { name: 'custom liquid', a: 5e-4, k: 5e-10, V: 40, Cp: 100 },
        };
        const sel = v.select('substance', Object.keys(SUB).map((k) => ({ value: k, label: SUB[k].name })), 'water');
        const q = v.slider('heat supplied $q$', 0.1, 5, 1, { step: 0.1, fmt: (x) => `${x.toFixed(1)} kJ` });
        const al = v.slider('$\\alpha$', 1e-4, 2e-3, 5e-4, { log: true, fmt: (x) => `${v.sci(x, 2)}`.replace(/\\times/g, '×') });
        const ka = v.slider('$\\kappa_T$ (Pa⁻¹)', 1e-11, 1e-8, 5e-10, { log: true });
        const Vm = v.slider('$V_m$ (cm³/mol)', 5, 150, 40, { step: 1 });
        const Cpm = v.slider('$C_{p,m}$ (J/K/mol)', 20, 200, 100, { step: 1 });
        const sl = [al, ka, Vm, Cpm];
        const s1 = v.stage({ x: [0, 3], y: [0, 100], axes: 'box', gutter: true, ylabel: 'ΔT / K', height: 330, title: 'temperature rise for the same heat', xticks: [[1, 'constant V'], [2, 'constant p']] });
        const s2 = v.stage({ x: [0, 1], y: [0.4, 6.6], axes: 'box', gutter: true, xlabel: 'share of the heat that raises $U$  ($C_V/C_p$)', height: 330, yticks: [] , title: 'where the heat goes at constant pressure' });
        const calc = (k) => {
          const s = SUB[k];
          if (s.gas) return { Cp: s.gas, Cv: s.gas - R, diff: R, a: 1 / 298.15, kap: 1 / 1e5, gas: true };
          const a = k === 'custom' ? al.value : s.a, kap = k === 'custom' ? ka.value : s.k, V = (k === 'custom' ? Vm.value : s.V) * 1e-6, Cp = k === 'custom' ? Cpm.value : s.Cp;
          const diff = 298.15 * a * a * V / kap;
          return { Cp, Cv: Cp - diff, diff, a, kap, gas: false };
        };
        v.render(() => {
          sl.forEach((c) => { c.el.hidden = sel.value !== 'custom'; });
          const c = calc(sel.value), Q = q.value * 1000;
          const dTV = Q / c.Cv, dTp = Q / c.Cp;
          s1.setView([0, 3], [0, Math.max(5, dTV * 1.2)]);
          s1.rect(0.6, 0, 1.4, dTV, { fill: 'orange', fillAlpha: 0.6, color: 'orange' });
          s1.rect(1.6, 0, 2.4, dTp, { fill: 'accent', fillAlpha: 0.6, color: 'accent' });
          s1.text(`${v.fix(dTV, 1)} K`, 1, dTV, { dy: -10, size: 13 }); s1.text(`${v.fix(dTp, 1)} K`, 2, dTp, { dy: -10, size: 13 });
          const keys = Object.keys(SUB);
          keys.forEach((k, i) => {
            const cc = calc(k), y = keys.length - i, fr = cc.Cv / cc.Cp, cur = k === sel.value;
            s2.rect(0, y - 0.32, fr, y + 0.32, { fill: cur ? 'green' : 'muted', fillAlpha: cur ? 0.7 : 0.35, color: cur ? 'green' : 'muted' });
            s2.text(SUB[k].name, 0.01, y, { size: 12, align: 'left', color: cur ? 'ink' : 'muted', dx: 3 });
            s2.text(v.fix(100 * fr, 1) + ' %', fr, y, { size: 12, align: 'right', dx: -4, color: 'ink' });
          });
        });
        v.legend([['orange', 'constant volume ($q = \\Delta U$)', { area: true }], ['accent', 'constant pressure ($q = \\Delta H$)', { area: true }]]);
        v.readout(() => {
          const c = calc(sel.value);
          return c.gas ? `Perfect gas: $\\alpha = 1/T$, $\\kappa_T = 1/p$, so $C_p - C_V = T V\\alpha^2/\\kappa_T = ${v.fix(c.diff, 3)}$ J/(K·mol) $= R$ exactly; $C_p = ${v.fix(c.Cp, 2)}$, $C_V = ${v.fix(c.Cv, 2)}$, $\\gamma = ${v.fix(c.Cp / c.Cv, 3)}$.`
            : `$C_p - C_V = TV\\alpha^2/\\kappa_T = ${v.fix(c.diff, 2)}$ J/(K·mol) from $\\alpha = ${v.sci(c.a, 3)}$ K⁻¹, $\\kappa_T = ${v.sci(c.kap, 3)}$ Pa⁻¹: only ${v.fix(100 * c.diff / c.Cp, 1)}% of $C_p = ${v.fix(c.Cp, 1)}$ J/(K·mol); $\\gamma = ${v.fix(c.Cp / c.Cv, 3)}$.`;
        });
      },
    },
  ],
};
