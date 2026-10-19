// Fluid Dynamics — Chapter 4: Potential flow (items 4.1–4.6; later items in ch04-b.js and ch04-c.js)
import { G0, clamp, TAU, cadd, csub, cmul, cdiv, cconj, cabs, carg, compileComplex, elemVel, elemW1, streamlines, drawLines } from './ch04.shared.js';

export default {
  collection: 'fluid',
  chapter: 4,
  title: 'Potential flow',
  summary: String.raw`Irrotational incompressible flow has a velocity potential obeying Laplace’s equation, and in two dimensions the potential and stream function combine into an analytic complex potential. Superposing sources, vortices and doublets builds flows past bodies; integrating the pressure gives zero drag (d’Alembert’s paradox) but a lift proportional to circulation (Kutta–Joukowski). Conformal maps carry any known flow onto new geometries, and circulation is a free parameter precisely because the region round a body is not simply connected.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Velocity potential',
      statement: String.raw`A flow is **irrotational** in a region when $\boldsymbol\omega=\nabla\times\mathbf u=\mathbf 0$ there. If the region is simply connected, the line integral $\int_{\mathbf x_0}^{\mathbf x}\mathbf u\cdot d\mathbf l$ does not depend on the path, and the function
$$\phi(\mathbf x)=\int_{\mathbf x_0}^{\mathbf x}\mathbf u\cdot d\mathbf l$$
is a **velocity potential**: $\mathbf u=\nabla\phi$. It is fixed up to an additive constant (the choice of $\mathbf x_0$). Surfaces $\phi=\text{const}$ are equipotentials, and in two dimensions they cross the streamlines at right angles. If the region has a hole, $\phi$ can be multi-valued: it may change by a fixed amount, the circulation, each time one goes once round the hole.`,
      idea: String.raw`Irrotational means that $\mathbf u\cdot d\mathbf l$ is a closed form; by the Poincaré lemma (pma-10.39) it is exact on a simply connected region, i.e. it is $d\phi$ for some $\phi$. Equivalently, Stokes' theorem makes the circulation round every loop (1.11) equal to the flux of vorticity through it, hence zero, so two paths between the same endpoints differ by a loop integral that vanishes. A gradient field is perpendicular to the level sets of its potential, which is why equipotentials and streamlines are orthogonal.`,
      caption: String.raw`The flow is a saddle-point (strain) flow plus a source (the green dot), which is irrotational away from the source. Drag the start $A$, the end $B$ and the two waypoints $C$ and $D$. The orange route $A\to C\to B$, the purple route $A\to D\to B$ and the straight chord are each integrated numerically (right: running value of $\int\mathbf u\cdot d\mathbf l$ against the fraction of the route): all three end at the same number, $\phi(B)-\phi(A)$, and the equipotentials (grey) are crossed at right angles by the velocity arrows. Now switch on the point vortex and put $C$ and $D$ on opposite sides of it: the routes disagree by $\Gamma$ times the number of times the loop $A\,C\,B\,D$ winds round the vortex. The hole at the vortex makes the region not simply connected, and $\phi$ becomes many-valued.`,
      deps: ['fluid-3.2', 'pma-10.39'],
      refs: ['Kundu §7.2', 'Acheson ch. 1'],
      tags: ['potential', 'irrotational'],
      scope: String.raw`Needs $\nabla\times\mathbf u=\mathbf 0$ and a simply connected region for a single-valued $\phi$. Incompressibility is not needed for the definition (it is what makes $\phi$ harmonic, 4.2).`,
      viz(v) {
        const M0 = 1.4, SX = -1.7, SY = 0.8, VX = 0.9, VY = -0.3, GAM = 1.6;
        const tv = v.toggle('add a point vortex (circulation $\\Gamma=1.6$) at the marked point', false);
        const s = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, axes: false, height: 400, weight: 1.4, title: 'irrotational flow and three routes from $A$ to $B$' });
        const h = v.stage({ x: [0, 1], y: [-2, 2], axes: 'box', gutter: true, height: 400, weight: 0.8, xlabel: 'fraction of the route', ylabel: '$\\int \\mathbf u\\cdot d\\mathbf l$ so far', title: 'running value of the line integral' });
        const A = s.handle(-2.3, -1.2, { color: 'ink', label: 'A', labelPos: 'sw' }), B = s.handle(2.2, 1.3, { color: 'green', label: 'B', labelPos: 'ne' });
        const C = s.handle(-0.3, 1.7, { color: 'orange', label: 'C' }), D = s.handle(0.4, -1.5, { color: 'purple', label: 'D' });
        const vel = (x, y) => {
          let u = 0.36 * x, w = -0.36 * y;
          const dx = x - SX, dy = y - SY, r2 = dx * dx + dy * dy + 1e-12; u += (M0 / TAU) * dx / r2; w += (M0 / TAU) * dy / r2;
          if (tv.value) { const ex = x - VX, ey = y - VY, q = ex * ex + ey * ey + 1e-12; u += (GAM / TAU) * (-ey) / q; w += (GAM / TAU) * ex / q; }
          return [u, w];
        };
        const phi = (x, y) => {
          let p = 0.18 * (x * x - y * y) + (M0 / TAU) * Math.log(Math.hypot(x - SX, y - SY) + 1e-12);
          if (tv.value) { const ex = x - VX, ey = y - VY; if (ex < 0 && Math.abs(ey) < 0.05) return NaN; p += (GAM / TAU) * Math.atan2(ey, ex); }
          return p;
        };
        const route = (pts) => {
          let L = 0; const segs = [];
          for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(l); L += l; }
          const run = [[0, 0]]; let acc = 0, done = 0, ang = 0, prev = null;
          for (let i = 0; i + 1 < pts.length; i++) {
            const n = 120, [p, q] = [pts[i], pts[i + 1]];
            for (let k = 0; k < n; k++) {
              const t = (k + 0.5) / n, x = p[0] + t * (q[0] - p[0]), y = p[1] + t * (q[1] - p[1]), u = vel(x, y);
              acc += (u[0] * (q[0] - p[0]) + u[1] * (q[1] - p[1])) / n;
              const a = Math.atan2(y - VY, x - VX); if (prev !== null) { let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; ang += d; } prev = a;
              if (k % 4 === 3) run.push([(done + (k + 1) / n * segs[i]) / L, acc]);
            }
            done += segs[i];
          }
          return { total: acc, run, ang };
        };
        let info = {};
        v.render(() => {
          const lv = []; for (let k = -8; k <= 8; k++) lv.push(0.2 * k);
          s.contour(phi, lv, { color: 'faint', width: 1, res: 150 });
          s.field((x, y) => { const q = vel(x, y), n = Math.hypot(q[0], q[1]) || 1; return [q[0] / n, q[1] / n]; }, { spacing: 38, color: 'accent', alpha: 0.5 });
          s.dot(SX, SY, { r: 7, color: 'green', label: 'source', labelPos: 'ne' });
          if (tv.value) s.dot(VX, VY, { r: 7, color: 'red', label: '$\\Gamma$', tex: true, labelPos: 'ne' });
          const P0 = [A.x, A.y], P1 = [B.x, B.y], p1 = [P0, [C.x, C.y], P1], p2 = [P0, [D.x, D.y], P1], p3 = [P0, P1];
          s.path(p1, { color: 'orange', width: 2.6 }); s.path(p2, { color: 'purple', width: 2.6 }); s.path(p3, { color: 'green', width: 2, dash: true });
          const r1 = route(p1), r2 = route(p2), r3 = route(p3);
          h.path(r1.run, { color: 'orange', width: 2.4 }); h.path(r2.run, { color: 'purple', width: 2.4, dash: [6, 4] }); h.path(r3.run, { color: 'green', width: 1.8 });
          const all = [...r1.run, ...r2.run, ...r3.run].map((p) => p[1]), lo = Math.min(-0.2, ...all), hi = Math.max(0.2, ...all);
          h.setView([0, 1], [lo - 0.15 * (hi - lo), hi + 0.15 * (hi - lo)]);
          const n = (r1.ang - r2.ang) / TAU;
          const exact = tv.value ? null : 0.18 * (B.x ** 2 - B.y ** 2 - A.x ** 2 + A.y ** 2) + (M0 / TAU) * (Math.log(Math.hypot(B.x - SX, B.y - SY)) - Math.log(Math.hypot(A.x - SX, A.y - SY)));
          info = { a: r1.total, b: r2.total, c: r3.total, n: Math.round(n), exact };
        });
        v.legend([['orange', 'route $A\\,C\\,B$'], ['purple', 'route $A\\,D\\,B$'], ['green', 'straight chord', { dash: true }], ['faint', 'equipotentials']]);
        v.readout(() => `$\\int_{ACB}=${v.fix(info.a, 4)}$, $\\int_{ADB}=${v.fix(info.b, 4)}$, $\\int_{AB}=${v.fix(info.c, 4)}$${info.exact === null ? `\nthe routes differ by $${v.fix(info.a - info.b, 4)}$ = $\\Gamma\\times$ (winding number $${info.n}$) $=${v.fix(GAM * info.n, 4)}$ — no single-valued potential round the vortex` : `\n$\\phi(B)-\\phi(A)=${v.fix(info.exact, 4)}$ from the formula: every route gives it, so $\\phi$ is path-independent`}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Laplace’s equation for ideal flow',
      statement: String.raw`Let the flow of an incompressible fluid be irrotational in a simply connected region, $\mathbf u=\nabla\phi$. Then the potential is harmonic,
$$\nabla^2\phi=\nabla\cdot\mathbf u=0,$$
and the flow is determined by $\phi$ alone. At a fixed impermeable wall the boundary condition is $\partial\phi/\partial n=0$; where fluid enters or leaves, $\partial\phi/\partial n$ is the prescribed normal velocity. The Neumann problem has a solution (unique up to an additive constant, hence a unique velocity field) exactly when the net flux through the boundary is zero. The motion at each instant is therefore a purely kinematic boundary-value problem: pressure plays no part in finding the velocity.`,
      idea: String.raw`Incompressibility (1.6) says $\nabla\cdot\mathbf u=0$ and irrotationality gives $\mathbf u=\nabla\phi$ (4.1), so $\nabla\cdot\nabla\phi=0$. Harmonic functions obey a maximum principle and the divergence theorem gives uniqueness of the Neumann problem: if two solutions differ by $\psi$, then $\int|\nabla\psi|^2\,dV=\oint\psi\,\partial_n\psi\,dS=0$. Numerically, the five-point average over the neighbours of each grid point is the discrete form of the mean-value property, and repeated sweeps (relaxation) converge to the harmonic function.`,
      caption: String.raw`Fluid enters on the left at speed $U$ and leaves on the right through a channel with a bump in its floor. The potential starts as the straight-channel guess $\phi=Ux$ and is relaxed by successive over-relaxation: each sweep replaces $\phi$ in every cell by the average of its four neighbours (reflecting at walls, with the prescribed slope at inlet and outlet), pushed a little further. The streamlines (traced from the current $\nabla\phi$) bend over the bump as the residual of $\nabla^2\phi=0$ (right, log scale) falls by many orders of magnitude, and the flux through the throat settles to the inflow. Raise the bump or reset to watch it converge again.`,
      deps: ['fluid-4.1', 'fluid-1.6', 'rca-11.3', 'vcalc-9.5'],
      refs: ['Kundu §7.2', 'Acheson ch. 1'],
      tags: ['Laplace', 'potential', 'relaxation'],
      scope: String.raw`Incompressible, irrotational flow with prescribed normal velocity on the boundary. Staircase boundaries (cells) make the numerical wall slightly rough; the discrete solution is second-order accurate for smooth shapes.`,
      viz(v) {
        const NX = 120, NY = 30, DX = 1 / NY, W = 4;
        const bump = v.slider('bump height $h$', 0, 0.62, 0.38, { step: 0.01, onChange: () => S.reset() });
        const U = v.slider('inflow speed $U$', 0.2, 2, 1, { step: 0.05, onChange: () => S.reset() });
        v.button('Restart relaxation', () => S.reset());
        const s = v.stage({ x: [0, W], y: [-0.02, 1.04], equal: true, axes: false, height: 270, weight: 1.6, title: 'speed (shade) and streamlines of the relaxed potential' });
        const g = v.stage({ x: [0, 4000], y: [1e-8, 10], ylog: true, axes: 'box', gutter: true, height: 270, weight: 0.8, xlabel: 'sweeps', ylabel: 'residual', title: 'residual of $\\nabla^2\\phi=0$' });
        const floor = (x) => bump.value * Math.exp(-(((x - 2) / 0.5) ** 2));
        let solid = null;
        const mask = () => { solid = new Uint8Array(NX * NY); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) solid[j * NX + i] = (j + 0.5) * DX < floor((i + 0.5) * DX) ? 1 : 0; };
        const SWEEPS = 70, OMEGA = 1.95;
        const nb = (P, i, j, di, dj) => { // neighbour value with boundary rules
          const ii = i + di, jj = j + dj;
          if (ii < 0) return P[j * NX + i] - U.value * DX;
          if (ii >= NX) return P[j * NX + i] + U.value * DX;
          if (jj < 0 || jj >= NY || solid[jj * NX + ii]) return P[j * NX + i];
          return P[jj * NX + ii];
        };
        const lap = (P, i, j) => nb(P, i, j, 1, 0) + nb(P, i, j, -1, 0) + nb(P, i, j, 0, 1) + nb(P, i, j, 0, -1) - 4 * P[j * NX + i];
        const S = v.sim(() => {
          mask(); const P = new Float64Array(NX * NY); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) P[j * NX + i] = U.value * (i + 0.5) * DX;
          return { P, k: 0, hist: [], res: 1, U: new Float64Array(NX * NY), Wv: new Float64Array(NX * NY) };
        }, (st) => {
          if (st.k > 4000) return;
          let res = 0;
          for (let n = 0; n < SWEEPS; n++) {
            res = 0;
            for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
              if (solid[j * NX + i]) continue;
              const r = lap(st.P, i, j); st.P[j * NX + i] += (OMEGA * r) / 4; if (Math.abs(r) > res) res = Math.abs(r);
            }
            st.k++;
          }
          st.res = res / (U.value * DX); st.hist.push([st.k, Math.max(st.res, 1e-9)]);
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (!solid[j * NX + i]) { st.U[j * NX + i] = (nb(st.P, i, j, 1, 0) - nb(st.P, i, j, -1, 0)) / (2 * DX); st.Wv[j * NX + i] = (nb(st.P, i, j, 0, 1) - nb(st.P, i, j, 0, -1)) / (2 * DX); }
        }, { dt: 1 / 30 });
        const interp = (A, x, y) => {
          const fx = x / DX - 0.5, fy = y / DX - 0.5, i = Math.floor(fx), j = Math.floor(fy);
          if (i < 0 || j < 0 || i >= NX - 1 || j >= NY - 1) return null;
          let a = 0, w = 0;
          for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = (j + dj) * NX + i + di; if (solid[k]) continue; const wt = (di ? fx - i : 1 - (fx - i)) * (dj ? fy - j : 1 - (fy - j)); a += wt * A[k]; w += wt; }
          return w > 0.3 ? a / w : null;
        };
        let info = {}, lines = [], lastK = -1;
        v.animate((t) => {
          const st = S.advance(t);
          if (st.k !== lastK && (st.k - lastK > 200 || lastK < 0 || st.k >= 4000 || t > 13.5)) {
            lastK = st.k;
            lines = streamlines((x, y) => { if (y < floor(x) || y > 1 || x < 0.03 || x > W - 0.03) return null; const a = interp(st.U, x, y), b = interp(st.Wv, x, y); return a === null || b === null ? null : [a, b]; }, [0.02, W - 0.02, 0.0, 1.0], { sep: 0.075, step: 0.02 });
          }
          s.raster((x, y) => {
            if (y < floor(x) || y > 1 || x > W || x < 0) return null;
            const a = interp(st.U, x, y), b = interp(st.Wv, x, y); if (a === null || b === null) return null;
            return [...v.ramp(clamp((Math.hypot(a, b) / U.value - 0.5) / 2, 0, 1), 'orange', 'panel'), 1];
          }, { res: 3, key: Math.floor(st.k / 120) + '|' + bump.value + '|' + U.value });
          const fl = []; for (let i = 0; i <= NX; i++) fl.push([i * DX, floor(i * DX)]);
          s.poly([[0, -0.02], ...fl, [W, -0.02]], { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 2 }); s.line(0, 1, W, 1, { color: 'ink', width: 2 });
          drawLines(s, lines, { color: 'ink', width: 1.1, alpha: 0.75, arrows: false });
          s.arrow(0.0, 0.9, 0.35, 0.9, { color: 'green', width: 2.4 }); s.text('inflow $U$', 0.4, 0.9, { color: 'green', align: 'left', baseline: 'middle' });
          g.setView([0, Math.max(400, Math.ceil(st.k / 400) * 400)], [1e-8, 10]);
          g.path(st.hist, { color: 'accent', width: 2.2 });
          let flux = 0; const ic = Math.floor(NX / 2); for (let j = 0; j < NY; j++) if (!solid[j * NX + ic]) flux += st.U[j * NX + ic] * DX;
          let fin = 0; for (let j = 0; j < NY; j++) fin += U.value * DX;
          info = { k: st.k, res: st.res, flux, fin };
        }, { period: 14, still: 12 });
        v.readout(() => `${info.k} sweeps · residual $\\max|\\nabla^2\\phi|\\,\\Delta x/U=${info.res < 1e-3 ? v.sci(info.res, 2) : v.fix(info.res, 3)}$\nflux through the throat of the bump $=${v.fix(info.flux, 4)}$ vs. inflow $UH=${v.fix(info.fin, 4)}$ — conservation of mass emerges from $\\nabla^2\\phi=0$ with $\\partial_n\\phi$ prescribed`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Unsteady Bernoulli equation',
      statement: String.raw`For irrotational flow of an inviscid fluid of constant density $\rho$ in a conservative gravitational field, with $\mathbf u=\nabla\phi$, Euler's equation integrates everywhere in the fluid (not just along a streamline) to
$$\frac{\partial\phi}{\partial t}+\frac{|\nabla\phi|^2}{2}+\frac{p}{\rho}+gz=F(t),$$
with $F(t)$ a function of time only, which can be absorbed into $\phi$. In steady flow this reduces to Bernoulli's theorem (2.9) with the same constant everywhere. For the unsteady flow of a column of fluid through a tube of cross-section $A(s)$, with volume flux $Q(t)$, the difference of $\partial\phi/\partial t$ between the tube endpoints is $\dot Q\int ds/A$.`,
      idea: String.raw`Write $(\mathbf u\cdot\nabla)\mathbf u=\nabla\tfrac12|\mathbf u|^2-\mathbf u\times\boldsymbol\omega$; irrotationality removes the last term, so Euler's equation (2.8) becomes $\nabla\big(\partial_t\phi+\tfrac12|\nabla\phi|^2+p/\rho+gz\big)=\mathbf 0$. A function with zero gradient is constant in space; the constant may still depend on time. Applied between two free surfaces at atmospheric pressure, the equation is an equation of motion for the whole column.`,
      credit: 'Unsteady potential-flow Bernoulli equation: Fitzpatrick, §4.13',
      caption: String.raw`A U-tube holds liquid of total length $L$ (including the bottom link). Displace one level and release: the unsteady Bernoulli equation between the two free surfaces, $I\dot Q+\tfrac12 Q^2(1/A_2^2-1/A_1^2)+g(h_2-h_1)=0$ with $I=\int ds/A$, is integrated numerically (RK4). With equal arms the nonlinear terms cancel and the motion is exactly harmonic at $\omega=\sqrt{2g/L}$, whatever the amplitude: the dashed orange prediction lies on the simulated level. Make the right arm wider or narrower than the left and the $Q^2$ term acts: the oscillation is no longer sinusoidal, and the small-amplitude frequency becomes $\omega^2=g(1/A_1+1/A_2)/I$.`,
      deps: ['fluid-4.1', 'fluid-2.9', 'mech-4.2'],
      refs: ['Fitzpatrick Fluid Mechanics, complete §4.13 Irrotational Flow, Eqs.(4.82)–(4.97); opposite velocity-potential sign convention'],
      tags: ['Bernoulli', 'unsteady', 'manometer'],
      scope: String.raw`Irrotational, inviscid flow with uniform density; a slowly varying tube (flow nearly uniform across each section). The bottom link has length0.5m and the left-arm area; the rest heights are $(L-0.5)/2$. The requested amplitude is limited to90% of the shorter arm’s available displacement, with the actual value shown below, so both liquid levels stay positive. Friction is omitted.`,
      viz(v) {
        const L = v.slider('liquid length $L$ (m)', 0.8, 3.2, 1.6, { step: 0.05, onChange: () => S.reset() });
        const amp = v.slider('initial displacement (m)', 0.05, 0.5, 0.3, { step: 0.01, onChange: () => S.reset() });
        const ratio = v.slider('area of right arm / left arm', 0.4, 2.5, 1, { step: 0.05, onChange: () => S.reset() });
        const s = v.stage({ x: [-2.6, 2.6], y: [-0.35, 1.9], equal: true, axes: false, height: 330, weight: 1, title: 'the U-tube' });
        const h = v.stage({ x: [0, 4], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'time $t$ (s)', ylabel: 'left level above rest (m)', title: 'level of the left arm' });
        const LB = 0.5;
        const S = v.sim(() => {
          const a = ratio.value, he = (L.value - LB) / 2, A = Math.min(amp.value, 0.9 * he * Math.min(1, a));
          return { h1: he + A, Q: 0, t: 0, hist: [[0, A]], he, A, cross: [], last: A };
        }, (st, dt) => {
          const a = ratio.value, F = (h1, Q) => { const h2 = ((1 + a) * st.he - h1) / a, I = h1 + LB + h2 / a; return [-Q, (-(G0 * (h2 - h1)) - 0.5 * Q * Q * (1 / (a * a) - 1)) / I]; };
          const k1 = F(st.h1, st.Q), k2 = F(st.h1 + dt / 2 * k1[0], st.Q + dt / 2 * k1[1]), k3 = F(st.h1 + dt / 2 * k2[0], st.Q + dt / 2 * k2[1]), k4 = F(st.h1 + dt * k3[0], st.Q + dt * k3[1]);
          st.h1 += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); st.Q += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); st.t += dt;
          const z = st.h1 - st.he; if (st.last * z < 0) st.cross.push(st.t - dt * Math.abs(z) / (Math.abs(z) + Math.abs(st.last))); st.last = z;
          if (Math.round(st.t / dt) % 4 === 0) st.hist.push([st.t, z]);
        }, { dt: 0.005 });
        let info = {};
        v.animate((t) => {
          const st = S.advance(t), a = ratio.value, he = st.he, h2 = ((1 + a) * he - st.h1) / a;
          const x1 = -1.1, x2 = 1.1, w1 = 0.5, w2 = 0.5 * a, top = Math.max(1.75, he + 2 * st.A + 0.15);
          s.setView([-2.6, 2.6], [-0.35, top + 0.15]);
          const draw = (x, w, hl) => {
            s.rect(x - w / 2, 0, x + w / 2, hl, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 });
            s.line(x - w / 2, 0, x - w / 2, top, { color: 'ink', width: 2.4 }); s.line(x + w / 2, 0, x + w / 2, top, { color: 'ink', width: 2.4 });
          };
          s.rect(x1 - w1 / 2, -0.2, x2 + w2 / 2, 0, { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1 });
          draw(x1, w1, st.h1); draw(x2, w2, h2);
          s.line(x1 - w1 / 2, -0.2, x2 + w2 / 2, -0.2, { color: 'ink', width: 2.4 });
          s.hline(he, { color: 'muted', dash: true, alpha: 0.7 });
          s.text('rest level', -2.5, he + 0.07, { color: 'muted', align: 'left' });
          s.arrow(x1 - 0.7, st.h1, x1 - 0.7, he, { color: 'gold', width: 2 });
          const w0 = Math.sqrt((2 * G0) / L.value);
          const wl = Math.sqrt((G0 * (1 + 1 / a)) / (he + LB + he / a));
          h.setView([0, 4], [-1.15 * st.A, 1.15 * st.A]);
          h.hline(0, { color: 'muted', alpha: 0.6 });
          h.fn((x) => st.A * Math.cos(wl * x), { color: 'orange', width: 2, dash: true });
          h.path(st.hist, { color: 'accent', width: 2.6 });
          const T = st.cross.length >= 2 ? 2 * (st.cross[1] - st.cross[0]) : null;
          info = { w0, wl, T, Tp: TAU / wl, a, A: st.A };
        }, { period: 4, still: 3.6 });
        v.legend([['accent', 'simulated level (unsteady Bernoulli)'], ['orange', '$x_0\\cos\\omega t$, $\\omega^2=g(1/A_1+1/A_2)/I$', { dash: true }]]);
        v.readout(() => `Actual initial displacement $${v.fix(info.A, 3)}$ m${info.A < amp.value ? ' (limited to keep both arms filled)' : ''}. ${info.a === 1 ? `equal arms: predicted period $2\\pi\\sqrt{L/2g}=${v.fix(TAU / info.w0, 3)}$ s` : `unequal arms: small-amplitude period $2\\pi/\\omega=${v.fix(info.Tp, 3)}$ s`}${info.T !== null ? `, measured $${v.fix(info.T, 3)}$ s` : ''}${info.a === 1 ? ' — independent of the amplitude: the $\\tfrac12u^2$ terms at the two surfaces cancel' : ' — the $Q^2$ term makes the motion anharmonic'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Complex potential',
      statement: String.raw`For a two-dimensional, incompressible, irrotational flow, with velocity potential $\phi$ (4.1) and stream function $\psi$ (1.7) defined by $u=\phi_x=\psi_y$, $v=\phi_y=-\psi_x$, the **complex potential**
$$w(z)=\phi(x,y)+i\psi(x,y),\qquad z=x+iy,$$
is an analytic function of $z$ in the flow region, because $\phi$ and $\psi$ satisfy the Cauchy–Riemann equations. Conversely every analytic function is the complex potential of a flow. The **complex velocity** is $\dfrac{dw}{dz}=u-iv$, so the speed is $|w'(z)|$ and the flow direction is $-\arg w'(z)$; stagnation points are zeros of $w'$. Equipotentials ($\operatorname{Re}w=$ const) and streamlines ($\operatorname{Im}w=$ const) form orthogonal families wherever $w'\neq0$.`,
      idea: String.raw`Incompressibility makes $u\,dy-v\,dx$ closed, hence $=d\psi$ locally, and irrotationality makes $u\,dx+v\,dy=d\phi$; comparing the two gives exactly the Cauchy–Riemann equations (rca-11.2) for $w=\phi+i\psi$. Conversely the real part of an analytic function is harmonic (rca-11.10), and the harmonic conjugate supplies $\psi$, which is why $\phi$ and $\psi$ both satisfy Laplace's equation (4.2). The derivative of an analytic function is independent of direction, and computing it along the $x$-axis gives $\phi_x+i\psi_x=u-iv$.`,
      caption: String.raw`Type any analytic function of $z$ (for example z + 1/z, z^2, sin(z), log(z) or sqrt(z)) or pick a preset: $\operatorname{Re}w$ is drawn in blue and $\operatorname{Im}w$ in orange, and the two families meet at right angles. Drag the probe: its arrow is the velocity $\overline{w'(z)}$ computed by a complex difference quotient, and the readout compares $u,v$ with finite differences of $\phi$ and $\psi$ (Cauchy–Riemann in action). Near zeros of $w'$ (stagnation points, red rings, found by a coarse scan) the two families form saddles. Contours are masked where a branch cut or pole makes the function jump.`,
      deps: ['fluid-4.2', 'fluid-1.7', 'rca-11.2', 'rca-11.10'],
      refs: ['Kundu §7.4', 'Acheson ch. 4'],
      tags: ['complex potential', 'analytic'],
      scope: String.raw`Plane, incompressible, irrotational flow. If the region is multiply connected, $w$ may be multi-valued (a vortex has $\phi\propto\theta$), but $w'$ is still single-valued.`,
      viz(v) {
        const PRE = { 'z': 'z', 'z²': 'z^2', '1/z': '1/z', 'z + 1/z': 'z + 1/z', 'ln z': 'log(z)', 'z^1.5': 'z^1.5', 'sin z': 'sin(z)' };
        let cf = compileComplex('z + 1/z').f, err = null;
        const inp = v.input('$w(z)=$', 'z + 1/z', { width: 220, onChange: (txt) => { const r = compileComplex(typeof txt === 'string' ? txt : inp.value); if (r.f) { cf = r.f; err = null; } else err = r.error; v.invalidate(); } });
        const pre = v.select('preset', Object.keys(PRE), 'z + 1/z', { onChange: (k) => { const k2 = typeof k === 'string' ? k : pre.value; inp.set(PRE[k2]); const r = compileComplex(PRE[k2]); if (r.f) { cf = r.f; err = null; } v.invalidate(); } });
        const s = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, axes: true, height: 420, weight: 1.5, title: 'equipotentials and streamlines of $w(z)$' });
        const P = s.handle(1.2, 0.9, { color: 'gold', label: 'probe', r: 8 });
        const W = (x, y) => cf([x, y]);
        const wprime = (x, y) => { const h = 1e-5, a = cf([x + h, y]), b = cf([x - h, y]); return [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; };
        const jumpy = (x, y, k) => { const a = W(x, y)[k], b = W(x + 0.03, y)[k], c = W(x, y + 0.03)[k]; return !isFinite(a) || Math.abs(a - b) > 0.9 || Math.abs(a - c) > 0.9; };
        const levels = (k) => {
          const vals = []; for (let j = 0; j <= 24; j++) for (let i = 0; i <= 32; i++) { const x = -3 + 6 * i / 32, y = -2.2 + 4.4 * j / 24, w = W(x, y)[k]; if (isFinite(w) && !jumpy(x, y, k)) vals.push(w); }
          if (vals.length < 10) return [];
          vals.sort((p, q) => p - q); const lo = vals[Math.floor(0.08 * vals.length)], hi = vals[Math.floor(0.92 * vals.length)]; if (hi - lo < 1e-9) return [lo];
          const n = 14, st = (hi - lo) / n, out = []; for (let i = 0; i <= n; i++) out.push(lo + i * st); return out;
        };
        let info = {};
        v.render(() => {
          for (const [k, col] of [[0, 'accent'], [1, 'orange']]) {
            s.contour((x, y) => (jumpy(x, y, k) ? NaN : W(x, y)[k]), levels(k), { color: col, width: 1.3, res: 150 });
          }
          const stag = [];
          for (let j = 0; j <= 44; j++) for (let i = 0; i <= 60; i++) { const x = -3 + 6 * i / 60, y = -2.2 + 4.4 * j / 44, q = wprime(x, y); if (isFinite(q[0]) && Math.hypot(q[0], q[1]) < 0.12) stag.push([x, y]); }
          const cl = []; for (const p of stag) { if (!cl.some((c) => Math.hypot(c[0] - p[0], c[1] - p[1]) < 0.3)) cl.push(p); }
          for (const p of cl) s.dot(p[0], p[1], { r: 5, color: 'red', hollow: true });
          const q = wprime(P.x, P.y), u = q[0], vv = -q[1], sp = Math.hypot(u, vv), sc = sp > 1.3 ? 1.3 / sp : 1;
          if (isFinite(sp)) s.arrow(P.x, P.y, P.x + u * sc, P.y + vv * sc, { color: 'gold', width: 3 });
          const e = 1e-4, phx = (W(P.x + e, P.y)[0] - W(P.x - e, P.y)[0]) / (2 * e), phy = (W(P.x, P.y + e)[0] - W(P.x, P.y - e)[0]) / (2 * e), psx = (W(P.x + e, P.y)[1] - W(P.x - e, P.y)[1]) / (2 * e), psy = (W(P.x, P.y + e)[1] - W(P.x, P.y - e)[1]) / (2 * e);
          info = { u, v: vv, phx, phy, psx, psy, w: W(P.x, P.y), n: cl.length };
        });
        v.legend([['accent', 'equipotentials $\\operatorname{Re}w$'], ['orange', 'streamlines $\\operatorname{Im}w$'], ['red', 'stagnation points $w\'=0$', { dot: true }]]);
        v.readout(() => err ? `cannot read the formula: ${err}` : `at the probe: $w=${v.fix(info.w[0], 3)}${info.w[1] < 0 ? '-' : '+'}${v.fix(Math.abs(info.w[1]), 3)}i$, $\\overline{w'}=(u,v)=(${v.fix(info.u, 3)},\\,${v.fix(info.v, 3)})$\nCauchy–Riemann: $\\phi_x=${v.fix(info.phx, 4)}$ vs $\\psi_y=${v.fix(info.psy, 4)}$ · $\\phi_y=${v.fix(info.phy, 4)}$ vs $-\\psi_x=${v.fix(-info.psx, 4)}$ · $${info.n}$ stagnation point(s) in view`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'Elementary flows: stream, source, vortex, doublet',
      statement: String.raw`Four building blocks of plane potential flow, each with a complex potential $w$:

- uniform stream of speed $U$ at angle $\alpha$: $w=Ue^{-i\alpha}z$;
- source of volume flux $m$ at $z_0$ (a sink if $m<0$): $w=\dfrac{m}{2\pi}\ln(z-z_0)$, with purely radial velocity $m/2\pi r$;
- point vortex of circulation $\Gamma$ (counter-clockwise) at $z_0$: $w=-\dfrac{i\Gamma}{2\pi}\ln(z-z_0)$, with azimuthal velocity $\Gamma/2\pi r$;
- doublet of strength $\mu$ at $z_0$ (a source and sink of equal and opposite strength brought together, $m\,\delta\to\mu\cdot2\pi$): $w=\dfrac{\mu e^{i\beta}}{z-z_0}$.

Because Laplace's equation is linear, the complex potentials add: any sum of these is again an irrotational, incompressible flow wherever it is regular, and its velocity is the vector sum of the individual velocities.`,
      idea: String.raw`Each potential is analytic away from its singularity (4.4), so it describes a legitimate flow there; the logarithms are multi-valued, which is why a vortex carries circulation and a source carries flux. A doublet is the limit of a source $m$ at $z_0-\varepsilon/2$ and a sink $-m$ at $z_0+\varepsilon/2$ with $m\varepsilon$ fixed, since $\ln\frac{z-z_0+\varepsilon/2}{z-z_0-\varepsilon/2}\to\varepsilon/(z-z_0)$. Linearity of the Laplace equation is the whole reason superposition works: it holds for the velocities, but not for pressure, which is quadratic in the velocity.`,
      caption: String.raw`Choose a tool and click to place an element, or click an element with the remove tool; the sliders set the strength of new elements and the stream. The streamlines are traced evenly from the summed velocity field. Drag the gold probe: its thin arrows are the contributions of the individual elements and the thick arrow is their vector sum (superposition of velocities). Try a source and a sink, a source against the stream, a vortex pair, or a doublet with the stream: each is a flow the later items put to use.`,
      deps: ['fluid-4.4'],
      refs: ['Kundu §7.3'],
      tags: ['source', 'vortex', 'doublet', 'superposition'],
      scope: String.raw`Plane, incompressible, irrotational flow, away from the singular points. The cores of the singularities are excluded from the drawing (radius 0.07).`,
      viz(v) {
        const tool = v.select('click to place', [{ value: 'src', label: 'source' }, { value: 'snk', label: 'sink' }, { value: 'vccw', label: 'vortex ↺' }, { value: 'vcw', label: 'vortex ↻' }, { value: 'dbl', label: 'doublet' }, { value: 'del', label: 'remove' }], 'src');
        const str = v.slider('strength of new elements', 0.5, 4, 2, { step: 0.1 });
        const U = v.slider('stream speed $U$', 0, 1.5, 0.6, { step: 0.05 });
        const ang = v.slider('stream angle (deg)', -45, 45, 0, { step: 1 });
        v.button('Clear elements', () => { E.length = 0; });
        const E = [{ t: 'src', x: -1.4, y: 0.4, k: 2.5 }, { t: 'vtx', x: 1.6, y: -0.6, k: 3 }];
        const s = v.stage({ x: [-5, 5], y: [-2.6, 2.6], equal: true, axes: false, height: 430, weight: 1.6, title: 'superposed elementary flows' });
        const P = s.handle(0.2, 1.3, { color: 'gold', label: 'probe', r: 8 });
        s.onClick((x, y) => {
          const t = tool.value;
          if (t === 'del') { let b = -1, bd = 0.45; E.forEach((e, i) => { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = i; } }); if (b >= 0) E.splice(b, 1); return; }
          if (E.length >= 12) return;
          E.push(t === 'src' ? { t: 'src', x, y, k: str.value } : t === 'snk' ? { t: 'src', x, y, k: -str.value } : t === 'vccw' ? { t: 'vtx', x, y, k: str.value } : t === 'vcw' ? { t: 'vtx', x, y, k: -str.value } : { t: 'dbl', x, y, k: str.value * 0.5, th: 0 });
        });
        const all = () => [{ t: 'uni', k: U.value, th: (ang.value * Math.PI) / 180 }, ...E];
        let info = {};
        v.render(() => {
          const A = all();
          const lines = streamlines((x, y) => elemVel(A, x, y, 0.07), [-5, 5, -2.6, 2.6], { sep: 0.26, step: 0.05 });
          drawLines(s, lines, { color: 'accent', width: 1.2, alpha: 0.85 });
          for (const e of E) {
            if (e.t === 'src') { const c = e.k > 0 ? 'green' : 'red'; s.dot(e.x, e.y, { r: 7, color: c }); s.text(e.k > 0 ? '+' : '−', e.x, e.y, { color: 'panel', size: 14, align: 'center', baseline: 'middle' }); }
            else if (e.t === 'vtx') { const c = e.k > 0 ? 'purple' : 'orange'; s.dot(e.x, e.y, { r: 9, color: c }); s.text(e.k > 0 ? '↺' : '↻', e.x, e.y, { color: 'panel', size: 15, align: 'center', baseline: 'middle' }); }
            else s.arrow(e.x + 0.25, e.y, e.x - 0.25, e.y, { color: 'teal', width: 3.5, head: 9 });
          }
          let sx = 0, sy = 0;
          for (const e of A) {
            const c = e.t === 'uni' ? [e.k * Math.cos(e.th), e.k * Math.sin(e.th)] : (() => { const q = elemW1(e, P.x, P.y); return [q[0], -q[1]]; })();
            if (Math.hypot(c[0], c[1]) > 40) continue;
            sx += c[0]; sy += c[1];
            const n = Math.hypot(c[0], c[1]), k = n > 1.4 ? 1.4 / n : 1;
            s.arrow(P.x, P.y, P.x + c[0] * k, P.y + c[1] * k, { color: e.t === 'uni' ? 'muted' : e.t === 'src' ? (e.k > 0 ? 'green' : 'red') : e.t === 'vtx' ? 'purple' : 'teal', width: 1.3, alpha: 0.7, head: 6 });
          }
          const n = Math.hypot(sx, sy), k = n > 1.4 ? 1.4 / n : 1;
          s.arrow(P.x, P.y, P.x + sx * k, P.y + sy * k, { color: 'gold', width: 3.4 });
          info = { sx, sy, m: E.filter((e) => e.t === 'src').reduce((a, e) => a + e.k, 0), g: E.filter((e) => e.t === 'vtx').reduce((a, e) => a + e.k, 0), n: E.length };
        });
        v.readout(() => `${info.n} element(s) · net source strength $\\sum m=${v.fix(info.m, 2)}$, total circulation $\\sum\\Gamma=${v.fix(info.g, 2)}$\nvelocity at the probe $(u,v)=(${v.fix(info.sx, 3)},\\,${v.fix(info.sy, 3)})$ = sum of the thin arrows`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'Rankine half-body',
      statement: String.raw`A source of strength $m$ at the origin in a uniform stream $U$ along $+x$ has $w=Uz+\dfrac{m}{2\pi}\ln z$, $\psi=Ur\sin\theta+\dfrac{m}{2\pi}\theta$. There is one stagnation point, at $x=-a$ with $a=\dfrac{m}{2\pi U}$. The streamline through it, $\psi=m/2$,
$$r=a\,\frac{\pi-\theta}{\sin\theta},\qquad 0<\theta<2\pi,$$
separates the source's fluid from the stream. It is the outline of a semi-infinite body that opens out to the asymptotic width $m/U$ (half-width $m/2U$). Outside it the flow is the potential flow past this half-body; the fluid from the source stays inside. The speed on the surface rises from zero at the nose to a maximum a little behind it and then decreases to $U$.`,
      idea: String.raw`On the line $\theta=\pi$ the stream-function contributions of the stream vanish, so $\psi=m/2$ there: the dividing streamline is the one carrying exactly the source's half-flux on each side. Setting $\psi=m/2$ and solving for $r$ gives the polar formula. Far downstream $\theta\to0$, so $y=r\sin\theta\to a\pi=m/2U$: the source's total flux $m$ must pass through the width $2y_\infty$ at speed $U$. Because no flow crosses a streamline, a solid body with this shape can replace the interior without changing the exterior flow.`,
      caption: String.raw`Drag the red stagnation point along the axis (or use the sliders): the source strength follows from $m=2\pi Ua$. The body outline is the dividing streamline $\psi=m/2$, drawn from the polar formula; the streamlines outside are traced from $\overline{w'(z)}$. The right panel is the pressure coefficient $C_p=1-|\mathbf u|^2/U^2$ along the upper surface: it is $1$ at the nose and dips below zero where the flow overspeeds. The half-width of the outline far downstream tends to $m/2U$. Switch on the interior to see the source's own fluid.`,
      deps: ['fluid-4.5'],
      refs: ['Kundu §7.3'],
      credit: 'W. J. M. Rankine, “On the mathematical theory of stream-lines, especially those with four foci and upwards”, Phil. Trans. R. Soc. 161, 1871',
      tags: ['Rankine', 'source', 'half-body'],
      scope: String.raw`Plane, ideal flow; the body is semi-infinite. Real flows past blunt noses separate at the shoulders if the pressure rises faster than the boundary layer can follow.`,
      viz(v) {
        const Us = v.slider('stream speed $U$', 0.4, 2, 1, { step: 0.05 });
        const ms = v.slider('source strength $m$', 1, 9, 5, { step: 0.1 });
        const inside = v.toggle('show the source’s fluid inside', false);
        const s = v.stage({ x: [-3.6, 6.4], y: [-3, 3], equal: true, axes: false, height: 400, weight: 1.5, title: 'source in a uniform stream' });
        const q = v.stage({ x: [-3.6, 6], y: [-1.6, 1.2], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'distance along the axis from the source $x$', ylabel: '$C_p$', title: 'pressure coefficient on the surface' });
        const H = s.handle(-0.8, 0, { color: 'red', r: 8, label: 'stagnation', labelPos: 'sw', constrain: (x) => [clamp(x, -3, -0.12), 0] });
        H.onDrag = () => { ms.set(clamp(2 * Math.PI * Us.value * -H.x, 1, 9)); };
        const a = () => ms.value / (TAU * Us.value);
        const edge = (th) => { const r = a() * (Math.PI - th) / Math.sin(th); return [r * Math.cos(th), r * Math.sin(th)]; };
        const outside = (x, y) => { const r = Math.hypot(x, y), th = ((Math.atan2(y, x) % TAU) + TAU) % TAU; if (th < 1e-6 || th > TAU - 1e-6) return Math.abs(y) > Math.PI * a(); return r > a() * Math.abs(Math.PI - th) / Math.abs(Math.sin(th)); };
        const vel = (x, y) => {
          if (!inside.value && !outside(x, y)) return null;
          const r2 = x * x + y * y; if (r2 < 0.01) return null;
          return [Us.value + (ms.value / TAU) * x / r2, (ms.value / TAU) * y / r2];
        };
        let info = {};
        v.render(() => {
          H.set(clamp(-a(), -3, -0.12), 0);
          const lines = streamlines(vel, [-3.6, 6.4, -3, 3], { sep: 0.27, step: 0.05, seeds: [[-3.4, 0.5]] });
          drawLines(s, lines, { color: 'accent', width: 1.2, alpha: 0.85 });
          const pts = []; for (let k = 1; k < 400; k++) { const th = (TAU * k) / 400; pts.push(edge(th)); }
          const body = pts.filter((p) => p[0] < 6.4 && Math.abs(p[1]) < 3);
          s.path(body, { color: 'ink', width: 3 });
          s.dot(0, 0, { r: 6, color: 'green', label: 'source', labelPos: 'ne' }); s.dot(-a(), 0, { r: 5, color: 'red' });
          s.measure(5.6, -Math.PI * a(), 5.6, Math.PI * a(), 'm/U');
          // pressure coefficient along the upper surface
          const up = []; for (let k = 1; k < 300; k++) { const th = (Math.PI * k) / 300, p = edge(th); if (p[0] > 6) continue; const w = [Us.value + (ms.value / TAU) * p[0] / (p[0] * p[0] + p[1] * p[1]), (ms.value / TAU) * p[1] / (p[0] * p[0] + p[1] * p[1])]; up.push([p[0], 1 - (w[0] * w[0] + w[1] * w[1]) / (Us.value * Us.value)]); }
          q.hline(0, { color: 'muted', alpha: 0.6 }); q.path(up, { color: 'accent', width: 2.6 });
          const psi = (y) => Us.value * y + (ms.value / TAU) * Math.atan2(y, 6) - ms.value / 2;
          let lo = 0, hi = 3; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (psi(mid) < 0) lo = mid; else hi = mid; }
          let cpmin = 1; for (const p of up) cpmin = Math.min(cpmin, p[1]);
          info = { a: a(), w: ms.value / Us.value, yfar: lo, cpmin };
        });
        v.legend([['accent', 'streamlines / $C_p$ on the surface'], ['ink', 'dividing streamline $\\psi=m/2$']]);
        v.readout(() => `$a=m/2\\pi U=${v.fix(info.a, 3)}$ (nose at $x=-a$) · half-width of the dividing streamline at $x=6$ (solved from $\\psi=m/2$): $${v.fix(info.yfar, 3)}$, tending to $m/2U=${v.fix(info.w / 2, 3)}$ · lowest $C_p=${v.fix(info.cpmin, 3)}$`);
      },
    },
  ],
};
