import {ellipseFourier,relaxFourier} from './electrostatic.audit.js';
// Electromagnetism — Chapter 3, part d: items 3.20–3.22 (reciprocity, Green's function, Thomson's theorem)
import { TAU, KV, EPS0, pot, fld, sgnCol, heatPot, levels, solveLin, drawLines, circ } from './ch03.shared.js';

export default {
  collection: 'em',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Green’s reciprocity theorem',
      statement: String.raw`Let $\rho_1$ produce the potential $V_1$ and $\rho_2$ the potential $V_2$, in the presence of the same fixed conductors (each either grounded or carrying the same fixed charge in both states, and including the charge induced on them). Then
$$\int\rho_1V_2\,d\tau=\int\rho_2V_1\,d\tau.$$
In words: the work done by distribution 1 in the potential of distribution 2 equals the work done by 2 in the potential of 1.`,
      idea: String.raw`Green's second identity (pma-10.51 on the divergence theorem) for the pair $V_1,V_2$ gives $\int(V_1\nabla^2V_2-V_2\nabla^2V_1)d\tau=\oint(V_1\nabla V_2-V_2\nabla V_1)\cdot d\mathbf a$. Using Poisson's equation (em-2.9) the left side is $\frac1{\varepsilon_0}\int(V_2\rho_1-V_1\rho_2)d\tau$ and on the conductors (equipotentials with equal data in both problems) the surface integral vanishes. Equivalent statement: the Green function of a fixed set of conductors is symmetric, $G(\mathbf r,\mathbf r')=G(\mathbf r',\mathbf r)$.`,
      caption: String.raw`A grounded conducting sphere sits in the plane (potential zero on it). Two distributions of point charges (handles 1a, 1b and 2a, 2b; positive red, negative blue) are dragged around; the left panel shows the potential of distribution 1 alone *with the sphere’s induced charge included* (via images), the right panel that of 2. The readout adds up $\sum q_iV_2(\mathbf r_i)$ and $\sum q_kV_1(\mathbf r_k)$ separately: they agree for every placement. Switch to **induced charge by reciprocity** to see the trick: the charge induced on the sphere by $q$ is found from the potential of the *raised* sphere at $q$'s position.`,
      scope: String.raw`Point charges in three dimensions in the presence of one grounded conducting sphere (exact solutions by images, em-3.12); the plane drawn is the plane through the centre and the charges (all in one plane). With an isolated or charged sphere the theorem still holds if the *total* charge on it is the same in both states.`,
      credit: 'G. Green, 1828',
      deps: ['em-2.9', 'pma-10.51'],
      refs: ['Griffiths §3.2'],
      tags: ['reciprocity', 'green'],
      viz(v) {
        const R = 1.2, BOX = [-5, 5, -3.6, 3.6];
        const sL = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1, minWidth: 250, title: 'distribution 1' });
        const sR = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1, minWidth: 250, title: 'distribution 2' });
        const mode = v.select('compare', [{ value: 'two', label: 'two distributions' }, { value: 'ind', label: 'induced charge by reciprocity' }], 'two');
        const con = (x, y) => { const r = Math.hypot(x, y), m = R + 0.25; return r < m ? [(x / r) * m, (y / r) * m] : [x, y]; };
        const hs = [[-3, 1.8], [-2, -1.6], [3.1, 1.4], [2.2, -1.9]].map((p, k) => (k < 2 ? sL : sL).handle(p[0], p[1], { color: k < 2 ? 'red' : 'blue', r: 8, constrain: con, label: k < 2 ? `1${'ab'[k]}` : `2${'ab'[k - 2]}`, labelPos: 'n' }));
        const qs = [v.slider('$q_{1a}$', -5, 5, 3, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{1b}$', -5, 5, -2, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{2a}$', -5, 5, 2, { step: 0.5, fmt: (x) => `${x} nC` }), v.slider('$q_{2b}$', -5, 5, 4, { step: 0.5, fmt: (x) => `${x} nC` })];
        const withIm = (S) => { const out = S.map((c) => ({ ...c })); for (const c of S) { const a = Math.hypot(c.x, c.y), f = (R * R) / (a * a); out.push({ x: c.x * f, y: c.y * f, q: (-c.q * R) / a }); } return out; };
        let info = {};
        v.render(() => {
          const ind = mode.value === 'ind';
          hs.forEach((h, k) => { h.visible = !(ind && k > 0); if (k < 2) h.color = sgnCol(qs[k].value); else h.color = sgnCol(qs[k].value); });
          const S1 = [0, 1].filter((k) => !(ind && k === 1)).map((k) => ({ x: hs[k].x, y: hs[k].y, q: qs[k].value })), S2 = ind ? [] : [2, 3].map((k) => ({ x: hs[k].x, y: hs[k].y, q: qs[k].value }));
          const I1 = withIm(S1), I2 = withIm(S2), V0 = 1000;
          const V1 = (x, y) => (Math.hypot(x, y) < R ? 0 : pot(I1, x, y)), V2 = ind ? (x, y) => { const r = Math.hypot(x, y); return r < R ? V0 : (V0 * R) / r; } : (x, y) => (Math.hypot(x, y) < R ? 0 : pot(I2, x, y));
          const key = hs.map((h) => h.x.toFixed(2) + h.y.toFixed(2)).join() + qs.map((q) => q.value).join() + ind;
          heatPot(sL, V1, 400, 'l' + key, { res: 3 }); heatPot(sR, V2, ind ? 600 : 400, 'r' + key, { res: 3 });
          sL.contour((x, y) => (Math.hypot(x, y) < R ? NaN : V1(x, y)), levels(200, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          sR.contour((x, y) => (Math.hypot(x, y) < R ? NaN : V2(x, y)), levels(ind ? 300 : 200, 8).filter((z) => z), { color: 'ink', alpha: 0.25, width: 1, res: 110 });
          for (const s of [sL, sR]) s.circle(0, 0, R, { color: 'ink', width: 2.4, fill: 'muted', fillAlpha: 0.3 });
          sL.text('0 V', 0, 0, { align: 'center', size: 12, color: 'muted' }); sR.text(ind ? `${V0} V` : '0 V', 0, 0, { align: 'center', size: 12, color: 'muted' });
          for (const c of S1) { sL.dot(c.x, c.y, { r: 9, color: sgnCol(c.q) }); sR.dot(c.x, c.y, { r: 9, hollow: true, color: 'red' }); }
          for (const c of S2) { sR.dot(c.x, c.y, { r: 9, color: sgnCol(c.q) }); sL.dot(c.x, c.y, { r: 9, hollow: true, color: 'blue' }); }
          if (!ind) {
            const a = S1.map((c) => [c.q, V2(c.x, c.y)]), b = S2.map((c) => [c.q, V1(c.x, c.y)]);
            info = { ind, a, b, A: a.reduce((t, p) => t + p[0] * p[1], 0), B: b.reduce((t, p) => t + p[0] * p[1], 0) };
          } else {
            const c = S1[0], a = Math.hypot(c.x, c.y);
            info = { ind, qi: (-c.q * R) / a, rec: (-c.q * V2(c.x, c.y)) / V0, V2: V2(c.x, c.y), q: c.q, a };
          }
        });
        v.readout(() => info.ind ? `Charge $q=${v.fix(info.q, 2)}$ nC at distance $a=${v.fix(info.a, 2)}$ cm. The raised sphere ($V_0=1000$ V, no charge anywhere else) has potential $V_2(q)=${v.fix(info.V2, 2)}$ V at $q$.\nReciprocity: $Q_{ind}=-q\\,V_2(q)/V_0=${v.fix(info.rec, 4)}$ nC. Image method: $-qR/a=${v.fix(info.qi, 4)}$ nC. Same number — with no need to know how the induced charge is distributed.` : `$\\sum q_{1}V_2=${v.fix(info.A, 3)}$ nC·V (distribution 1 in the potential of 2)\n$\\sum q_{2}V_1=${v.fix(info.B, 3)}$ nC·V (distribution 2 in the potential of 1). Difference: $${v.sci(Math.abs(info.A - info.B) + 1e-14, 1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.21
    {
      num: '3.21',
      kind: 'Method',
      name: 'Green’s function for the Dirichlet problem',
      statement: String.raw`In a region $\Omega$, the **Dirichlet Green function** $G(\mathbf r,\mathbf r')$ solves $\nabla^2G=-\delta(\mathbf r-\mathbf r')$ with $G=0$ on $\partial\Omega$. The solution of Laplace's equation with boundary values $f$ is
$$V(\mathbf r')=-\oint_{\partial\Omega}f(\mathbf r)\,\frac{\partial G}{\partial n}(\mathbf r,\mathbf r')\,da.$$
For the disc of radius $R$ in the plane, $G=\frac1{2\pi}\Bigl[\ln\frac{R\,|\mathbf r-\mathbf r'^*|}{|\mathbf r'|\,|\mathbf r-\mathbf r'|}\Bigr]$ with $\mathbf r'^*=R^2\mathbf r'/|\mathbf r'|^2$, and $-\partial_nG$ is the **Poisson kernel** $\dfrac{R^2-r'^2}{2\pi R\,|\mathbf r-\mathbf r'|^2}$.`,
      idea: String.raw`Green's second identity (em-2.9) with $V$ and $G$ in the region: the volume terms collapse to $V(\mathbf r')$ by the delta function, and the boundary terms are $\oint(G\,\partial_nV-V\,\partial_nG)$; the $G\,\partial_nV$ term vanishes because $G=0$ on the boundary, leaving the stated formula. For the disc, the image charge at the inverse point (em-3.12 in 2D) makes $G=0$ on the rim (the same Apollonius property); differentiating gives the Poisson kernel (rca-11.8), a positive weight that integrates to $1$ over the rim.`,
      caption: String.raw`Paint the boundary: drag the 12 handles on the rim in or out (outwards = positive, inwards = negative) to set the boundary potential $f(\varphi)$. The interior potential is assembled from Poisson-kernel weights and shown as a heat map, with equipotentials. The gold dot is a point $\mathbf r'$ inside: switch to **Green function** to see $G(\cdot,\mathbf r')$ vanish on the rim, and read $V(\mathbf r')$ two ways, as the Poisson integral and as $-\oint f\,\partial_nG$ computed from the actual normal derivative of $G$.`,
      scope: String.raw`Two-dimensional disc (log potential), 180-point trapezoid quadrature around the rim (spectrally accurate for smooth $f$); the interior point may not approach the rim too closely or the kernel becomes sharply peaked. The three-dimensional ball has the analogous formula with $|\mathbf r-\mathbf r'|^{-3}$.`,
      deps: ['em-2.9', 'em-3.5', 'rca-11.8', 'pde-5.13'],
      refs: ['Griffiths §3.2'],
      tags: ['green function', 'poisson kernel'],
      viz(v) {
        const R = 2.4, K = 12, Q = 180, W = 0.6, B = [-3.4, 3.4];
        const s = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, height: 360, axes: false, weight: 1.1, title: 'disc' });
        const sF = v.stage({ x: [0, 360], y: [-1.4, 1.4], height: 360, axes: 'box', gutter: true, weight: 1, minWidth: 250, xlabel: 'boundary angle $\\varphi$ (degrees)', ylabel: '$f$ and kernel', title: 'boundary data and Poisson kernel' });
        const mode = v.select('show', [{ value: 'u', label: 'solution $u$' }, { value: 'G', label: 'Green function $G(\\cdot,\\mathbf r\')$' }], 'u');
        const init = (k) => Math.sin((TAU * k) / K) + 0.5 * Math.cos((3 * TAU * k) / K);
        const hs = Array.from({ length: K }, (_, k) => { const th = (TAU * k) / K, r0 = R + W * 0.9 * init(k) * 0.7; return s.handle(r0 * Math.cos(th), r0 * Math.sin(th), { color: 'accent', r: 7, constrain: (x, y) => { const th2 = th, r = x * Math.cos(th2) + y * Math.sin(th2), c = Math.max(R - W, Math.min(R + W, r)); return [c * Math.cos(th2), c * Math.sin(th2)]; } }); });
        const src = s.handle(0.9, 0.6, { color: 'gold', r: 8, constrain: (x, y) => { const r = Math.hypot(x, y), m = R * 0.82; return r > m ? [(x / r) * m, (y / r) * m] : [x, y]; } });
        const hann = (t) => (Math.abs(t) < 1 ? 0.5 * (1 + Math.cos(Math.PI * t)) : 0);
        let info = {};
        v.render(() => {
          const vals = hs.map((h, k) => { const th = (TAU * k) / K; return (h.x * Math.cos(th) + h.y * Math.sin(th) - R) / W; });
          const f = (phi) => { let t = 0; for (let k = 0; k < K; k++) { let d = ((phi - (TAU * k) / K) % TAU + TAU) % TAU; if (d > Math.PI) d -= TAU; t += vals[k] * hann(d / (TAU / K)); } return t; };
          const fq = Array.from({ length: Q }, (_, j) => f((TAU * j) / Q));
          const u = (x, y) => { const r2 = x * x + y * y; if (r2 >= R * R) return NaN; let t = 0; const th = Math.atan2(y, x), r = Math.sqrt(r2); for (let j = 0; j < Q; j++) t += fq[j] * (R * R - r2) / (R * R - 2 * R * r * Math.cos(th - (TAU * j) / Q) + r2); return t / Q; };
          const sx = src.x, sy = src.y, sr = Math.hypot(sx, sy), sst = [(R * R * sx) / (sr * sr + 1e-12), (R * R * sy) / (sr * sr + 1e-12)];
          // G·2π = ln( R |x − s*| / (|s| |x − s|) )
          const G2 = (x, y) => { if (Math.hypot(x, y) >= R) return NaN; const d1 = Math.hypot(x - sx, y - sy) + 1e-9; return sr < 1e-6 ? Math.log(R / (Math.hypot(x, y) + 1e-9)) : Math.log((R * Math.hypot(x - sst[0], y - sst[1])) / (sr * d1)); };
          const key = vals.map((x) => x.toFixed(2)).join();
          if (mode.value === 'u') {
            s.heat((x, y) => (Math.hypot(x, y) < R ? Math.tanh(u(x, y) / 1.2) : NaN), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: 'u' + key, alpha: 0.9 });
            s.contour(u, levels(0.2, 6).filter((z) => z), { color: 'ink', alpha: 0.3, width: 1, res: 90 });
          } else {
            s.heat((x, y) => (Math.hypot(x, y) < R ? Math.tanh(G2(x, y) / 2) : NaN), { range: [0, 1], cmap: 'theme', color: 'green', res: 3, key: `G${sx.toFixed(2)}${sy.toFixed(2)}`, alpha: 0.9 });
            s.contour(G2, [0.1, 0.25, 0.5, 0.8, 1.2, 1.8, 2.6, 3.6], { color: 'ink', alpha: 0.35, width: 1, res: 110 });
          }
          s.path(circ(0, 0, R, 160), { color: 'faint', width: 1, dash: true });
          for (let j = 0; j < Q; j++) { const t0 = (TAU * j) / Q, t1 = (TAU * (j + 1)) / Q, val = fq[j]; s.path([[R * Math.cos(t0), R * Math.sin(t0)], [R * Math.cos(t1), R * Math.sin(t1)]], { color: val >= 0 ? 'red' : 'blue', width: 3 + 5 * Math.min(1, Math.abs(val)), alpha: 0.85 }); }
          hs.forEach((h, k) => { h.color = vals[k] >= 0 ? 'red' : 'blue'; });
          // kernel and checks
          const ker = (j) => (R * R - sr * sr) / (R * R - 2 * R * sr * Math.cos(Math.atan2(sy, sx) - (TAU * j) / Q) + sr * sr);
          let us = 0, ug = 0; const eps = 1e-3;
          for (let j = 0; j < Q; j++) {
            us += (fq[j] * ker(j)) / Q;
            const xr = (R - eps) * Math.cos((TAU * j) / Q), yr = (R - eps) * Math.sin((TAU * j) / Q);
            ug += (fq[j] * G2(xr, yr) * R) / (eps * Q); // −∂nG·R dφ with G = G2/2π and dφ = 2π/Q
          }
          const ker2 = Array.from({ length: Q }, (_, j) => ker(j));
          sF.path(fq.map((y, j) => [(360 * j) / Q, y]).concat([[360, fq[0]]]), { color: 'accent', width: 2.4 });
          sF.path(ker2.map((y, j) => [(360 * j) / Q, y / 4]).concat([[360, ker2[0] / 4]]), { color: 'green', width: 1.8 });
          sF.hline(0, { color: 'faint' });
          let avg = fq.reduce((a, b) => a + b, 0) / Q;
          info = { us, ug, uc: u(0, 0), avg, sr, ks: ker2.reduce((a, b) => a + b, 0) / Q };
          src.visible = true;
        });
        v.legend([['accent', 'boundary potential $f(\\varphi)$'], ['green', 'Poisson kernel (÷4) for $\\mathbf r\'$']]);
        v.readout(() => `At the gold point (at distance $${v.fix(info.sr, 2)}$ cm from the centre, $R=2.4$ cm): Poisson integral $V(\\mathbf r')=${v.fix(info.us, 4)}$; from $-\\oint f\\,\\partial_nG$ with $\\partial_nG$ taken numerically: $${v.fix(info.ug, 4)}$. The kernel integrates to $${v.fix(info.ks, 4)}$ (=1).\nAt the centre $V(0)=${v.fix(info.uc, 4)}$ equals the average of $f$, $${v.fix(info.avg, 4)}$ (mean-value property).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.22
    {
      num: '3.22',
      kind: 'Theorem',
      name: 'Thomson’s theorem',
      statement: String.raw`Among all ways of distributing a given total charge $Q$ over the surface of an isolated conductor (or a given charge on each of several conductors), the electrostatic field energy $W=\tfrac{\varepsilon_0}{2}\int E^2\,d\tau$ is smallest for the equilibrium distribution, the one for which the conductor is an equipotential.`,
      idea: String.raw`Write any trial distribution as the equilibrium one plus a change $\delta\sigma$ with zero total charge. The energy is a quadratic form in the charges, $W=\tfrac12\int\sigma V\,da$, so $W_{trial}=W_{eq}+\int\delta\sigma\,V_{eq}\,da+W[\delta\sigma]$. Because $V_{eq}$ is constant on the conductor and $\int\delta\sigma=0$, the linear term vanishes, and $W[\delta\sigma]=\tfrac{\varepsilon_0}{2}\int|\mathbf E_{\delta}|^2d\tau>0$ (the field energy of a nonzero charge distribution, em-2.11). So $W_{trial}>W_{eq}$ unless $\delta\sigma=0$, which is also the second uniqueness theorem (em-3.6). Equivalently, charges on a conductor slide until they can lower the energy no more.`,
      caption: String.raw`A conducting elliptic cylinder carries fixed total line charge. The smooth trial density is the equilibrium density multiplied by $1+\sum_{k=1}^4 a_k\cos k\theta$, with eccentric angle $\theta$ and $a_k=0.8$ times the slider values. Forty-eight bars sample these continuous densities, rather than representing point charges or finite strips. Signed densities are allowed. The plot uses density per physical arc length, relative to its perimeter average. Press slide the charge: each Fourier coefficient decays, lowering the exact energy difference and surface-potential spread.`,
      scope: String.raw`The theorem concerns finite-energy three-dimensional charge distributions, with each isolated conductor’s charge fixed. This illustration instead uses the two-dimensional logarithmic kernel of an infinite elliptic cylinder; its absolute energy diverges, so only the finite energy difference at fixed total line charge is reported, in units $\lambda^2/(2\pi\varepsilon_0)$. For $c=(a+b)/2$, $t=(a-b)/(a+b)$, the exact kernel factorization yields $\Delta W=\sum_{k=1}^4a_k^2(1+t^k)/(8k)$ and angular RMS potential spread $[\sum_k a_k^2(1+t^k)^2/(8k^2)]^{1/2}$ in units $\lambda/(2\pi\varepsilon_0)$. Perimeter normalization alone uses numerical quadrature.`,
      credit: 'Thomson minimum-energy theorem; modern proof by Fiolhais, Essén and Gouveia (2016)',
      verify: false,
      links: { 'Modern original proof': 'https://doi.org/10.1016/j.physleta.2016.06.039' },
      deps: ['em-3.6', 'em-2.11'],
      refs: ['Fiolhais, Essén and Gouveia, A variational proof of Thomson’s theorem, Physics Letters A380 (2016),2703–2705, §2 Eqs.1–12, DOI10.1016/j.physleta.2016.06.039', 'Fitzpatrick, Classical Electromagnetism, §2.6 field-energy identity; ellipse log-kernel factorization supplied here'],
      tags: ['energy', 'variational'],
      viz(v) {
        const s=v.stage({x:[-5,5],y:[-5,5],equal:true,height:340,axes:false,weight:1.2,title:'continuous charge density on an ellipse'});
        const p=v.stage({x:[0,1],y:[-1,3],height:340,axes:'box',gutter:true,weight:.85,minWidth:240,xlabel:'eccentric angle θ / 2π',ylabel:'arc-length density / perimeter average',title:'physical surface density'});
        let coeffs=[.7,-.5,0,0],steps=0,running=false,raf=0;
        const bs=v.slider('ellipse $b/a$',.2,1,.45,{step:.01,onChange:()=>reset()});
        const cs=[1,2,3,4].map((k)=>v.slider(`initial smear $\\cos${k}\\theta$`,-1,1,coeffs[k-1],{step:.05,onChange:()=>reset()}));
        function reset(){running=false;coeffs=cs.map(c=>c.value);steps=0;}
        const relax=n=>{coeffs=relaxFourier(coeffs,bs.value,n);steps+=n;};
        const tick=()=>{if(!running)return;relax(4);v.invalidate();raf=requestAnimationFrame(tick);};
        v.button('slide the charge',()=>{running=!running;if(running)raf=requestAnimationFrame(tick);});
        v.button('reset',()=>reset());v.onCleanup(()=>{running=false;cancelAnimationFrame(raf);});
        let info={};
        v.render(()=>{
          const M=ellipseFourier(bs.value,coeffs),a=M.a,b=M.b,mx=Math.max(...M.nodes.flatMap(n=>[Math.abs(n.eq),Math.abs(n.trial)]),1);
          s.path(Array.from({length:161},(_,k)=>[a*Math.cos(TAU*k/160),b*Math.sin(TAU*k/160)]),{color:'ink',width:2.2,close:true,fill:'muted',fillAlpha:.2});
          for(const n of M.nodes){const ux=n.x/(a*a),uy=n.y/(b*b),u=Math.hypot(ux,uy);for(const [d,col,width,alpha]of[[n.eq,'green',5,.28],[n.trial,'red',2.2,.9]])s.segment([n.x,n.y],[n.x+ux/u*1.5*d/mx,n.y+uy/u*1.5*d/mx],{color:col,width,alpha});}
          const ymin=Math.min(0,...M.nodes.map(n=>n.trial));p.setView([0,1],[ymin<0?ymin*1.15:0,Math.max(mx,2)*1.15]);
          const closed=fn=>M.nodes.map((n,i)=>[(i+.5)/M.nodes.length,fn(n)]);
          p.path(closed(n=>n.eq),{color:'green',width:2.2,dash:true});p.path(closed(n=>n.trial),{color:'red',width:2.2});p.hline(1,{color:'faint'});
          info={dW:M.dW,sd:M.spread,steps,negative:ymin<0,coeffs:coeffs.slice(),ratio:bs.value};
        });
        v.legend([['green','equilibrium density'],['red','trial density']]);
        v.readout(()=>`Energy above equilibrium: $\\Delta W=${v.sci(info.dW,4)}$ in units $\\lambda^2/(2\\pi\\varepsilon_0)$ per unit length. Angular RMS surface-potential variation: $${v.sci(info.sd,4)}$ in units $\\lambda/(2\\pi\\varepsilon_0)$. Both are zero exactly when all four perturbation coefficients vanish. After ${info.steps} coefficient-relaxation steps.${info.negative?' Signed trial density: negative on part of the rim; total charge remains fixed.':''}`);
      },
    },
  ],
};
