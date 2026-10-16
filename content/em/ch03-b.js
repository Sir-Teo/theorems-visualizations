// Electromagnetism — Chapter 3, part b: items 3.7–3.13 (Faraday cage, capacitance, images)
import { TAU, KV, EPS0, pot, fld, sgnCol, drawCharge, heatPot, levels, quiver, solveLin, sor, samp, drawLines, circ, potL, fldL, streamline } from './ch03.shared.js';

export default {
  collection: 'em',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Faraday cage: no field in an empty cavity',
      statement: String.raw`Inside a closed hollow conductor the field of any charges *outside* is exactly zero: a cavity that contains no charge has $\mathbf E=\mathbf 0$ and one constant potential, whatever the outside charges do. If the cavity does contain charge $q$, the inner surface carries $-q$ and the outer surface carries the rest of the conductor’s net charge, spread so that the outside field depends only on the *total* charge and the outside charges — not on where inside the cavity $q$ sits or how it is arranged.`,
      idea: String.raw`Without charge in the cavity, $V$ is harmonic inside (em-2.8) and is constant on the cavity wall, since the conductor is an equipotential (em-3.1). The constant is itself a solution with those boundary values, so by the first uniqueness theorem (em-3.5) it is the solution: $\mathbf E=\mathbf 0$. If the cavity holds a charge, Gauss's law around the cavity wall (which lies in the conductor, where $\mathbf E=\mathbf 0$) forces the induced charge on it to be $-q$, so the outer surface sees net $Q_{shell}+q$; the field inside the cavity is determined by the cavity wall as a boundary alone, and the field outside by the outer surface alone, and the two problems do not talk to each other.`,
      caption: String.raw`A conducting cylindrical shell (cross-section: inner radius $a$, outer radius $b$) with a charge inside the cavity (drag the orange handle) and a charge outside (drag the red one). Colour is $|\mathbf E|$: it is exactly zero inside the metal. Move the outer charge and the pattern in the cavity does not change at all; move the inner charge and the field outside does not change at all (only its total, $Q_{shell}+\lambda_i$, matters). The readout checks that both walls really are equipotentials.`,
      scope: String.raw`Exact solution for an infinitely long cylindrical shell with line charges (image method for each wall); the theorem holds for any closed cavity in an electrostatic conductor. For *time-varying* fields the shielding is only approximate (skin depth, holes of size comparable to the wavelength); a real mesh cage shields by the same principle only for frequencies whose wavelength greatly exceeds the mesh size.`,
      credit: 'Faraday, 1836 (conducting-room experiment)',
      verify: true,
      deps: ['em-3.5', 'em-3.1'],
      refs: ['Griffiths §2.5', 'Feynman II ch. 5'],
      tags: ['shielding', 'cavity'],
      viz(v) {
        const a = 1.6, b = 2.5, EB = [-7, 7, -4.6, 4.6];
        const s = v.stage({ x: [-7, 7], y: [-4.6, 4.6], equal: true, height: 380, axes: false, weight: 1, title: 'conducting shell with a cavity' });
        const he = s.handle(4.4, 2.2, { color: 'red', r: 8, label: 'outside charge', labelPos: 'n', constrain: (x, y) => { const r = Math.hypot(x, y), m = b + 0.4; return r < m ? [(x / r) * m, (y / r) * m] : [x, y]; } });
        const hi = s.handle(0.55, -0.3, { color: 'orange', r: 8, label: 'inside charge', labelPos: 'n', constrain: (x, y) => { const r = Math.hypot(x, y), m = a - 0.3; return r > m ? [(x / r) * m, (y / r) * m] : [x, y]; } });
        const le = v.slider('outside charge $\\lambda_e$', -8, 8, 6, { step: 0.5, fmt: (x) => `${x} nC/cm` }), li = v.slider('inside charge $\\lambda_i$', -8, 8, 5, { step: 0.5, fmt: (x) => `${x} nC/cm` }), Qs = v.slider('shell’s net charge', -8, 8, 0, { step: 0.5, fmt: (x) => `${x} nC/cm` });
        let info = {};
        const inv = (x, y, R) => { const r2 = x * x + y * y; return [(R * R * x) / r2, (R * R * y) / r2]; };
        v.render(() => {
          const L = le.value, I = li.value, Q = Qs.value, ei = inv(he.x, he.y, b), ii = inv(hi.x, hi.y, a);
          const outS = [{ x: he.x, y: he.y, q: L }, { x: ei[0], y: ei[1], q: -L }, { x: 0, y: 0, q: Q + I + L }], cavS = [{ x: hi.x, y: hi.y, q: I }, { x: ii[0], y: ii[1], q: -I }];
          const F = (x, y) => { const r = Math.hypot(x, y); return r > b ? fldL(outS, x, y) : r < a ? fldL(cavS, x, y) : [0, 0]; };
          const Es = 2 * KV * 5 / 1.2;
          s.heat((x, y) => Math.tanh(Math.hypot(...F(x, y)) / Es), { range: [0, 1], cmap: 'theme', color: 'accent', res: 3, key: [he.x, he.y, hi.x, hi.y, L, I, Q].map((z) => z.toFixed(3)).join(), alpha: 0.8 });
          s.path(circ(0, 0, b, 100), { color: 'ink', width: 2.4 }); s.path(circ(0, 0, a, 100), { color: 'ink', width: 2.4 });
          s.text('metal', 0, (a + b) / 2, { align: 'center', size: 11, color: 'muted', baseline: 'middle' });
          const seeds = (cx, cy, n, r0) => Array.from({ length: n }, (_, k) => [cx + r0 * Math.cos((TAU * (k + 0.3)) / n), cy + r0 * Math.sin((TAU * (k + 0.3)) / n)]);
          const stopOut = (x, y) => Math.hypot(x, y) < b + 0.01, stopIn = (x, y) => Math.hypot(x, y) > a - 0.01;
          if (L) drawLines(s, F, seeds(he.x, he.y, 14, 0.18), EB, { color: 'red', dir: Math.sign(L), stop: stopOut, h: 0.07, n: 500, alpha: 0.7 });
          if (I) drawLines(s, F, seeds(hi.x, hi.y, 14, 0.14), EB, { color: 'orange', dir: Math.sign(I), stop: stopIn, h: 0.05, n: 500, alpha: 0.8 });
          const rim = (R, off, dr) => { const out = []; for (let k = 0; k < 24; k++) { const t = (TAU * (k + 0.5)) / 24, x = (R + off) * Math.cos(t), y = (R + off) * Math.sin(t), f = F(x, y), en = f[0] * Math.cos(t) + f[1] * Math.sin(t); out.push([t, en]); } return out; };
          const outer = rim(b, 0.02), inner = rim(a, -0.02), mo = Math.max(...outer.map((p) => Math.abs(p[1])), 1e-9), mi = Math.max(...inner.map((p) => Math.abs(p[1])), 1e-9);
          outer.forEach(([t, e]) => { const l = (0.55 * e) / mo; s.segment([b * Math.cos(t), b * Math.sin(t)], [(b + l) * Math.cos(t), (b + l) * Math.sin(t)], { color: e >= 0 ? 'red' : 'blue', width: 3 }); });
          inner.forEach(([t, e]) => { const l = (0.4 * e) / mi; s.segment([a * Math.cos(t), a * Math.sin(t)], [(a - l) * Math.cos(t), (a - l) * Math.sin(t)], { color: e >= 0 ? 'red' : 'blue', width: 3 }); });
          he.color = sgnCol(L); hi.color = sgnCol(I);
          const spread = (S, R) => { let lo = 1e30, hi2 = -1e30; for (let k = 0; k < 90; k++) { const t = (TAU * k) / 90, p = potL(S, R * Math.cos(t), R * Math.sin(t)); lo = Math.min(lo, p); hi2 = Math.max(hi2, p); } return hi2 - lo; };
          const Ec = Math.hypot(...fldL(cavS, 0, 0));
          info = { so: spread(outS, b), si: spread(cavS, a), Ec, tot: Q + I + L, q_in: -I, q_out: Q + I };
        });
        v.readout(() => `Induced charge on the inner wall $=${v.fix(info.q_in, 1)}$ nC/cm, on the outer wall $=${v.fix(info.q_out, 1)}$ nC/cm (plus the part induced by the outside charge, which sums to zero).\nPotential variation over the outer wall: $${v.sci(info.so + 1e-12, 1)}$ V; over the inner wall: $${v.sci(info.si + 1e-12, 1)}$ V — both walls are equipotentials. Field in the metal: $0$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Capacitance',
      statement: String.raw`For two conductors carrying charges $+Q$ and $-Q$, the potential difference is proportional to $Q$ (everything else fixed):
$$Q=C\,\Delta V,$$
and the constant $C>0$, the **capacitance**, depends only on the geometry of the two conductors and the medium (SI unit: farad, F = C/V). For a single conductor $C$ refers to the other being at infinity: for an isolated sphere $C=4\pi\varepsilon_0R$.`,
      idea: String.raw`With the geometry fixed, a given $\rho$ (the surface charges) yields a unique field by the second uniqueness theorem (em-3.6): charges $(Q,-Q)$ determine the potentials. Scaling every charge by $\lambda$ scales the field and the potentials by $\lambda$ (Coulomb's law is linear, em-2.3), so $\Delta V\propto Q$, and $C=Q/\Delta V$ is a property of the shapes. Dimensionally $C=\varepsilon_0\times$(a length), which is why 1 cm of size is worth about 1.1 pF.`,
      caption: String.raw`Two spheres of radius $R_1=1.5$ cm and $R_2$ (slider) carry $+Q$ and $-Q$; the exact field of the sphere pair is built from the infinite series of image charges. The left panel shows the equipotentials and field lines; the right panel plots $\Delta V$ against $Q$: a straight line whose slope $1/C$ changes when you move the spheres or resize one: bringing them closer raises $C$ and so makes the line flatter. Dashed lines show the two extreme separations.`,
      scope: String.raw`Exact for two conducting spheres in vacuum, summing up to 400 image charges (accurate unless the spheres are within a small fraction of a centimetre of touching). The field is drawn in the plane through both centres; the series is the classical one of Maxwell’s *Treatise* (art. 173 ff.).`,
      deps: ['em-3.1', 'em-2.3'],
      refs: ['Griffiths §2.5', 'Purcell ch. 3'],
      tags: ['capacitance', 'spheres'],
      viz(v) {
        const R1 = 1.5;
        const s = v.stage({ x: [-4, 10], y: [-4.5, 4.5], equal: true, height: 330, axes: false, weight: 1.35, title: 'two spheres with ±Q' });
        const sV = v.stage({ x: [0, 20], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 0.9, minWidth: 240, xlabel: 'charge $Q$ (nC)', ylabel: '$\\Delta V$ (kV)', title: '$\\Delta V=Q/C$' });
        const Qs = v.slider('charge $Q$', 0.5, 20, 8, { step: 0.5, fmt: (x) => `${x} nC` });
        const R2s = v.slider('radius $R_2$', 0.5, 3, 1.5, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const ds = v.slider('centre separation $d$', 2.2, 12, 4.5, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        // image charges: potential 1 V on sphere A (centre 0, radius ra), 0 on sphere B (centre d, radius rb)
        const imgs = (ra, rb, d) => {
          const A = [{ x: 0, q: ra / KV }], B = []; let last = A[0], inA = true;
          for (let it = 0; it < 400; it++) {
            let cB = inA ? d : 0, rO = inA ? rb : ra; const s2 = Math.abs(last.x - cB); if (!(s2 > 1e-9)) break;
            const q = (-last.q * rO) / s2, x = cB + Math.sign(last.x - cB) * (rO * rO) / s2, n = { x, q };
            (inA ? B : A).push(n); last = n; inA = !inA; if (Math.abs(q) < 1e-13) break;
          }
          return [A, B];
        };
        const cap = (ra, rb, d) => {
          const [A1, B1] = imgs(ra, rb, d), sum = (L) => L.reduce((t, c) => t + c.q, 0);
          const [B2, A2] = imgs(rb, ra, d).map((L) => L.map((c) => ({ x: d - c.x, q: c.q }))); // unit potential on B (reflect coordinates)
          const c11 = sum(A1), c21 = sum(B1), c22 = sum(B2), c12 = sum(A2);
          const det = c11 * c22 - c12 * c21, k = (c22 - c12) / det, l = (-c21 + c11) / det; // solve C [V1,V2] = [1,-1] Q
          const V1 = (c22 * 1 - c12 * -1) / det, V2 = (-c21 * 1 + c11 * -1) / det;
          return { C: 1 / (V1 - V2), V1, V2, A1, B1, B2, A2 };
        };
        let info = {};
        v.render(() => {
          const R2 = R2s.value, d = Math.max(ds.value, R1 + R2 + 0.12), Q = Qs.value;
          const r = cap(R1, R2, d), V1 = r.V1 * Q, V2 = r.V2 * Q, src = [];
          for (const c of r.A1) src.push({ x: c.x, y: 0, q: c.q * V1 }); for (const c of r.B1) src.push({ x: c.x, y: 0, q: c.q * V1 });
          for (const c of r.B2) src.push({ x: c.x, y: 0, q: c.q * V2 }); for (const c of r.A2) src.push({ x: c.x, y: 0, q: c.q * V2 });
          const inside = (x, y) => (Math.hypot(x, y) < R1 ? V1 : Math.hypot(x - d, y) < R2 ? V2 : null);
          const f = (x, y) => { const w = inside(x, y); return w === null ? pot(src, x, y) : w; };
          const sc = Math.max(Math.abs(V1), Math.abs(V2), 100);
          heatPot(s, f, 0.7 * sc, `c${Q}${R2}${d}`, { res: 3 });
          s.contour((x, y) => (inside(x, y) === null ? pot(src, x, y) : NaN), levels(sc / 6, 10).filter((z) => z), { color: 'ink', alpha: 0.3, width: 1, res: 140 });
          const Fx = (x, y) => (inside(x, y) === null ? fld(src, x, y) : [0, 0]);
          const sd = Array.from({ length: 12 }, (_, k) => [R1 * 1.03 * Math.cos((TAU * (k + 0.5)) / 12), R1 * 1.03 * Math.sin((TAU * (k + 0.5)) / 12)]);
          drawLines(s, Fx, sd, [-4, 10, -4.5, 4.5], { color: 'ink', dir: Q * r.V1 > 0 ? 1 : -1, h: 0.07, n: 700, alpha: 0.55, stop: (x, y) => inside(x, y) !== null });
          s.circle(0, 0, R1, { color: 'red', width: 2.4, fill: 'red', fillAlpha: 0.12 }); s.circle(d, 0, R2, { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12 });
          s.text('+Q', 0, 0, { align: 'center', size: 14, color: 'red', weight: 700 }); s.text('−Q', d, 0, { align: 'center', size: 14, color: 'blue', weight: 700 });
          // ΔV vs Q lines
          const dmin = R1 + R2 + 0.3, Cmin = cap(R1, R2, dmin).C, Cfar = cap(R1, R2, 12).C, C0 = r.C;
          const top = 20 * 1.15 / Math.min(C0, Cmin, Cfar) / 1000; sV.setView([0, 20], [0, top]);
          sV.path([[0, 0], [20, 20 / Cfar / 1000]], { color: 'muted', dash: true }); sV.path([[0, 0], [20, 20 / Cmin / 1000]], { color: 'muted', dash: true });
          sV.path([[0, 0], [20, 20 / C0 / 1000]], { color: 'accent', width: 2.4 }); sV.dot(Q, Q / C0 / 1000, { r: 6, color: 'gold' });
          sV.text(`$d=12$ cm`, 18.5, 20 / Cfar / 1000, { align: 'right', size: 11, color: 'muted', dy: -10 }); sV.text(`$d=${dmin.toFixed(1)}$ cm`, 18.5, 20 / Cmin / 1000, { align: 'right', size: 11, color: 'muted', dy: 10 });
          info = { C: C0, dV: V1 - V2, V1, V2, Q, iso: (R1 * R2) / (R1 + R2) * 1.1126501, d };
        });
        v.readout(() => `$V_1=${v.fix(info.V1 / 1000, 2)}$ kV, $V_2=${v.fix(info.V2 / 1000, 2)}$ kV, so $\\Delta V=${v.fix(info.dV / 1000, 3)}$ kV and $C=Q/\\Delta V=${v.fix(info.C * 1000, 3)}$ pF.\nFor comparison: far-apart limit $4\\pi\\varepsilon_0R_1R_2/(R_1+R_2)=${v.fix(info.iso, 3)}$ pF (the spheres’ mutual attraction raises $C$ above it as they approach).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Parallel-plate, spherical and cylindrical capacitors',
      statement: String.raw`Three geometries where the field can be found by Gauss’s law:
(a) parallel plates of area $A$ and gap $d\ll\sqrt A$: $C=\varepsilon_0A/d$;
(b) concentric spheres of radii $a<b$: $C=4\pi\varepsilon_0\,\dfrac{ab}{b-a}$;
(c) coaxial cylinders of radii $a<b$ and length $\ell\gg b$: $C=\dfrac{2\pi\varepsilon_0\ell}{\ln(b/a)}$.
In each case the field lives between the conductors and the capacitance is a purely geometric factor.`,
      idea: String.raw`Gauss's law (em-1.16 in its symmetric forms) gives $E$ between the conductors in terms of $Q$: $\sigma/\varepsilon_0$ between the plates, $Q/4\pi\varepsilon_0r^2$ between spheres, $Q/2\pi\varepsilon_0\ell r$ between cylinders. Integrating $E$ across the gap gives $\Delta V$, and $C=Q/\Delta V$ (em-3.8). The plate formula neglects the fringing field at the edges, which is an $O(d/\sqrt A)$ correction; the narrow-gap limits of the spherical and cylindrical formulas, with $b-a=d$, reduce to $\varepsilon_0A/d$.`,
      caption: String.raw`**Plates**: a numerical (relaxation) solution for two long strips, a cross-section with width $w$ and gap $d$ (drag the sliders): the colour and equipotentials show the field with its fringing at the edges, and the readout compares the capacitance computed from the flux with $\varepsilon_0w/d$; the ratio approaches $1$ as $d/w\to0$. **Sphere / cylinder**: the exact radial field $E(r)$ and potential $V(r)$ between the shells for the radii you choose.`,
      scope: String.raw`The plate picture is two-dimensional (strips of width $w$, capacitance per unit length $C'$), solved on a $161\times121$ grid with $0.1$ cm spacing inside a grounded box $16\times12$ cm; the plates are one grid cell ($0.1$ cm) thick, and the box and the thickness each add a few per cent to $C'$ when $d$ is small. The ideal formulas are idealizations: they ignore fringing and assume vacuum.`,
      deps: ['em-3.8', 'em-1.16'],
      refs: ['Griffiths §2.5', 'Purcell ch. 3'],
      tags: ['capacitance', 'gauss'],
      viz(v) {
        const N = 161, Mg = 121, h = 0.1, E0 = 0.0885418782; // pF/cm
        const mode = v.select('geometry', [{ value: 'p', label: 'parallel plates' }, { value: 's', label: 'spherical' }, { value: 'c', label: 'cylindrical' }], 'p');
        const s = v.stage({ x: [-8, 8], y: [-6, 6], equal: true, height: 340, axes: false, weight: 1.3, title: 'cross-section' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', gutter: true, weight: 0.9, minWidth: 230, xlabel: 'distance', ylabel: '', title: 'field and potential' });
        const ws = v.slider('plate width $w$', 1, 10, 6, { step: 0.2, fmt: (x) => `${x.toFixed(1)} cm` }), ds = v.slider('gap $d$', 0.4, 4, 1, { step: 0.2, fmt: (x) => `${x.toFixed(1)} cm` });
        const as = v.slider('inner radius $a$', 0.5, 3, 1.2, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` }), bs = v.slider('outer radius $b$', 1, 5.5, 3.5, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const upd = () => { const p = mode.value === 'p'; ws.el.hidden = !p; ds.el.hidden = !p; as.el.hidden = p; bs.el.hidden = p; };
        let V = new Float64Array(N * Mg), fixed = new Uint8Array(N * Mg), key = '', info = {};
        const solvePlates = () => {
          const w = ws.value, d = ds.value, jt = 60 + Math.round(d / 2 / h), jb = 60 - Math.round(d / 2 / h), i0 = 80 - Math.round(w / 2 / h), i1 = 80 + Math.round(w / 2 / h);
          fixed.fill(0); for (let i = 0; i < N; i++) { fixed[i] = fixed[(Mg - 1) * N + i] = 1; V[i] = V[(Mg - 1) * N + i] = 0; } for (let j = 0; j < Mg; j++) { fixed[j * N] = fixed[j * N + N - 1] = 1; V[j * N] = V[j * N + N - 1] = 0; }
          for (let i = i0; i <= i1; i++) { fixed[jt * N + i] = 1; V[jt * N + i] = 0.5; fixed[jb * N + i] = 1; V[jb * N + i] = -0.5; }
          sor(V, fixed, N, Mg, 1.95, 450);
          // charge on the upper plate: flux of E through a loop two cells outside it
          const ja = jt - 2, jc = jt + 2, ia = i0 - 2, ic = i1 + 2; let flux = 0;
          for (let i = ia; i < ic; i++) { flux += -(V[(jc + 0) * N + i] - V[(jc - 1) * N + i]) / h * h; flux -= -(V[(ja + 1) * N + i] - V[ja * N + i]) / h * h; }
          for (let j = ja; j < jc; j++) { flux += -(V[j * N + ic + 0] - V[j * N + ic - 1]) / h * h; flux -= -(V[j * N + ia + 1] - V[j * N + ia]) / h * h; }
          return { mode: 'p', C: (E0 * flux) / 1, ideal: (E0 * (i1 - i0) * h) / ((jt - jb) * h), w: (i1 - i0) * h, d: (jt - jb) * h, jt, jb, i0, i1 };
        };
        v.render(() => {
          upd();
          if (mode.value === 'p') {
            const k = ws.value + '|' + ds.value; if (k !== key) { key = k; info = solvePlates(); }
            s.setView([-8, 8], [-6, 6]);
            heatPot(s, (x, y) => samp(V, N, Mg, -8, 8, -6, 6, x, y), 0.4, 'pl' + k, { res: 3 });
            s.contour((x, y) => samp(V, N, Mg, -8, 8, -6, 6, x, y), levels(0.05, 9).filter((z) => z), { color: 'ink', alpha: 0.35, width: 1, res: 160 });
            const wh = info.w / 2, dh = info.d / 2;
            s.rect(-wh, dh - 0.05, wh, dh + 0.05, { color: 'red', fill: 'red', fillAlpha: 0.7 }); s.rect(-wh, -dh - 0.05, wh, -dh + 0.05, { color: 'blue', fill: 'blue', fillAlpha: 0.7 });
            // field strength profile along the midplane
            sR.setView([-8, 8], [0, 2]); sR.setLabels('$x$ along the midplane (cm)', '$|E|$ (V/cm) for 1 V across');
            const Ey = (x) => (samp(V, N, Mg, -8, 8, -6, 6, x, 0.05) - samp(V, N, Mg, -8, 8, -6, 6, x, -0.05)) / 0.1;
            sR.fn(Ey, { color: 'accent', width: 2.2 }); sR.hline(1 / info.d, { color: 'green', dash: true }); sR.text('ideal $1/d$', 7.8, 1 / info.d, { align: 'right', size: 11, color: 'green', dy: -10 });
            sR.setView([-8, 8], [0, Math.max(1.2 / info.d, 0.5)]);
          } else if (mode.value === 's' || mode.value === 'c') {
            const a = as.value, b = Math.max(bs.value, a + 0.3), sph = mode.value === 's', Q = 1;
            const V0 = sph ? (1 / a - 1 / b) : Math.log(b / a), Ef = (r) => (r < a || r > b ? 0 : sph ? 1 / (r * r) : 1 / r), Vf = (r) => (r < a ? V0 : r > b ? 0 : sph ? 1 / r - 1 / b : Math.log(b / r));
            s.setView([-8, 8], [-6, 6]);
            s.heat((x, y) => (Math.hypot(x, y) > b ? NaN : Vf(Math.hypot(x, y)) / V0), { range: [0, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: 'sc' + mode.value + a + b, alpha: 0.5 });
            s.circle(0, 0, a, { color: 'red', width: 2.6, fill: 'red', fillAlpha: 0.15 }); s.circle(0, 0, b, { color: 'blue', width: 2.6 });
            for (let k = 0; k < 16; k++) { const t = (TAU * k) / 16; s.arrow(a * 1.04 * Math.cos(t), a * 1.04 * Math.sin(t), (b - 0.05) * Math.cos(t), (b - 0.05) * Math.sin(t), { color: 'ink', alpha: 0.45, width: 1.2, head: 6 }); }
            for (let k = 1; k < 6; k++) { const rr = a + ((b - a) * k) / 6, c2 = circ(0, 0, rr, 80); s.path(c2, { color: 'ink', alpha: 0.2, width: 1 }); }
            sR.setView([0, b * 1.15], [0, 1.1]); sR.setLabels('radius $r$ (cm)', 'relative $E$ (blue), $V$ (red)');
            sR.fn((r) => Ef(r) / Ef(a), { color: 'blue', width: 2.2, domain: [a, b] }); sR.fn((r) => Vf(r) / V0, { color: 'red', width: 2.2, domain: [0, b * 1.15] });
            sR.vline(a, { color: 'faint', dash: true }); sR.vline(b, { color: 'faint', dash: true });
            info = { mode: 'x', C: sph ? (4 * Math.PI * E0 * a * b) / (b - a) : (2 * Math.PI * E0) / Math.log(b / a), a, b, sph, Ea: Ef(a) / 1 };
          }
        });
        v.readout(() => info.mode === 'p' ? `From the flux through a loop round the upper plate: $C'=${v.fix(info.C, 4)}$ pF/cm. Ideal $\\varepsilon_0w/d=${v.fix(info.ideal, 4)}$ pF/cm. Ratio $${v.fix(info.C / info.ideal, 3)}$ at $d/w=${v.fix(info.d / info.w, 2)}$ (fringing makes the true value larger).` : info.sph ? `$C=4\\pi\\varepsilon_0ab/(b-a)=${v.fix(info.C, 3)}$ pF. Narrow-gap check: with gap $d=b-a=${v.fix(info.b - info.a, 2)}$ cm and area $4\\pi ab$ the plate formula gives $\\varepsilon_0A/d=${v.fix((E0 * 4 * Math.PI * info.a * info.b) / (info.b - info.a), 3)}$ pF — identical, since $A=4\\pi ab$ is the geometric mean area.` : `$C'=2\\pi\\varepsilon_0/\\ln(b/a)=${v.fix(info.C, 4)}$ pF/cm. Plate formula with $A/\\ell=2\\pi\\sqrt{ab}$ and $d=b-a$: $${v.fix((E0 * 2 * Math.PI * Math.sqrt(info.a * info.b)) / (info.b - info.a), 4)}$ pF/cm; the two agree as $b\\to a$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Energy stored in a capacitor',
      statement: String.raw`The work needed to charge a capacitor of capacitance $C$ to charge $\pm Q$ (potential difference $V=Q/C$) is
$$W=\int_0^Q\frac{q}{C}\,dq=\frac{Q^2}{2C}=\tfrac12CV^2=\tfrac12QV,$$
and it equals the energy $\tfrac{\varepsilon_0}2\int E^2\,d\tau$ stored in the field between the conductors.`,
      idea: String.raw`Moving a small charge $dq$ from the negative to the positive conductor when they already carry $\mp q$ costs $dW=V(q)\,dq=(q/C)\,dq$ (em-2.10 applied to a continuous charge, em-3.8 for $V=q/C$). Adding up gives the triangle under $V(q)$, i.e. half of the naive $QV$. For a parallel-plate capacitor, $E=V/d$ between plates of area $A$ so $\tfrac{\varepsilon_0}2E^2\,Ad=\tfrac12\varepsilon_0\frac{A}{d}V^2=\tfrac12CV^2$ (em-2.11): the same energy, now located in the field.`,
      caption: String.raw`Charge a parallel-plate capacitor in $n$ steps, each moving $\Delta q=Q/n$ at the current voltage. The red staircase is the work spent, the area under the straight line $V=q/C$ is $Q^2/2C$. With few steps the staircase overshoots; as $n$ grows it converges to the triangle. The bars compare the staircase, $Q^2/2C$, the field integral $\int\tfrac{\varepsilon_0}2E^2d\tau$, and the naive (wrong) $QV$.`,
      scope: String.raw`The field integral uses the ideal parallel-plate field $E=Q/\varepsilon_0A$ in the gap (no fringing, vacuum). The result $Q^2/2C$ holds for any pair of conductors; the field integral equals it exactly in any geometry, which is the content of em-2.11.`,
      deps: ['em-3.8', 'em-2.10'],
      refs: ['Griffiths §2.5', 'Purcell ch. 3'],
      tags: ['energy', 'capacitor'],
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, weight: 1.25, xlabel: 'charge moved so far $q$ (nC)', ylabel: '$V$ (V)', title: 'work staircase' });
        const sB = v.stage({ x: [0, 4], y: [0, 1], height: 320, axes: 'box', gutter: true, weight: 0.8, minWidth: 240, ylabel: 'energy (µJ)', xticks: [[0.5, 'steps'], [1.5, 'Q²/2C'], [2.5, 'field'], [3.5, 'QV']], title: 'four ways to count' });
        const Qs = v.slider('final charge $Q$', 1, 100, 40, { step: 1, fmt: (x) => `${x} nC` });
        const As = v.slider('plate area $A$', 10, 400, 100, { log: true, fmt: (x) => `${x.toPrecision(3)} cm²` }), ds = v.slider('gap $d$', 0.05, 1, 0.2, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const ns = v.slider('steps $n$', 1, 60, 6, { int: true });
        let info = {};
        v.render(() => {
          const A = As.value, d = ds.value, Q = Qs.value, n = ns.value, C = (EPS0 * A) / d * 1e9 / 1e9; // nC/V
          const Cn = EPS0 * A / d, Vend = Q / Cn;
          s.setView([0, Q * 1.04], [0, Vend * 1.1]);
          s.path([[0, 0], [Q, Vend]], { color: 'accent', width: 2.4 });
          let W = 0;
          for (let k = 0; k < n; k++) { const q0 = (Q * k) / n, q1 = (Q * (k + 1)) / n, V0 = q0 / Cn; s.rect(q0, 0, q1, V0, { color: 'red', fill: 'red', fillAlpha: 0.12, width: 1 }); s.rect(q0, V0, q1, q0 / Cn + (q1 - q0) / Cn, { color: 'red', fill: 'red', fillAlpha: 0.3, width: 1 }); W += (V0 * (q1 - q0)); }
          // staircase uses the voltage at the start of each step (lower sum) — plus the half-step average (trapezoid) as the exact value
          const Wl = W; let Wu = 0; for (let k = 0; k < n; k++) Wu += (((Q * (k + 1)) / n) / Cn) * (Q / n);
          const exact = (Q * Q) / (2 * Cn), E = Q / (EPS0 * A), field = 0.5 * EPS0 * E * E * A * d, naive = Q * Vend;
          const toJ = 1e-9 * 1; // nC·V = nJ -> µJ factor: nC*V = 1e-9 C·V = 1e-9 J = 1e-3 µJ
          const mu = (x) => x * 1e-3;
          sB.setView([0, 4], [0, mu(naive) * 1.15]);
          sB.rect(0.2, 0, 0.8, mu(Wl), { color: 'red', fill: 'red', fillAlpha: 0.4 }); sB.rect(0.2, mu(Wl), 0.8, mu(Wu), { color: 'red', fill: 'red', fillAlpha: 0.15, dash: true });
          sB.rect(1.2, 0, 1.8, mu(exact), { color: 'accent', fill: 'accent', fillAlpha: 0.4 }); sB.rect(2.2, 0, 2.8, mu(field), { color: 'green', fill: 'green', fillAlpha: 0.4 }); sB.rect(3.2, 0, 3.8, mu(naive), { color: 'muted', fill: 'muted', fillAlpha: 0.3 });
          info = { exact, field, Wl, Wu, naive, Vend, Cn, n, E };
        });
        v.readout(() => `$C=${v.fix(info.Cn * 1000, 2)}$ pF, final voltage $V=${v.fix(info.Vend, 1)}$ V, gap field $E=${v.sci(info.E * 100, 2)}$ V/m.\nWork with $n=${info.n}$ steps: lower staircase $${v.fix(info.Wl * 1e-3, 3)}$ µJ, upper staircase $${v.fix(info.Wu * 1e-3, 3)}$ µJ (the exact value lies between). $Q^2/2C=${v.fix(info.exact * 1e-3, 3)}$ µJ; field energy $=${v.fix(info.field * 1e-3, 3)}$ µJ; naive $QV=${v.fix(info.naive * 1e-3, 3)}$ µJ is twice too big.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Method',
      name: 'Method of images: charge near a grounded plane',
      statement: String.raw`A point charge $q$ at height $d$ above an infinite grounded conducting plane produces, in the half-space above the plane, exactly the field of $q$ together with an *image* charge $-q$ at the mirror point $d$ below the plane. The induced surface charge density on the plane at distance $\rho$ from the foot of the perpendicular is
$$\sigma(\rho)=-\frac{q\,d}{2\pi\,(\rho^2+d^2)^{3/2}},\qquad\int\sigma\,dA=-q.$$
The image field is only valid above the plane; below it the real field is zero.`,
      idea: String.raw`The potential of $q$ and its mirror image $-q$ satisfies Poisson's equation above the plane with the single source $q$, and is $0$ on the plane by symmetry (the two contributions cancel). By the first uniqueness theorem (em-3.5) the grounded-plane problem has exactly this solution above the plane, and no other. The surface charge follows from $\sigma=\varepsilon_0E_\perp$ (em-3.2): the field at the plane is vertical with magnitude $2\cdot\frac{q}{4\pi\varepsilon_0}\frac{d}{(\rho^2+d^2)^{3/2}}$. Integrating over the plane gives $-q$: all the flux of $q$ ends on the plane.`,
      caption: String.raw`Drag the charge $q$ (it keeps above the plane). The shading is the potential of the charge and its image; blue/red lines are field lines, ending perpendicularly on the plane. Tick **show image field** to see the continuation below the plane: it exists only in the equations. On the right, the induced density $\sigma(\rho)$ and the induced charge inside a disc of radius $\rho_{max}$ (slider), which tends to $-q$.`,
      scope: String.raw`Infinite, grounded, perfectly conducting plane, vacuum above. The picture is the plane through the charge perpendicular to the conductor; the induced charge is rotationally symmetric about the vertical axis through $q$. For an isolated, neutral plane (rather than grounded) the same solution holds for an infinite plane.`,
      credit: 'W. Thomson (Lord Kelvin), 1840s',
      verify: true,
      deps: ['em-3.5'],
      refs: ['Griffiths §3.2', 'Feynman II ch. 6'],
      tags: ['images', 'grounded plane'],
      viz(v) {
        const BX = [-5, 5, -1.5, 5];
        const s = v.stage({ x: [-5, 5], y: [-1.5, 5], equal: true, height: 360, axes: false, weight: 1.15, title: 'charge above a grounded plane' });
        const sS = v.stage({ x: [0, 6], y: [0, 1.05], height: 360, axes: 'box', gutter: true, weight: 0.85, minWidth: 250, xlabel: 'distance from foot $\\rho/d$', ylabel: '', title: 'induced charge' });
        const qs = v.slider('charge $q$', -5, 5, 3, { step: 0.5, fmt: (x) => `${x} nC` });
        const h = s.handle(0.8, 2, { color: 'red', r: 9, constrain: (x, y) => [x, Math.max(0.35, y)] });
        const show = v.toggle('show image field below the plane', false);
        const rho = v.slider('disc radius $\\rho_{max}$', 0.2, 40, 3, { log: true, fmt: (x) => `${x.toPrecision(2)} d` });
        let info = {};
        v.render(() => {
          const q = qs.value || 1e-6, d = h.y, x0 = h.x, src = [{ x: x0, y: d, q }, { x: x0, y: -d, q: -q }], F = (x, y) => fld(src, x, y);
          h.color = sgnCol(qs.value);
          const sc = Math.max(300, 0.5 * Math.abs(q) * KV / 0.9);
          heatPot(s, (x, y) => (y < 0 && !show.value ? 0 : pot(src, x, y)), sc, `p${x0.toFixed(2)}${d.toFixed(2)}${q}${show.value}`, { res: 3, alpha: show.value ? 0.6 : 0.85 });
          s.contour((x, y) => (y < 0 && !show.value ? NaN : pot(src, x, y)), levels(sc / 3, 9).filter((z) => z), { color: 'ink', alpha: 0.28, width: 1, res: 140 });
          if (!show.value) s.rect(-5, -1.5, 5, 0, { fill: 'muted', fillAlpha: 0.35, color: 'ink', width: 2 }); else s.line(-5, 0, 5, 0, { color: 'ink', width: 2 });
          const seeds = Array.from({ length: 16 }, (_, k) => [x0 + 0.16 * Math.cos((TAU * (k + 0.25)) / 16), d + 0.16 * Math.sin((TAU * (k + 0.25)) / 16)]);
          drawLines(s, F, seeds, show.value ? BX : [-5, 5, 0, 5], { color: q > 0 ? 'red' : 'blue', dir: q > 0 ? 1 : -1, h: 0.06, n: 900, alpha: 0.75, stop: (x, y) => (show.value ? Math.hypot(x - x0, y + d) < 0.14 : y < 0.01) });
          if (show.value) { s.dot(x0, -d, { r: 9, hollow: true, color: sgnCol(-q) }); s.text('image', x0 + 0.3, -d, { size: 12, color: 'muted' }); }
          s.dot(x0, d, { r: 9, color: sgnCol(q) }); s.text(q > 0 ? '+' : '−', x0, d, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false });
          const sg = (r) => (1 / (1 + r * r) ** 1.5), enc = (r) => 1 - 1 / Math.sqrt(1 + r * r);
          sS.fn(sg, { color: 'accent', width: 2.2, domain: [0, 6] }); sS.fn(enc, { color: 'green', width: 2.2, domain: [0, 6] });
          sS.vline(rho.value, { color: 'gold', dash: true }); sS.hline(1, { color: 'faint', dash: true });
          sS.dot(Math.min(rho.value, 6), enc(Math.min(rho.value, 6)), { r: 5, color: 'gold' });
          info = { d, q, s0: (-q * 1) / (2 * Math.PI * d * d), enc: enc(rho.value), num: v.M.integrate((r) => 2 * Math.PI * r * sg(r) / (2 * Math.PI), 0, rho.value, 400) };
        });
        v.legend([['accent', '$\\sigma(\\rho)/\\sigma(0)$'], ['green', 'fraction of $-q$ inside $\\rho$']]);
        v.readout(() => `Charge at height $d=${v.fix(info.d, 2)}$ cm. Peak induced density $\\sigma(0)=${v.fix(info.s0, 4)}$ nC/cm² (directly under the charge).\nInside radius $\\rho_{max}$ the plane carries $${v.fix(-info.q * info.enc, 3)}$ nC; numerical integral of $\\sigma\\,dA$: $${v.fix(-info.q * info.num, 3)}$ nC; the total is $-q=${v.fix(-info.q, 2)}$ nC.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Method',
      name: 'Image charge for a grounded sphere',
      statement: String.raw`A point charge $q$ at distance $a>R$ from the centre of a grounded conducting sphere of radius $R$ produces outside the sphere the field of $q$ together with an image charge
$$q'=-\frac{R}{a}\,q\qquad\text{at distance}\qquad b=\frac{R^2}{a}$$
from the centre, on the line to $q$. The induced charge on the sphere is $q'$, and the potential vanishes on the sphere.`,
      idea: String.raw`Place $q$ and $q'$ on a line through the centre. On the sphere, the ratio of the distances to $q$ and to the image is constant, $|\mathbf r-\mathbf a|/|\mathbf r-\mathbf b|=a/R$ (Apollonius' circle: a sphere is the locus of constant distance ratio), so with $q'/q=-R/a$ the two potentials $q/4\pi\varepsilon_0|\mathbf r-\mathbf a|$ and $q'/4\pi\varepsilon_0|\mathbf r-\mathbf b|$ cancel at every point of the sphere. By uniqueness (em-3.5) the field outside is that of $q$ and $q'$, as in the plane case (em-3.11).`,
      caption: String.raw`Drag the charge $q$ around the sphere (the cross-section through the centre). Two sliders deliberately *spoil* the image: scale its size or its distance away from the correct value $-qR/a$, $R^2/a$. Then the potential on the sphere (right panel: $V(\theta)$ as one goes round) ripples away from zero, so the sphere is no longer grounded; only the correct pair gives the flat line at $0$.`,
      scope: String.raw`Grounded sphere in vacuum, charge outside. (For an isolated neutral sphere, add $+qR/a$ at the centre; for a sphere held at $V_0$, add $4\pi\varepsilon_0RV_0$ at the centre.) The picture is the plane through the centre and the charge, with the 3D inverse-square law.`,
      credit: 'W. Thomson (Lord Kelvin), 1840s',
      verify: true,
      deps: ['em-3.11'],
      refs: ['Griffiths §3.2', 'Feynman II ch. 6'],
      tags: ['images', 'sphere'],
      viz(v) {
        const R = 1.6;
        const s = v.stage({ x: [-5, 5], y: [-3.8, 3.8], equal: true, height: 340, axes: false, weight: 1.2, title: 'charge and grounded sphere' });
        const sV = v.stage({ x: [0, 360], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 0.85, minWidth: 250, xlabel: 'angle $\\theta$ round the sphere (degrees)', ylabel: '$V$ on the sphere (V)', title: 'potential on the sphere' });
        const qs = v.slider('charge $q$', -6, 6, 4, { step: 0.5, fmt: (x) => `${x} nC` });
        const fq = v.slider('image size × correct', 0.5, 1.5, 1, { step: 0.01 }), fb = v.slider('image distance × correct', 0.5, 1.5, 1, { step: 0.01 });
        const h = s.handle(3.4, 0.9, { color: 'red', r: 9, constrain: (x, y) => { const r = Math.hypot(x, y), m = R + 0.25; return r < m ? [(x / r) * m, (y / r) * m] : [x, y]; } });
        let info = {};
        v.render(() => {
          const q = qs.value || 1e-6, a = Math.hypot(h.x, h.y), ux = h.x / a, uy = h.y / a, qi = (-q * R) / a * fq.value, b = ((R * R) / a) * fb.value;
          const src = [{ x: h.x, y: h.y, q }, { x: ux * b, y: uy * b, q: qi }];
          h.color = sgnCol(qs.value);
          const out = (x, y) => Math.hypot(x, y) >= R;
          const sc = Math.max(250, Math.abs(q) * 120);
          heatPot(s, (x, y) => (out(x, y) ? pot(src, x, y) : 0), sc, `s${h.x.toFixed(2)}${h.y.toFixed(2)}${q}${fq.value}${fb.value}`, { res: 3 });
          s.contour((x, y) => (out(x, y) ? pot(src, x, y) : NaN), levels(sc / 3, 9).filter((z) => z), { color: 'ink', alpha: 0.28, width: 1, res: 140 });
          const seeds = Array.from({ length: 16 }, (_, k) => [h.x + 0.16 * Math.cos((TAU * (k + 0.25)) / 16), h.y + 0.16 * Math.sin((TAU * (k + 0.25)) / 16)]);
          drawLines(s, (x, y) => fld(src, x, y), seeds, [-5, 5, -3.8, 3.8], { color: q > 0 ? 'red' : 'blue', dir: q > 0 ? 1 : -1, h: 0.06, n: 900, alpha: 0.7, stop: (x, y) => Math.hypot(x, y) < R + 0.005 });
          s.circle(0, 0, R, { color: 'ink', width: 2.4, fill: 'muted', fillAlpha: 0.3 });
          s.dot(h.x, h.y, { r: 9, color: sgnCol(q) }); s.text(q > 0 ? '+' : '−', h.x, h.y, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false });
          s.dot(ux * b, uy * b, { r: 8, hollow: true, color: sgnCol(qi) }); s.text("image", ux * b, uy * b - 0.55, { align: 'center', size: 11, color: 'muted' });
          s.text('0 V', 0, -R * 0.55, { align: 'center', size: 13, color: 'muted' });
          const ang = Math.atan2(h.y, h.x), pts = []; let mx = 0;
          for (let k = 0; k <= 180; k++) { const t = (TAU * k) / 180, V = pot(src, R * Math.cos(t), R * Math.sin(t)); mx = Math.max(mx, Math.abs(V)); pts.push([(k * 2), V]); }
          const top = Math.max(mx * 1.2, 5); sV.setView([0, 360], [-top, top]);
          sV.hline(0, { color: 'green', dash: true }); sV.path(pts, { color: 'accent', width: 2.2 }); sV.vline(((ang * 180) / Math.PI + 360) % 360, { color: 'red', dash: true, alpha: 0.5 });
          info = { mx, qi, b, a, qc: (-q * R) / a, bc: (R * R) / a, V0: pot(src, R * ux, R * uy) };
        });
        v.readout(() => `Correct image: $q'=-qR/a=${v.fix(info.qc, 3)}$ nC at $R^2/a=${v.fix(info.bc, 3)}$ cm (distance of the charge $a=${v.fix(info.a, 2)}$ cm). Used: $q'=${v.fix(info.qi, 3)}$ nC at $${v.fix(info.b, 3)}$ cm.\nLargest $|V|$ on the sphere: $${v.fix(info.mx, 2)}$ V ${info.mx < 1e-6 ? '— zero, as required.' : '— not a grounded sphere.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'Attraction by induced charge',
      statement: String.raw`A point charge $q$ at distance $d$ from a grounded conducting plane is attracted to it with force
$$F=\frac{1}{4\pi\varepsilon_0}\frac{q^2}{(2d)^2},$$
the force between $q$ and its image. The work needed to pull it slowly to infinity is
$$W=\int_d^\infty F\,dx=\frac{1}{4\pi\varepsilon_0}\frac{q^2}{4d},$$
**half** of the interaction energy $-q^2/(4\pi\varepsilon_0\,2d)$ that two real charges $q,-q$ at separation $2d$ would have.`,
      idea: String.raw`The force on $q$ is the force of the induced charge on it, and by the image method (em-3.11) the induced charge acts on $q$ exactly like the image at distance $2d$; the surface density $\sigma$ there is given by em-3.2. For the energy, drag $q$ out: when $q$ is at height $x$ the force is $q^2/(4\pi\varepsilon_0\,4x^2)$ and the integral from $d$ to $\infty$ gives $q^2/(16\pi\varepsilon_0d)$. Two real charges would have field everywhere, whereas here the field exists only above the plane, and the energy in the upper half space is half the full-space energy of the pair.`,
      caption: String.raw`A charge $q$ (in units of the electron charge) above a metal plane (heights in nm; energies in eV). Drag the charge vertically, or use the slider. The curve is the attractive force $F(x)$; the shaded area from $d$ to $\infty$, integrated numerically, is the work to remove it, shown as a bar next to the pair energy $q^2/4\pi\varepsilon_0(2d)$: it is exactly half.`,
      scope: String.raw`Classical electrostatics with a perfect conductor; for an electron near a real metal surface the image potential is accurate down to a nanometre or so but fails at atomic distances (quantum effects, the finite screening length), and it is the origin of the Schottky lowering of the work function.`,
      deps: ['em-3.11', 'em-3.2'],
      refs: ['Griffiths §3.2'],
      tags: ['image force', 'energy'],
      viz(v) {
        const K = 1.439964548; // e²/4πε0 in eV·nm
        const s = v.stage({ x: [-2.5, 2.5], y: [-3.6, 4], equal: true, height: 330, axes: false, weight: 0.9, minWidth: 220, title: 'charge and plane' });
        const sF = v.stage({ x: [0, 4], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 1.1, xlabel: 'height $x$ (nm)', ylabel: '$F$ (eV/nm)', title: 'attractive force' });
        const sB = v.stage({ x: [0, 3], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 0.7, minWidth: 200, ylabel: 'energy (eV)', xticks: [[0.5, 'pair'], [1.5, '∫F dx'], [2.5, 'half pair']], title: 'energy' });
        const qs = v.slider('charge $q$ (units of $e$)', 1, 3, 1, { step: 1, int: true });
        const h = s.handle(0, 1, { color: 'red', r: 9, constrain: { x: [0, 0], y: [0.25, 3.8] } });
        let info = {};
        v.render(() => {
          const q = qs.value, d = h.y, F = (x) => (K * q * q) / (4 * x * x), top = F(0.25) * 1.02;
          s.rect(-2.5, -3.6, 2.5, 0, { fill: 'muted', fillAlpha: 0.35, color: 'ink', width: 2 });
          s.dot(0, -d, { r: 9, hollow: true, color: 'blue' }); s.text('image', 0.5, -d, { size: 12, color: 'muted' });
          s.arrow(0, d, 0, d * 0.35 + 0.03, { color: 'green', width: 3, head: 10 }); s.dot(0, d, { r: 9, color: 'red' });
          s.line(0.35, 0, 0.35, d, { color: 'faint', dash: true }); s.text('$d$', 0.55, d / 2, { size: 13, color: 'muted' });
          s.dot(0, d, { r: 9, color: 'red' });
          sF.setView([0, 4], [0, Math.min(top, F(0.4) * 1.1)]);
          sF.fn(F, { color: 'accent', width: 2.2, domain: [0.25, 4] });
          sF.fn(F, { color: 'green', fill: true, fillAlpha: 0.18, domain: [d, 4], stroke: false, width: 0 });
          sF.dot(d, F(d), { r: 6, color: 'gold' });
          const W = v.M.integrate((u) => F(1 / u) / (u * u), 1e-9, 1 / d, 4000), pair = (K * q * q) / (2 * d);
          sB.setView([0, 3], [0, pair * 1.15]);
          sB.rect(0.2, 0, 0.8, pair, { color: 'muted', fill: 'muted', fillAlpha: 0.3 }); sB.rect(1.2, 0, 1.8, W, { color: 'green', fill: 'green', fillAlpha: 0.4 }); sB.rect(2.2, 0, 2.8, pair / 2, { color: 'accent', fill: 'accent', fillAlpha: 0.3 });
          info = { F: F(d), W, pair, d, q };
        });
        v.readout(() => `At $d=${v.fix(info.d, 2)}$ nm: $F=${v.fix(info.F, 3)}$ eV/nm (=${v.fix(info.F * 0.160217663, 3)} nN).\n$W=\\int_d^\\infty F\\,dx=${v.fix(info.W, 4)}$ eV (numerical) versus $q^2/4\\pi\\varepsilon_0(4d)=${v.fix(info.pair / 2, 4)}$ eV; the pair energy would be $${v.fix(info.pair, 4)}$ eV.`);
      },
    },
  ],
};
