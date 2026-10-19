// Differential Geometry — Chapter 4 (continued): 4.8–4.14. (4.7 is the cross-listed differential of a smooth map, mfd-2.4.)
import {
  TAU, PI, clamp, add, sub, mul, dot, cross, len, unit, dF, stage3, chart, coordLines, SURF,
  implicitMesh, paramMesh, drawMesh, rayHits, sliceZ,
} from './ch04.shared.js';


/** Uniform Catmull–Rom curve through the points P at parameter t ∈ [0, n]. */
function crom(P, t) {
  const n = P.length - 1, i = Math.min(n - 1, Math.max(0, Math.floor(t))), s = t - i;
  const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n)];
  const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s * s + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s * s * s);
  return [f(0), f(1)];
}

export default {
  collection: 'dg',
  chapter: 4,
  items: [
  // ───────────────────────────────────────────────────────────── 4.8
  {
    num: '4.8',
    kind: 'Definition',
    name: 'Surfaces of revolution',
    statement: String.raw`Let $\gamma(t)=(\rho(t),0,z(t))$, $t\in I$, be a regular plane curve in the half-plane $\rho>0$ of the $xz$-plane that is injective (a **profile**). Rotating it about the $z$-axis gives the **surface of revolution**
$$\mathbf x(t,\theta)=(\rho(t)\cos\theta,\ \rho(t)\sin\theta,\ z(t)),\qquad t\in I,\ \theta\in(0,2\pi),$$
which is a regular surface with $\mathbf x_t\times\mathbf x_\theta\ne0$ (indeed $|\mathbf x_t\times\mathbf x_\theta|=\rho\,|\gamma'|$). The images of $\theta=\text{const}$ are the **meridians** (copies of $\gamma$) and of $t=\text{const}$ the **parallels** (circles of radius $\rho(t)$).`,
    idea: String.raw`The partial derivatives are $\mathbf x_t=(\rho'\cos\theta,\rho'\sin\theta,z')$, tangent to the meridian, and $\mathbf x_\theta=\rho(-\sin\theta,\cos\theta,0)$, tangent to the parallel; they are orthogonal, and independent exactly when $\gamma'\ne0$ and $\rho\ne0$. So the only way to lose regularity is to let the profile touch the axis. Where it meets the axis at a right angle (like the poles of a sphere) the surface can still be smooth, provided the profile extends evenly across the axis; at any other angle the surface has a cone point. The area is $2\pi\int\rho\,|\gamma'|\,dt$ (Pappus's centroid theorem).`,
    caption: String.raw`Drag the four control points of the profile (left; the curve is a Catmull–Rom spline through them), or choose a preset, or switch to the circle profile of a torus and slide its centre distance $R$ against the fixed radius $r=0.6$. The blue curve is the profile, the faint curves are meridians and parallels. Take the first point to the axis: if the tangent there is horizontal (like the "cap" preset) the end is smooth; slanted (the "cone tip" preset) it is a cone point. For the torus, $R>r$ gives a regular surface, $R=r$ a horn torus touching its axis, $R<r$ a profile that crosses the axis and a self-intersecting surface.`,
    deps: ['dg-4.1'],
    refs: ['do Carmo §2-3', 'Pressley Ch. 5'],
    tags: ['surface of revolution', 'profile curve', 'torus'],
    viz(v) {
      const PRE = {
        vase: [[0.9, -1.3], [1.15, -0.4], [0.55, 0.5], [0.85, 1.3]],
        cap: [[0, 1.3], [0.9, 1.2], [1.2, 0.1], [0.8, -1.2]],
        cone: [[0, 1.4], [0.45, 0.9], [0.9, 0.4], [1.35, -0.1]],
      };
      const mode = v.select('profile', [{ value: 'free', label: 'free spline' }, { value: 'circle', label: 'circle (torus)' }], 'free', { onChange: () => sync() });
      const pre = v.select('preset', [{ value: 'vase', label: 'vase' }, { value: 'cap', label: 'cap (right angle)' }, { value: 'cone', label: 'cone tip' }], 'vase', {
        onChange: (k) => { PRE[k].forEach((q, i) => H[i].set(q[0], q[1])); },
      });
      const Rr = v.slider('torus: centre distance $R$ (radius $r=0.6$)', 0.2, 1.8, 1.2, { step: 0.05 });
      const sweep = v.slider('angle swept', 60, 360, 360, { step: 5 });
      const S3 = stage3(v, { range: 2.1, title: 'surface of revolution', yaw: -0.8, pitch: 0.4, weight: 1.2 });
      const P2 = v.stage({ x: [-0.4, 2.4], y: [-1.8, 1.8], equal: true, axes: false, height: 380, weight: 0.8, minWidth: 260, title: 'profile in the $(\\rho,z)$ half-plane' });
      const H = PRE.vase.map((q, i) => P2.handle(q[0], q[1], { color: 'accent', label: String(i + 1), constrain: { x: [0, 2.2], y: [-1.6, 1.6] } }));
      function sync() { H.forEach((h) => { h.visible = mode.value === 'free'; }); pre.el.hidden = mode.value !== 'free'; Rr.el.hidden = mode.value !== 'circle'; }
      sync();
      let info = null;
      v.render(() => {
        const circ = mode.value === 'circle', r = 0.6, R = Rr.value;
        const pts = H.map((h) => [h.x, h.y]);
        const prof = circ ? (t) => [R + r * Math.cos(t), r * Math.sin(t)] : (t) => crom(pts, t);
        const T = circ ? TAU : 3;
        const F = (t, th) => { const p = prof(t); return [p[0] * Math.cos(th), p[0] * Math.sin(th), p[1]]; };
        const th1 = (sweep.value * PI) / 180;
        S3.surface(F, [0, T], [0, th1], { nu: circ ? 48 : 40, nv: Math.max(8, Math.round(36 * sweep.value / 360)), alpha: 0.78, color: 'accent', wire: true });
        for (let k = 0; k <= 8; k++) { const th = (th1 * k) / 8; S3.curve((t) => F(t, th), 0, T, { color: k === 0 ? 'gold' : 'ink', width: k === 0 ? 2.6 : 1, alpha: k === 0 ? 1 : 0.3, n: 60, bias: -0.05 }); }
        for (let j = 0; j <= 8; j++) { const t = (T * j) / 8; S3.curve((th) => F(t, th), 0, th1, { color: 'ink', width: 1, alpha: 0.3, n: 40, bias: -0.05 }); }
        S3.line([0, 0, -2], [0, 0, 2], { color: 'muted', width: 1.2, dash: true });
        // profile panel
        P2.line(0, -1.8, 0, 1.8, { color: 'muted', width: 1.5, dash: true });
        P2.text('axis', 0.08, 1.65, { color: 'muted', size: 11, align: 'left' });
        const N = 160, line = [];
        for (let i = 0; i <= N; i++) line.push(prof((T * i) / N));
        P2.path(line, { color: 'accent', width: 3 });
        let area = 0, minRho = Infinity;
        const M = 600;
        for (let i = 0; i < M; i++) {
          const a = prof((T * i) / M), b = prof((T * (i + 1)) / M), rr = (a[0] + b[0]) / 2;
          area += 2 * PI * Math.abs(rr) * Math.hypot(b[0] - a[0], b[1] - a[1]); minRho = Math.min(minRho, a[0]);
        }
        const ends = [];
        if (!circ) for (const [i, tt] of [[0, 0], [3, 3]]) {
          if (pts[i][0] < 0.04) {
            const e = 1e-3, p = prof(tt === 0 ? e : 3 - e), q0 = prof(tt), d = [p[0] - q0[0], p[1] - q0[1]], dl = Math.hypot(d[0], d[1]) || 1;
            ends.push({ i: i + 1, ang: (Math.atan2(Math.abs(d[1]), Math.abs(d[0])) * 180) / PI, dl });
            P2.arrow(q0[0], q0[1], q0[0] + (0.5 * d[0]) / dl, q0[1] + (0.5 * d[1]) / dl, { color: 'orange', width: 2.5 });
          }
        }
        info = { circ, R, r, area, minRho, ends, T };
      });
      v.readout(() => {
        if (!info) return '';
        const f = (x) => v.fix(x, 2);
        let t = `Area $=2\\pi\\int\\rho\\,ds\\approx${f(info.area)}`;
        if (info.circ) {
          const d = Math.abs(info.R - info.r);
          t += `$ (exact for a torus: $4\\pi^2Rr=${f(4 * PI * PI * info.R * info.r)}$). ` + (d < 1e-6 ? '**$R=r$: the profile touches the axis** at one point, the horn torus is singular there.' : info.R < info.r ? '**$R<r$: the profile crosses the axis**, the surface passes through itself.' : '$R>r$: $\\rho>0$ along the profile, a regular surface.');
        } else {
          t += `$. Smallest $\\rho$ on the profile: $${f(info.minRho)}$. `;
          if (info.ends.length) t += info.ends.map((e) => `End ${e.i} is on the axis; the tangent makes ${f(e.ang)}° with the horizontal: ` + (e.ang < 4 ? 'perpendicular to the axis, so the end can be a smooth pole.' : '**slanted: a cone point**, not a regular point.')).join(' ');
          else t += 'The profile stays off the axis, so every point is regular.';
        }
        return t;
      });
    },
  },
  // ───────────────────────────────────────────────────────────── 4.9
  {
    num: '4.9',
    kind: 'Definition',
    name: 'Ruled surfaces',
    statement: String.raw`A **ruled surface** is a surface swept out by a one-parameter family of straight lines (the **rulings**): it is parametrized by $\mathbf x(s,t)=\beta(s)+t\,\delta(s)$, where $\beta$ is a smooth curve (the **directrix**) and $\delta(s)\ne0$ gives the direction of the ruling through $\beta(s)$. It is regular where $\mathbf x_s\times\mathbf x_t=(\beta'+t\delta')\times\delta\ne0$. A surface is **doubly ruled** if through every point pass two different rulings; the plane, the hyperboloid of one sheet and the hyperbolic paraboloid are the classical doubly ruled surfaces.`,
    idea: String.raw`The definition only asks for straight lines inside the surface, so very curved-looking surfaces qualify: the hyperboloid $x^2+y^2-z^2=1$ contains the lines $(\cos s-t\sin s,\ \sin s+t\cos s,\ t)$, obtained by tilting the tangent line of the waist circle, and the mirror family with $t\to-t$ in the first two coordinates; $z=xy$ contains the lines $y=\text{const}$ and $x=\text{const}$. The helicoid and the cone are singly ruled, the cone singular at the vertex where all rulings meet. The Möbius band is also ruled, which is why ruled surfaces need not be orientable (4.12).`,
    caption: String.raw`Choose a surface; the faint lines are rulings of the first family, and with "second family" on, the other family of a doubly ruled surface appears (the hyperboloid and the saddle $z=xy$ have two, the helicoid, cone and Möbius band only one). The gold line is one ruling, chosen by the slider; the readout gives its direction. Rotate the 3D view by dragging; notice that every ruling is a straight line, though the surface it fills is curved.`,
    deps: ['dg-4.1'],
    refs: ['do Carmo §3-5', 'Pressley Ch. 5'],
    tags: ['ruled surface', 'hyperboloid', 'helicoid'],
    credit: 'The rulings of the hyperboloid of one sheet: C. Wren, 1669 (Philosophical Transactions)',
    viz(v) {
      const SR = {
        hyp: { name: 'hyperboloid', F: (s, t) => [Math.cos(s) - t * Math.sin(s), Math.sin(s) + t * Math.cos(s), t], G: (s, t) => [Math.cos(s) + t * Math.sin(s), Math.sin(s) - t * Math.cos(s), t], S: [0, TAU], T: [-1.3, 1.3], dbl: true, txt: '$x^2+y^2-z^2=1$, doubly ruled' },
        sad: { name: 'saddle $z=xy$', F: (s, t) => [s, t, s * t], G: (s, t) => [t, s, s * t], S: [-1.4, 1.4], T: [-1.4, 1.4], dbl: true, txt: '$z=xy$, doubly ruled (the lines $y=$ const and $x=$ const)' },
        hel: { name: 'helicoid', F: (s, t) => [t * Math.cos(s), t * Math.sin(s), 0.33 * s], S: [-4.6, 4.6], T: [-1.4, 1.4], dbl: false, txt: 'helicoid: horizontal lines through the axis, singly ruled' },
        cone: { name: 'cone', F: (s, t) => [t * Math.cos(s), t * Math.sin(s), t], S: [0, TAU], T: [-1.4, 1.4], dbl: false, txt: 'cone: all rulings pass through the vertex (singular point)' },
        mob: { name: 'Möbius band', F: (s, t) => [(1.1 + t * Math.cos(s / 2)) * Math.cos(s), (1.1 + t * Math.cos(s / 2)) * Math.sin(s), t * Math.sin(s / 2)], S: [0, TAU], T: [-0.6, 0.6], dbl: false, txt: 'Möbius band: ruled by segments that turn through $180^\\circ$ around the core' },
      };
      const sel = v.select('surface', Object.entries(SR).map(([k, s]) => ({ value: k, label: s.name })), 'hyp');
      const nR = v.slider('number of rulings', 4, 40, 18, { int: true });
      const pick = v.slider('highlighted ruling', 0, 1, 0.2, { step: 0.005 });
      const both = v.toggle('second family', true);
      const S3 = stage3(v, { range: 1.9, height: 440, title: 'ruled surface', yaw: -0.7, pitch: 0.4, full: true });
      let info = null;
      v.render(() => {
        const s = SR[sel.value], [s0, s1] = s.S, [t0, t1] = s.T, F = s.F;
        S3.surface(F, s.S, s.T, { nu: 56, nv: 20, alpha: 0.35, color: 'accent' });
        const n = nR.value;
        for (let k = 0; k < n; k++) { const ss = s0 + ((s1 - s0) * (k + (sel.value === 'mob' || sel.value === 'hyp' ? 0 : 0.5))) / n; S3.curve((t) => F(ss, t), t0, t1, { n: 2, color: 'accent', width: 1.5, bias: -0.05 }); }
        if (s.dbl && both.value) for (let k = 0; k < n; k++) { const ss = s0 + ((s1 - s0) * (k + 0.5)) / n; S3.curve((t) => s.G(ss, t), t0, t1, { n: 2, color: 'orange', width: 1.5, bias: -0.05 }); }
        const sg = s0 + (s1 - s0) * pick.value;
        S3.curve((t) => F(sg, t), t0, t1, { n: 2, color: 'gold', width: 4, bias: -0.2 });
        const a = F(sg, t0), b = F(sg, t1), d = unit(sub(b, a));
        info = { s, d, doubly: s.dbl && both.value };
      });
      v.readout(() => {
        if (!info) return '';
        return `${info.s.txt}. The highlighted ruling has direction $(${info.d.map((x) => v.fix(x, 2)).join(',\\ ')})$. ${info.doubly ? 'Through each point of the surface pass **two** straight lines, one from each family.' : 'One family of straight lines fills the surface.'}`;
      });
    },
  },
  // ───────────────────────────────────────────────────────────── 4.10
  {
    num: '4.10',
    kind: 'Definition',
    name: 'Quadric surfaces',
    statement: String.raw`A **quadric surface** is the zero set in $\R^3$ of a polynomial of degree $2$, $Q(x)=x^{\mathsf T}Ax+2b\cdot x+c=0$ with $A\ne0$ symmetric. After a rotation and a translation of the axes, $A$ is diagonal with eigenvalues $\lambda_1,\lambda_2,\lambda_3$ and the standard real types include: the ellipsoid ($+++$, right side $1$), hyperboloids of one sheet ($++-$) and of two sheets ($+--$), the elliptic and hyperbolic paraboloids ($\lambda_3=0$ with a linear term), the cone ($\kappa=0$), and the cylinders (one $\lambda_i=0$). Degenerate zero sets can also be pairs of planes, a line or a point, and some equations have no real solutions. The type depends on the eigenvalues, the linear term in the nullspace, and the shifted constant.`,
    idea: String.raw`The spectral theorem (ladr-7.29) diagonalizes $A$ by an orthogonal change of coordinates, which preserves shapes. If no eigenvalue is $0$ one can complete the square in every variable, which moves the centre to the origin and leaves $\sum\lambda_ix_i^2=\kappa$; dividing by $|\kappa|$ leaves only the signs of the $\lambda_i$ (and the sign of $\kappa$), so they decide the type. If $\lambda_3=0$ and $b$ has a component along that axis, completing squares in the other two variables leaves a linear term and a paraboloid. The nonzero level $\kappa$ is a regular value of $Q$ in the central case, so a nonempty nonzero level in the central case is a regular surface (4.3). The cone has a singular vertex; lower-dimensional and empty zero sets are not regular surfaces.`,
    caption: String.raw`The equation is $\lambda_1x'^2+\lambda_2y'^2+\lambda_3z'^2+2\ell z'=\kappa$ in axes $(x',y',z')$ rotated by the two tilt sliders, a family of rotated diagonal quadrics with a linear term along the third eigenaxis; the readout recomputes the eigenvalues of $A$ from the rotated matrix and classifies the surface from their signs. Use the presets, then move one eigenvalue through $0$: an ellipsoid opens into a cylinder and then into a hyperboloid; add $\ell$ with $\lambda_3=0$ for the paraboloids; set $\kappa=0$ for the cone.`,
    deps: ['dg-4.3', 'ladr-7.29'],
    refs: ['Axler, Linear Algebra Done Right, 4th ed., Theorem7.29; do Carmo, §2-2 (regular level sets); completion-of-squares classification given here'],
    tags: ['quadric', 'classification', 'eigenvalues'],
    viz(v) {
      const PRE = {
        ell: [1, 0.8, 0.5, 0, 1], one: [1, 1, -0.8, 0, 1], two: [1, -1, -1, 0, 1], cone: [1, 1, -1, 0, 0],
        ep: [1, 0.6, 0, 0.8, 0], hp: [1, -1, 0, 0.8, 0], cyl: [1, 0.7, 0, 0, 1],
      };
      const sel = v.select('preset', [
        { value: 'ell', label: 'ellipsoid' }, { value: 'one', label: 'one sheet' }, { value: 'two', label: 'two sheets' }, { value: 'cone', label: 'cone' },
        { value: 'ep', label: 'elliptic paraboloid' }, { value: 'hp', label: 'hyperbolic paraboloid' }, { value: 'cyl', label: 'cylinder' },
      ], 'one', { onChange: (k) => { const p = PRE[k]; l1.set(p[0]); l2.set(p[1]); l3.set(p[2]); ell.set(p[3]); kap.set(p[4]); } });
      const l1 = v.slider('$\\lambda_1$', -1.5, 1.5, 1, { step: 0.1 }), l2 = v.slider('$\\lambda_2$', -1.5, 1.5, 1, { step: 0.1 }), l3 = v.slider('$\\lambda_3$', -1.5, 1.5, -0.8, { step: 0.1 });
      const ell = v.slider('linear term $\\ell$', 0, 1.2, 0, { step: 0.1 });
      const kap = v.select('$\\kappa$', [{ value: -1, label: '−1' }, { value: 0, label: '0' }, { value: 1, label: '1' }], 1);
      const a1 = v.slider('tilt 1 (degrees)', 0, 90, 25, { step: 1 }), a2 = v.slider('tilt 2 (degrees)', 0, 90, 35, { step: 1 });
      const S3 = stage3(v, { range: 2.1, height: 430, title: 'the quadric (clipped to a box)', yaw: -0.7, pitch: 0.4, full: true });
      const cache = new Map();
      let info = null;
      v.render(() => {
        const L = [l1.value, l2.value, l3.value].map((x) => (Math.abs(x) < 1e-6 ? 0 : x)), lt = ell.value, k = kap.value;
        const al = (a1.value * PI) / 180, be = (a2.value * PI) / 180;
        // R = Rz(be) Rx(al); x' = R^T x
        const ca = Math.cos(al), sa = Math.sin(al), cb = Math.cos(be), sb = Math.sin(be);
        const R = [[cb, -sb * ca, sb * sa], [sb, cb * ca, -cb * sa], [0, sa, ca]];
        const Rt = (x, y, z) => [R[0][0] * x + R[1][0] * y + R[2][0] * z, R[0][1] * x + R[1][1] * y + R[2][1] * z, R[0][2] * x + R[1][2] * y + R[2][2] * z];
        const f = (x, y, z) => { const q = Rt(x, y, z); return L[0] * q[0] * q[0] + L[1] * q[1] * q[1] + L[2] * q[2] * q[2] + 2 * lt * q[2]; };
        const key = [...L, lt, k, a1.value, a2.value].join('|');
        if (!cache.has(key)) { if (cache.size > 6) cache.clear(); cache.set(key, implicitMesh(f, k, [-1.8, -1.8, -1.8], [1.8, 1.8, 1.8], 30)); }
        const tris = cache.get(key);
        drawMesh(S3, v, tris, { color: 'accent', alpha: 0.88 });
        for (let i = 0; i < 3; i++) { const e = [0, 0, 0]; e[i] = 1; const w = [R[0][i], R[1][i], R[2][i]]; S3.arrow(mul(w, -1.9), mul(w, 1.9), { color: ['red', 'green', 'blue'][i], width: 1.4, alpha: 0.6 }); }
        // eigenvalues of A = R diag(L) R^T
        const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => L[0] * R[i][0] * R[j][0] + L[1] * R[i][1] * R[j][1] + L[2] * R[i][2] * R[j][2]));
        const ev = v.M.eigSym(A).values.slice().sort((p, q) => q - p);
        // classification
        const tol = 1e-6, z3 = Math.abs(L[2]) < tol;
        let name;
        if (z3 && lt > tol) {
          const a = L[0], b = L[1];
          if (Math.abs(a) > tol && Math.abs(b) > tol) name = a * b > 0 ? 'elliptic paraboloid' : 'hyperbolic paraboloid';
          else if (Math.abs(a) > tol || Math.abs(b) > tol) name = 'parabolic cylinder';
          else name = 'plane';
        } else {
          const ke = k + (!z3 ? (lt * lt) / L[2] : 0);
          const nz = L.filter((x) => Math.abs(x) > tol), sgn = Math.abs(ke) < 1e-9 ? 1 : Math.sign(ke);
          const p = nz.filter((x) => x * sgn > 0).length, n = nz.length - p, r = nz.length;
          if (Math.abs(ke) < 1e-9) {
            if (r === 3) name = p === 3 || n === 3 ? 'a single point' : 'cone';
            else if (r === 2) name = nz[0] * nz[1] > 0 ? 'a line' : 'two crossing planes';
            else if (r === 1) name = 'a plane (double)'; else name = 'everything';
          } else if (r === 3) name = p === 3 ? 'ellipsoid' : p === 2 ? 'hyperboloid of one sheet' : p === 1 ? 'hyperboloid of two sheets' : 'empty set';
          else if (r === 2) name = p === 2 ? 'elliptic cylinder' : p === 1 ? 'hyperbolic cylinder' : 'empty set';
          else if (r === 1) name = p === 1 ? 'two parallel planes' : 'empty set'; else name = 'empty set';
        }
        info = { ev, name, L };
      });
      v.readout(() => {
        if (!info) return '';
        const sg = (x) => (Math.abs(x) < 1e-6 ? '0' : x > 0 ? '+' : '−');
        return `Eigenvalues of $A$ (computed from the rotated matrix): $${info.ev.map((x) => v.fix(x, 2)).join(',\\ ')}$, signs $(${info.ev.map(sg).join(' ')})$ — the surface is the **${info.name}**.`;
      });
    },
  },
  // ───────────────────────────────────────────────────────────── 4.11
  {
    num: '4.11',
    kind: 'Definition',
    name: 'Orientation and unit normal fields',
    statement: String.raw`A regular surface $S$ is **orientable** if there is a smooth unit normal field $N\colon S\to S^2\subset\R^3$, i.e. a smooth choice of one of the two unit vectors orthogonal to $T_pS$ at each $p$. An **orientation** is such a choice of $N$; equivalently (for connected $S$) a choice of a family of parametrizations covering $S$ whose changes of parameters have positive Jacobian determinant. A parametrization $\mathbf x$ is positively oriented for $N$ if $N=\mathbf x_u\times\mathbf x_v/|\mathbf x_u\times\mathbf x_v|$. A connected orientable surface has exactly two orientations, $N$ and $-N$.`,
    idea: String.raw`In one patch $N=\pm\mathbf x_u\times\mathbf x_v/|\mathbf x_u\times\mathbf x_v|$ is smooth, because $\mathbf x_u\times\mathbf x_v$ is smooth and non-vanishing (4.1). Orientability asks whether these local choices glue: on an overlap, the two cross products point the same way exactly when the Jacobian determinant of the change of parameters (4.4) is positive. For a connected surface the set of points where two normal fields agree is open and closed, hence all or nothing: so one choice at one point forces the field everywhere, if it exists.`,
    caption: String.raw`Choose a surface and a closed loop on it. Press "flip" to choose the other normal at the base point: the whole green field turns over, since a continuous extension is unique. The gold marker moves along the loop (slider) carrying the continuous normal; the readout gives its angle to the normal at the start and tells whether the chart basis $(\mathbf x_u,\mathbf x_v)$ (blue, orange) is positively oriented for the chosen $N$. Back at the end of the loop the normal is exactly where it began: on these surfaces there is no obstruction. (4.12 shows the surface where there is.)`,
    deps: ['dg-4.6'],
    refs: ['do Carmo §2-6'],
    tags: ['orientation', 'normal field'],
    viz(v) {
      const SR = {
        sphere: { s: SURF.sphere, loop: (t) => [-PI + TAU * t, 0.7 * Math.sin(TAU * t)], name: 'sphere: tilted loop' },
        torusM: { s: SURF.torus, loop: (t) => [0.4, TAU * t], name: 'torus: meridian' },
        torusL: { s: SURF.torus, loop: (t) => [TAU * t, 0.7], name: 'torus: longitude' },
        saddle: { s: SURF.saddle, loop: (t) => [0.9 * Math.cos(TAU * t), 0.9 * Math.sin(TAU * t)], name: 'saddle: loop' },
      };
      const sel = v.select('surface and loop', Object.entries(SR).map(([k, r]) => ({ value: k, label: r.name })), 'torusM');
      const flip = v.toggle('flip the normal (other orientation)', false);
      const pos = v.slider('position on the loop', 0, 1, 0.6, { step: 0.005 });
      const S3 = stage3(v, { range: 2, height: 440, title: 'unit normal field', yaw: -0.7, pitch: 0.5, full: true });
      let info = null;
      v.render(() => {
        const r = SR[sel.value], s = r.s, F = s.F, sg = flip.value ? -1 : 1;
        S3.surface(F, s.U, s.V, { nu: 44, nv: 30, alpha: 0.55, color: 'accent', wire: true });
        const Nf = (a, b) => mul(dF(F, a, b).N, sg);
        const nu = 14, nv = 9, [u0, u1] = s.U, [v0, v1] = s.V;
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
          const a = u0 + ((u1 - u0) * (i + 0.5)) / nu, b = v0 + 0.05 * (v1 - v0) + ((v1 - v0) * 0.9 * (j + 0.5)) / nv, P = F(a, b), N = Nf(a, b);
          S3.arrow(P, add(P, mul(N, 0.3)), { color: 'green', width: 1.8, alpha: 0.8, head: 6 });
        }
        S3.path(Array.from({ length: 121 }, (_, i) => { const q = r.loop(i / 120); return F(q[0], q[1]); }), { color: 'gold', width: 2, alpha: 0.7 });
        const q0 = r.loop(0), q = r.loop(pos.value), P0 = F(q0[0], q0[1]), P = F(q[0], q[1]), N0 = Nf(q0[0], q0[1]), N = Nf(q[0], q[1]), d = dF(F, q[0], q[1]);
        S3.arrow(P0, add(P0, mul(N0, 0.7)), { color: 'muted', width: 2.5, bias: -0.1 });
        S3.arrow(P, add(P, mul(N, 0.8)), { color: 'gold', width: 4, bias: -0.2 });
        S3.arrow(P, add(P, mul(unit(d.Fu), 0.5)), { color: 'blue', width: 2.5, bias: -0.15 });
        S3.arrow(P, add(P, mul(unit(d.Fv), 0.5)), { color: 'orange', width: 2.5, bias: -0.15 });
        S3.dot(P, { r: 5, color: 'gold', bias: -0.3 });
        info = { ang: (Math.acos(clamp(dot(N, N0), -1, 1)) * 180) / PI, pos: dot(d.n, N) > 0 };
      });
      v.legend([['green', 'normal field $N$'], ['muted', '$N$ at the start'], ['gold', 'carried normal'], ['blue', '$\\mathbf x_u$'], ['orange', '$\\mathbf x_v$']]);
      v.readout(() => (info ? `Angle between the carried normal and the normal at the start: $${v.fix(info.ang, 1)}^\\circ$ (it is $0$ again at the end of the loop). The chart $(\\mathbf x_u,\\mathbf x_v)$ is **${info.pos ? 'positively' : 'negatively'} oriented** for this $N$ (${info.pos ? '$N$ is $\\mathbf x_u\\times\\mathbf x_v$ normalized' : 'swap $u$ and $v$ to make it positive'}).` : ''));
    },
  },
  // ───────────────────────────────────────────────────────────── 4.12
  {
    num: '4.12',
    kind: 'Proposition',
    name: 'The Möbius band is not orientable',
    statement: String.raw`The Möbius band $M$, parametrized by
$$\mathbf x(u,v)=\Big(\big(1+v\cos\tfrac u2\big)\cos u,\ \big(1+v\cos\tfrac u2\big)\sin u,\ v\sin\tfrac u2\Big),\quad 0\le u\le2\pi,\ |v|<\tfrac12,$$
is a regular surface that is not orientable: there is no continuous unit normal field on $M$. If $N(u)$ is the normal $\mathbf x_u\times\mathbf x_v/|\cdot|$ along the core circle $v=0$, then continued once around ($u$ from $0$ to $2\pi$) it arrives as $-N(0)$ at the same point.`,
    idea: String.raw`Along the core $\mathbf x(u,0)=(\cos u,\sin u,0)$ the normal obtained by continuity from the chart is $N(u)=\mathbf x_u\times\mathbf x_v/|\cdot|$, which is a smooth function of $u\in[0,2\pi]$ but satisfies $N(2\pi)=-N(0)$: the half-twist $\cos\frac u2,\sin\frac u2$ turns the frame over while the point returns. A continuous normal field on a connected surface is determined by its value at one point (4.11), so the only candidate field takes two different values at that point, a contradiction. With $k$ half-twists the same computation gives $N(2\pi)=(-1)^kN(0)$: only an odd number of twists obstructs orientation.`,
    caption: String.raw`The band with $k$ half-twists (k=1 is the Möbius band). The two halves $v>0$ (blue) and $v<0$ (orange) of the band are coloured; for odd $k$ the colours meet each other at the seam, because going around once swaps the two halves. Slide the gold normal around the core: the grey arrow is its starting value. At the end it points the opposite way (for odd $k$), while for even $k$ (an annulus with full twists) it returns to itself. The readout gives $N(2\pi)\cdot N(0)$, computed from the partial derivatives numerically.`,
    deps: ['dg-4.11', 'top-2.14'],
    refs: ['do Carmo §2-6'],
    tags: ['Möbius band', 'orientation'],
    credit: 'A. F. Möbius and J. B. Listing, independently, 1858',
    viz(v) {
      const kk = v.select('half-twists $k$', [0, 1, 2, 3].map((k) => ({ value: k, label: String(k) })), 1);
      const pos = v.slider('position $u/2\\pi$ of the normal on the core', 0, 1, 0.55, { step: 0.005 });
      const S3 = stage3(v, { range: 1.75, height: 440, title: 'band with $k$ half-twists', yaw: -0.5, pitch: 0.65, full: true });
      let info = null;
      v.render(() => {
        const k = kk.value;
        const F = (u, w) => { const r = 1 + w * Math.cos((k * u) / 2); return [r * Math.cos(u), r * Math.sin(u), w * Math.sin((k * u) / 2)]; };
        S3.surface(F, [0, TAU], [-0.5, 0.5], { nu: 96, nv: 10, alpha: 1, colorFn: (u, w) => (w > 1e-9 ? 'accent' : 'orange') });
        S3.path(Array.from({ length: 121 }, (_, i) => F((TAU * i) / 120, 0)), { color: 'ink', width: 1.4, alpha: 0.6, bias: -0.05 });
        const u = TAU * pos.value, P = F(u, 0), N = dF(F, u, 0).N, P0 = F(0, 0), N0 = dF(F, 0, 0).N, N1 = dF(F, TAU, 0).N;
        S3.arrow(P0, add(P0, mul(N0, 0.7)), { color: 'muted', width: 3, bias: -0.1 });
        S3.arrow(P, add(P, mul(N, 0.8)), { color: 'gold', width: 4.5, bias: -0.2 });
        S3.dot(P, { r: 5, color: 'gold', bias: -0.3 });
        info = { k, d: dot(N1, N0), a: (Math.acos(clamp(dot(N, N0), -1, 1)) * 180) / PI };
      });
      v.legend([['accent', 'half $v>0$'], ['orange', 'half $v<0$'], ['gold', 'carried normal'], ['muted', 'normal at $u=0$']]);
      v.readout(() => (info ? `$k=${info.k}$. Angle between the carried normal and $N(0)$: $${v.fix(info.a, 1)}^\\circ$. After the full circuit $N(2\\pi)\\cdot N(0)=${v.fix(info.d, 3)}$ — ${info.d < 0 ? '**the normal comes back reversed**: no continuous normal field exists, the band is not orientable.' : 'the normal comes back to itself: this band (even $k$) is orientable.'}` : ''));
    },
  },
  // ───────────────────────────────────────────────────────────── 4.13
  {
    num: '4.13',
    kind: 'Theorem',
    name: 'Regular level sets are orientable',
    statement: String.raw`Let $F\colon W\to\R$ be smooth on an open set $W\subset\R^3$ and let $c$ be a regular value. Then the regular surface $S=F^{-1}(c)$ is orientable: $N=\nabla F/|\nabla F|$ is a smooth unit normal field on $S$.`,
    idea: String.raw`At $p\in S$ the gradient is orthogonal to the tangent plane, because for any curve $\alpha$ in $S$ we have $F(\alpha(t))=c$ and so $\nabla F\cdot\alpha'=0$; hence $\nabla F(p)\perp T_pS$ (4.6). It is nonzero precisely because $c$ is a regular value, so dividing by $|\nabla F|$ gives a unit normal, which is smooth as a quotient of smooth functions. The field points to the side where $F>c$, which is a consistent choice of side along all of $S$ (with $c$ a regular value, $S$ is two-sided in $W$). This is one half of the proof that compact surfaces in $\R^3$ are orientable (4.14).`,
    caption: String.raw`The level set $\{g^2+z^2=c\}$ with $g=x^2(1-x^2)-y^2$ is the boundary of a tube around the figure-eight curve $g=0$. For $0<c<\tfrac1{16}$ it is a surface of genus $2$; the critical points of $F$ are the origin ($F=0$) and $(\pm1/\sqrt2,0,0)$ ($F=1/16$). The green arrows are $\nabla F/|\nabla F|$, which never vanishes or flips, so the surface has an outward field however many handles it has. Slide $c$ to the critical value $1/16$, where the two holes close up in a pinch and $N$ cannot be defined at the red points; beyond it the surface is a sphere. The right panel is the section $z=0$.`,
    deps: ['dg-4.11', 'dg-4.3'],
    refs: ['do Carmo §2-6', 'do Carmo Ch. 2'],
    tags: ['level set', 'gradient', 'orientation'],
    viz(v) {
      const g = (x, y) => x * x * (1 - x * x) - y * y;
      const F = (x, y, z) => g(x, y) ** 2 + z * z;
      const gr = (x, y, z) => { const gg = g(x, y); return [2 * gg * (2 * x - 4 * x ** 3), 2 * gg * (-2 * y), 2 * z]; };
      const c = v.slider('level $c$', 0.0125, 0.12, 0.03, { step: 0.0025 });
      v.button('$c=1/16$ (critical value)', () => c.set(0.0625));
      const S3 = stage3(v, { range: 1.65, height: 400, title: 'level set of $F=g^2+z^2$', yaw: -0.5, pitch: 0.75, weight: 1.4 });
      const S2 = chart(v, { x: [-1.5, 1.5], y: [-0.9, 0.9], xlabel: 'x', ylabel: 'y', equal: true, title: 'section $z=0$: $g^2=c$', weight: 0.9 });
      const cache = new Map();
      let info = null;
      v.render(() => {
        const cv = Math.round(c.value * 10000) / 10000, crit = Math.abs(cv - 0.0625) < 1e-4;
        if (!cache.has(cv)) { if (cache.size > 6) cache.clear(); cache.set(cv, implicitMesh(F, cv, [-1.5, -0.85, -0.5], [1.5, 0.85, 0.5], 80, 46, 26)); }
        const tris = cache.get(cv);
        drawMesh(S3, v, tris, { color: 'accent', alpha: 0.92 });
        const step = Math.max(1, Math.floor(tris.length / 70));
        let gmin = Infinity;
        for (let i = 0; i < tris.length; i++) {
          const t = tris[i], m = [0, 1, 2].map((k) => (t.p[0][k] + t.p[1][k] + t.p[2][k]) / 3), gg = len(gr(...m));
          gmin = Math.min(gmin, gg);
          if (i % step === 0) { const u = unit(gr(...m)); S3.arrow(m, add(m, mul(u, 0.2)), { color: 'green', width: 2, bias: -0.3 }); }
        }
        const P = [[1 / Math.SQRT2, 0, 0], [-1 / Math.SQRT2, 0, 0]];
        for (const p of P) S3.dot(p, { r: 5, color: 'red', bias: -0.5 });
        S2.contour((x, y) => g(x, y) ** 2, [cv], { color: 'accent', width: 3, res: 160 });
        S2.contour((x, y) => g(x, y) ** 2, [0.0625], { color: 'red', width: 1, dash: [5, 4], res: 160 });
        S2.contour((x, y) => g(x, y), [0], { color: 'ink', width: 1, alpha: 0.4, res: 160 });
        for (const p of P) S2.dot(p[0], p[1], { r: 5, color: 'red' });
        info = { cv, crit, gmin, n: tris.length };
      });
      v.legend([['accent', 'level set'], ['green', '$\\nabla F/|\\nabla F|$'], ['red', 'critical points ($F=1/16$)']]);
      v.readout(() => (info ? `$c=${v.fix(info.cv, 4)}$. Smallest $|\\nabla F|$ among ${info.n} sample points of the surface: $${v.fix(info.gmin, 3)}$. ${info.crit ? '**$c=1/16$ is a critical value**: $\\nabla F=0$ at the two red points, where the surface pinches and no normal is defined.' : info.cv < 0.0625 ? '$c<1/16$ is a regular value: genus-$2$ surface (two holes), and $N=\\nabla F/|\\nabla F|$ is defined and continuous everywhere on it.' : '$c>1/16$ is a regular value: the holes have closed, a sphere; $N$ is again a continuous field.'}` : ''));
    },
  },
  // ───────────────────────────────────────────────────────────── 4.14
  {
    num: '4.14',
    kind: 'Proposition',
    name: 'Compact surfaces in ℝ³ are orientable',
    statement: String.raw`Every nonempty compact connected regular surface without boundary $S\subset\R^3$ is orientable. In fact $\R^3\setminus S$ has exactly two connected components, a bounded one (the inside) and an unbounded one (the outside) (the separation consequence of Alexander duality), and the unit normal that points into the outside is a smooth field on $S$. Consequently the Klein bottle, and the projective plane, cannot be embedded as regular surfaces in $\R^3$: their usual pictures pass through themselves.`,
    idea: String.raw`Alexander duality for the embedded compact surface says that $S$ divides space into an inside and an outside. At each $p\in S$ exactly one of the two unit normals points into the outside, and which one varies smoothly with $p$, since a small normal segment through $p$ crosses the surface only at $p$ and stays on a fixed side. Equivalently, parity of crossings of a ray from a point with $S$ tells inside (odd) from outside (even). Immersed surfaces escape this: where two sheets cross there are four local regions, and the side labelled "outside" is no longer a single side of each sheet.`,
    caption: String.raw`Choose a compact surface. Drag the probe $q$ in the section $z=q_z$ (right) and slide $q_z$: the ray to the right meets the surface at the gold points and the readout counts them (computed by intersecting the ray with the triangle mesh). For a transverse ray and a probe off the mesh, an odd count means $q$ is inside. The finite triangle mesh approximates the smooth surface; tangencies and mesh-edge hits are numerically degenerate. At each hit the green arrow points to the side from which a ray meets the surface an even number of times, i.e. outward. On the sphere, torus and the genus-2 surface this is one consistent field. The Klein bottle (figure-eight immersion) crosses itself along the red circle, where two sheets with different tangent planes meet: it is not a regular surface there.`,
    deps: ['dg-4.13'],
    refs: ['Hatcher, Algebraic Topology, Corollaries3.28,3.45,3.46, pp.238,255–256; do Carmo §2-6'],
    tags: ['compact surface', 'Jordan–Brouwer', 'Klein bottle'],
    viz(v) {
      const g2 = (x, y, z) => (x * x * (1 - x * x) - y * y) ** 2 + z * z;
      const klein = (u, w) => { const r = 2 + Math.cos(u / 2) * Math.sin(w) - Math.sin(u / 2) * Math.sin(2 * w); return [0.5 * r * Math.cos(u), 0.5 * r * Math.sin(u), 0.5 * (Math.sin(u / 2) * Math.sin(w) + Math.cos(u / 2) * Math.sin(2 * w))]; };
      const SRF = {
        sphere: { name: 'sphere', mk: () => paramMesh(SURF.sphere.F, [-PI, PI], [-PI / 2, PI / 2], 40, 24), q: [0.2, 0.1, 0.1], emb: true, range: 1.7 },
        torus: { name: 'torus', mk: () => paramMesh(SURF.torus.F, [0, TAU], [0, TAU], 56, 28), q: [1.0, 0.3, 0.0], emb: true, range: 2 },
        genus2: { name: 'double torus', mk: () => implicitMesh(g2, 0.03, [-1.5, -0.85, -0.5], [1.5, 0.85, 0.5], 72, 40, 22), q: [0.7, 0.0, 0.0], emb: true, range: 1.75 },
        klein: { name: 'Klein bottle (figure-eight)', mk: () => paramMesh(klein, [0, TAU], [0, TAU], 72, 48), q: [0.0, 0.0, 0.0], emb: false, range: 1.8 },
      };
      const sel = v.select('surface', Object.entries(SRF).map(([k, s]) => ({ value: k, label: s.name })), 'torus', { onChange: () => reset() });
      const qz = v.slider('height $q_z$ of the probe', -1, 1, 0, { step: 0.01 });
      const S3 = stage3(v, { range: 2, height: 420, title: 'surface, probe and ray', yaw: -0.6, pitch: 0.5, weight: 1.2 });
      const S2 = chart(v, { x: [-2, 2], y: [-1.5, 1.5], xlabel: 'x', ylabel: 'y', equal: true, title: 'section $z=q_z$ and the ray', weight: 0.9 });
      const q = S2.handle(1, 0.3, { color: 'gold', label: 'q', constrain: { x: [-1.9, 1.9], y: [-1.4, 1.4] } });
      const cache = {};
      const mesh = (k) => (cache[k] ||= SRF[k].mk());
      function reset() { const s = SRF[sel.value]; q.set(s.q[0], s.q[1]); qz.set(s.q[2]); S3.o.range = s.range; }
      reset();
      let info = null;
      v.render(() => {
        const key = sel.value, s = SRF[key], tris = mesh(key);
        drawMesh(S3, v, tris, { color: 'accent', alpha: 0.42 });
        const Q = [q.x, q.y, qz.value], D = [1, 0, 0];
        const hits = rayHits(tris, Q, D);
        const par = (pt) => rayHits(tris, pt, unit([0.31, 0.52, 0.8])).length % 2;
        // section
        for (const sg of sliceZ(tris, qz.value)) S2.segment(sg[0], sg[1], { color: 'accent', width: 2.2 });
        S2.segment([q.x, q.y], [2, q.y], { color: 'gold', width: 1.6, dash: true });
        S3.arrow(Q, [2, Q[1], Q[2]], { color: 'gold', width: 1.6 });
        S3.dot(Q, { r: 6, color: 'gold', bias: -0.3 });
        for (const h of hits) {
          const P = add(Q, mul(D, h.s));
          S2.dot(P[0], P[1], { r: 4.5, color: 'gold' });
          S3.dot(P, { r: 4.5, color: 'orange', bias: -0.3 });
          const n = h.t.n, e = 0.06, a = par(add(P, mul(n, e))), b = par(sub(P, mul(n, e)));
          if (a !== b) { const out = a === 0 ? n : mul(n, -1); S3.arrow(P, add(P, mul(out, 0.45)), { color: 'green', width: 2.8, bias: -0.4 }); }
        }
        if (!s.emb) {
          S3.path(Array.from({ length: 97 }, (_, i) => [Math.cos((TAU * i) / 96), Math.sin((TAU * i) / 96), 0]), { color: 'red', width: 3, bias: -0.5 });
          S2.circle(0, 0, 1, { color: 'red', width: 2 });
        }
        let ang = null;
        if (!s.emb) { const a = dF(klein, 0.8, 0).N, b = dF(klein, 0.8, PI).N; ang = (Math.acos(clamp(Math.abs(dot(a, b)), 0, 1)) * 180) / PI; }
        info = { n: hits.length, ang, emb: s.emb, par: par(Q) };
      });
      v.legend([['gold', 'probe, ray, hits'], ['green', 'outward normal at a hit'], ['red', 'self-intersection']]);
      v.readout(() => {
        if (!info) return '';
        const t = `The ray from $q$ to the right meets the surface **${info.n}** time${info.n === 1 ? '' : 's'} (${info.n % 2 ? 'odd: $q$ is inside' : 'even: $q$ is outside'}).`;
        if (info.emb) return t + ' The surface is embedded and compact, so inside and outside are well defined and the outward normal is a continuous field.';
        return t + ` Along the red circle two sheets meet at an angle of $${v.fix(info.ang, 0)}^\\circ$ (between their normals, at $u=0.8$): the surface passes through itself, so it is not a regular surface and the outward-normal argument breaks down. The Klein bottle is not orientable.`;
      });
    },
  },
  ],
};
