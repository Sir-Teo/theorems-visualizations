// Special & General Relativity — Chapter 2: Lorentz transformations and their paradoxes (items 2.1–2.7)
import { gam, toMoving, fromMoving, P, atanh, addV, lightLines, frameGrid } from './ch02.shared.js';

export default {
  collection: 'rel',
  chapter: 2,
  title: 'Lorentz transformations and their paradoxes',
  summary: String.raw`Requiring the interval to be invariant pins down the linear maps between inertial frames: the Lorentz boosts, which are hyperbolic rotations measured by rapidity. Velocity addition, the Doppler effect and aberration follow at once. The famous paradoxes — the twins, the ladder in the barn, faster-than-light signalling — each dissolve once simultaneity is handled honestly, and composing boosts in different directions reveals a hidden rotation.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'Lorentz transformation',
      credit: 'Lorentz 1904; Poincaré 1905; Einstein 1905',
      statement: String.raw`Let the frame $S'$ move with velocity $v$ along the $x$-axis of an inertial frame $S$, with parallel axes and a common origin event. If inertial frames are related by linear maps (the principle of relativity) and the interval $c^2t^2-x^2-y^2-z^2$ is the same in both frames, then
$$ct'=\gamma\,(ct-\beta x),\qquad x'=\gamma\,(x-\beta ct),\qquad y'=y,\quad z'=z,\qquad \beta=\frac vc,\ \ \gamma=\frac1{\sqrt{1-\beta^2}},$$
and the inverse transformation is the same with $v\to-v$. For $|v|\ll c$ it reduces to the Galilean map $x'=x-vt$, $t'=t$. It holds for $|v|<c$; there is no frame moving at $c$.`,
      idea: String.raw`Light rays $x=\pm ct$ must stay light rays in every frame (rel-1.3), so the new axes are mirror images of each other in the light line: both tilt toward it by the same angle. Inside the plane of $t$ and $x$, the only linear maps that keep $c^2t^2-x^2$ fixed (rel-1.7) are $\bigl(\begin{smallmatrix}\cosh\varphi&-\sinh\varphi\\-\sinh\varphi&\cosh\varphi\end{smallmatrix}\bigr)$, and the origin of $S'$, which sits at $x=vt$ in $S$, fixes $\tanh\varphi=v/c$. The relativity principle (rel-1.2) says the inverse is the boost with $-v$, which rules out any extra overall scale factor.`,
      caption: String.raw`**Drag $E$** and the **velocity slider.** The grey axes are frame $S$; the orange lines $x'=\text{const}$ (worldlines of the points of $S'$) and blue lines $ct'=\text{const}$ (its instants) are the grid of frame $S'$. The grid scissors toward the gold light lines but never crosses them. Read $E$'s coordinates in both frames, and notice that $c^2t^2-x^2$ is the same. Switch to the Galilean map and the grid shears instead, the light line is no longer a light line in $S'$, and the interval is not preserved.`,
      deps: ['rel-1.7', 'rel-1.2', 'ladr-3.31'],
      refs: ['Taylor–Wheeler ch. L', 'Schutz §1.9'],
      tags: ['lorentz transformation', 'boost', 'spacetime diagram'],
      scope: String.raw`Inertial frames in flat spacetime, standard configuration (a pure boost, axes parallel, origins coincident).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lorentz_transformation' },
      viz(v) {
        const R = 4.2;
        const bS = v.slider('$v/c$', -0.95, 0.95, 0.6, { step: 0.01 });
        const mode = v.select('map', [{ value: 'lor', label: 'Lorentz' }, { value: 'gal', label: 'Galilean (wrong)' }], 'lor');
        const D = v.stage({ x: [-R, R], y: [-3.2, 3.4], equal: true, axes: false, height: 480, full: true, title: 'spacetime, frame $S$ in grey; grid of $S\'$ in colour ($c=1$)' });
        const E = D.handle(1.3, 2.1, { color: 'purple', label: 'E', labelPos: 'ne' });
        let st = {};
        v.render(() => {
          const b = bS.value, gal = mode.value === 'gal';
          const map = gal ? (tp, xp) => [tp, xp + b * tp] : (tp, xp) => fromMoving(b, tp, xp);
          const inv = gal ? (t, x) => [t, x - b * t] : (t, x) => toMoving(b, t, x);
          D.line(-R, 0, R, 0, { color: 'muted', width: 1.2 }); D.line(0, -3.2, 0, 3.4, { color: 'muted', width: 1.2 });
          D.text('x', R - 0.1, 0, { dy: 10, align: 'right', color: 'muted', math: true }); D.text('ct', 0, 3.3, { dx: -8, align: 'right', color: 'muted', math: true });
          lightLines(D, 8);
          frameGrid(D, map, { n: 8, R: 10, alpha: 0.38, cx: 'orange', ct: 'accent' });
          for (let k = -3; k <= 3; k++) {
            if (!k) continue;
            const a = P(...map(k, 0)), c = P(...map(0, k));
            D.text(String(k), a[0], a[1], { dx: -9, size: 10, color: 'accent' }); D.text(String(k), c[0], c[1], { dy: 11, size: 10, color: 'orange' });
          }
          const ta = P(...map(3.1, 0)), xa = P(...map(0, 3.4));
          D.text(`ct′`, ta[0], ta[1], { dx: 12, dy: -4, color: 'orange', math: true, size: 13 });
          D.text(`x′`, xa[0], xa[1], { dy: -11, color: 'accent', math: true, size: 13 });
          const [tp, xp] = inv(E.y, E.x);
          const pT = P(...map(tp, 0)), pX = P(...map(0, xp));
          D.line(E.x, E.y, pX[0], pX[1], { color: 'orange', dash: [3, 3], width: 1.2 }); D.line(E.x, E.y, pT[0], pT[1], { color: 'accent', dash: [3, 3], width: 1.2 });
          // a light flash sent from the common origin
          st = { b, gal, tp, xp, g: gam(b) };
        });
        v.legend([['orange', 'lines $x\'$ = const'], ['accent', 'lines $ct\'$ = const'], ['gold', 'light', { dash: true }], ['purple', 'event E projected parallel to the $S\'$ axes', { dash: true }]]);
        v.readout(() => {
          const { b, gal, tp, xp, g } = st; if (!g) return '';
          const I = E.y ** 2 - E.x ** 2, Ip = tp ** 2 - xp ** 2;
          const first = String.raw`$v/c=${v.fix(b, 2)}$, $\gamma=${v.fix(g, 3)}$. Event E: $(ct,x)=(${v.fix(E.y, 2)},\,${v.fix(E.x, 2)})$ in $S$, $(ct',x')=(${v.fix(tp, 2)},\,${v.fix(xp, 2)})$ in $S'$.`;
          return first + '\n' + String.raw`$c^2t^2-x^2=${v.fix(I, 3)}$ in $S$ and $c^2t'^2-x'^2=${v.fix(Ip, 3)}$ in $S'$` + (gal ? String.raw` — **not** equal; a flash along $x=ct$ would move at $c-v=${v.fix(1 - b, 2)}\,c$ in $S'$.` : String.raw` — equal, as the theorem says; a flash along $x=ct$ is still along $x'=ct'$.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Invariant hyperbolae and calibrated axes',
      statement: String.raw`The set of events at interval $\pm s^2$ from the origin, $c^2t^2-x^2=s^2$ (timelike, two branches) or $x^2-c^2t^2=s^2$ (spacelike), is a hyperbola, and every Lorentz boost maps it to itself. These **invariant hyperbolae** calibrate the axes of a moving frame: the unit of time on the $ct'$-axis is the event where the axis meets the hyperbola $c^2t^2-x^2=1$, and the unit of length on the $x'$-axis is where the $x'$-axis meets $x^2-c^2t^2=1$. A tick that is one unit long to its own observer is, on the page of the $S$ diagram, $\sqrt{(1+\beta^2)/(1-\beta^2)}$ times the length of the $S$ tick.`,
      idea: String.raw`A boost leaves $c^2t^2-x^2$ unchanged (rel-1.7, 2.1), so it slides each event along the hyperbola it lies on. Therefore the event one unit of proper time up the $ct'$-axis lies on the same hyperbola as the event one unit up the $ct$-axis. The tilted axes look stretched on the page of the diagram only because the paper uses Euclidean length, which a boost does not preserve; the honest comparison of the two observers' rulers is the hyperbola.`,
      caption: String.raw`**Move the velocity slider.** The tick marks of $S'$ (blue on the $x'$-axis, orange on $ct'$) always sit on the same hyperbolae as the grey ticks of $S$. **Drag the purple and red points** along their hyperbolae: the other frame's reading of the point is read off, and its distance to the origin on the page changes while its interval does not.`,
      deps: ['rel-2.1'],
      refs: ['Taylor–Wheeler §5.3', 'Schutz §1.7'],
      tags: ['hyperbola', 'interval', 'calibration'],
      viz(v) {
        const R = 4;
        const bS = v.slider('$v/c$', -0.9, 0.9, 0.55, { step: 0.01 });
        const sh = v.select('show', [{ value: 'both', label: 'both families' }, { value: 'time', label: 'timelike' }, { value: 'space', label: 'spacelike' }], 'both');
        const D = v.stage({ x: [-R, R], y: [-3.4, 3.4], equal: true, axes: false, height: 500, full: true, title: 'hyperbolae $c^2t^2-x^2=\\pm k^2$ and the ticks of both frames' });
        const U = D.handle(Math.sinh(0.3), Math.cosh(0.3), { color: 'purple', label: 'P', labelPos: 'nw', constrain: (x) => { const f = Math.asinh(x); return [Math.sinh(f), Math.cosh(f)]; } });
        const W = D.handle(Math.cosh(0.5), Math.sinh(0.5), { color: 'red', label: 'Q', labelPos: 'se', constrain: (x, y) => { const f = Math.asinh(y); return [Math.cosh(f), Math.sinh(f)]; } });
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), map = (tp, xp) => fromMoving(b, tp, xp), phi = atanh(b);
          D.line(-R, 0, R, 0, { color: 'muted', width: 1.2 }); D.line(0, -3.4, 0, 3.4, { color: 'muted', width: 1.2 });
          lightLines(D, 8);
          D.clip(() => {
            for (const k of [1, 2, 3]) {
              if (sh.value !== 'space') for (const sg of [1, -1]) D.curve((u) => [k * Math.sinh(u), sg * k * Math.cosh(u)], -2.2, 2.2, { color: 'green', width: k === 1 ? 2 : 1.1, alpha: k === 1 ? 0.9 : 0.5 });
              if (sh.value !== 'time') for (const sg of [1, -1]) D.curve((u) => [sg * k * Math.cosh(u), k * Math.sinh(u)], -2.2, 2.2, { color: 'red', width: k === 1 ? 2 : 1.1, alpha: k === 1 ? 0.9 : 0.5 });
            }
            D.line(...P(...map(-7, 0)), ...P(...map(7, 0)), { color: 'orange', width: 1.6 });
            D.line(...P(...map(0, -7)), ...P(...map(0, 7)), { color: 'accent', width: 1.6 });
          });
          D.text('ct′', ...P(...map(3.0, 0)), { dx: 14, color: 'orange', math: true, size: 13 }); D.text('x′', ...P(...map(0, 3.9)), { dy: -12, color: 'accent', math: true, size: 13 });
          for (let k = 1; k <= 3; k++) {
            for (const sg of [1, -1]) {
              if (sh.value !== 'space') { const a = P(...map(sg * k, 0)); D.dot(a[0], a[1], { r: 4.5, color: 'orange' }); if (sg > 0) D.text(String(k), a[0], a[1], { dx: 10, dy: 2, size: 10, color: 'orange' }); D.dot(0, sg * k, { r: 3, color: 'ink' }); }
              if (sh.value !== 'time') { const a = P(...map(0, sg * k)); D.dot(a[0], a[1], { r: 4.5, color: 'accent' }); if (sg > 0) D.text(String(k), a[0], a[1], { dx: 2, dy: -11, size: 10, color: 'accent' }); D.dot(sg * k, 0, { r: 3, color: 'ink' }); }
            }
          }
          for (const [H, kind] of [[U, 't'], [W, 'x']]) {
            if (kind === 't' && sh.value === 'space') { H.visible = false; continue; }
            if (kind === 'x' && sh.value === 'time') { H.visible = false; continue; }
            H.visible = true;
            const [tp, xp] = toMoving(b, H.y, H.x);
            const a = P(...map(tp, 0)), c = P(...map(0, xp));
            D.line(H.x, H.y, a[0], a[1], { color: 'orange', dash: [3, 3], width: 1.1 }); D.line(H.x, H.y, c[0], c[1], { color: 'accent', dash: [3, 3], width: 1.1 });
          }
          st = { b, g, phi };
        });
        v.legend([['green', 'timelike: $c^2t^2-x^2=k^2$'], ['red', 'spacelike: $x^2-c^2t^2=k^2$'], ['orange', 'ticks of $ct\'$', { dot: true }], ['accent', 'ticks of $x\'$', { dot: true }], ['ink', 'ticks of $S$', { dot: true }]]);
        v.readout(() => {
          const { b, g, phi } = st; if (!g) return '';
          const [tp, xp] = toMoving(b, U.y, U.x), [tq, xq] = toMoving(b, W.y, W.x);
          return String.raw`$v/c=${v.fix(b, 2)}$, rapidity $\varphi=${v.fix(phi, 3)}$. One tick of $S'$ is $\sqrt{(1+\beta^2)/(1-\beta^2)}=${v.fix(Math.sqrt((1 + b * b) / (1 - b * b)), 3)}$ units long on the page, yet the same unit to its own observer.` + '\n' +
            (U.visible ? String.raw`P: $(ct,x)=(${v.fix(U.y, 2)},${v.fix(U.x, 2)})$, $(ct',x')=(${v.fix(tp, 2)},${v.fix(xp, 2)})$, $c^2t'^2-x'^2=${v.fix(tp * tp - xp * xp, 3)}$ (still $1$). ` : '') +
            (W.visible ? String.raw`Q: $(ct',x')=(${v.fix(tq, 2)},${v.fix(xq, 2)})$, $x'^2-c^2t'^2=${v.fix(xq * xq - tq * tq, 3)}$ (still $1$).` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Rapidity: boosts as hyperbolic rotations',
      statement: String.raw`The **rapidity** $\varphi$ of a frame moving with velocity $v$ is defined by $v=c\tanh\varphi$, i.e. $\varphi=\operatorname{artanh}(v/c)$. In terms of it a boost along $x$ is $ct'=ct\cosh\varphi-x\sinh\varphi$, $x'=x\cosh\varphi-ct\sinh\varphi$, a rotation of the $(ct,x)$ plane through the hyperbolic angle $\varphi$ that keeps $c^2t^2-x^2$ fixed. Successive boosts along one line add their rapidities, $\varphi_{13}=\varphi_{12}+\varphi_{23}$, although their velocities do not. Rapidity ranges over all of $\R$ while $v$ is confined to $(-c,c)$; the hyperbolic angle is also twice the area of the sector it cuts from the unit hyperbola.`,
      idea: String.raw`The circular functions rotate the plane while preserving $x^2+y^2$; the hyperbolic functions do the same for $t^2-x^2$, since $\cosh^2\varphi-\sinh^2\varphi=1$ (the Lorentz map of 2.1 with $\gamma=\cosh\varphi$ and $\gamma\beta=\sinh\varphi$). The addition formulas $\cosh(\varphi_1+\varphi_2)$, $\sinh(\varphi_1+\varphi_2)$ show that the matrix of a boost is a one-parameter group in $\varphi$, exactly as rotation matrices are in the angle. The compressing $\tanh$ is what keeps every velocity below $c$ however large the rapidity.`,
      caption: String.raw`**Set two rapidities** $\varphi_1$, $\varphi_2$. Left: the unit hyperbola $c^2t^2-x^2=1$ and the points reached after the first boost and after both; the shaded sector has area $\varphi/2$. Right: velocity is the flattening curve $\tanh\varphi$. The rapidities add (the angle at the origin simply continues), but the velocity of the composition is **less** than the sum of the velocities.`,
      deps: ['rel-2.1', 'pma-8.6'],
      refs: ['Taylor–Wheeler ch. L', 'Carroll ch. 1'],
      tags: ['rapidity', 'hyperbolic functions', 'boost'],
      viz(v) {
        const f1 = v.slider('$\\varphi_1$', -1, 1, 0.6, { step: 0.01 });
        const f2 = v.slider('$\\varphi_2$', -1, 1, 0.7, { step: 0.01 });
        const A = v.stage({ x: [-4.2, 4.2], y: [-0.3, 4.4], equal: true, axes: false, height: 400, weight: 1.1, minWidth: 300, title: 'unit hyperbola $c^2t^2-x^2=1$' });
        const B = v.stage({ x: [-2.2, 2.2], y: [-1.15, 2.1], axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 280, xlabel: 'rapidity $\\varphi$', ylabel: '$v/c$', title: 'velocity $=\\tanh\\varphi$' });
        let st = {};
        v.render(() => {
          const a = f1.value, c = f2.value, s = a + c;
          A.line(-4.2, 0, 4.2, 0, { color: 'muted' }); A.line(0, -0.3, 0, 4.4, { color: 'muted' });
          lightLines(A, 8);
          A.curve((u) => [Math.sinh(u), Math.cosh(u)], -2.2, 2.2, { color: 'ink', width: 1.4 });
          const sector = [[0, 0]]; for (let k = 0; k <= 60; k++) { const u = (s * k) / 60; sector.push([Math.sinh(u), Math.cosh(u)]); }
          A.poly(sector, { fill: 'green', fillAlpha: 0.18, stroke: false });
          const p1 = [Math.sinh(a), Math.cosh(a)], p2 = [Math.sinh(s), Math.cosh(s)];
          A.segment([0, 0], p1, { color: 'accent', width: 2 }); A.segment([0, 0], p2, { color: 'green', width: 2.4 });
          A.dot(p1[0], p1[1], { r: 5, color: 'accent', label: '$\\varphi_1$', labelPos: 'nw' }); A.dot(p2[0], p2[1], { r: 6, color: 'green', label: '$\\varphi_1+\\varphi_2$', labelPos: 'ne' });
          A.dot(0, 1, { r: 4, color: 'ink' });
          A.text(`sector area ½φ = ${v.fix(s / 2, 3)}`, 0.2, 0.55, { size: 11, color: 'green', math: false });
          B.fn((u) => Math.tanh(u), { color: 'ink', width: 1.6 });
          B.hline(1, { color: 'gold', dash: true }); B.hline(-1, { color: 'gold', dash: true });
          B.text('$c$', -2.1, 1, { dy: -9, color: 'gold' });
          B.line(0, 0, 0, 0);
          const va = Math.tanh(a), vc = Math.tanh(c), vs = Math.tanh(s);
          B.dot(a, va, { r: 5, color: 'accent', label: '$v_1$', labelPos: 'se' }); B.dot(c, vc, { r: 5, color: 'orange', label: '$v_2$', labelPos: 'se' });
          B.dot(s, vs, { r: 6, color: 'green', label: '$v_{12}$', labelPos: 'nw' });
          B.segment([s, vs], [s, va + vc], { color: 'red', dash: true, alpha: 0.6 }); B.dot(s, va + vc, { r: 5, color: 'red', hollow: true });
          st = { a, c, s, va, vc, vs };
        });
        v.legend([['accent', 'after boost 1'], ['green', 'after both boosts'], ['red', 'Galilean sum $v_1+v_2$', { dot: true }]]);
        v.readout(() => {
          const { a, c, s, va, vc, vs } = st; if (st.s === undefined) return '';
          return String.raw`$\varphi_1+\varphi_2=${v.fix(a, 3)}+${v.fix(c, 3)}=${v.fix(s, 3)}$ — exact. Velocities: $v_1=${v.fix(va, 3)}$, $v_2=${v.fix(vc, 3)}$, $v_{12}=\tanh(\varphi_1+\varphi_2)=${v.fix(vs, 4)}$ $\;<\;v_1+v_2=${v.fix(va + vc, 3)}$` + '\n' +
            String.raw`Check: $(v_1+v_2)/(1+v_1v_2)=${v.fix(addV(va, vc), 4)}$ — the same number. $\gamma_{12}=\cosh(\varphi_1+\varphi_2)=${v.fix(Math.cosh(s), 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Relativistic velocity addition',
      credit: 'Einstein, 1905',
      statement: String.raw`If a particle moves with velocity $u'$ along $x$ in a frame $S'$ that itself moves with velocity $v$ along $x$ relative to $S$, then its velocity in $S$ is
$$u=\frac{u'+v}{1+u'v/c^2}.$$
Consequently $|u|<c$ whenever $|u'|<c$ and $|v|<c$, and $u=c$ if $u'=c$ (light has the same speed in every frame). For $|u'|,|v|\ll c$ it reduces to the Galilean $u=u'+v$. For velocities not along $x$ the transverse components pick up factors of $\gamma_v(1+u'_xv/c^2)$ in the denominator.`,
      idea: String.raw`Differentiate the Lorentz map of 2.1: $dx=\gamma(dx'+v\,dt')$ and $dt=\gamma(dt'+v\,dx'/c^2)$, so $u=dx/dt=(u'+v)/(1+u'v/c^2)$. In rapidity language (2.3) this is just $\varphi=\varphi'+\varphi_v$ with $\tanh$ applied, which is why the result never reaches $1$: $\tanh$ of any finite number is below one.`,
      caption: String.raw`**Left:** moving walkways, each running at the step speed $u$ relative to the one beneath it; add layers and compare the Galilean total with the true speed. **Right:** the composed speed $w$ of a runner at speed $v'$ on a walkway of speed $u$ — drag the point along the curve; the Galilean line escapes past $c$, the real curve bends and meets $c$ only at $v'=c$.`,
      deps: ['rel-2.1', 'rel-2.3'],
      refs: ['Taylor–Wheeler ch. L', 'Schutz §1.10'],
      tags: ['velocity addition', 'speed limit'],
      viz(v) {
        const un = v.slider('step speed $u/c$', 0.05, 0.9, 0.5, { step: 0.01 });
        const nl = v.slider('layers $n$', 1, 10, 4, { int: true });
        const A = v.stage({ x: [0, 10.5], y: [0, 2.6], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: 'walkway layers', ylabel: 'total speed / $c$', title: 'stacked walkways' });
        const B = v.stage({ x: [0, 1], y: [0, 2], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: "speed $v'$ on the walkway, in $c$", ylabel: 'speed $w$ in the ground frame, in $c$', title: 'composition with one walkway $u$' });
        const H = B.handle(0.6, 1, { color: 'gold', label: '', constrain: (x) => { const t = Math.max(0, Math.min(1, x)); return [t, addV(un.value, t)]; } });
        let st = {};
        v.render(() => {
          const u = un.value, n = nl.value, ph = atanh(u);
          B.setView([0, 1], [0, 2]);
          const gal = (k) => k * u, rel = (k) => Math.tanh(k * ph);
          A.hline(1, { color: 'gold', width: 1.6 }); A.text('$c$', 0.1, 1, { dy: -9, color: 'gold' });
          A.path(Array.from({ length: 11 }, (_, k) => [k, gal(k)]), { color: 'red', width: 1.3, alpha: 0.5, dash: true });
          A.path(Array.from({ length: 11 }, (_, k) => [k, rel(k)]), { color: 'green', width: 1.3, alpha: 0.5, dash: true });
          for (let k = 1; k <= 10; k++) {
            const on = k <= n;
            A.dot(k, gal(k), { r: on ? 5 : 3, color: 'red', hollow: !on }); A.dot(k, rel(k), { r: on ? 5.5 : 3, color: 'green', hollow: !on });
          }
          B.hline(1, { color: 'gold', width: 1.6 }); B.text('$c$', 0.02, 1, { dy: -9, color: 'gold' });
          B.line(0, u, 1, u + 1, { color: 'red', width: 1.6, alpha: 0.7 });
          B.fn((x) => addV(u, x), { color: 'green', width: 2.2, domain: [0, 1] });
          B.line(0, 0, 1, 1, { color: 'faint', dash: true });
          const x = H.x, w = addV(u, x);
          B.segment([x, x + u], [x, w], { color: 'red', alpha: 0.5, dash: true });
          st = { u, n, gn: n * u, rn: rel(n), x, w };
        });
        v.legend([['red', 'Galilean sum'], ['green', 'relativistic composition'], ['gold', 'speed of light']]);
        v.readout(() => {
          const { u, n, gn, rn, x, w } = st; if (st.u === undefined) return '';
          return String.raw`After $n=${n}$ layers of $u=${v.fix(u, 2)}c$: Galilean $nu=${v.fix(gn, 3)}c$${gn >= 1 ? ' (faster than light!)' : ''}, relativistic $c\tanh(n\,\mathrm{artanh}\,u)=${v.fix(rn, 4)}c$ (below $c$ always).` + '\n' +
            String.raw`One layer: $v'=${v.fix(x, 3)}c$ on $u=${v.fix(u, 2)}c$ gives $w=(u+v')/(1+uv')=${v.fix(w, 4)}c$, versus $u+v'=${v.fix(u + x, 3)}c$; at $v'=c$ the result is exactly $c$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Fizeau’s moving-water experiment',
      credit: 'Fizeau, 1851; Fresnel’s drag coefficient, 1818',
      statement: String.raw`Light travelling through a transparent medium of refractive index $n$ that itself flows with velocity $v$ (parallel or antiparallel to the light) has speed, to first order in $v$,
$$u_\pm=\frac cn\pm\Bigl(1-\frac1{n^2}\Bigr)v,$$
so the medium drags the light only by the fraction $k=1-1/n^2$ of its own speed — not the full $v$ of a naive addition of speeds, not $0$ for an ether at rest. Fizeau's interferometer sent two beams through water streams flowing in opposite senses and measured the resulting fringe shift, in agreement with this fraction. Exactly, relativistic velocity addition gives $u_\pm=\bigl(c/n\pm v\bigr)/\bigl(1\pm v/(nc)\bigr)$.`,
      idea: String.raw`In the water's rest frame the light has speed $c/n$. Transform back to the laboratory with the velocity-addition law (2.4): $u=(c/n+v)/(1+v/(nc))\approx c/n+v(1-1/n^2)$. The correction $-v/(nc)\cdot c/n$ in the denominator is precisely Fresnel's drag coefficient, which had been introduced to save the ether theory; special relativity derives it with no ether and no free parameter. The experiment was among Einstein's stated reasons for rejecting an entrained ether.`,
      caption: String.raw`**Change the water speed and the medium.** Left: the fraction of the flow speed that is added to the light speed, as a function of $n$: full drag (1), no drag (0), and the exact relativistic result. Middle: the fringe shift for Fizeau-like parameters (tube length and wavelength are illustrative). Right: the fringe pattern shifts by $\Delta$ fringes. Turn on *absurdly fast water* to see where the first-order formula fails.`,
      deps: ['rel-2.4'],
      refs: ['Taylor–Wheeler ch. L'],
      tags: ['Fizeau', 'Fresnel drag', 'velocity addition'],
      scope: String.raw`Non-dispersive medium; the first-order law needs $v\ll c$. The apparatus numbers used in the picture ($L=1.5$ m per tube, $\lambda=526$ nm) are illustrative, of the scale of Fizeau's apparatus, not his exact figures.`,
      viz(v) {
        const C = 299792458, L = 1.5, lam = 526e-9;
        const med = v.select('medium', [{ value: 1.333, label: 'water 1.333' }, { value: 1.5, label: 'glass 1.5' }, { value: 2.42, label: 'diamond 2.42' }, { value: 1.0003, label: 'air 1.0003' }], 1.333);
        const vs = v.slider('water speed $v$ (m/s)', 0, 15, 7, { step: 0.1 });
        const fast = v.toggle('absurdly fast water ($0.6\\,c$) in the left panel', false);
        const A = v.stage({ x: [1, 2.6], y: [-0.1, 1.15], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'refractive index $n$', ylabel: 'drag fraction $\\Delta u/v$', title: 'how much of the flow is added to the light' });
        const B = v.stage({ x: [0, 15], y: [0, 0.6], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'flow speed $v$ (m/s)', ylabel: 'fringe shift $\\Delta$', title: 'fringe shift, $L=1.5$ m, $\\lambda=526$ nm' });
        const F = v.stage({ x: [-1.5, 1.5], y: [0, 1.2], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'position across the fringes', ylabel: 'intensity', title: 'interference fringes' });
        const shift = (n, vv, k) => (4 * L * n * n * k * vv) / (C * lam);
        let st = {};
        v.render(() => {
          const n = med.value, vv = vs.value, vf = fast.value ? 0.6 * C : vv;
          const k1 = 1 - 1 / (n * n), kex = (vf) => (1 - 1 / (n * n)) / (1 + vf / (n * C));
          A.hline(1, { color: 'red', width: 1.4, dash: true }); A.hline(0, { color: 'muted', width: 1.4, dash: true });
          A.fn((m) => 1 - 1 / (m * m), { color: 'accent', width: 1.6, alpha: fast.value ? 0.5 : 1, domain: [1, 2.6] });
          if (fast.value) A.fn((m) => (1 - 1 / (m * m)) / (1 + 0.6 / m), { color: 'green', width: 2.2, domain: [1, 2.6] });
          A.vline(n, { color: 'faint', dash: true }); A.dot(n, fast.value ? kex(vf) : k1, { r: 6, color: 'green' });
          A.text('full drag (Galilean)', 1.05, 1, { dy: -9, size: 10.5, color: 'red' }); A.text('no drag (ether at rest)', 1.05, 0, { dy: -9, size: 10.5, color: 'muted' });
          A.text('Fresnel / relativity', 1.7, 1 - 1 / 2.89 - 0.06, { size: 10.5, color: 'accent', dy: 14 });
          B.fn((x) => shift(n, x, 1), { color: 'red', width: 1.4, dash: true, domain: [0, 15] });
          B.fn((x) => shift(n, x, k1), { color: 'accent', width: 2, domain: [0, 15] });
          B.hline(0, { color: 'muted', dash: true });
          B.vline(vv, { color: 'faint', dash: true });
          B.dot(vv, shift(n, vv, k1), { r: 6, color: 'green' });
          B.text('full drag', 14.8, shift(n, 15, 1), { align: 'right', dy: -8, size: 10.5, color: 'red' }); B.text('Fresnel', 14.8, shift(n, 15, k1), { align: 'right', dy: -8, size: 10.5, color: 'accent' });
          const D = shift(n, vv, k1);
          F.fn((x) => Math.cos(Math.PI * x) ** 2, { color: 'muted', width: 1.2, dash: true, domain: [-1.5, 1.5] });
          F.fn((x) => Math.cos(Math.PI * (x - D)) ** 2, { color: 'accent', width: 2.2, domain: [-1.5, 1.5], fill: true, base: 0 });
          F.segment([0, 1.12], [D, 1.12], { color: 'green', width: 2 }); F.text(`Δ = ${v.fix(D, 3)}`, D / 2, 1.14, { align: 'center', dy: -8, size: 11, color: 'green' });
          st = { n, vv, k1, D, Dfull: shift(n, vv, 1), uPlus: (C / n + vv) / (1 + vv / (n * C)) };
        });
        v.legend([['accent', 'Fresnel drag = relativity'], ['green', 'exact relativistic (at the chosen $v$)'], ['red', 'full drag'], ['muted', 'no drag']]);
        v.readout(() => {
          const { n, vv, k1, D, Dfull } = st; if (st.n === undefined) return '';
          return String.raw`$n=${v.fix(n, 4)}$: drag fraction $1-1/n^2=${v.fix(k1, 4)}$. At $v=${v.fix(vv, 1)}$ m/s the two beams differ by $\Delta=4L(n^2-1)v/(c\lambda)=${v.fix(D, 3)}$ fringes; full drag would give $${v.fix(Dfull, 3)}$ and no drag $0$. Measuring a shift near the first value, not the others, is the observation.` + (fast.value ? String.raw` With $v=0.6c$ the exact drag fraction falls to $${v.fix((1 - 1 / (n * n)) / (1 + 0.6 / n), 3)}$ — the first-order formula no longer applies.` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Paradox',
      name: 'Each clock runs slow in the other’s frame',
      statement: String.raw`Two inertial observers $A$ and $B$ pass each other at relative speed $v$. Each, using the clocks of his own synchronized lattice, finds that the other's clock advances more slowly, by the factor $1/\gamma$: when $A$'s clock reads $T$ the simultaneous reading of $B$'s clock (in $A$'s frame) is $T/\gamma$, and when $B$'s clock reads $T$ the simultaneous reading of $A$'s clock (in $B$'s frame) is $T/\gamma$. The two statements do not contradict each other because they compare different pairs of events, which are simultaneous in different frames.`,
      idea: String.raw`Time dilation (rel-1.10) is a statement about events that are simultaneous in a given frame, and simultaneity is relative (rel-1.6). In $A$'s frame the line of simultaneity through $A$'s reading $T$ is horizontal and meets $B$'s worldline at $B$-time $T/\gamma$; in $B$'s frame the line of simultaneity through $B$'s reading $T$ is the horizontal line of $B$'s diagram, which is tilted in $A$'s diagram and meets $A$'s worldline at $A$-time $T/\gamma$. These are two different lines meeting two different pairs of points, so nothing is contradictory; a contradiction would only arise if the clocks could be brought together and compared directly, which needs one of them to turn around (2.7).`,
      caption: String.raw`The same two worldlines are drawn in the frame of $A$ (left) and of $B$ (right). **Choose a reading $T$.** The blue line is $A$'s simultaneity line through $A$'s clock reading $T$; the orange line is $B$'s through $B$'s reading $T$; each is horizontal in its owner's diagram and tilted in the other's. Compare which readings they cut out on the other worldline: both are $T/\gamma$.`,
      deps: ['rel-2.1', 'rel-1.6', 'rel-1.10'],
      refs: ['Taylor–Wheeler ch. 3', 'Schutz §1.11'],
      tags: ['time dilation', 'simultaneity', 'reciprocity'],
      viz(v) {
        const bS = v.slider('relative speed $v/c$', 0.05, 0.95, 0.6, { step: 0.01 });
        const TS = v.slider('clock reading $T$', 0.5, 3, 2, { step: 0.05 });
        const both = v.toggle('show both lines in both pictures', true);
        const mk = (title) => v.stage({ x: [-3, 4.4], y: [-0.5, 4.5], equal: true, axes: false, height: 440, weight: 1, minWidth: 300, title });
        const SA = mk("frame of $A$ (vertical worldline)"), SB = mk("frame of $B$ (vertical worldline)");
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), T = TS.value, show = both.value;
          // events in frame A, (t, x): A's reading T, the B event simultaneous with it in A's frame, B's reading T, the A event simultaneous with it in B's frame
          const P0 = [T, 0], Q1 = [T, b * T], Q0 = [g * T, g * b * T], P1 = [T / g, 0];
          for (const [S, M, who] of [[SA, (t, x) => [t, x], 'A'], [SB, (t, x) => toMoving(b, t, x), 'B']]) {
            const pt = (e) => P(...M(...e));
            S.clip(() => {
              S.line(-6, -6, 6, 6, { color: 'gold', alpha: 0.5, dash: [4, 4], width: 1.2 }); S.line(-6, 6, 6, -6, { color: 'gold', alpha: 0.5, dash: [4, 4], width: 1.2 });
              S.path([[-1, 0], [7, 0]].map(pt), { color: 'accent', width: 2.4 }); S.path([[-1, -b], [7, 7 * b]].map(pt), { color: 'orange', width: 2.4 });
              if (who === 'A' || show) S.path([[T, -4], [T, 6]].map(pt), { color: 'accent', width: 1.6, dash: [6, 4] });
              if (who === 'B' || show) S.path([[T, -4], [T, 6]].map(([tp, xp]) => pt(fromMoving(b, tp, xp))), { color: 'orange', width: 1.6, dash: [6, 4] });
            });
            const mark = (e, col, lab, pos) => { const p = pt(e); S.dot(p[0], p[1], { r: 5.5, color: col, label: lab, labelPos: pos }); };
            if (who === 'A' || show) { mark(P0, 'accent', `A: ${v.fix(T, 2)}`, 'nw'); mark(Q1, 'orange', `B: ${v.fix(T / g, 2)}`, 'se'); }
            if (who === 'B' || show) { mark(Q0, 'orange', `B: ${v.fix(T, 2)}`, 'se'); mark(P1, 'accent', `A: ${v.fix(T / g, 2)}`, 'nw'); }
          }
          st = { b, g, T };
        });
        v.legend([['accent', 'worldline of $A$ and its simultaneity line'], ['orange', 'worldline of $B$ and its simultaneity line'], ['gold', 'light', { dash: true }]]);
        v.readout(() => {
          const { b, g, T } = st; if (!g) return '';
          return String.raw`$v/c=${v.fix(b, 2)}$, $\gamma=${v.fix(g, 3)}$. In $A$'s frame: when $A$ reads $T=${v.fix(T, 2)}$, $B$ reads $T/\gamma=${v.fix(T / g, 3)}$. In $B$'s frame: when $B$ reads $T=${v.fix(T, 2)}$, $A$ reads $T/\gamma=${v.fix(T / g, 3)}$. The pairs of events are different, so both are true.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Paradox',
      name: 'Twin paradox',
      credit: 'Langevin, 1911 (the travelling-twin form)',
      statement: String.raw`One twin stays at rest in an inertial frame; the other leaves, turns around at some event and returns to meet the first. When they meet, the travelling twin has aged less: if the stay-at-home twin's elapsed time is $T$ and the traveller moves with constant speeds $v_1$ out and $v_2$ back in the home frame, the traveller's elapsed proper time is $\tau=\tfrac{t_1}{\gamma_1}+\tfrac{T-t_1}{\gamma_2}<T$, where $t_1$ is the home time of the turn. Each twin sees the other's clock slow in any inertial stretch (2.6), yet the result is not symmetric, because only the traveller changes inertial frame.`,
      idea: String.raw`The paradox arises from applying "moving clocks run slow" symmetrically. But the two worldlines between the same pair of events are not equivalent: the straight inertial one has the **longest** proper time, since $\tau=\int\sqrt{1-v^2/c^2}\,dt$ (rel-1.9) is largest for $v=0$. In the traveller's own accounting the resolution is that at the turnaround his line of simultaneity swings from one inertial frame to another and sweeps over a stretch of the home twin's life, $2\beta^2 t_1$ in the symmetric case. Before the turn he reckons the home clock slow, after the turn too, but the jump in between makes up the difference.`,
      caption: String.raw`**Drag the turnaround event** $E$ of the traveller (blue) in the home frame (the vertical worldline). Left: the traveller's lines of simultaneity, blue on the way out and orange on the way back, hit the home worldline at the home age the traveller assigns to "now"; the red stretch is the home time that his simultaneity skips at the turn. Right: that assigned home age against the traveller's own proper time: it rises slowly, jumps at the turn, then rises slowly again, and ends at $T$. Switch on the yearly signals to count them instead.`,
      deps: ['rel-1.9', 'rel-2.6'],
      refs: ['Taylor–Wheeler §4.6', 'Schutz §1.13'],
      tags: ['twin paradox', 'proper time', 'simultaneity'],
      scope: String.raw`Special relativity with instantaneous (idealized) turnaround; the acceleration itself changes nothing about the proper-time integral. In general relativity the same logic holds with the straight line replaced by a geodesic.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Twin_paradox' },
      viz(v) {
        const T = 10;
        const sig = v.toggle('show yearly light signals from home', false);
        const A = v.stage({ x: [-5.5, 5.5], y: [-0.4, 10.6], equal: true, axes: false, height: 460, weight: 1.15, minWidth: 320, title: 'home frame: years up, light-years across' });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 460, weight: 0.85, minWidth: 280, xlabel: 'traveller\'s proper time $\\tau$ (years)', ylabel: 'home age by his simultaneity', title: 'what the traveller assigns to the home twin' });
        const E = A.handle(3, 5, { color: 'accent', label: 'E', labelPos: 'e', constrain: (x, y) => { const t = Math.max(1.2, Math.min(T - 1.2, y)); const m = Math.min(t, T - t) - 0.15; return [Math.max(-m, Math.min(m, x)), t]; } });
        let st = {};
        v.render(() => {
          const xt = E.x, tt = E.y;
          const b1 = xt / tt, b2 = -xt / (T - tt), g1 = gam(b1), g2 = gam(Math.abs(b2));
          const tau1 = tt / g1, tau2 = (T - tt) / g2, tau = tau1 + tau2;
          // clock ticks of the traveller (yearly) and the home twin
          A.line(-5.5, 0, 5.5, 0, { color: 'faint' });
          A.clip(() => { A.line(-12, -12, 12, 12, { color: 'gold', alpha: 0.35, dash: [4, 4] }); A.line(12, -12, -12, 12, { color: 'gold', alpha: 0.35, dash: [4, 4] }); });
          A.path([[0, 0], [0, T]], { color: 'ink', width: 2.6 }); A.path([[0, 0], [xt, tt], [0, T]], { color: 'accent', width: 2.6 });
          // lines of simultaneity of the traveller
          const hOut = (s) => s / g1, N = 14;
          const hIn = (s) => { const s2 = s - tau1, tp = tt + g2 * s2, xp = xt + g2 * s2 * b2; return tp - b2 * xp; };
          for (let k = 1; k < N; k++) {
            const s = (tau * k) / N;
            if (Math.abs(s - tau1) < 0.12) continue;
            const out = s < tau1, bb = out ? b1 : b2;
            const p = out ? [g1 * s * b1, g1 * s] : [xt + g2 * (s - tau1) * b2, tt + g2 * (s - tau1)];
            const hh = out ? hOut(s) : hIn(s);
            A.segment([0, hh], p, { color: out ? 'accent' : 'orange', width: 1.2, alpha: 0.6 });
            A.dot(p[0], p[1], { r: 2.8, color: out ? 'accent' : 'orange' });
          }
          // the home years skipped at the turn
          const h1 = hOut(tau1), h2 = hIn(tau1 + 1e-9);
          A.segment([0, h1], [0, h2], { color: 'red', width: 6, alpha: 0.75 });
          A.segment([0, h1], [xt, tt], { color: 'accent', width: 1.6 }); A.segment([0, h2], [xt, tt], { color: 'orange', width: 1.6 });
          A.text(`skipped: ${v.fix(h2 - h1, 2)} yr`, 0, (h1 + h2) / 2, { dx: -10, align: 'right', color: 'red', size: 11 });
          let nOut = 0, nIn = 0;
          if (sig.value) {
            for (let k = 1; k <= T; k++) {
              let th = k / (1 - b1), onOut = th <= tt + 1e-9;
              if (!onOut) th = (k + xt - b2 * tt) / (1 - b2);
              const xh = onOut ? b1 * th : xt + b2 * (th - tt);
              A.segment([0, k], [xh, th], { color: 'gold', width: 1.3, alpha: 0.9 }); A.dot(0, k, { r: 3, color: 'gold' });
              if (onOut) nOut++; else nIn++;
            }
          }
          // plot of the home age assigned by the traveller
          B.line(0, 0, 10, 10, { color: 'faint', dash: true });
          B.fn((s) => hOut(s), { color: 'accent', width: 2.4, domain: [0, tau1] });
          B.fn((s) => hIn(s), { color: 'orange', width: 2.4, domain: [tau1, tau] });
          B.segment([tau1, h1], [tau1, h2], { color: 'red', width: 3 });
          B.dot(tau, T, { r: 5, color: 'green' }); B.dot(0, 0, { r: 4, color: 'ink' });
          B.vline(tau, { color: 'faint', dash: true });
          B.text(`τ = ${v.fix(tau, 2)}`, tau, 0.3, { align: 'right', dx: -4, size: 11, color: 'green' });
          st = { b1, b2, g1, g2, tau, h1, h2, nOut, nIn, xt, tt };
        });
        v.legend([['ink', 'home twin'], ['accent', 'traveller outbound, and his simultaneity'], ['orange', 'traveller inbound'], ['red', 'home years skipped at the turn']]);
        v.readout(() => {
          const { b1, b2, g1, g2, tau, h1, h2, nOut, nIn } = st; if (!g1) return '';
          return String.raw`Out at $v_1=${v.fix(b1, 3)}c$ ($\gamma=${v.fix(g1, 3)}$), back at $v_2=${v.fix(Math.abs(b2), 3)}c$ ($\gamma=${v.fix(g2, 3)}$). Home twin ages $T=${T}$ yr; traveller ages $\tau=${v.fix(tau, 3)}$ yr — always less than $T$. On the way out he assigns the home clock ${v.fix(h1, 2)} yr when he is at the turn, on the way back ${v.fix(h2, 2)} yr: a jump of ${v.fix(h2 - h1, 2)} yr in the simultaneity, which accounts for the difference.` + (sig.value ? String.raw` Signals received: ${nOut} on the way out, ${nIn} on the way back (the last one at the reunion), ${nOut + nIn} in all.` : '');
        });
      },
    },
  ],
};
