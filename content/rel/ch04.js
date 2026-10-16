// Special & General Relativity — Chapter 4 (items 4.1–4.6): four-momentum, E–p relation, conservation, mass–energy, massless particles
import { gam, boostEp, P, lightLines, eng, ME, MP } from './ch04.shared.js';

export default {
  collection: 'rel',
  chapter: 4,
  title: 'Relativistic dynamics',
  summary: String.raw`Momentum and energy merge into a single four-vector whose length is the rest mass, and its conservation replaces both Newtonian laws. Mass and energy become interchangeable, as nuclear binding energies show. The same bookkeeping explains Compton scattering, the energy thresholds that force particle physicists to build colliders, the kinematics of decays, and why cyclotrons fall out of step at high energy.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Four-momentum',
      statement: String.raw`For a particle of rest mass $m$ with four-velocity $u^\mu=\gamma(c,\mathbf v)$ the **four-momentum** is $p^\mu=m\,u^\mu=(E/c,\ \mathbf p)$, with $E=\gamma mc^2$ and $\mathbf p=\gamma m\mathbf v$. It is a four-vector: under a boost the energy and momentum mix exactly as $ct$ and $x$ do. Its Minkowski length is the same in every frame, $\eta(p,p)=E^2/c^2-|\mathbf p|^2=m^2c^2$, so the rest mass is a property of the particle, not of the observer. For $v\ll c$ the spatial part is Newton's $m\mathbf v$ and $E\approx mc^2+\tfrac12mv^2$.`,
      idea: String.raw`The proper time $d\tau$ along a worldline is invariant (rel-1.9), so $dx^\mu/d\tau$ transforms like $x^\mu$ itself; that is the four-velocity of rel-3.4, whose length is $c$. Multiplying by the invariant $m$ gives a four-vector of length $mc$. Its time component is $\gamma mc$, which the next items identify with the energy, and its space part $\gamma m\mathbf v$ is the quantity that is conserved in collisions in every frame (rel-4.3), unlike $m\mathbf v$.`,
      caption: String.raw`The left panel is a spacetime diagram in frame $S$; the particle's worldline carries a tangent arrow $u$ of one unit of proper time. The right panel is the same arrow, scaled by $m$, in the $(pc,E)$ plane: faint in $S$, solid in the observer's frame $S'$. **Move the observer-boost slider:** the components $(E,pc)$ change, the tip slides along the dashed mass hyperbola, and the invariant mass in the readout stays put. Compare with the Newtonian $mv$ (gold tick on the $pc$ axis), which falls short as $\beta\to1$.`,
      deps: ['rel-3.4'],
      refs: ['Taylor–Wheeler ch. 7', 'Schutz §2.4'],
      tags: ['four-momentum', 'energy', 'invariant mass'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Four-momentum' },
      viz(v) {
        const bS = v.slider('particle speed $\\beta$ in $S$', -0.9, 0.9, 0.6, { step: 0.01 });
        const mS = v.slider('rest mass $m$ (units $m_0$)', 0.3, 1.5, 1, { step: 0.01 });
        const oS = v.slider('observer boost $\\beta_o$', -0.8, 0.8, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-4, 4], y: [-1, 5], equal: true, axes: true, height: 380, minWidth: 300, title: 'spacetime, frame $S$: $(x, ct)$' });
        const B = v.stage({ x: [-7, 7], y: [-1, 10], equal: true, axes: true, height: 380, minWidth: 300, title: 'energy–momentum plane: $(pc, E)$ in units $m_0c^2$' });
        let st = {};
        v.render(() => {
          const b = bS.value, m = mS.value, bo = oS.value, g = gam(b);
          const E = g * m, p = g * b * m, [Ep, pp] = boostEp(E, p, bo);
          lightLines(A, 8);
          A.line(-bo * 6, -6, bo * 6, 6, { color: 'orange', width: 1.2, alpha: 0.6 }); A.line(-6, -bo * 6, 6, bo * 6, { color: 'orange', width: 1.2, alpha: 0.6 });
          A.text("$ct'$", bo * 4.2, 4.4, { color: 'orange', dx: 10 }); A.text("$x'$", 3.7, bo * 3.7, { color: 'orange', dy: -12 });
          A.line(-b * 6, -6, b * 6, 6, { color: 'accent', width: 1, alpha: 0.4 });
          A.arrow(0, 0, g * b, g, { color: 'accent', width: 3 });
          A.text('$u$', g * b, g, { color: 'accent', dx: 10, dy: -8 });
          A.dot(0, 0, { r: 4, color: 'ink' });
          lightLines(B, 14);
          B.curve((u) => [m * Math.sinh(u), m * Math.cosh(u)], -4, 4, { color: 'green', dash: [5, 4], width: 1.3, alpha: 0.9 });
          B.arrow(0, 0, p, E, { color: 'accent', width: 2, alpha: 0.4 });
          B.arrow(0, 0, pp, Ep, { color: 'accent', width: 3 });
          B.line(0, 0, m * b, 0, { color: 'gold', width: 3 }); B.dot(m * b, 0, { r: 4, color: 'gold' });
          B.text('$p^\\mu$', pp, Ep, { color: 'accent', dx: 10, dy: -8 });
          st = { b, m, E, p, Ep, pp, g };
        });
        v.legend([['accent', 'four-velocity $u$ / four-momentum $p=mu$'], ['orange', 'axes of the observer frame $S\'$'], ['green', 'mass hyperbola', { dash: true }], ['gold', 'Newtonian $mv$']]);
        v.readout(() => {
          const { b, m, E, p, Ep, pp } = st; if (E === undefined) return '';
          return String.raw`In $S$: $(E,pc)=(${v.fix(E, 3)},\,${v.fix(p, 3)})$, with $\gamma m=${v.fix(E, 3)}$ against Newton's $mv=${v.fix(m * b, 3)}$.` + '\n' +
            String.raw`In $S'$: $(E',p'c)=(${v.fix(Ep, 3)},\,${v.fix(pp, 3)})$. Invariant: $\sqrt{E^2-p^2c^2}=${v.fix(Math.sqrt(E * E - p * p), 4)}$ in $S$ and $${v.fix(Math.sqrt(Ep * Ep - pp * pp), 4)}$ in $S'$; the rest mass is $m=${v.fix(m, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Energy–momentum relation',
      statement: String.raw`For a free particle of rest mass $m$, total energy $E=\gamma mc^2$ and momentum $p=\gamma mv$ satisfy
$$E^2=(pc)^2+(mc^2)^2 .$$
In the $(pc,E)$ plane every state of a particle of mass $m$ lies on one branch of this hyperbola (its **mass shell**), $m=0$ gives the light lines $E=\pm pc$, and a change of inertial frame moves the state along the hyperbola. The speed is $v=pc^2/E$, and the kinetic energy $T=E-mc^2$.`,
      idea: String.raw`This is the statement $\eta(p,p)=m^2c^2$ of rel-4.1 written in components: $\gamma^2m^2c^4-\gamma^2m^2v^2c^2=m^2c^4\,\gamma^2(1-v^2/c^2)=m^2c^4$. Because the left side is a Lorentz scalar, a boost maps the mass shell to itself; on the hyperbola it is a hyperbolic rotation by the rapidity (rel-2.3), with $E=mc^2\cosh\eta$ and $pc=mc^2\sinh\eta$.`,
      caption: String.raw`**Drag the gold handle** along the mass hyperbola of mass $m$ (change $m$ with the slider; the faint curves are $m=1,2,3$). The **boost** slider carries the state to another frame: the solid point slides along the same hyperbola. The right panel plots $E$, $pc$ and $T$ against speed; the dashed Newtonian curves $mc^2+\tfrac12mv^2$ and $mv$ part ways from the true ones near $c$.`,
      deps: ['rel-4.1'],
      refs: ['Taylor–Wheeler ch. 7', 'Schutz §2.4'],
      tags: ['mass shell', 'energy', 'hyperbola'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Energy%E2%80%93momentum_relation' },
      viz(v) {
        const mS = v.slider('rest mass $m$ (units $m_0$)', 0, 3, 1, { step: 0.01 });
        const bS = v.slider('boost $\\beta_o$ of the observer', -0.9, 0.9, 0, { step: 0.01 });
        const A = v.stage({ x: [-5, 5], y: [-0.6, 6.4], equal: true, axes: true, height: 400, minWidth: 300, title: 'mass shells in the $(pc, E)$ plane' });
        const B = v.stage({ x: [0, 0.99], y: [0, 6], axes: 'box', gutter: true, height: 400, minWidth: 280, weight: 0.9, xlabel: 'speed $\\beta=v/c$', ylabel: 'in units of $m c^2$', title: 'the same relation against speed (mass $m=1$)' });
        const H = A.handle(1.5, Math.sqrt(2.25 + 1), { color: 'gold', label: 'state', labelPos: 'ne', constrain: (x) => [Math.max(-4.5, Math.min(4.5, x)), Math.sqrt(x * x + mS.value * mS.value)] });
        let st = {};
        v.render(() => {
          const m = mS.value, x0 = H.x; H.set(x0, Math.sqrt(x0 * x0 + m * m));
          const E = H.y, p = x0, [Eb, pb] = boostEp(E, p, bS.value);
          lightLines(A, 12);
          for (const k of [1, 2, 3]) A.curve((u) => [k * Math.sinh(u), k * Math.cosh(u)], -4, 4, { color: 'faint', width: 1 });
          A.curve((u) => [m * Math.sinh(u), m * Math.cosh(u)], -4, 4, { color: 'green', width: 2.4 });
          A.dot(0, m, { r: 4, color: 'ink', label: 'rest', labelPos: 'e' });
          A.dot(pb, Eb, { r: 6, color: 'accent' });
          A.segment([pb, 0], [pb, Eb], { color: 'accent', dash: [3, 3], width: 1 }); A.segment([0, Eb], [pb, Eb], { color: 'accent', dash: [3, 3], width: 1 });
          const beta = E > 0 ? pb / Eb : 0, bb = Math.min(0.99, Math.abs(beta));
          B.fn((b) => 1 / Math.sqrt(1 - b * b), { color: 'accent', width: 2.4 });
          B.fn((b) => b / Math.sqrt(1 - b * b), { color: 'orange', width: 2.4 });
          B.fn((b) => 1 / Math.sqrt(1 - b * b) - 1, { color: 'green', width: 2 });
          B.fn((b) => 1 + 0.5 * b * b, { color: 'accent', width: 1.2, dash: true, alpha: 0.7 });
          B.fn((b) => b, { color: 'orange', width: 1.2, dash: true, alpha: 0.7 });
          const gg = 1 / Math.sqrt(1 - bb * bb);
          B.dot(bb, gg, { r: 4.5, color: 'accent' }); B.dot(bb, gg * bb, { r: 4.5, color: 'orange' });
          st = { m, E: Eb, p: pb, beta, T: Eb - m, d: Eb * Eb - pb * pb - m * m };
        });
        v.legend([['accent', '$E$'], ['orange', '$pc$'], ['green', '$T=E-mc^2$ (right) / shell (left)'], ['faint', 'shells $m=1,2,3$']]);
        v.readout(() => {
          const { m, E, p, beta, T, d } = st; if (E === undefined) return '';
          return String.raw`In this frame $E=${v.fix(E, 3)}$, $pc=${v.fix(p, 3)}$, so $E^2-(pc)^2=${v.fix(E * E - p * p, 4)}=m^2=${v.fix(m * m, 4)}$ (defect $${v.fix(d, 6)}$).` + '\n' +
            (m > 1e-9 ? String.raw`Speed $v/c=pc/E=${v.fix(beta, 4)}$; kinetic energy $T=${v.fix(T, 3)}\,m_0c^2$.` : String.raw`Massless: $E=|pc|$ and the speed is exactly $c$ in every frame.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Law',
      name: 'Conservation of four-momentum',
      statement: String.raw`In an isolated system (no external forces; collisions and decays happen at points) the total four-momentum is conserved: $\sum_{\text{in}}p^\mu=\sum_{\text{out}}p^\mu$. Its time component is conservation of energy and the three space components are conservation of momentum. Because the sum of four-vectors is a four-vector, if the equality holds in one inertial frame it holds in every one. The Newtonian quantity $\sum m_i\mathbf v_i$ is **not** conserved in relativistic collisions, and neither is $\sum m_i$.`,
      idea: String.raw`In the Newtonian limit the law reduces to momentum conservation (mech-2.2), which is the conserved quantity of translation symmetry. The relativistic law is the same symmetry statement for spacetime translations: the equality of two four-vectors is frame-independent by the transformation law of rel-4.1. The momentum that is conserved must be $\gamma m\mathbf v$, since $m\mathbf v$ fails to be conserved once the boost is applied to a collision where it balanced in one frame.`,
      caption: String.raw`An elastic head-on collision of two particles is built the honest way: go to the centre-of-momentum frame, reverse both momenta, and boost back. **Change the masses and the lab speeds,** then **slide the observer frame** $S'$. The left diagram shows the worldlines in $S'$; the bars compare totals before (blue) and after (green). The totals of $E$ and $p=\gamma mv$ agree in every frame; the Newtonian $\sum mv$ already disagrees in the lab, and more so the faster you go.`,
      deps: ['rel-4.1', 'mech-2.2'],
      refs: ['Taylor–Wheeler ch. 8', 'Schutz §2.4'],
      tags: ['conservation', 'collision', 'four-momentum'],
      scope: String.raw`Closed systems with no external forces; in a collision, interaction energy must be negligible except at the contact event.`,
      viz(v) {
        const m1S = v.slider('mass $m_1$', 0.3, 3, 1, { step: 0.01 });
        const m2S = v.slider('mass $m_2$', 0.3, 3, 2, { step: 0.01 });
        const b1S = v.slider('$\\beta_1$ (lab)', -0.95, 0.95, 0.8, { step: 0.01 });
        const b2S = v.slider('$\\beta_2$ (lab)', -0.95, 0.95, -0.4, { step: 0.01 });
        const fS = v.slider("observer frame $\\beta_o$", -0.9, 0.9, 0, { step: 0.01 });
        const A = v.stage({ x: [-4, 4], y: [-3, 3], axes: true, height: 380, minWidth: 300, title: "worldlines in the observer frame: $x$ across, $ct$ up" });
        const B = v.stage({ x: [0, 9], y: [-5, 5], axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 1.1, title: 'totals before (blue) and after (green)' });
        let st = {};
        const mk = (m, b) => { const g = gam(b); return [g * m, g * m * b, m]; };
        v.render(() => {
          const m1 = m1S.value, m2 = m2S.value;
          const a = mk(m1, b1S.value), c = mk(m2, b2S.value);
          const Et = a[0] + c[0], Pt = a[1] + c[1], bc = Pt / Et, gc = gam(bc);
          // CM frame momenta reversed, then boosted back
          const out = [a, c].map(([E, p, m]) => { const [Es, ps] = boostEp(E, p, bc); return [gc * (Es + bc * -ps), gc * (-ps + bc * Es), m]; });
          const bo = fS.value;
          const tr = (q) => { const [E, p] = boostEp(q[0], q[1], bo); return [E, p, q[2]]; };
          const ain = tr(a), cin = tr(c), aout = tr(out[0]), cout = tr(out[1]);
          const vel = (q) => q[1] / q[0];
          lightLines(A, 5, { alpha: 0.3 });
          const wl = (q, t0, t1, col) => A.segment([vel(q) * t0, t0], [vel(q) * t1, t1], { color: col, width: 2.6 });
          wl(ain, -3, 0, 'blue'); wl(cin, -3, 0, 'orange'); wl(aout, 0, 3, 'blue'); wl(cout, 0, 3, 'orange');
          A.dot(0, 0, { r: 5, color: 'ink' });
          const sums = (qs) => [qs.reduce((s, q) => s + q[0], 0), qs.reduce((s, q) => s + q[1], 0), qs.reduce((s, q) => s + q[2] * vel(q), 0)];
          const sb = sums([ain, cin]), sa = sums([aout, cout]);
          const mx = Math.max(1, ...sb.map(Math.abs), ...sa.map(Math.abs)) * 1.15;
          B.setView([0, 9], [-mx, mx]);
          const xs = [[1, 2], [4, 5], [7, 8]];
          for (let k = 0; k < 3; k++) { B.rect(xs[k][0] - 0.4, 0, xs[k][0] + 0.4, sb[k], { fill: 'blue', fillAlpha: 0.55, color: 'blue' }); B.rect(xs[k][1] - 0.4, 0, xs[k][1] + 0.4, sa[k], { fill: 'green', fillAlpha: 0.55, color: 'green' }); }
          B.tex(String.raw`\sum E`, 1.5, -mx * 0.92, { size: 14 }); B.tex(String.raw`\sum \gamma m v`, 4.5, -mx * 0.92, { size: 14 }); B.tex(String.raw`\sum m v`, 7.5, -mx * 0.92, { size: 14 });
          st = { sb, sa, mx, bc };
        });
        v.legend([['blue', 'particle 1 / totals before'], ['orange', 'particle 2'], ['green', 'totals after']]);
        v.readout(() => {
          const { sb, sa } = st; if (!sb) return '';
          return String.raw`$\sum E$: ${v.fix(sb[0], 4)} → ${v.fix(sa[0], 4)}.  $\sum p$: ${v.fix(sb[1], 4)} → ${v.fix(sa[1], 4)}  (both conserved).` + '\n' +
            String.raw`Newtonian $\sum mv$: ${v.fix(sb[2], 4)} → ${v.fix(sa[2], 4)}; change ${v.fix(sa[2] - sb[2], 4)}${Math.abs(sa[2] - sb[2]) > 1e-3 ? ' (not conserved)' : ''}. Units $c=1$, $m_1=1$ means $m_1c^2$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Mass–energy equivalence E = mc²',
      credit: 'Einstein, 1905',
      statement: String.raw`A body at rest has energy $E_0=mc^2$, and any change $\Delta E_0$ of a body's rest energy changes its inertial mass by $\Delta m=\Delta E_0/c^2$. In particular, when two bodies collide and stick, with no energy radiated away, the combined body has rest mass
$$M=\frac{E_{\text{tot}}}{c^2}\sqrt{1-\frac{|\mathbf P|^2c^2}{E_{\text{tot}}^2}}\ >\ m_1+m_2,$$
and $M-m_1-m_2=K_{\text{cm}}/c^2$, where $K_{\text{cm}}$ is the kinetic energy that the bodies had in their centre-of-momentum frame and that has become internal (thermal) energy. Rest mass is therefore not additive.`,
      idea: String.raw`Conserve the four-momentum of rel-4.3. The final lump has the total $(E,\mathbf P)$ of the incoming pair, and its mass is the length of that four-vector: $M^2c^4=E^2-P^2c^2$. In the centre-of-momentum frame $\mathbf P=0$, so $Mc^2=E_{\text{cm}}=m_1c^2+m_2c^2+K_{\text{cm}}$ by rel-4.2. Energy conservation alone forces the body to be heavier, so energy has inertia.`,
      caption: String.raw`A lump of mass $m_1$ moving at speed $\beta$ hits a lump of mass $m_2$ at rest and they stick. **Raise $\beta$ and change $m_2/m_1$.** The discs have area proportional to mass (before: blue and orange; after: the heated lump). The bars show the rest masses added up (blue, orange) and the final mass $M$ (red top): the surplus is the CM kinetic energy divided by $c^2$, and the readout checks it. The right panel shows the same event in the lab: the energy $E=\gamma m_1c^2+m_2c^2$ is carried by the final lump as $\gamma_{\text{cm}}Mc^2$.`,
      deps: ['rel-4.3', 'rel-4.2'],
      refs: ['Taylor–Wheeler §8.3'],
      tags: ['mass–energy', 'inelastic collision', 'rest mass'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mass%E2%80%93energy_equivalence' },
      viz(v) {
        const bS = v.slider('speed of lump 1, $\\beta$', 0, 0.99, 0.8, { step: 0.005 });
        const rS = v.slider('mass ratio $m_2/m_1$', 0.2, 5, 1, { step: 0.01, log: true });
        const A = v.stage({ x: [-6, 6], y: [-3.4, 3.4], equal: true, axes: false, height: 340, minWidth: 300, title: 'area ∝ mass' });
        const B = v.stage({ x: [0, 7], y: [0, 6], axes: 'box', gutter: true, height: 340, minWidth: 300, weight: 1.1, xticks: [[1, 'm₁+m₂'], [2.8, 'M'], [4.9, 'E before'], [6.1, 'γcm·M']], ylabel: 'energy / mass, units $m_1c^2$', title: 'CM frame (left) and lab frame (right) ledgers' });
        let st = {};
        v.render(() => {
          const b = bS.value, m2 = rS.value, m1 = 1, g = gam(b);
          const E = g * m1 + m2, Pm = g * b * m1, M = Math.sqrt(E * E - Pm * Pm), bc = Pm / E, gc = gam(bc);
          const dM = M - m1 - m2, Kcm = M - m1 - m2;
          const rad = (m) => 1.3 * Math.sqrt(m);
          A.circle(-4, 1.6, rad(m1), { fill: 'blue', fillAlpha: 0.5, color: 'blue' }); A.circle(-1.2, 1.6, rad(m2), { fill: 'orange', fillAlpha: 0.5, color: 'orange' });
          A.arrow(-6 + 0.2, 1.6, -5.4 + b * 1.2, 1.6, { color: 'blue', width: 2 });
          A.circle(3, -1.1, rad(M), { fill: 'red', fillAlpha: 0.15 + Math.min(0.5, dM / M * 1.5), color: 'red' });
          A.arrow(3 + rad(M) + 0.1, -1.1, 3 + rad(M) + 0.1 + bc * 1.6, -1.1, { color: 'ink', width: 2 });
          A.text('before', -2.6, 3.1, { color: 'muted' }); A.text('after (stuck)', 3, 2.9, { color: 'muted' });
          // ledger: CM frame masses
          const tot = m1 + m2;
          B.rect(0.4, 0, 1.6, m1, { fill: 'blue', fillAlpha: 0.55, color: 'blue' }); B.rect(0.4, m1, 1.6, tot, { fill: 'orange', fillAlpha: 0.55, color: 'orange' });
          B.rect(2.2, 0, 3.4, tot, { fill: 'faint', fillAlpha: 0.4, color: 'muted' }); B.rect(2.2, tot, 3.4, M, { fill: 'red', fillAlpha: 0.6, color: 'red' });
          B.setView([0, 7], [0, Math.max(6, 1.1 * E)]);
          st = { b, m2, M, dM, Kcm, E, gM: gc * M, tot };
        });
        v.legend([['blue', '$m_1$'], ['orange', '$m_2$'], ['red', 'final mass $M$ (excess = heat)']]);
        v.readout(() => {
          const { b, m2, M, dM, E, gM, tot } = st; if (M === undefined) return '';
          return String.raw`$m_1+m_2=${v.fix(tot, 4)}$, final $M=${v.fix(M, 4)}$, so $\Delta m=${v.fix(dM, 4)}\,m_1$ (${v.fix(100 * dM / tot, 1)}% heavier).` + '\n' +
            String.raw`CM kinetic energy $K_{cm}/c^2=${v.fix(M - tot, 4)}\,m_1$, equal to $\Delta m$. Lab energy $\gamma m_1c^2+m_2c^2=${v.fix(E, 4)}$ equals $\gamma_{cm}Mc^2=${v.fix(gM, 4)}$ (units $m_1c^2$).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Relativistic kinetic energy and its Newtonian limit',
      statement: String.raw`The kinetic energy of a particle of rest mass $m$ is $T=E-mc^2=(\gamma-1)mc^2$. For $v\ll c$,
$$T=\tfrac12mv^2+\tfrac38\,m\frac{v^4}{c^2}+\tfrac{5}{16}\,m\frac{v^6}{c^4}+\cdots ,$$
so the Newtonian $\tfrac12mv^2$ is the leading term, with relative error about $\tfrac34\,v^2/c^2$. As $v\to c$ the energy $T$ grows without bound, so $c$ cannot be reached with finite energy.`,
      idea: String.raw`Expand $\gamma=(1-\beta^2)^{-1/2}=1+\tfrac12\beta^2+\tfrac38\beta^4+\cdots$ by the binomial series (Taylor's theorem, pma-5.15), with remainder controlled for $\beta<1$. Subtracting 1 and multiplying by $mc^2$ gives the series above. The first term is Newton's, and the correction is positive, so the relativistic energy always exceeds the Newtonian one.`,
      caption: String.raw`**Slide $\beta$.** On the left, $T/mc^2=\gamma-1$ (blue) rises above Newton's $\tfrac12\beta^2$ (dashed); the shaded sliver between them is the Taylor remainder. The two-term series (orange) hugs the true curve out to moderate speeds. On the right the relative error of the Newtonian formula is on a log–log scale: it follows $\tfrac34\beta^2$ and crosses 1% near $\beta\approx0.115$.`,
      deps: ['rel-4.2', 'pma-5.15'],
      refs: ['Taylor–Wheeler ch. 7'],
      tags: ['kinetic energy', 'Taylor series', 'Newtonian limit'],
      scope: String.raw`Free particle, $c=1$ units on the plots; series valid for $|\beta|<1$.`,
      viz(v) {
        const bS = v.slider('speed $\\beta=v/c$', 0.001, 0.99, 0.4, { step: 0.001 });
        const A = v.stage({ x: [0, 0.99], y: [0, 3.5], axes: 'box', gutter: true, height: 380, minWidth: 300, xlabel: '$\\beta=v/c$', ylabel: '$T/mc^2$', title: 'kinetic energy' });
        const B = v.stage({ x: [1e-3, 1], y: [1e-6, 3], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, ylog: true, xlabel: '$\\beta$', ylabel: 'relative error of $\\tfrac12mv^2$', title: 'error of the Newtonian formula' });
        const T = (b) => 1 / Math.sqrt(1 - b * b) - 1;
        const err = (b) => 1 - 0.5 * b * b / T(b);
        const b1 = (() => { let lo = 0.01, hi = 0.5; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (err(m) < 0.01) lo = m; else hi = m; } return lo; })();
        let st = {};
        v.render(() => {
          const b = bS.value;
          A.between((x) => 0.5 * x * x, (x) => T(x), 0, 0.99, { fill: 'red', fillAlpha: 0.2 });
          A.fn((x) => T(x), { color: 'accent', width: 2.8 });
          A.fn((x) => 0.5 * x * x, { color: 'ink', width: 1.8, dash: true });
          A.fn((x) => 0.5 * x * x + 0.375 * x ** 4, { color: 'orange', width: 1.8, domain: [0, 0.99] });
          A.vline(b, { color: 'gold', width: 1.2 }); A.dot(b, T(b), { r: 5, color: 'accent' }); A.dot(b, 0.5 * b * b, { r: 4.5, color: 'ink' });
          B.fn((x) => err(x), { color: 'red', width: 2.6, n: 300 });
          B.fn((x) => 0.75 * x * x, { color: 'muted', width: 1.2, dash: true, n: 100 });
          B.hline(0.01, { color: 'green', dash: [4, 4], width: 1.2 }); B.vline(b1, { color: 'green', dash: [4, 4], width: 1 });
          B.dot(b, Math.max(1.1e-6, err(b)), { r: 5, color: 'gold' });
          st = { b, t: T(b), n: 0.5 * b * b, e: err(b) };
        });
        v.legend([['accent', '$(\\gamma-1)$'], ['ink', '$\\tfrac12\\beta^2$ (Newton)', { dash: true }], ['orange', '$\\tfrac12\\beta^2+\\tfrac38\\beta^4$'], ['red', 'remainder / error']]);
        v.readout(() => {
          const { b, t, n, e } = st; if (t === undefined) return '';
          return String.raw`$\beta=${v.fix(b, 3)}$: $T/mc^2=${v.fix(t, 5)}$ against Newton $${v.fix(n, 5)}$; error ${v.fix(100 * e, 2)}% (≈ $\tfrac34\beta^2=${v.fix(75 * b * b, 2)}$%).` + '\n' +
            `For an electron T = ${eng(t * ME)} (Newton: ${eng(n * ME)}); for a proton T = ${eng(t * MP)} (Newton: ${eng(n * MP)}). The 1% error point is $\\beta=${v.fix(b1, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Massless particles and the momentum of light',
      statement: String.raw`A **massless particle** is one with $m=0$: its four-momentum is null, $E^2=(pc)^2$, so $E=pc$ and its speed $pc^2/E$ is exactly $c$ in every frame. It cannot be brought to rest, and its energy can be anything; frames change only the value of $E$ (the Doppler shift). It is the limit $m\to0$ at fixed $E$ of a massive particle: $v/c=\sqrt{1-(mc^2/E)^2}\to1$ and $p\to E/c$. Light carries momentum $p=E/c=h/\lambda$ (when $E=hf$).`,
      idea: String.raw`Write $E=\gamma mc^2$ and $pc=\gamma mvc$ and let $m\to0$ with $E$ held fixed, so that $\gamma\to\infty$: then $pc/E=v/c\to1$ (rel-4.2). The four-momentum arrow tips onto the light cone and stays on it under boosts, as it must since its length is zero. That an electromagnetic wave carries momentum $E/c$ is already visible in Maxwell's theory as radiation pressure; the quantum relation $p=h/\lambda$ is rel-4.6's counterpart in qm-1.3.`,
      caption: String.raw`**Drag the Lorentz factor $\gamma=E/mc^2$** up the log slider. Left: at fixed energy $E=1$ the arrow in the $(pc,E)$ plane tips toward the light line (gold) as $m=1/\gamma$ shrinks. Right: the speed gap $1-\beta$ falls as $1/(2\gamma^2)$; the marked points show an electron of 1 MeV, 1 GeV and 104.5 GeV (LEP energies). A massless particle sits on the light line, at $1-\beta=0$.`,
      deps: ['rel-4.2'],
      refs: ['Taylor–Wheeler §8.4', 'Schutz §2.7'],
      tags: ['photon', 'massless', 'light cone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Massless_particle' },
      viz(v) {
        const gS = v.slider('Lorentz factor $\\gamma=E/mc^2$', 1, 1e6, 3, { log: true, sig: 3 });
        const A = v.stage({ x: [-0.1, 1.2], y: [-0.1, 1.2], equal: true, axes: true, height: 380, minWidth: 300, title: 'fixed energy $E=1$: $(pc, E)$ plane' });
        const B = v.stage({ x: [1, 1e6], y: [1e-13, 1], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, ylog: true, xlabel: '$\\gamma=E/mc^2$', ylabel: '$1-\\beta$', title: 'how close to $c$?' });
        let st = {};
        v.render(() => {
          const g = gS.value, m = 1 / g, p = Math.sqrt(Math.max(0, 1 - m * m)), gap = 1 / (g * g * (1 + p));
          A.line(0, 0, 1.1, 1.1, { color: 'gold', width: 2, dash: [5, 4] });
          A.curve((u) => [m * Math.sinh(u), m * Math.cosh(u)], 0, 6, { color: 'green', dash: [4, 4], width: 1.2, alpha: 0.9 });
          A.hline(1, { color: 'faint', dash: [3, 3] });
          A.arrow(0, 0, p, 1, { color: 'accent', width: 3.2 });
          A.dot(0, m, { r: 4, color: 'green' }); A.text('$mc^2$', 0, m, { color: 'green', dx: 22, dy: 4 });
          A.text('$E=pc$', 0.72, 0.8, { color: 'gold', dx: 10, dy: 10 });
          B.fn((x) => 1 / (x * x * (1 + Math.sqrt(1 - 1 / (x * x)))), { color: 'accent', width: 2.6, n: 300 });
          B.fn((x) => 1 / (2 * x * x), { color: 'muted', width: 1.2, dash: true, n: 100 });
          for (const [E, lab] of [[1, '1 MeV'], [1000, '1 GeV'], [104500, '104.5 GeV']]) { const gg = E / ME; B.dot(gg, 1 / (gg * gg * (1 + Math.sqrt(1 - 1 / (gg * gg)))), { r: 4.5, color: 'orange', label: lab, labelPos: E > 1e5 ? 'sw' : 'ne' }); }
          B.dot(g, gap, { r: 6, color: 'gold' });
          st = { g, m, p, gap };
        });
        v.legend([['accent', 'arrow / $1-\\beta$ exact'], ['gold', 'light line'], ['orange', 'electron at LEP-type energies'], ['muted', '$1/2\\gamma^2$', { dash: true }]]);
        v.readout(() => {
          const { g, m, p, gap } = st; if (g === undefined) return '';
          return String.raw`$\gamma=${v.fix(g, g < 100 ? 2 : 0)}$: $mc^2/E=${v.sci(m, 3)}$, $pc/E=${v.fix(p, 6)}$, $1-\beta=${v.sci(gap, 3)}$ (≈ $1/2\gamma^2=${v.sci(1 / (2 * g * g), 3)}$).` + '\n' +
            String.raw`For a photon $m=0$: $\gamma$ is infinite, the arrow lies on the light line, $E=pc$ and $1-\beta=0$ exactly. A 2 eV photon has $p=E/c=${v.sci(2 * 1.602176634e-19 / 299792458, 3)}$ kg m/s.`;
        });
      },
    },
  ],
};
