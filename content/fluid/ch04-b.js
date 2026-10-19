// Fluid Dynamics — Chapter 4: Potential flow (items 4.7–4.11)
import { clamp, TAU, cadd, cpolar, elemVel, streamlines, drawLines, joukBody } from './ch04.shared.js';

import { pressureForce, forceReference, cylinderForce, fitPoints } from './forces-audit.shared.js';

const deg = (a) => (a * Math.PI) / 180;

export default {
  collection: 'fluid',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Flow past a circular cylinder',
      statement: String.raw`A uniform stream $U$ along $+x$ added to a doublet of strength $\mu=Ua^2$ at the origin has the complex potential
$$w(z)=U\Big(z+\frac{a^2}{z}\Big),\qquad \psi=U\Big(r-\frac{a^2}{r}\Big)\sin\theta.$$
The streamline $\psi=0$ consists of the $x$-axis and the circle $r=a$, so this is the irrotational flow past a circular cylinder of radius $a$. On the surface the speed is $|\mathbf u|=2U|\sin\theta|$ (purely tangential, with stagnation points at $\theta=0,\pi$ and maximum $2U$ at the top and bottom), and Bernoulli's theorem gives the pressure coefficient
$$C_p=\frac{p-p_\infty}{\tfrac12\rho U^2}=1-4\sin^2\theta .$$
The distribution is symmetric front to back and top to bottom.`,
      idea: String.raw`The potential is analytic away from $z=0$ (4.4) and, by superposition (4.5), is a legitimate flow; it tends to the stream at infinity. On $|z|=a$, $z=ae^{i\theta}$ gives $w=2Ua\cos\theta$ real, so $\psi=0$ there: the circle is a streamline and no fluid crosses it, which is the only boundary condition an ideal fluid needs (the tangential slip is allowed). The complex velocity $u-iv=U(1-a^2/z^2)$ has modulus $2U|\sin\theta|$ on the circle, and Bernoulli's theorem (2.9) turns that into $C_p$.`,
      caption: String.raw`Streamlines of the stream-plus-doublet flow (traced evenly from $\overline{w'}$), with the cylinder in grey. Drag the gold point round the surface: the right panel marks $C_p(\theta)=1-4\sin^2\theta$ at that angle and at its three mirror images $\pi-\theta$, $-\theta$ and $\pi+\theta$ (open dots), which all lie at the same height, so the pressure pushes on the cylinder equally from front and back and top and bottom. The arrows on the cylinder show the pressure: red pushes in (near the stagnation points, $C_p=1$), blue pulls out (over the shoulders, down to $C_p=-3$). Changing $U$ rescales the speeds but leaves $C_p$ unchanged.`,
      deps: ['fluid-4.5'],
      refs: ['Kundu §7.3', 'Acheson ch. 4'],
      tags: ['cylinder', 'doublet', 'pressure coefficient'],
      scope: String.raw`Steady, ideal, irrotational flow with no circulation. Real flow past a cylinder separates behind the shoulders at all but the smallest Reynolds numbers, so the rear half of this picture is not observed (see 4.8).`,
      viz(v) {
        const Us = v.slider('stream speed $U$', 0.3, 2, 1, { step: 0.05 });
        const a = 1;
        const s = v.stage({ x: [-4.2, 4.2], y: [-2.5, 2.5], equal: true, axes: false, height: 400, weight: 1.5, title: 'potential flow past a cylinder' });
        const q = v.stage({ x: [0, 360], y: [-3.5, 1.5], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'angle $\\theta$ (degrees, measured from $+x$)', ylabel: '$C_p$', title: 'surface pressure coefficient', xticks: [0, 90, 180, 270, 360] });
        const H = s.handle(Math.cos(deg(55)), Math.sin(deg(55)), { color: 'gold', r: 8, constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(x / r) * a, (y / r) * a]; } });
        const vel = (x, y) => { const r2 = x * x + y * y; if (r2 < a * a * 1.002) return null; const r4 = r2 * r2; return [Us.value * (1 - (a * a * (x * x - y * y)) / r4), (-2 * Us.value * a * a * x * y) / r4]; };
        let lines = null, key = '';
        let info = {};
        v.render(() => {
          if (key !== 'x') { lines = streamlines(vel, [-4.2, 4.2, -2.5, 2.5], { sep: 0.22, step: 0.045, seeds: [[-4.1, 0.31], [-4.1, -0.31]] }); key = 'x'; }
          drawLines(s, lines, { color: 'accent', width: 1.2, alpha: 0.85 });
          s.circle(0, 0, a, { fill: 'muted', fillAlpha: 0.45, color: 'ink', width: 2.4 });
          for (let k = 0; k < 36; k++) {
            const th = (TAU * (k + 0.5)) / 36, cp = 1 - 4 * Math.sin(th) ** 2, L = 0.3 * Math.abs(cp) / 3 + 0.04, c = Math.cos(th), sn = Math.sin(th);
            if (cp > 0) s.arrow((a + L) * c, (a + L) * sn, a * c, a * sn, { color: 'red', width: 1.6, head: 5 });
            else s.arrow(a * c, a * sn, (a + L) * c, (a + L) * sn, { color: 'blue', width: 1.6, head: 5 });
          }
          s.dot(a, 0, { r: 4, color: 'red' }); s.dot(-a, 0, { r: 4, color: 'red' });
          const th = ((Math.atan2(H.y, H.x) % TAU) + TAU) % TAU, cp = 1 - 4 * Math.sin(th) ** 2;
          q.hline(0, { color: 'muted', alpha: 0.6 });
          q.fn((d) => 1 - 4 * Math.sin(deg(d)) ** 2, { domain: [0, 360], color: 'accent', width: 2.6 });
          for (const t2 of [Math.PI - th, -th, Math.PI + th]) { const tt = ((t2 % TAU) + TAU) % TAU; q.dot((tt * 180) / Math.PI, cp, { r: 5, hollow: true, color: 'ink' }); s.dot(a * Math.cos(tt), a * Math.sin(tt), { r: 5, hollow: true, color: 'ink' }); }
          q.dot((th * 180) / Math.PI, cp, { r: 7, color: 'gold' });
          const uth = 2 * Us.value * Math.sin(th);
          info = { th: (th * 180) / Math.PI, cp, speed: Math.abs(uth) };
        });
        v.readout(() => `$\\theta=${v.fix(info.th, 1)}^\\circ$: surface speed $|u_\\theta|=2U|\\sin\\theta|=${v.fix(info.speed, 3)}$ (that is $${v.fix(info.speed / Us.value, 3)}\\,U$), $C_p=1-4\\sin^2\\theta=${v.fix(info.cp, 3)}$\nthe four mirror points $\\theta,\\ \\pi-\\theta,\\ -\\theta,\\ \\pi+\\theta$ share this $C_p$: front–back and top–bottom symmetry`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Paradox',
      name: 'd’Alembert’s paradox',
      statement: String.raw`A fixed smooth body in steady plane inviscid incompressible irrotational flow, with uniform velocity at infinity, impermeable boundary, zero circulation and no sources or vortex wake in the exterior, experiences **zero net pressure force**. In particular drag and lift vanish. The complex velocity has $dw/dz=Ue^{-i\alpha}+O(z^{-2})$ at infinity, so its square has no $1/z$ term and the Blasius integral (4.10) is zero. Viscosity and separated wakes can invalidate this ideal-flow prediction; the theorem is not a prediction of real-fluid drag.`,
      idea: String.raw`A distant control-volume argument must include both momentum flux and pressure force. In this plane zero-circulation problem the velocity and pressure perturbations are $O(r^{-2})$, so both perturbation integrals vanish as the distant circle grows. Equivalently the residue of $(dw/dz)^2$ is zero when the $1/z$ term of $w'$ is absent (4.10). Physically, Bernoulli's theorem (2.9) makes the pressure distribution a function of the local speed only, and for a body whose potential flow is fore-aft symmetric the pressure forces on the two halves cancel; the cancellation holds for any shape, not only symmetric ones.`,
      caption: String.raw`An ellipse of adjustable flatness $c$ ($c=0$ is a circle) is placed in a stream at an adjustable angle of attack, and the potential flow past it is computed exactly with the Joukowski map. The pressure integral uses the analytic mapped boundary tangent; its small signed residual is numerical, while the ideal result is exactly zero. The full pressure curve is visible, parameterized by the preimage-circle angle. The imposed-pressure toy replaces the downstream half (defined relative to the stream) by $C_{p,b}$. Depending on the chosen pressure it can give drag or thrust; it is not a physical wake solution. Pressure-arrow lengths are scaled separately at each setting.`,
      deps: ['fluid-4.7', 'fluid-2.9'],
      refs: ['MIT18.354 (2015), §§18.5,20.3–20.4, Eqs.(499)–(514)'],
      credit: 'd’Alembert paradox; author derivation: MIT18.354 (2015), §§20.3–20.4.',
      verify: false,
      links:{primary:'https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf'},
      tags: ['drag', 'paradox', 'pressure'],
      scope: String.raw`Steady, inviscid, irrotational flow in an unbounded fluid, zero circulation, no free surface, no cavitation, no wake. The imposed rear-pressure toy is a prescribed boundary load, not a self-consistent velocity/pressure solution. It can produce either sign of streamwise force. Pressure is relative to an arbitrary far-field value; negative coefficients need not mean negative absolute pressure.`,
      viz(v) {
        const flat = v.slider('flatness $c$ ($0$ = circle)', 0, 0.9, 0.35, { step: 0.01 });
        const aoa = v.slider('angle of attack (deg)', -25, 25, 12, { step: 1 });
        const wake = v.toggle('imposed downstream pressure', false);
        const cpb = v.slider('base pressure $C_{p,b}$', -1.6, 0, -0.6, { step: 0.05 });
        const s = v.stage({ x: [-3.6, 3.6], y: [-2.2, 2.2], equal: true, axes: false, height: 380, weight: 1.35, title: 'flow past an ellipse' });
        const q = v.stage({ x: [0, 360], y: [-4.2, 1.5], axes: 'box', gutter: true, height: 380, weight: 0.95, xlabel: 'preimage-circle angle $\\varphi$ (deg)', ylabel: '$C_p$', title: 'surface pressure coefficient', xticks: [0, 90, 180, 270, 360] });
        let lines = [], key = '';
        let info = {};
        v.render(() => {
          const c = flat.value, al = deg(aoa.value), P = joukBody({ c, R: 1, alpha: al, U: 1, G: 0 });
          const k = c + '|' + al;
          if (k !== key) { key = k; lines = streamlines((x, y) => P.at(x, y), [-3.6, 3.6, -2.2, 2.2], { sep: 0.24, step: 0.045, seeds: [[-3.5, 0.2]] }); }
          drawLines(s, lines, { color: 'accent', width: 1.15, alpha: 0.8 });
          const F=pressureForce(P,1440,{wake:wake.value,base:cpb.value}),cps=F.cp,cpm=F.modified;
          s.poly(P.surf(360).map(P.zOf),{fill:'muted',fillAlpha:.5,color:'ink',width:2.4});
          const scale=.5/Math.max(1,...cpm.map(p=>Math.abs(p[1])));
          for(let j=0;j<F.surface.length;j+=40){const [x,y]=F.surface[j],[nx,ny]=F.normals[j],r=Math.hypot(nx,ny),cp=cpm[j][1],L=scale*Math.abs(cp),ux=nx/r,uy=ny/r;if(cp>0)s.arrow(x+L*ux,y+L*uy,x,y,{color:'red',width:1.5,head:5});else if(cp<0)s.arrow(x,y,x+L*ux,y+L*uy,{color:'blue',width:1.5,head:5});}
          const vals=[...cps,...cpm].map(p=>p[1]),low=Math.min(-3,...vals),high=Math.max(1,...vals);q.setView([0,360],[low-.1*(high-low),high+.1*(high-low)]);
          q.hline(0, { color: 'muted', alpha: 0.6 });
          q.path(cps, { color: 'accent', width: 2.4 });
          if (wake.value) { q.path(cpm, { color: 'red', width: 2.4, dash: true }); }
          info = {c,al,wake:wake.value,base:cpb.value,...F};
        });
        v.legend([['accent', '$C_p$ of potential flow'], ['red', '$C_p$ with the rear held at $C_{p,b}$', { dash: true }]]);
        v.readout(() => `force on the body by integrating pressure: drag (along the stream) $D=${wake.value ? v.fix(info.D, 4) : v.sci(info.D, 2)}$, lift $L=${wake.value ? v.fix(info.L, 4) : v.sci(info.L, 2)}$ (normalized by $\\rho U^2a$ (unit span, $a=1$))\nstreamwise force on the upstream half $${v.fix(info.front, 4)}$, on the downstream half $${v.fix(info.rear, 4)}$${wake.value ? (info.D<0?' — imposed-pressure toy gives thrust':' — imposed-pressure toy gives drag') : ' — they cancel (d’Alembert)'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Cylinder with circulation: the Magnus effect',
      statement: String.raw`For $U>0$, $a>0$ and $\Gamma\ge0$, adding a point vortex of clockwise circulation $\Gamma$ at the centre of the cylinder flow of 4.7 gives the complex potential
$$w(z)=U\Big(z+\frac{a^2}{z}\Big)+\frac{i\Gamma}{2\pi}\ln z .$$
The circle $r=a$ is still a streamline, so this is again a flow past a cylinder, for every value of $\Gamma$. The surface speed is $|u_\theta|=\big|2U\sin\theta+\Gamma/2\pi a\big|$ and the stagnation points lie at $\sin\theta=-\Gamma/4\pi Ua$ on the surface; they move toward each other as $\Gamma$ grows, meet at $\Gamma=4\pi Ua$, and for larger $\Gamma$ leave the surface as a single point on the axis, at $r=a\,[\hat\Gamma+\sqrt{\hat\Gamma^2-1}]$, $\hat\Gamma=\Gamma/4\pi Ua$. The pressure is lower on the side where the vortex velocity adds to the stream, and the net force is a lift $L=\rho U\Gamma$ per unit span at right angles to the stream (towards the side where the flow is faster), with no drag.`,
      idea: String.raw`The vortex's streamlines are circles about the origin, so they never cross $r=a$: adding it keeps the boundary condition. On the surface the stream and doublet give $u_\theta=-2U\sin\theta$ and the vortex adds $-\Gamma/2\pi a$ (clockwise). Bernoulli's theorem (2.9) gives $p$ and integrating $-p\,\mathbf n\,a\,d\theta$ over the circle, only the cross term $\sin\theta\cdot\Gamma$ survives and yields $\rho U\Gamma$; this is a special case of the Kutta–Joukowski theorem (4.11). The ideal boundary condition allows tangential slip and does not determine a solid rotation rate from $\Gamma$.`,
      caption: String.raw`Slide the circulation parameter $\hat\Gamma=\Gamma/4\pi Ua$. Streamlines are traced from the combined field; the two red dots are the stagnation points, which slide down the surface, merge at $\hat\Gamma=1$ and leave it for larger values. The rotating ticks are a chosen clockwise visual phase, not a calculated solid-body angular velocity. The gold arrow is the sideways force obtained by integrating the pressure numerically; its length is $0.12$ times the force in chosen units, with no saturation, and the force is compared with $\rho U\Gamma$ in the readout. On the right, $C_p=1-4(\sin\theta+\hat\Gamma)^2$ (blue) against the non-rotating case (grey dashed): the extra suction on top is the lift.`,
      deps: ['fluid-4.7'],
      refs: ['MIT18.354 (2015), §§18.3–18.5,19.2, Eqs.(460)–(479)'],
      credit: 'Cylinder circulation model: MIT18.354 (2015), §§18.3–18.5 and 19.2.',
      verify: false,
      links:{primary:'https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf'},
      tags: ['circulation', 'Magnus', 'lift'],
      scope: String.raw`Ideal flow with circulation imposed; the model does not determine circulation from solid rotation or solve a viscous boundary layer. Here $\Gamma$ is a free parameter (see 4.16).`,
      viz(v) {
        const gs = v.slider('circulation $\\hat\\Gamma=\\Gamma/4\\pi U a$', 0, 2.2, 0.6, { step: 0.01 });
        const s = v.stage({ x: [-4, 4], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1.5, title: 'cylinder with prescribed circulation' });
        const q = v.stage({ x: [0, 360], y: [-16, 2], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'angle $\\theta$ (degrees)', ylabel: '$C_p$', title: 'surface pressure coefficient', xticks: [0, 90, 180, 270, 360] });
        const a = 1, U = 1;
        let lines = [], lk = -1;
        let info = {};
        v.animate((t) => {
          const G = 4 * Math.PI * U * a * gs.value, E = [{ t: 'uni', k: U, th: 0 }, { t: 'dbl', x: 0, y: 0, k: U * a * a, th: 0 }, { t: 'vtx', x: 0, y: 0, k: -G }];
          const F=cylinderForce(gs.value),V=fitPoints([...F.stagnation,[0,F.arrow]],{minX:3.5,minY:2.4});s.setView(V.x,V.y);
          if (lk !== gs.value) { lk = gs.value; lines = streamlines((x, y) => (x * x + y * y < 1.004 ? null : elemVel(E, x, y, 0.01)), [...V.x,...V.y], { sep: 0.25, step: 0.045, seeds: [[-3.9, 0.3], [-3.9, -0.3]] }); }
          drawLines(s, lines, { color: 'accent', width: 1.15, alpha: 0.85 });
          s.circle(0, 0, a, { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 2.4 });
          const spin = -0.9 * gs.value * t;
          for (let k = 0; k < 12; k++) { const th = spin + (TAU * k) / 12; s.line(0.82 * Math.cos(th), 0.82 * Math.sin(th), 0.97 * Math.cos(th), 0.97 * Math.sin(th), { color: k === 0 ? 'red' : 'ink', width: 2 }); }
          for(const [x,y]of F.stagnation)s.dot(x,y,{r:5.5,color:'red'});
          const {Fx,Fy,cp:cps}=F,Lref=U*G;
          if(G!==0)s.arrow(0,0,0,F.arrow,{color:'gold',width:4,head:11});s.text('lift',.12,F.arrow*.5,{color:'gold',align:'left'});
          q.hline(0, { color: 'muted', alpha: 0.6 });
          q.fn((d) => 1 - 4 * Math.sin(deg(d)) ** 2, { domain: [0, 360], color: 'muted', width: 1.6, dash: true });
          q.path(cps, { color: 'accent', width: 2.6 });
          let cmin = 0; for (const p of cps) cmin = Math.min(cmin, p[1]);
          q.setView([0, 360], [Math.min(-4, 1.15 * cmin), 2]);
          info = {hat:gs.value,t,...F,Lref};
        }, { period: 6, still: 0.5 });
        v.legend([['accent', '$C_p$ with circulation'], ['muted', 'no circulation', { dash: true }]]);
        v.readout(() => `$\\Gamma=${v.fix(info.G, 3)}$ (in units with $U=a=1$) · lift by integrating pressure $L=${v.fix(info.Fy, 4)}$ vs. $\\rho U\\Gamma=${v.fix(info.Lref, 4)}$ · drag $${v.sci(info.Fx, 2)}$\n${gs.value < 1 ? `stagnation points on the surface at $\\theta=-\\arcsin\\hat\\Gamma=${v.fix((-Math.asin(gs.value) * 180) / Math.PI, 1)}^\\circ$ and $${v.fix(180 + (Math.asin(gs.value) * 180) / Math.PI, 1)}^\\circ$` : gs.value === 1 ? 'the two stagnation points have just merged at the bottom of the cylinder' : `one stagnation point, off the surface, at $r=${v.fix(gs.value + Math.sqrt(gs.value * gs.value - 1), 3)}\\,a$`}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Blasius force theorem',
      statement: String.raw`Let a rigid body in steady plane inviscid incompressible irrotational flow of constant density $\rho$ have a single-valued analytic complex velocity $q=w'(z)$ in the exterior, with an impermeable smooth boundary and no exterior sources or vortices. The potential itself may be multivalued when circulation is nonzero. The force $(F_x,F_y)$ per unit span that the pressure exerts on the body satisfies
$$F_x-iF_y=\frac{i\rho}{2}\oint_C\Big(\frac{dw}{dz}\Big)^2dz ,$$
where $C$ is the body's boundary or, equivalently, any simple counter-clockwise contour in the fluid winding once around the body, with no singularity between it and the boundary. By the residue theorem the integral depends only on the coefficient of $1/z$ in the Laurent expansion of $(w')^2$ at infinity.`,
      idea: String.raw`For a counter-clockwise boundary, $n_x\,ds=dy$ and $n_y\,ds=-dx$. The conjugate complex force is $F_x-iF_y=-i\oint p\,d\bar z=(i\rho/2)\oint |q|^2d\bar z$, since constant pressure integrates to zero. Impermeability makes $q\,dz$ real: $q\,dz=\bar q\,d\bar z$, hence $|q|^2d\bar z=q^2dz$. This is an identity involving the boundary tangent, not an unrestricted replacement of $\bar q$ by $q$. Cauchy's theorem then deforms the integral through the nonsingular fluid.`,
      caption: String.raw`A smooth body (the image of an off-centre circle under the Joukowski map $z=\zeta+1/\zeta$, see 4.15) sits in a stream at angle of attack $\alpha$ with clockwise circulation $\Gamma$. The force is computed twice: by integrating the surface pressure, and by evaluating $\tfrac i2\oint (w')^2dz$ on the orange contour, whose radius you set with the slider. The view expands to include the entire contour. On the right, 21 sampled contour radii including both endpoints are compared with the surface result (dashed). The exact theorem is contour-independent; finite quadrature retains a small residual. The force is $\rho U\Gamma$ across the stream, the next item's theorem.`,
      deps: ['fluid-4.4', 'rca-10.42'],
      refs: ['MIT18.354 (2015), §20.3, Eqs.(499)–(507)'],
      credit: 'Blasius formula; author derivation in MIT18.354 (2015), §20.3.',
      verify: false,
      links:{primary:'https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf'},
      tags: ['force', 'residue', 'Blasius'],
      scope: String.raw`Steady, plane, irrotational flow with no singularities in the fluid. The body in the picture is a smooth Joukowski-type shape (no sharp trailing edge), so that the surface integral converges for every $\Gamma$.`,
      viz(v) {
        const cx = v.slider('circle centre $\\zeta_{0x}$', -0.3, 0.3, -0.1, { step: 0.01 });
        const cy = v.slider('circle centre $\\zeta_{0y}$', -0.3, 0.5, 0.25, { step: 0.01 });
        const rd = v.slider('roundness', 0.12, 0.6, 0.2, { step: 0.01 });
        const al = v.slider('angle of attack (deg)', -15, 20, 8, { step: 1 });
        const gam = v.slider('circulation $\\Gamma$ (clockwise)', 0, 4, 2, { step: 0.05 });
        const ro = v.slider('contour radius / body radius', 1, 4, 2.2, { step: 0.05 });
        const s = v.stage({ x: [-3.6, 3.6], y: [-2.4, 2.4], equal: true, axes: false, height: 400, weight: 1.35, title: 'a body and the contour for the Blasius integral' });
        const q = v.stage({ x: [1, 4], y: [-1, 5], axes: 'box', gutter: true, height: 400, weight: 0.95, xlabel: 'contour radius / body radius', ylabel: 'force (per $\\rho$, $U=1$)', title: 'the contour integral does not depend on the contour' });
        let lines = [], key = '', info = {};
        v.render(() => {
          const P = joukBody({ zeta0: [cx.value, cy.value], c: 1, round: rd.value, U: 1, alpha: deg(al.value), G: gam.value });
          const B=P.blasius(ro.value*P.R,1440),body=P.surf(360).map(P.zOf),V=fitPoints([...body,...B.contour]);s.setView(V.x,V.y);
          const k=[cx.value,cy.value,rd.value,al.value,gam.value,ro.value].join('|'),sep=.04*Math.max(V.x[1]-V.x[0],V.y[1]-V.y[0]);
          if(k!==key){key=k;lines=streamlines((x,y)=>P.at(x,y),[...V.x,...V.y],{sep,step:sep*.2});}
          drawLines(s,lines,{color:'accent',width:1.1,alpha:.7});s.poly(body,{fill:'muted',fillAlpha:.5,color:'ink',width:2.4});s.path(B.contour,{color:'orange',width:2.4,dash:[7,4]});
          const F=pressureForce(P,1440);
          const curveY = [], curveX = [];
          for (let j=0;j<=20;j++) { const r=1+3*j/20; const bb = P.blasius(r * P.R, 720); curveY.push([r, bb.Fy]); curveX.push([r, bb.Fx]); }
          const ys = [F.Fy, F.Fx, ...curveY.map((p) => p[1]), ...curveX.map((p) => p[1])];
          const lo = Math.min(...ys), hi = Math.max(...ys), pad = 0.25 * (hi - lo + 0.5);
          q.setView([1, 4], [lo - pad, hi + pad]);
          q.hline(F.Fy, { color: 'accent', dash: true, width: 1.6 }); q.hline(F.Fx, { color: 'green', dash: true, width: 1.6 });
          q.path(curveY, { color: 'accent', width: 2.4 }); q.path(curveX, { color: 'green', width: 2.4 });
          q.vline(ro.value, { color: 'orange', alpha: 0.7 });
          info = {F,B,R:P.R,zeta0:P.zeta0,round:rd.value,alpha:deg(al.value),G:gam.value,ratio:ro.value,curveY,curveX,reference:forceReference(1,gam.value,deg(al.value))};
        });
        v.legend([['accent', '$F_y$'], ['green', '$F_x$'], ['orange', 'current contour', { dash: true }]]);
        v.readout(() => `surface pressure: $(F_x,F_y)=(${v.fix(info.F.Fx, 5)},\\ ${v.fix(info.F.Fy, 5)})$\nBlasius integral on the contour: $(${v.fix(info.B.Fx, 5)},\\ ${v.fix(info.B.Fy, 5)})$ — difference $${v.sci(Math.hypot(info.F.Fx - info.B.Fx, info.F.Fy - info.B.Fy), 1)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Kutta–Joukowski lift theorem',
      statement: String.raw`A cylinder of any cross-section in a steady, plane, irrotational flow of an ideal fluid that tends to a uniform stream $U$ at infinity, with circulation $\Gamma$ (clockwise) round the body, experiences a signed lift per unit span
$$L=\rho U\Gamma$$
positive to the left of the stream for clockwise-positive $\Gamma$, with magnitude $\rho U|\Gamma|$ and **no** force along the stream. The shape of the body does not enter, only the circulation.`,
      idea: String.raw`Far from the body $w(z)=Uz+\dfrac{i\Gamma}{2\pi}\ln z+O(1/z)$, hence $w'=U+\dfrac{i\Gamma}{2\pi z}+O(z^{-2})$ and $(w')^2=U^2+\dfrac{iU\Gamma}{\pi z}+O(z^{-2})$. The Blasius theorem (4.10) says the force is given by the residue of $(w')^2$, which is the coefficient of $1/z$, $\dfrac{iU\Gamma}{\pi}$: multiplying by $2\pi i\cdot\tfrac{i\rho}{2}$ gives $F_x-iF_y=\tfrac{i\rho}{2}\cdot2\pi i\cdot\tfrac{iU\Gamma}{\pi}=-i\rho U\Gamma$, that is $F_x=0$, $F_y=\rho U\Gamma$ for a stream along $+x$ (the sign follows the orientation of $\Gamma$). The doublet and higher terms contribute no residue, which is why the shape drops out and why d'Alembert's paradox (4.8) is the case $\Gamma=0$.`,
      caption: String.raw`Four very different cross-sections (a circle, a flat ellipse, an egg and a cambered shape) sit in the same stream with the same circulation $\Gamma$; the pressure is integrated numerically round each. The gold arrows show the theoretical lift, with length $0.45U\Gamma$ in chosen drawing units and a view that contains the full arrow. Actual signed pressure-integral lift, drag and residual are reported separately. The theoretical drag is zero; the numerical residual need not be. The streamlines differ strongly from one body to the next, but the force does not. Slide $\Gamma$ to zero and the lift disappears (4.8). The circulations are given values here: what fixes $\Gamma$ in practice is the subject of the next chapter.`,
      deps: ['fluid-4.10', 'fluid-4.9'],
      refs: ['MIT18.354 (2015), §20.4, Eqs.(508)–(514)'],
      credit: 'Kutta–Joukowski theorem; author proof: MIT18.354 (2015), §20.4.',
      verify: false,
      links:{primary:'https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf'},
      tags: ['lift', 'Kutta', 'Joukowski'],
      scope: String.raw`Steady inviscid incompressible plane flow outside one smooth impermeable body; complex velocity analytic throughout the exterior, uniform at infinity, zero net source flux and prescribed circulation. The potential may be multivalued. For a sharp-edged aerofoil $\Gamma$ must be fixed separately, by the Kutta condition (chapter 5). Three-dimensional wing flow lies outside this plane theorem.`,
      viz(v) {
        const G = v.slider('circulation $\\Gamma$ (clockwise)', 0, 4, 2.4, { step: 0.05 });
        const U = v.slider('stream speed $U$', 0.5, 2, 1, { step: 0.05 });
        const al = v.slider('angle of the stream (deg)', -20, 20, 6, { step: 1 });
        const SH = [
          { n: 'circle', o: { zeta0: [0, 0], c: 0, R: 1 } },
          { n: 'flat ellipse', o: { zeta0: [0, 0], c: 0.85, R: 1 } },
          { n: 'egg', o: { zeta0: [-0.12, 0.12], c: 1, round: 0.4 } },
          { n: 'cambered', o: { zeta0: [-0.1, 0.38], c: 1, round: 0.12 } },
        ];
        const S = SH.map((sh) => v.stage({ x: [-2.6, 2.6], y: [-1.95, 1.95], equal: true, axes: false, height: 230, weight: 1, minWidth: 175, title: sh.n }));
        const keys = SH.map(() => ''), lines = SH.map(() => []);
        let info = [];
        v.render(() => {
          info = SH.map((sh, i) => {
            const al0 = deg(al.value), P = joukBody({ ...sh.o, U: U.value, alpha: al0, G: G.value }), s = S[i];
            const F=pressureForce(P,1440),Lf=F.L,D=F.D,len=.45*U.value*G.value,nx=-Math.sin(al0),ny=Math.cos(al0),body=P.surf(300).map(P.zOf),V=fitPoints([...body,[nx*len,ny*len]],{minX:2.5,minY:1.95});s.setView(V.x,V.y);
            const k = G.value + '|' + U.value + '|' + al.value,sep=.07*Math.max(V.x[1]-V.x[0],V.y[1]-V.y[0]);
            if (keys[i] !== k) { keys[i] = k; lines[i] = streamlines((x, y) => P.at(x, y), [...V.x,...V.y], { sep, step: sep*.2 }); }
            drawLines(s, lines[i], { color: 'accent', width: 1.05, alpha: 0.7 });
            s.poly(P.surf(300).map(P.zOf), { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 2.2 });
            if(G.value!==0)s.arrow(0, 0, nx * len, ny * len, { color: 'gold', width: 4, head: 10 });
            s.text(`L = ${v.fix(Lf, 2)}`, nx * len + 0.12, ny * len + 0.1, { color: 'gold', align: 'left', size: 12 });
            return {Lf,D,U:U.value,G:G.value,alpha:al0,shape:i,arrow:[nx*len,ny*len],Fx:F.Fx,Fy:F.Fy,error:Math.hypot(F.Fx+U.value*G.value*Math.sin(al0),F.Fy-U.value*G.value*Math.cos(al0))};
          });
        });
        v.readout(() => `$\\rho U\\Gamma=${v.fix(U.value * G.value, 4)}$ · lift per unit span by pressure integration: ${SH.map((sh, i) => `${sh.n} $${v.fix(info[i].Lf, 4)}$`).join(', ')}\ndrag along the stream: ${SH.map((sh, i) => `$${v.sci(info[i].D, 2)}$`).join(', ')} — theoretical drag 0; numerical lift-force residuals: ${info.map(q=>`$${v.sci(q.error,2)}$`).join(', ')} (density 1, force per unit span)`);
      },
    },
  ],
};
