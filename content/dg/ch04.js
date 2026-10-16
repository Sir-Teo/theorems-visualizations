// Differential Geometry of Curves & Surfaces — Chapter 4: Regular surfaces (4.1–4.6 here; 4.8–4.14 in ch04-b.js; 4.7 is an alias)
import {
  TAU, PI, clamp, add, sub, mul, dot, cross, len, unit, dF, stage3, chart, coordLines, squareImage, planeQuad, orthoBasis, SURF,
  implicitMesh, drawMesh,
} from './ch04.shared.js';

export default {
  collection: 'dg',
  chapter: 4,
  title: 'Regular surfaces',
  summary: String.raw`A regular surface is a subset of space covered by smooth patches with independent partial derivatives. Graphs and regular level sets are the main sources of examples, and the inverse function theorem makes changes of parameters smooth, so calculus on surfaces is well defined. Every point has a tangent plane, smooth maps have differentials, and orientability asks whether a unit normal can be chosen consistently.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Regular surface',
      statement: String.raw`A subset $S\subset\R^3$ is a **regular surface** if every point $p\in S$ has an open neighbourhood $V\subset\R^3$ and a map $\mathbf x\colon U\to V\cap S$ from an open set $U\subset\R^2$ onto $V\cap S$ (a **parametrization** or **patch**) such that
(a) $\mathbf x(u,v)=(x(u,v),y(u,v),z(u,v))$ is $C^\infty$;
(b) $\mathbf x$ is a homeomorphism onto $V\cap S$ (its inverse is continuous);
(c) for every $q\in U$ the differential $d\mathbf x_q\colon\R^2\to\R^3$ is injective, i.e. $\mathbf x_u\times\mathbf x_v\ne0$ at $q$.`,
      idea: String.raw`Condition (a) lets one differentiate, (c) makes the image look like a plane to first order (the two partial derivatives $\mathbf x_u,\mathbf x_v$ are independent), and (b) rules out surfaces that pass through themselves or accumulate on themselves. By the inverse function theorem (pma-9.24) conditions (a)–(c) force the surface to be, near each point, the graph of a smooth function over one of the coordinate planes, which is how most examples are verified. Regularity is a property of the *set*, not of one parametrization: the sphere is a regular surface although the latitude–longitude patch is singular at the poles, because other patches cover the poles.`,
      caption: String.raw`Choose a patch. The right panel is the parameter domain $U$, shaded by $|\mathbf x_u\times\mathbf x_v|$ (pale = small); the red curve marks where it is nearly $0$. Drag $p$: the blue and orange arrows are $\mathbf x_u,\mathbf x_v$ at the image point, the gold quadrilateral is the image of a small square (side $\varepsilon$). Push $p$ to the red set: the arrows become parallel (or one vanishes) and the patch is no longer regular. The latitude–longitude patch fails at the poles only as a *patch*; the cone and the cuspidal edge fail as *sets*.`,
      deps: ['pma-9.11', 'top-2.3'],
      refs: ['do Carmo §2-2', 'Pressley Ch. 4'],
      tags: ['regular surface', 'parametrization', 'patch'],
      credit: 'C. F. Gauss, Disquisitiones generales circa superficies curvas (presented 1827, printed 1828); the definition by charts is a later formalization',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parametric_surface' },
      viz(v) {
        const SP = {
          sphere: { name: 'sphere: latitude–longitude', F: SURF.sphere.F, U: [-PI, PI], V: [-PI / 2, PI / 2], p: [0.8, 0.4], jmax: 1,
            note: 'regular surface; this patch is singular at the poles only' },
          graph: { name: 'sphere: graph chart', F: (x, y) => { const r = 1 - x * x - y * y; return r > 1e-9 ? [x, y, Math.sqrt(r)] : [NaN, NaN, NaN]; }, U: [-1, 1], V: [-1, 1], p: [0.35, 0.3], jmax: 4,
            note: 'regular on the open unit disc (the upper hemisphere)' },
          cone: { name: 'cone', F: (u, w) => [w * Math.cos(u), w * Math.sin(u), w], U: [0, TAU], V: [-1, 1], p: [1.0, 0.55], jmax: 1.5,
            note: 'not a regular surface at the vertex: the patch is singular there and no other patch repairs it' },
          cusp: { name: 'cuspidal edge', F: (u, w) => [1.2 * u * u - 0.6, u * u * u, w], U: [-1.1, 1.1], V: [-1, 1], p: [0.5, 0.2], jmax: 4,
            note: 'a smooth map whose image has a sharp edge along $u=0$: not regular there' },
        };
        const sel = v.select('patch', Object.entries(SP).map(([k, s]) => ({ value: k, label: s.name })), 'sphere', { onChange: () => reset() });
        const eps = v.slider('size of the small square $\\varepsilon$', 0.03, 0.5, 0.2, { step: 0.01 });
        const S3 = stage3(v, { range: 1.7, title: 'the surface and the patch', yaw: -0.7, pitch: 0.4, weight: 1.3 });
        const C = chart(v, { x: [-PI, PI], y: [-PI / 2, PI / 2], title: 'parameter domain $U$', weight: 0.9 });
        const p = C.handle(0.8, 0.4, { color: 'gold', label: 'q', constrain: (x, y) => { const s = SP[sel.value]; return [clamp(x, s.U[0] + 0.02, s.U[1] - 0.02), clamp(y, s.V[0] + 0.02, s.V[1] - 0.02)]; } });
        function reset() { const s = SP[sel.value]; p.set(s.p[0], s.p[1]); C.setView(s.U, s.V); C.setLabels(sel.value === 'graph' ? 'x' : 'u', sel.value === 'graph' ? 'y' : 'v'); }
        reset();
        let info = null;
        v.render(() => {
          const s = SP[sel.value], F = s.F;
          if (sel.value === 'graph') { // keep the handle in the open disc
            const r = Math.hypot(p.x, p.y); if (r > 0.97) p.set((p.x * 0.97) / r, (p.y * 0.97) / r);
          }
          const J = (a, b) => { const d = dF(F, a, b); return Number.isFinite(d.J) ? d.J : NaN; };
          C.setView(s.U, s.V);
          C.heat(J, { range: [0, s.jmax], cmap: 'theme', res: 5, key: sel.value });
          C.contour(J, [0.06], { color: 'red', width: 2, res: 90 });
          const [u0, u1] = s.U, [v0, v1] = s.V;
          S3.surface(F, s.U, s.V, { nu: 36, nv: 28, alpha: 0.5, color: 'accent', wire: true });
          coordLines(S3, F, s.U, s.V, 12, 9, { color: 'ink', alpha: 0.25, width: 1 });
          const a = p.x, b = p.y, d = dF(F, a, b), P = F(a, b);
          const e = eps.value * Math.min(u1 - u0, v1 - v0) * 0.5;
          const quad = squareImage(F, a, b, e, e).filter((q) => q.every(Number.isFinite));
          if (quad.length > 3) S3.poly(quad, { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.5, bias: -0.05 });
          C.rect(a, b, a + e, b + e, { fill: 'gold', fillAlpha: 0.3, color: 'gold' });
          if (P.every(Number.isFinite)) {
            S3.arrow(P, add(P, mul(d.Fu, Math.min(0.6, 0.6 / (len(d.Fu) || 1)))), { color: 'blue', width: 3, bias: -0.1 });
            S3.arrow(P, add(P, mul(d.Fv, Math.min(0.6, 0.6 / (len(d.Fv) || 1)))), { color: 'orange', width: 3, bias: -0.1 });
            S3.dot(P, { r: 5, color: 'gold', bias: -0.12 });
          }
          info = { d, J: d.J, a: len(d.Fu), b: len(d.Fv), sin: d.J / ((len(d.Fu) * len(d.Fv)) || 1) };
        });
        v.legend([['blue', '$\\mathbf x_u$'], ['orange', '$\\mathbf x_v$'], ['gold', 'image of a small square'], ['red', '$|\\mathbf x_u\\times\\mathbf x_v|\\approx0$']]);
        v.readout(() => {
          if (!info) return '';
          const s = SP[sel.value], f = (x) => v.fix(x, 3), ok = info.J > 0.06;
          return `At $q$: $|\\mathbf x_u|=${f(info.a)}$, $|\\mathbf x_v|=${f(info.b)}$, $|\\mathbf x_u\\times\\mathbf x_v|=${f(info.J)}$, $\\sin\\angle(\\mathbf x_u,\\mathbf x_v)=${f(info.sin)}$ — ${ok ? 'the patch is **regular** at $q$ (condition (c) holds).' : '**condition (c) fails at $q$**: $d\\mathbf x_q$ is not injective.'}\nThe set: ${s.note}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Proposition',
      name: 'Graphs of smooth functions are regular surfaces',
      statement: String.raw`Let $f\colon U\to\R$ be a $C^\infty$ function on an open set $U\subset\R^2$. Then its graph $\{(x,y,f(x,y)):(x,y)\in U\}$ is a regular surface, covered by the single patch $\mathbf x(x,y)=(x,y,f(x,y))$, with $\mathbf x_x\times\mathbf x_y=(-f_x,-f_y,1)$ and unit normal $N=(-f_x,-f_y,1)/\sqrt{1+|\nabla f|^2}$.`,
      idea: String.raw`The map $\mathbf x$ is smooth because $f$ is. Its inverse is the restriction of the projection $(x,y,z)\mapsto(x,y)$, which is continuous, so $\mathbf x$ is a homeomorphism onto the graph. Finally $\mathbf x_x=(1,0,f_x)$ and $\mathbf x_y=(0,1,f_y)$ are independent because of their first two coordinates, whatever $f_x,f_y$ are; indeed $|\mathbf x_x\times\mathbf x_y|=\sqrt{1+|\nabla f|^2}\ge1$. If $f$ is only continuous, or has a crease, condition (a) fails.`,
      caption: String.raw`Pick a function or type your own $f(x,y)$. The right panel is the domain: the shading is a numerical *kink detector* (red where the gradient of $f$ jumps), so a smooth $f$ stays pale and $|x|$ lights up along $x=0$. Drag $p$: the green arrow is the unit normal $(-f_x,-f_y,1)/\sqrt{1+|\nabla f|^2}$, and its third component is never $0$, however steep the graph. The crease and the cone point of $\sqrt{x^2+y^2}$ are exactly where the graph stops being a smooth patch.`,
      deps: ['dg-4.1'],
      refs: ['do Carmo §2-2'],
      tags: ['graph', 'regular surface'],
      viz(v) {
        const PRE = [
          ['saddle', 'saddle', '(x^2 - y^2)/2'], ['wave', 'wave', 'sin(2x) cos(y)/1.2'], ['bump', 'bump', '1.4 exp(-(x^2+y^2)) - 0.3'],
          ['abs', 'crease $|x|$', '|x|'], ['cone', 'cone point', 'sqrt(x^2 + y^2)'],
        ];
        const sel = v.select('function', PRE.map(([k, l]) => ({ value: k, label: l })), 'saddle', { onChange: (k) => inp.set(PRE.find((r) => r[0] === k)[2]) });
        const inp = v.input('$f(x,y)=$', PRE[0][2], { vars: ['x', 'y'], width: 260 });
        const S3 = stage3(v, { range: 2.3, pitch: 0.5, yaw: -0.7, title: 'the graph $z=f(x,y)$', weight: 1.3 });
        const D = chart(v, { x: [-2, 2], y: [-2, 2], xlabel: 'x', ylabel: 'y', equal: true, title: 'domain: kink detector', weight: 0.9 });
        const p = D.handle(0.8, 0.6, { color: 'gold', label: 'p', constrain: { x: [-2, 2], y: [-2, 2] } });
        let info = null, key = '';
        v.render(() => {
          const f0 = inp.fn; if (!f0) return;
          const f = (x, y) => { const z = f0(x, y); return Number.isFinite(z) && Math.abs(z) < 3 ? z : NaN; };
          key = inp.value;
          const h = 0.02;
          const fx = (x, y, e = h) => (f(x + e, y) - f(x - e, y)) / (2 * e), fy = (x, y, e = h) => (f(x, y + e) - f(x, y - e)) / (2 * e);
          const kink = (x, y) => Math.max(
            Math.abs((f(x + h, y) - f(x, y)) / h - (f(x, y) - f(x - h, y)) / h),
            Math.abs((f(x, y + h) - f(x, y)) / h - (f(x, y) - f(x, y - h)) / h));
          // second differences / h = O(h f'') for smooth f, O(1) across a crease
          D.heat((x, y) => kink(x, y), { range: [0, 0.9], cmap: 'theme', color: 'red', res: 5, key });
          S3.surface((x, y) => [x, y, f(x, y)], [-2, 2], [-2, 2], { nu: 40, nv: 40, alpha: 0.85, color: 'accent', wire: true });
          const z = f(p.x, p.y), gx = fx(p.x, p.y), gy = fy(p.x, p.y), J = Math.sqrt(1 + gx * gx + gy * gy), P = [p.x, p.y, z];
          const N = [-gx / J, -gy / J, 1 / J];
          D.dot(p.x, p.y, { r: 6, color: 'gold' });
          if (Number.isFinite(z)) {
            const [e1, e2] = orthoBasis([1, 0, gx], [0, 1, gy]);
            S3.poly(planeQuad(P, e1, e2, 0.5), { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.2, bias: -0.05 });
            S3.arrow(P, add(P, mul(N, 0.9)), { color: 'green', width: 3, bias: -0.1 });
            S3.dot(P, { r: 5, color: 'gold', bias: -0.12 });
          }
          info = { z, gx, gy, J, N, k: kink(p.x, p.y) };
        });
        v.readout(() => {
          if (!info || !Number.isFinite(info.z)) return inp.error ? '' : 'The graph leaves the box here (or $f$ is undefined).';
          const f = (x) => v.fix(x, 3);
          return `At $p$: $f=${f(info.z)}$, $(f_x,f_y)=(${f(info.gx)},${f(info.gy)})$, $\\mathbf x_x\\times\\mathbf x_y=(${f(-info.gx)},${f(-info.gy)},1)$ with length $\\sqrt{1+|\\nabla f|^2}=${f(info.J)}\\ge1$; $N_z=${f(info.N[2])}>0$.${info.k > 0.35 ? '\n**$f$ is not differentiable at $p$**: the graph has a crease or a point here, so $\\mathbf x$ fails condition (a).' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Regular level sets are regular surfaces',
      statement: String.raw`Let $F\colon W\to\R$ be a $C^\infty$ function on an open set $W\subset\R^3$ and $c\in\R$ a **regular value**: $\nabla F(p)\ne0$ at every $p\in W$ with $F(p)=c$. Then $S=F^{-1}(c)$ is a regular surface (if non-empty), and $\nabla F/|\nabla F|$ is a unit normal field on it.`,
      idea: String.raw`Near $p\in S$ some partial derivative, say $F_z(p)\ne0$. The implicit function theorem (pma-9.28), itself a consequence of the inverse function theorem, solves $F(x,y,z)=c$ as $z=h(x,y)$ with $h$ smooth near $p$, so near $p$ the set $S$ is the graph of $h$, a regular surface by 4.2; covering $S$ by such pieces proves the claim. At a *critical* point the argument breaks and the level set can really be singular, as for the vertex of a cone, the set $\{xyz=0\}$ along the axes, or a single point.`,
      caption: String.raw`Choose $F$ and slide the level $c$. The surface is the level set $\{F=c\}$ (a mesh computed by marching tetrahedra in a box), the green arrows are $\nabla F/|\nabla F|$ at sample points, and the left readout reports the smallest $|\nabla F|$ found on the surface. The right panel shows a plane section. For $F=x^2+y^2-z^2$: hyperboloids of one sheet for $c>0$, two sheets for $c<0$, and at the critical value $c=0$ a cone whose vertex is exactly the critical point. Press the button to jump to $c=0$.`,
      deps: ['dg-4.1', 'pma-9.28'],
      refs: ['do Carmo §2-2'],
      tags: ['level set', 'implicit function theorem', 'critical value'],
      viz(v) {
        const FUN = {
          hyp: { name: '$x^2+y^2-z^2$', F: (x, y, z) => x * x + y * y - z * z, g: (x, y, z) => [2 * x, 2 * y, -2 * z], sec: (a, b) => a * a - b * b, secLab: 'section $y=0$: $x^2-z^2=c$', c: 0.5 },
          sph: { name: '$x^2+y^2+z^2$', F: (x, y, z) => x * x + y * y + z * z, g: (x, y, z) => [2 * x, 2 * y, 2 * z], sec: (a, b) => a * a + b * b, secLab: 'section $y=0$: $x^2+z^2=c$', c: 1 },
          xyz: { name: '$xyz$', F: (x, y, z) => x * y * z, g: (x, y, z) => [y * z, x * z, x * y], sec: (a, b) => a * b * 0.8, secLab: 'section $z=0.8$: $0.8\\,xy=c$', c: 0.4 },
        };
        const sel = v.select('function', Object.entries(FUN).map(([k, f]) => ({ value: k, label: f.name })), 'hyp', { onChange: (k) => c.set(FUN[k].c) });
        const c = v.slider('level $c$', -1.5, 1.5, 0.5, { step: 0.05 });
        v.button('$c=0$ (critical value)', () => c.set(0));
        const S3 = stage3(v, { range: 2.2, title: 'level set $\\{F=c\\}$', pitch: 0.4, yaw: -0.65, weight: 1.3 });
        const S2 = chart(v, { x: [-2, 2], y: [-2, 2], xlabel: 'x', ylabel: 'z', equal: true, title: 'a plane section', weight: 0.8 });
        const cache = {};
        let info = null;
        v.render(() => {
          const fn = FUN[sel.value], cv = Math.round(c.value * 100) / 100, key = sel.value + cv;
          if (!cache[key]) { if (Object.keys(cache).length > 12) for (const k in cache) delete cache[k]; cache[key] = implicitMesh(fn.F, cv, [-1.9, -1.9, -1.9], [1.9, 1.9, 1.9], 34); }
          const tris = cache[key];
          drawMesh(S3, v, tris, { color: 'accent', alpha: 0.9 });
          let gmin = Infinity;
          const step = Math.max(1, Math.floor(tris.length / 26));
          for (let i = 0; i < tris.length; i += 1) {
            const t = tris[i], m = [0, 1, 2].map((k) => (t.p[0][k] + t.p[1][k] + t.p[2][k]) / 3), gg = len(fn.g(...m));
            if (gg < gmin) gmin = gg;
            if (i % step === 0) { const u = unit(fn.g(...m)); if (Number.isFinite(u[0])) S3.arrow(m, add(m, mul(u, 0.4)), { color: 'green', width: 2.2, bias: -0.3 }); }
          }
          S3.dot([0, 0, 0], { r: 4, color: 'red', bias: -0.5 });
          S2.contour((a, b) => fn.sec(a, b), [cv], { color: 'accent', width: 3, res: 140 });
          S2.contour((a, b) => fn.sec(a, b), [0], { color: 'red', width: 1.5, dash: true, res: 140 });
          info = { gmin, n: tris.length, cv };
        });
        v.legend([['accent', 'level set $F=c$'], ['green', '$\\nabla F/|\\nabla F|$'], ['red', 'critical level / critical point']]);
        v.readout(() => {
          if (!info) return '';
          const crit = Math.abs(info.cv) < 1e-9;
          return `$c=${v.fix(info.cv, 2)}$. ${info.n === 0 ? 'The level set is **empty** (a regular value vacuously).' : `Smallest $|\\nabla F|$ sampled on the surface: $${v.fix(info.gmin, 3)}$.`} The only critical value of this $F$ is $0$ (at the origin${sel.value === 'xyz' ? ' and along the three axes' : ''}). ${crit ? '**$c$ is a critical value**: the theorem does not apply and the level set is singular ' + (sel.value === 'hyp' ? '(a cone, singular at the vertex).' : sel.value === 'sph' ? '(a single point).' : '(three planes crossing along the axes).') : '$c$ is a regular value: the level set is a regular surface.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Change of parameters is smooth',
      statement: String.raw`Let $p$ be a point of a regular surface $S$ and let $\mathbf x\colon U\to S$, $\mathbf y\colon W\to S$ be two parametrizations with $p\in\mathbf x(U)\cap\mathbf y(W)=:V$. Then the **change of parameters** $h=\mathbf x^{-1}\circ\mathbf y\colon\mathbf y^{-1}(V)\to\mathbf x^{-1}(V)$ is a diffeomorphism: it is $C^\infty$ with $C^\infty$ inverse, and its Jacobian determinant never vanishes.`,
      idea: String.raw`Write $\mathbf x=(x,y,z)$ and suppose $\partial(x,y)/\partial(u,v)\ne0$ at $\mathbf x^{-1}(p)$ (some pair of coordinates must work, because $\mathbf x_u,\mathbf x_v$ are independent). Extend $\mathbf x$ to $\mathbf F(u,v,t)=(x(u,v),y(u,v),z(u,v)+t)$; its Jacobian is invertible, so by the inverse function theorem (pma-9.24) $\mathbf F^{-1}$ is smooth near $p$. Since $h=\pi\circ\mathbf F^{-1}\circ\mathbf y$ with $\pi$ the projection to $(u,v)$, $h$ is smooth; the same argument applies to $h^{-1}$, so the Jacobian of $h$ is invertible.`,
      caption: String.raw`Two latitude–longitude patches on the unit sphere: $\mathbf x(u,v)$ and the same chart turned by $90^\circ$ about the $x$-axis, $\mathbf y(s,t)=(\cos t\cos s,-\sin t,\cos t\sin s)$. Drag $q$ in the $(u,v)$ domain: the orange curves in the $(s,t)$ domain are the images of the grid lines of $\mathbf x$ under $h=\mathbf y^{-1}\circ\mathbf x$, and the gold square goes to a gold quadrilateral. The numerical Jacobian determinant of $h$ is compared with the exact value $\cos v/\cos t$; it never vanishes while both patches are regular (away from the poles $v=\pm\pi/2$ of $\mathbf x$ and $t=\pm\pi/2$ of $\mathbf y$).`,
      deps: ['dg-4.1', 'pma-9.24'],
      refs: ['do Carmo §2-3'],
      tags: ['change of parameters', 'inverse function theorem', 'diffeomorphism'],
      viz(v) {
        const X = (u, w) => [Math.cos(w) * Math.cos(u), Math.cos(w) * Math.sin(u), Math.sin(w)];
        const Y = (s, t) => [Math.cos(t) * Math.cos(s), -Math.sin(t), Math.cos(t) * Math.sin(s)];
        const h = (u, w) => { const q = X(u, w); return [Math.atan2(q[2], q[0]), Math.asin(clamp(-q[1], -1, 1))]; };
        const eps = v.slider('size of the small square', 0.05, 0.6, 0.25, { step: 0.01 });
        const S3 = stage3(v, { range: 1.35, title: 'two patches on the sphere', yaw: -0.8, pitch: 0.35, weight: 1.1 });
        const A = chart(v, { x: [-PI, PI], y: [-PI / 2, PI / 2], title: 'domain of $\\mathbf x$: $(u,v)$', weight: 0.9, xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']] });
        const B = chart(v, { x: [-PI, PI], y: [-PI / 2, PI / 2], xlabel: 's', ylabel: 't', title: 'domain of $\\mathbf y$: $(s,t)$', weight: 0.9, xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']] });
        const q = A.handle(0.7, 0.5, { color: 'gold', label: 'q', constrain: { x: [-PI + 0.02, PI - 0.02], y: [-1.5, 1.5] } });
        const unwrap = (s, ref) => s - TAU * Math.round((s - ref) / TAU);
        let info = null;
        v.render(() => {
          S3.surface(X, [-PI, PI], [-PI / 2, PI / 2], { nu: 36, nv: 24, alpha: 0.35, color: 'accent', wire: false });
          coordLines(S3, X, [-PI, PI], [-1.5, 1.5], 12, 8, { color: 'blue', alpha: 0.55, width: 1.2, bias: -0.05 });
          coordLines(S3, Y, [-PI, PI], [-1.5, 1.5], 12, 8, { color: 'orange', alpha: 0.55, width: 1.2, bias: -0.05 });
          // grid of x pulled into (s,t)
          const polyline = (g, t0, t1, n = 80) => {
            const out = []; let prev = null;
            for (let i = 0; i <= n; i++) {
              const pt = g(t0 + ((t1 - t0) * i) / n);
              if (prev && Math.abs(pt[0] - prev[0]) > 3) out.push(null);
              out.push(pt); prev = pt;
            }
            return out;
          };
          for (let i = -5; i <= 5; i++) {
            const u = (i * PI) / 6;
            A.path(polyline((w) => [u, w], -1.5, 1.5, 2), { color: 'blue', alpha: 0.5, width: 1 });
            B.path(polyline((w) => h(u, w), -1.5, 1.5), { color: 'blue', alpha: 0.5, width: 1 });
          }
          for (let j = -4; j <= 4; j++) {
            const w = (j * PI) / 10;
            A.path([[-PI, w], [PI, w]], { color: 'blue', alpha: 0.5, width: 1 });
            B.path(polyline((u) => h(u, w), -PI, PI, 160), { color: 'orange', alpha: 0.7, width: 1.2 });
          }
          const e = eps.value, a = q.x, b = q.y, hq = h(a, b);
          A.rect(a, b, a + e, b + e, { fill: 'gold', fillAlpha: 0.35, color: 'gold' });
          const quad = squareImage((uu, ww) => { const r = h(uu, ww); return [unwrap(r[0], hq[0]), r[1]]; }, a, b, e, e, 12);
          B.poly(quad, { fill: 'gold', fillAlpha: 0.35, color: 'gold' });
          B.dot(hq[0], hq[1], { r: 6, color: 'gold' });
          S3.poly(squareImage(X, a, b, e, e, 8), { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.5, bias: -0.1 });
          // numerical Jacobian of h at q
          const d = 1e-5, H = (uu, ww) => { const r = h(uu, ww); return [unwrap(r[0], hq[0]), r[1]]; };
          const hu = [(H(a + d, b)[0] - H(a - d, b)[0]) / (2 * d), (H(a + d, b)[1] - H(a - d, b)[1]) / (2 * d)], hv = [(H(a, b + d)[0] - H(a, b - d)[0]) / (2 * d), (H(a, b + d)[1] - H(a, b - d)[1]) / (2 * d)];
          info = { det: hu[0] * hv[1] - hu[1] * hv[0], exact: Math.cos(b) / Math.cos(hq[1]), s: hq[0], t: hq[1], a, b };
        });
        v.legend([['blue', 'grid of $\\mathbf x$'], ['orange', 'grid of $\\mathbf y$'], ['gold', 'a small square and its image']]);
        v.readout(() => {
          if (!info) return '';
          const f = (x) => v.fix(x, 4);
          return `$q=(u,v)=(${v.fix(info.a, 2)},${v.fix(info.b, 2)})\\ \\mapsto\\ (s,t)=h(q)=(${v.fix(info.s, 2)},${v.fix(info.t, 2)})$. Jacobian determinant of $h$: numerical $${f(info.det)}$, exact $\\cos v/\\cos t=${f(info.exact)}$ — ${Math.abs(info.det) > 0.05 ? 'nonzero, so $h$ is a local diffeomorphism.' : 'near $0$: $q$ is close to a pole of one of the patches.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Smooth functions and maps on surfaces',
      statement: String.raw`Let $S$ be a regular surface. A function $f\colon S\to\R$ is **smooth** (differentiable of class $C^\infty$) at $p\in S$ if for some parametrization $\mathbf x\colon U\to S$ with $p\in\mathbf x(U)$ the composition $f\circ\mathbf x\colon U\to\R$ is $C^\infty$ at $\mathbf x^{-1}(p)$; it is smooth on $S$ if it is smooth at every point. More generally a map $\varphi\colon S_1\to S_2$ is smooth if it is continuous and $\mathbf y^{-1}\circ\varphi\circ\mathbf x$ is smooth for parametrizations $\mathbf x$ of $S_1$ and $\mathbf y$ of $S_2$ around $p$ and $\varphi(p)$. By 4.4 the choice of parametrization does not matter.`,
      idea: String.raw`Smoothness is *defined* in coordinates, and 4.4 is what makes the definition consistent: if $f\circ\mathbf x$ is smooth and $\mathbf y$ is another patch, then $f\circ\mathbf y=(f\circ\mathbf x)\circ(\mathbf x^{-1}\circ\mathbf y)$ is a composition of smooth maps. Restrictions to $S$ of smooth functions on $\R^3$ (height, squared distance to a fixed point) are the standard examples. Functions that look harmless, such as $|z|$ (a crease along the equator) or the longitude angle (a jump along a half-meridian and undefined at the poles), are not smooth on the sphere, however smooth they look in one chart.`,
      caption: String.raw`A function on the unit sphere is painted on it and shown in the two latitude–longitude charts $\mathbf x(u,v)$ and $\mathbf y(s,t)$ (the second turned by $90^\circ$). Red marks, found numerically by second differences, where the function is not smooth in that chart. Height and $|p-a|^2$ are smooth in both charts; $|z|$ has a crease along the equator (a line in the first chart, a meridian in the second); the longitude jumps across a half-meridian, which the second chart shows in its middle. Drag $q$ to read the value in both charts.`,
      deps: ['dg-4.4'],
      refs: ['do Carmo §2-3'],
      tags: ['smooth function', 'chart', 'sphere'],
      viz(v) {
        const X = (u, w) => [Math.cos(w) * Math.cos(u), Math.cos(w) * Math.sin(u), Math.sin(w)];
        const Y = (s, t) => [Math.cos(t) * Math.cos(s), -Math.sin(t), Math.cos(t) * Math.sin(s)];
        const FUN = {
          height: { name: 'height $z$', f: (p) => p[2], lo: -1, hi: 1 },
          dist: { name: '$|p-a|^2$', f: (p) => (p[0] - 1) ** 2 + p[1] ** 2 + p[2] ** 2, lo: 0, hi: 4 },
          trig: { name: '$\\sin 3x\\cdot y$', f: (p) => Math.sin(3 * p[0]) * p[1], lo: -1, hi: 1 },
          abs: { name: '$|z|$', f: (p) => Math.abs(p[2]), lo: 0, hi: 1 },
          lon: { name: 'longitude', f: (p) => Math.atan2(p[1], p[0]), lo: -PI, hi: PI },
        };
        const sel = v.select('function', Object.entries(FUN).map(([k, f]) => ({ value: k, label: f.name })), 'abs');
        const S3 = stage3(v, { range: 1.35, title: '$f$ on the sphere', yaw: -0.8, pitch: 0.4, weight: 1.1 });
        const tk = [[-PI, '−π'], [0, '0'], [PI, 'π']], tk2 = [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']];
        const A = chart(v, { x: [-PI, PI], y: [-PI / 2, PI / 2], title: '$f\\circ\\mathbf x$ in the chart $(u,v)$', weight: 0.9, xticks: tk, yticks: tk2 });
        const B = chart(v, { x: [-PI, PI], y: [-PI / 2, PI / 2], xlabel: 's', ylabel: 't', title: '$f\\circ\\mathbf y$ in the chart $(s,t)$', weight: 0.9, xticks: tk, yticks: tk2 });
        const q = A.handle(0.5, 0.45, { color: 'gold', label: 'q', constrain: { x: [-PI + 0.02, PI - 0.02], y: [-1.5, 1.5] } });
        const hmap = (u, w) => { const p = X(u, w); return [Math.atan2(p[2], p[0]), Math.asin(clamp(-p[1], -1, 1))]; };
        const kink = (f, G) => (a, b) => {
          const e = 0.02, c = f(G(a, b));
          const s1 = Math.abs(f(G(a + e, b)) + f(G(a - e, b)) - 2 * c) / e, s2 = Math.abs(f(G(a, b + e)) + f(G(a, b - e)) - 2 * c) / e;
          return Math.max(s1, s2);
        };
        const THR = 0.5;
        const scan = {};
        function scanFor(k) {
          if (scan[k]) return scan[k];
          const f = FUN[k].f, kx = kink(f, X), ky = kink(f, Y);
          const cnt = (kf, G) => { let n = 0, tot = 0; for (let i = 0; i < 70; i++) for (let j = 0; j < 36; j++) { const a = -PI + ((i + 0.5) * TAU) / 70, b = -1.5 + ((j + 0.5) * 3) / 36; tot++; if (kf(a, b) > THR) n++; } return n / tot; };
          return (scan[k] = { x: cnt(kx, X), y: cnt(ky, Y) });
        }
        let info = null;
        v.render(() => {
          const fn = FUN[sel.value], f = fn.f, col = (val) => v.ramp((val - fn.lo) / (fn.hi - fn.lo), 'accent');
          const red = v.rgb('red');
          S3.surface(X, [-PI, PI], [-PI / 2, PI / 2], { nu: 72, nv: 36, alpha: 1, colorFn: (u, w, p) => col(f(p)), shade: true });
          for (const [Cst, G, nm] of [[A, X, 'x'], [B, Y, 'y']]) {
            const kf = kink(f, G);
            Cst.raster((a, b) => { if (Math.abs(b) > PI / 2) return null; const kv = kf(a, b); if (kv > THR) return [red[0], red[1], red[2], 0.9]; return col(f(G(a, b))); }, { res: 5, key: sel.value + nm });
          }
          const a = q.x, b = q.y, hq = hmap(a, b);
          A.dot(a, b, { r: 6, color: 'gold' }); B.dot(hq[0], hq[1], { r: 6, color: 'gold' });
          S3.dot(X(a, b), { r: 6, color: 'gold', bias: -0.2 });
          info = { val: f(X(a, b)), kx: kink(f, X)(a, b), ky: kink(f, Y)(hq[0], hq[1]), sc: scanFor(sel.value) };
        });
        v.readout(() => {
          if (!info) return '';
          const pc = (x) => v.fix(100 * x, 1) + '\\%', sm = (r) => (r < 0.002 ? 'smooth everywhere in this chart' : `**not smooth** on about ${pc(r)} of this chart (red)`);
          return `$f(q)=${v.fix(info.val, 3)}$. In the chart $\\mathbf x$: ${sm(info.sc.x)}; in the chart $\\mathbf y$: ${sm(info.sc.y)}. ${info.sc.x < 0.002 && info.sc.y < 0.002 ? '$f\\circ\\mathbf x$ and $f\\circ\\mathbf y$ are both smooth, as 4.4 guarantees for a smooth $f$.' : 'A red set in *either* chart means $f$ is not a smooth function on $S$.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Tangent plane',
      statement: String.raw`Let $p$ be a point of a regular surface $S$. A **tangent vector** at $p$ is the velocity $\alpha'(0)$ of a smooth curve $\alpha\colon(-\epsilon,\epsilon)\to S$ with $\alpha(0)=p$. The set of all of them is the **tangent plane** $T_pS$. If $\mathbf x\colon U\to S$ is a parametrization with $\mathbf x(q)=p$, then $T_pS=d\mathbf x_q(\R^2)=\operatorname{span}\{\mathbf x_u(q),\mathbf x_v(q)\}$: a $2$-dimensional vector subspace of $\R^3$ that does not depend on the parametrization.`,
      idea: String.raw`A curve in $S$ near $p$ is $\alpha(t)=\mathbf x(u(t),v(t))$ with $(u,v)$ smooth (by 4.4), so by the chain rule $\alpha'(0)=u'\mathbf x_u+v'\mathbf x_v$, which lies in the span; conversely any $(a,b)$ is $(u',v')$ for the straight line $q+t(a,b)$. Because $\mathbf x_u,\mathbf x_v$ are independent the span is a plane. Another parametrization $\mathbf y$ gives $d\mathbf y=d\mathbf x\circ dh^{-1}$ with $dh$ invertible, hence the same plane.`,
      caption: String.raw`Drag $q$ in the parameter domain to move $p$ on the surface. The gold curves are images of straight lines in the domain through $q$ in $n$ different directions, with their velocity vectors at $p$ (finite differences of the actual curves). All velocity vectors lie in the orange plane spanned by $\mathbf x_u,\mathbf x_v$; the readout gives their distance from the plane and the normal. Switch on the second chart (a different parametrization of the same patch, $(u,v)=q+A(s,t)+$ quadratic terms): its purple partial derivatives differ, but span the same plane.`,
      deps: ['dg-4.1'],
      refs: ['do Carmo §2-4'],
      tags: ['tangent plane', 'tangent vector'],
      viz(v) {
        const sel = v.select('surface', Object.entries(SURF).map(([k, s]) => ({ value: k, label: s.name })), 'hill', { onChange: () => reset() });
        const nCurves = v.slider('number of curves $n$', 1, 10, 6, { int: true });
        const twist = v.slider('direction of the first curve (degrees)', 0, 180, 30, { step: 1 });
        const second = v.toggle('second chart (purple)', false);
        const S3 = stage3(v, { range: 2, title: 'tangent plane at $p$', yaw: -0.75, pitch: 0.45, weight: 1.3 });
        const C = chart(v, { x: SURF.hill.U, y: SURF.hill.V, title: 'parameter domain', weight: 0.8 });
        const q = C.handle(0.4, -0.3, { color: 'gold', label: 'q', constrain: (x, y) => { const s = SURF[sel.value]; return [clamp(x, s.U[0] + 0.05, s.U[1] - 0.05), clamp(y, s.V[0] + 0.05, s.V[1] - 0.05)]; } });
        function reset() { const s = SURF[sel.value]; C.setView(s.U, s.V); q.set(s.p0[0], s.p0[1]); }
        reset();
        const A = [[1.2, 0.7], [-0.4, 0.9]];
        let info = null;
        v.render(() => {
          const s = SURF[sel.value], F = s.F;
          C.setView(s.U, s.V);
          S3.surface(F, s.U, s.V, { nu: 44, nv: 36, alpha: 0.6, color: 'accent', wire: true });
          const a = q.x, b = q.y, P = F(a, b), d = dF(F, a, b);
          const [e1, e2] = orthoBasis(d.Fu, d.Fv);
          S3.poly(planeQuad(P, e1, e2, 0.8), { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.2, bias: -0.05 });
          const nC = nCurves.value, r = 0.22 * Math.min(s.U[1] - s.U[0], s.V[1] - s.V[0]);
          let maxOff = 0;
          C.dot(a, b, { r: 6, color: 'gold' });
          for (let k = 0; k < nC; k++) {
            const th = ((twist.value + (k * 180) / nC) * PI) / 180, du = Math.cos(th), dv = Math.sin(th);
            const g = (t) => F(a + t * du, b + t * dv);
            S3.curve(g, -r, r, { color: 'gold', width: 2.2, n: 30, bias: -0.1 });
            C.segment([a - r * du, b - r * dv], [a + r * du, b + r * dv], { color: 'gold', width: 1.4, alpha: 0.7 });
            const h = 1e-4, vel = mul(sub(g(h), g(-h)), 1 / (2 * h));
            maxOff = Math.max(maxOff, Math.abs(dot(vel, d.N)) / len(vel));
            S3.arrow(P, add(P, mul(vel, 0.6 / len(vel))), { color: 'gold', width: 2.6, bias: -0.15 });
          }
          S3.arrow(P, add(P, mul(d.N, 0.8)), { color: 'green', width: 3, bias: -0.15 });
          let normDiff = null;
          if (second.value) {
            const G = (ss, tt) => F(a + A[0][0] * ss + A[0][1] * tt + 0.3 * tt * tt, b + A[1][0] * ss + A[1][1] * tt - 0.4 * ss * tt);
            const d2 = dF(G, 0, 0);
            S3.arrow(P, add(P, mul(d2.Fu, 0.6 / len(d2.Fu))), { color: 'purple', width: 3, bias: -0.2 });
            S3.arrow(P, add(P, mul(d2.Fv, 0.6 / len(d2.Fv))), { color: 'purple', width: 3, bias: -0.2 });
            normDiff = Math.acos(clamp(Math.abs(dot(d2.N, d.N)), 0, 1)) * 180 / PI;
          }
          S3.dot(P, { r: 5, color: 'gold', bias: -0.25 });
          info = { off: maxOff, N: d.N, normDiff };
        });
        v.legend([['gold', 'velocities $\\alpha_k\'(0)$'], ['orange', '$T_pS$'], ['green', 'normal'], ['purple', 'second chart: $\\mathbf y_s,\\mathbf y_t$']]);
        v.readout(() => {
          if (!info) return '';
          const f = (x) => v.fix(x, 3);
          return `Largest normal component of the unit velocities: $${v.sci(info.off, 2)}$ (zero up to rounding), so all velocity vectors lie in $T_pS$. Unit normal $N=(${info.N.map(f).join(',\\ ')})$.${info.normDiff != null ? ` The second chart's plane makes an angle of $${v.fix(info.normDiff, 4)}^\\circ$ with the first: the same plane.` : ''}`;
        });
      },
    },
  ],
};
