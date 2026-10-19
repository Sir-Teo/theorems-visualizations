// Fluid Dynamics — Chapter 4: Potential flow (items 4.12–4.17)
import { G0, clamp, TAU, cadd, cpolar, cmul, cdiv, cexp, cabs, carg, elemVel, elemW1, streamlines, drawLines, theodorsen } from './ch04.shared.js';

import * as CA from './conformal-audit.shared.js';
import * as BA from './boundaries-inertia-audit.shared.js';

const deg = (a) => (a * Math.PI) / 180;

export default {
  collection: 'fluid',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12', kind: 'Method', name: 'Method of images',
      statement: String.raw`For a straight impermeable wall, reflect a source with the same strength and a point vortex with **opposite circulation**. The pair cancels normal velocity at the wall. A counterclockwise vortex of strength $\Gamma$ at height $y>0$ drifts with signed velocity $u=\Gamma/(4\pi y)$ along the wall. In a strip $0<y<W$, the complete infinite image lattice gives $u=\Gamma\cot(\pi y/W)/(4W)$ and $v=0$. In the right-angle corner $x,y>0$, the three image strengths are $-\Gamma,-\Gamma,+\Gamma$; their induced velocity conserves $x^{-2}+y^{-2}$.`,
      idea: String.raw`Reflection makes the normal components cancel. For the strip, sum the simple poles using $\sum_{n\in\mathbb Z}(z-2inW)^{-1}=(\pi/2W)\coth(\pi z/2W)$, with symmetric summation. Thus $u-iv=\Gamma[\coth(\pi(z-z_0)/(2W))-\coth(\pi(z-\bar z_0)/(2W))]/(4Wi)$. Removing the real vortex's singular term gives its drift. The corner drift is $\dot x=\Gamma x^2/[4\pi y(x^2+y^2)]$, $\dot y=-\Gamma y^2/[4\pi x(x^2+y^2)]$; differentiate the stated invariant to check it. These constructions satisfy the boundary condition; uniqueness also requires a far-field condition and specified circulations, not just Neumann data.`,
      credit: 'Straight-wall reflection derivation: MIT 13.021, lectures 10–11, §3.8',
      verify: false,
      caption: String.raw`Place the vortex and release it in a wall, strip or corner geometry. Open dots show image vortices, coloured by sign; the doubly reflected corner image has the original sign. Only a few strip images are drawn, but velocity, streamlines and wall checks use the **closed infinite-lattice field**. Drift is analytic for the wall/strip and fourth-order time stepping for the corner. The numerical wall residual is sampled, not a proof or an imposed error floor. Motion stops before leaving the frame; changing a control or dragging restarts both the state and animation clock.`,
      deps: ['fluid-4.5'], refs: ['MIT 13.021, lectures 10–11, §3.8; strip pole sum and corner invariant derived here'],
      tags: ['images', 'vortex', 'wall'],
      scope: String.raw`Inviscid incompressible plane point-vortex model, irrotational away from its vortex, with slip walls. No imposed background stream. The vortex is a singular idealization; its self-field is omitted from its motion. The strip uses $W=2$ in chosen units. The visible finite-time corner trajectory is numerical and its invariant residual is displayed.`,
      viz(v) {
        const reset=()=>{S.reset();v.t=0;};
        const mode=v.select('boundary',[{value:'wall',label:'one wall'},{value:'channel',label:'two walls'},{value:'corner',label:'corner'}],'wall',{onChange:()=>{place();reset();}});
        const gs=v.slider('circulation $\\Gamma$',-10,10,6,{step:.5,onChange:reset});
        v.button('Release again',reset);
        const s=v.stage({x:[-4.6,4.6],y:[-1.5,3.3],equal:true,axes:false,height:400,title:'a vortex and its images'});
        const H=s.handle(-2.5,.8,{color:'gold',r:8,label:'start',labelPos:'nw',constrain:(x,y)=>{const m=mode.value;return[m==='corner'?clamp(x,.2,3.8):clamp(x,-3.8,3.8),clamp(y,.2,m==='channel'?1.8:2.8)];}});H.onDrag=reset;
        function place(){H.set(mode.value==='corner'?.9:-2.5,mode.value==='channel'?.6:mode.value==='corner'?2.2:.8);}
        const inside=(x,y)=>mode.value==='corner'?x>0&&y>0:mode.value==='channel'?y>0&&y<2:y>0;
        const S=v.sim(()=>({x:H.x,y:H.y,t:0,trail:[[H.x,H.y]],k:0,c0:1/H.x**2+1/H.y**2,stopped:false}),(st,dt)=>{
          if(st.stopped)return;
          const next=BA.vortexStep(mode.value,st.x,st.y,gs.value,dt);
          if(next[0]<-4.2||next[0]>4.2||next[1]<.1||next[1]>3.0){st.stopped=true;return;}
          [st.x,st.y]=next;st.t+=dt;if(++st.k%3===0)st.trail.push(next);
        },{dt:.005});
        let info={};
        v.animate(t=>{
          const st=S.advance(t),m=mode.value,L=BA.imageVortices(m,st.x,st.y,gs.value),field=(x,y)=>inside(x,y)&&Math.hypot(x-st.x,y-st.y)>.035?BA.imageVelocity(m,x,y,st.x,st.y,gs.value):null;
          const lines=streamlines(field,[-4.6,4.6,0,m==='channel'?2:3.3],{sep:.23,step:.04,seeds:[[st.x+.5,st.y]]}),hat={fill:'muted',fillAlpha:.3,hatch:true,color:'ink',width:2.4};
          s.rect(-4.6,-1.5,4.6,0,hat);if(m==='channel')s.rect(-4.6,2,4.6,3.3,hat);if(m==='corner')s.rect(-4.6,0,0,3.3,hat);
          drawLines(s,lines,{color:'accent',width:1.1,alpha:.7,arrows:false});s.path(st.trail,{color:'gold',width:2.2});
          for(const e of L.slice(1))if(e.y>-1.5&&e.y<3.3&&Math.abs(e.x)<4.6)s.dot(e.x,e.y,{r:6,hollow:true,color:e.k>0?'purple':'orange'});
          s.dot(st.x,st.y,{r:7,color:gs.value>=0?'purple':'orange'});
          let vn=0;for(let j=0;j<=60;j++){const x=.013+j*4/60;const f=(x,y)=>BA.imageVelocity(m,x,y,st.x,st.y,gs.value);vn=Math.max(vn,Math.abs(f(m==='corner'?x:x-2,0)[1]));if(m==='channel')vn=Math.max(vn,Math.abs(f(x-2,2)[1]));if(m==='corner')vn=Math.max(vn,Math.abs(f(0,x*.75)[0]));}
          info={...st,sp:BA.imageDrift(m,st.x,st.y,gs.value),vn,error:1/st.x**2+1/st.y**2-st.c0,mode:m};
        },{period:12,still:0});
        v.readout(()=>`$t=${v.fix(info.t,3)}$, vortex $(${v.fix(info.x,3)},${v.fix(info.y,3)})$, signed drift $(${v.fix(info.sp[0],4)},${v.fix(info.sp[1],4)})$${info.stopped?' · stopped at the visible-frame limit':''}\nsampled wall-normal residual $${v.sci(info.vn,2)}$${info.mode==='corner'?`; invariant error $${v.sci(info.error,2)}$`:''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Milne-Thomson circle theorem',
      statement: String.raw`Let $f(z)$ be the complex potential of a plane irrotational flow with no singularities in $|z|\le a$ (all sources, vortices and doublets lie outside the circle, and the flow may include a uniform stream at infinity). Then the potential
$$w(z)=f(z)+\overline{f\!\Big(\frac{a^2}{\bar z}\Big)}$$
is the flow that has the same singularities outside the circle and in addition has $|z|=a$ as a streamline: it describes the flow in the presence of the fixed cylinder $|z|\le a$. The second term gives the images: a source $m$ at $z_0$ has as image a source $m$ at $a^2/\bar z_0$ and a sink $-m$ at the centre, a vortex $\Gamma$ at $z_0$ has an image $-\Gamma$ at $a^2/\bar z_0$ and a vortex $+\Gamma$ at the centre, and a uniform stream $Ue^{-i\alpha}z$ has a doublet $Ua^2e^{i\alpha}/z$.`,
      idea: String.raw`On the circle $z=ae^{i\theta}$ one has $a^2/\bar z=z$, so $w=f(z)+\overline{f(z)}=2\operatorname{Re}f$, which is real: $\operatorname{Im}w=\psi$ is constant on the circle, which is therefore a streamline. The added term is analytic outside the circle because $f(a^2/\bar z)$ is analytic when $a^2/\bar z$ lies inside the circle, where $f$ has no singularities, and its conjugate is analytic in $z$ (a double reflection). It is the Schwarz reflection principle (rca-11.14) in the circle instead of in a line: with the doublet-and-image construction of 4.12 as a special case.`,
      caption: String.raw`Place sources, sinks and vortices outside the unit circle (click with the tool; they cannot go inside), set the stream, and the theorem adds the image singularities (open dots, with the extra source or vortex at the centre). With the images on, the circle is a streamline: nothing passes through it, and the right-hand plot of the normal velocity $u_r$ round the circle is flat at zero (the readout gives its largest value). Switch the images off: the streamlines run straight through the cylinder, and $u_r(\theta)$ is a wave of the order of the stream speed. Move a singularity and the images move with it ($z_0\mapsto a^2/\bar z_0$).`,
      deps: ['fluid-4.12', 'fluid-4.4', 'rca-11.14'],
      refs: ['Acheson ch. 4'],
      credit: 'L. M. Milne-Thomson, Proc. Camb. Phil. Soc. 36, 246–247, 1940',
      tags: ['circle theorem', 'images', 'Milne-Thomson'],
      scope: String.raw`Plane, ideal, irrotational flow; $f$ analytic in $|z|\le a$ except possibly at the origin if the image is wanted there. For vortices the total circulation round the cylinder is that of the vortices outside plus the central image vortices, so it can differ from the sum of the real circulations: it is zero when no vortex is outside.`,
      viz(v) {
        const tool = v.select('click to place', [{ value: 'src', label: 'source' }, { value: 'snk', label: 'sink' }, { value: 'vccw', label: 'vortex ↺' }, { value: 'vcw', label: 'vortex ↻' }, { value: 'del', label: 'remove' }], 'src');
        const str = v.slider('strength of new elements', 0.5, 4, 2, { step: 0.1 });
        const U = v.slider('stream speed $U$', 0, 1.5, 0.6, { step: 0.05 });
        const ang = v.slider('stream angle (deg)', -45, 45, 0, { step: 1 });
        const img = v.toggle('apply the circle theorem (add the images)', true);
        v.button('Clear', () => { E.length = 0; });
        const E = [{ t: 'src', x: 1.9, y: 0.9, k: 2.5 }];
        const s = v.stage({ x: [-4.8, 4.8], y: [-2.5, 2.5], equal: true, axes: false, height: 400, weight: 1.4, title: 'singularities, their images and the circle $|z|=1$' });
        const q = v.stage({ x: [0, 360], y: [-3, 3], axes: 'box', gutter: true, height: 400, weight: 0.8, xlabel: 'angle $\\theta$ (degrees)', ylabel: '$u_r$ on the circle', title: 'normal velocity on the circle', xticks: [0, 90, 180, 270, 360] });
        s.onClick((x, y) => {
          const t = tool.value;
          if (t === 'del') { let b = -1, bd = 0.5; E.forEach((e, i) => { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = i; } }); if (b >= 0) E.splice(b, 1); return; }
          if (Math.hypot(x, y) < 1.15 || E.length >= 8) return;
          E.push(t === 'src' ? { t: 'src', x, y, k: str.value } : t === 'snk' ? { t: 'src', x, y, k: -str.value } : t === 'vccw' ? { t: 'vtx', x, y, k: str.value } : { t: 'vtx', x, y, k: -str.value });
        });
        const imgs = () => {
          const out = [], a2 = deg(ang.value);
          out.push({ t: 'dbl', x: 0, y: 0, k: U.value, th: a2 });
          for (const e of E) { const d2 = e.x * e.x + e.y * e.y, zx = e.x / d2, zy = e.y / d2; out.push({ ...e, x: zx, y: zy, k: e.t === 'src' ? e.k : -e.k, img: true }); out.push({ t: e.t, x: 0, y: 0, k: e.t === 'src' ? -e.k : e.k, img: true }); }
          return out;
        };
        let info = {};
        v.render(() => {
          const real = [{ t: 'uni', k: U.value, th: deg(ang.value) }, ...E], I = imgs(), all = img.value ? [...real, ...I] : real;
          const lines = streamlines((x, y) => (img.value && x * x + y * y < 1.003 ? null : elemVel(all, x, y, 0.06)), [-4.8, 4.8, -2.5, 2.5], { sep: 0.22, step: 0.045, seeds: [[-4.7, 0.3]] });
          drawLines(s, lines, { color: 'accent', width: 1.15, alpha: 0.85 });
          s.circle(0, 0, 1, { fill: 'muted', fillAlpha: img.value ? 0.55 : 0.18, color: 'ink', width: 2.4 });
          for (const e of E) s.dot(e.x, e.y, { r: 8, color: e.t === 'src' ? (e.k > 0 ? 'green' : 'red') : e.k > 0 ? 'purple' : 'orange' });
          if (img.value) for (const e of I) { if (e.t === 'dbl') continue; s.dot(e.x, e.y, { r: e.x === 0 && e.y === 0 ? 4 : 6, hollow: true, color: e.t === 'src' ? (e.k > 0 ? 'green' : 'red') : e.k > 0 ? 'purple' : 'orange' }); }
          const pts = []; let mx = 0;
          for (let k = 0; k <= 360; k += 2) { const th = deg(k), x = Math.cos(th), y = Math.sin(th), u = elemVel(all, x, y, 0.001) || [0, 0], ur = u[0] * x + u[1] * y; pts.push([k, ur]); mx = Math.max(mx, Math.abs(ur)); }
          q.hline(0, { color: 'muted', alpha: 0.6 }); q.path(pts, { color: img.value ? 'green' : 'red', width: 2.6 });
          info = { mx };
        });
        v.readout(() => `largest normal velocity on the circle: $${img.value ? v.sci(info.mx + 1e-18, 1) : v.fix(info.mx, 3)}$${img.value ? ' — the circle is a streamline' : ' — without the images fluid streams through the cylinder'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'Flow in corners and round edges: w = zⁿ',
      statement: String.raw`The complex potential $w=Az^n$ ($A>0$ real, $n>\tfrac12$) has $\psi=Ar^n\sin n\theta$, which vanishes on the two rays $\theta=0$ and $\theta=\pi/n$. These are streamlines, so the flow is the potential flow inside a **wedge of angle $\pi/n$** whose sides are rigid walls. The speed is $|w'|=nAr^{n-1}$. For $n>1$ (wedge angle less than $\pi$: a corner, e.g. $n=2$, the right-angle corner) the speed vanishes at the apex like $r^{n-1}$: the corner is a stagnation point. For $n=1$ the flow is uniform along a flat wall. For $\tfrac12<n<1$ (wedge angle between $\pi$ and $2\pi$: flow round an edge) the speed grows without bound at the apex like $r^{-(1-n)}$; for the flat plate, $n=\tfrac12$, as $r^{-1/2}$.`,
      idea: String.raw`Every power $z^n$ is analytic in the sector away from $0$ (4.4), and $\operatorname{Im}(r^ne^{in\theta})=r^n\sin n\theta$ is zero on the two rays that bound the sector. Differentiating gives $w'=nAz^{n-1}$, hence the power law in the speed; its exponent changes sign at $n=1$. The map $z\mapsto z^n$ opens or closes angles by the factor $n$ and is conformal away from the origin (rca-14.2), which is why the wall condition is preserved. The infinite speed at a sharp convex edge is where the ideal-fluid theory stops describing real flow: the fluid separates, or the edge is rounded.`,
      caption: String.raw`Set the exponent $n$ (the wedge angle is $\pi/n$ and is drawn). Blue contours are $\psi$ (streamlines) and orange are $\phi$ (equipotentials); the fluid fills the white sector. The right panel plots the wall speed $|w'|=nr^{n-1}$ against distance $r$ from the apex on logarithmic axes: a straight line of slope $n-1$ (compare the slope measured between two points of the curve in the readout). For $n>1$ it falls to zero toward the corner; for $n<1$ it rises without bound toward the edge. Drag the gold marker along the wall.`,
      deps: ['fluid-4.4', 'rca-14.2'],
      refs: ['Kundu §7.4'],
      tags: ['corner', 'power law', 'singularity'],
      scope: String.raw`Plane, ideal, irrotational flow in a wedge with straight walls; $n$ may be non-integer when the sector is a proper subset of the plane. Near any sharp corner of a more complicated boundary the flow looks like one of these (with $n=\pi/\text{angle}$).`,
      viz(v) {
        const ns = v.slider('exponent $n$ (wedge angle $\\pi/n$)', 0.5, 3, 2, { step: 0.05 });
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 420, weight: 1.1, title: 'flow in a wedge: $w=z^n$' });
        const q = v.stage({ x: [0.03, 3], y: [0.05, 20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, weight: 0.9, xlabel: 'distance from the apex $r$', ylabel: 'wall speed $|w\'|$', title: 'speed along the wall' });
        const M = s.handle(1.4, 0, { color: 'gold', r: 8, label: 'probe', labelPos: 'n', constrain: (x) => [clamp(Math.abs(x), 0.04, 2.1), 0] });
        let info = {};
        v.render(() => {
          const n = ns.value, W = Math.PI / n, wedge = Math.min(W, TAU);
          const ang = (x, y) => ((Math.atan2(y, x) % TAU) + TAU) % TAU;
          const psi = (x, y) => { const r = Math.hypot(x, y), th = ang(x, y); return th > W - 1e-9 || th < 1e-9 ? NaN : Math.pow(r, n) * Math.sin(n * th); };
          const phi = (x, y) => { const r = Math.hypot(x, y), th = ang(x, y); return th > W - 1e-9 || th < 1e-9 ? NaN : Math.pow(r, n) * Math.cos(n * th); };
          if (W < TAU - 1e-9) { const pts = [[0, 0]]; for (let k = 0; k <= 60; k++) { const th = W + ((TAU - W) * k) / 60; pts.push([3 * Math.cos(th), 3 * Math.sin(th)]); } s.poly(pts, { fill: 'muted', fillAlpha: 0.3, stroke: false, hatch: true }); }
          const lv = []; for (let k = -10; k <= 10; k++) lv.push(0.35 * k);
          s.contour(phi, lv, { color: 'orange', width: 1, res: 170, alpha: 0.8 }); s.contour(psi, lv.filter((x) => x > 0), { color: 'accent', width: 1.4, res: 170 });
          s.line(0, 0, 2.2, 0, { color: 'ink', width: 3 }); s.line(0, 0, 2.2 * Math.cos(wedge), 2.2 * Math.sin(wedge), { color: 'ink', width: 3 });
          s.dot(0, 0, { r: 4, color: 'red' });
          s.text(`angle ${v.fix((wedge * 180) / Math.PI, 0)}°`, 0.6 * Math.cos(wedge / 2), 0.6 * Math.sin(wedge / 2), { color: 'muted', size: 12 });
          q.fn((r) => n * Math.pow(r, n - 1), { color: 'accent', width: 2.6 });
          q.hline(1, { color: 'muted', alpha: 0.5, dash: true });
          const r1 = 0.1, r2 = 1, sl = Math.log((n * Math.pow(r2, n - 1)) / (n * Math.pow(r1, n - 1))) / Math.log(r2 / r1);
          q.dot(M.x, n * Math.pow(M.x, n - 1), { r: 7, color: 'gold' });
          info = { n, sl, sp: n * Math.pow(M.x, n - 1), r: M.x, ang: (wedge * 180) / Math.PI };
        });
        v.readout(() => `wedge angle $\\pi/n=${v.fix(info.ang, 1)}^\\circ$ · wall speed at $r=${v.fix(info.r, 2)}$: $nr^{n-1}=${v.fix(info.sp, 3)}$ · slope of the log–log line measured between $r=0.1$ and $r=1$: $${v.fix(info.sl, 3)}$ $=n-1$\n${info.n > 1 ? 'convex corner of fluid: the apex is a stagnation point (speed $\\to0$)' : info.n === 1 ? 'a flat wall: uniform flow' : 'flow round an edge: the speed grows without bound at the apex'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Conformal maps carry potential flows',
      statement: String.raw`Let $z=F(\zeta)$ be a conformal map (analytic with $F'\ne0$) from a region $D'$ of the $\zeta$-plane onto the flow region $D$ of the $z$-plane. If $W(\zeta)$ is the complex potential of a flow in $D'$ then
$$w(z)=W\big(F^{-1}(z)\big)$$
is the complex potential of a flow in $D$. Streamlines and equipotentials of $W$ are carried to those of $w$ (they remain orthogonal), a streamline that is a boundary of $D'$ maps to a boundary streamline of $D$, and the velocities are related by $\dfrac{dw}{dz}=\dfrac{dW/d\zeta}{dF/d\zeta}$. Circulation and flux through corresponding curves are the same. The Riemann mapping theorem applies to a proper simply connected plane domain; for a bounded Jordan body, its exterior with infinity included maps to the exterior disk with infinity fixed. Smooth boundary extension is needed when carrying surface velocities, and a zero derivative at a corner requires separate limiting analysis.`,
      idea: String.raw`Composition of analytic functions is analytic, so $W\circ F^{-1}$ is analytic and its real and imaginary parts are conjugate harmonic functions: a legitimate flow. Because $\psi$ is simply carried along, level sets of $\psi$ map to level sets and the boundary streamline stays a streamline. The map preserves angles at every point where $F'\neq0$ (rca-14.2), so orthogonality of the two families is kept, while the speed is rescaled by $|F'|$: wherever the map stretches lengths the flow slows down and vice versa (the chain rule above).`,
      caption: String.raw`Drag the eight radial handles to specify a positive log-radius interpolant. The dashed candidate boundary comes from a relaxed Fourier implementation of Theodorsen's nonlinear boundary correspondence. A residual below $10^{-4}$, positive sampled polar-angle increments and nonzero sampled map derivatives allow a numerical flow illustration; failure withholds the mapped flow and surface speed. These finite tests do not certify global conformality. The right camera includes the outline, candidate and any mapped streamlines. Changing shape recomputes both flows, including the circle-plane stream scale needed for unit physical far-stream speed.`,
      deps: ['fluid-4.4', 'rca-14.2', 'rca-14.8'],
      refs: ['Theodorsen, NACA Report411, Theory of Wing Sections of Arbitrary Shape, pp229–234 and237 (appendix)'],
      credit: 'Nonlinear boundary correspondence: Theodore Theodorsen, NACA Report411; the Fourier discretization here is a numerical implementation',
      verify: false,
      tags: ['conformal map', 'Theodorsen', 'obstacle'],
      scope: String.raw`Plane, ideal, irrotational flow; simply connected obstacle. The numerical method here needs a star-shaped outline (a single-valued radius as a function of angle) and moderate aspect ratio.`,
      viz(v){
        const al=v.slider('stream angle (deg)',-30,30,10,{step:1}),gm=v.slider('clockwise circulation $\\Gamma$',-3,3,0,{step:.05});
        const a=v.stage({x:[-3.2,3.2],y:[-2.4,2.4],equal:true,axes:false,height:400,title:'circle plane: capacity-scaled stream'}),s=v.stage({x:[-3.2,3.2],y:[-2.4,2.4],equal:true,axes:false,height:400,title:'candidate map and requested outline'});
        const R0=[1.45,1,.62,.8,1.2,.8,.62,1],TH=R0.map((_,k)=>TAU*k/8),H=TH.map((t,k)=>s.handle(R0[k]*Math.cos(t),R0[k]*Math.sin(t),{color:'gold',r:7,constrain:(x,y)=>{const c=Math.cos(t),sn=Math.sin(t),r=clamp(x*c+y*sn,.35,2.2);return[r*c,r*sn];}}));
        let key='',mp=null,Rf=null,lines=[],flowKey='',info={};
        v.render(()=>{
          const rr=H.map(h=>Math.hypot(h.x,h.y)),k=rr.join(',');if(k!==key){key=k;Rf=CA.radiusInterpolant(rr);mp=CA.mapCandidate(Rf);}
          const angle=deg(al.value),G=gm.value,U=mp.capacity,fk=key+'|'+angle+'|'+G;
          if(flowKey!==fk){flowKey=fk;lines=streamlines((x,y)=>{if(x*x+y*y<1.004)return null;const d=CA.circleDerivative([x,y],angle,G,U);return[d[0],-d[1]];},[-3.2,3.2,-2.4,2.4],{sep:.22,step:.045,seeds:[[-3.1,.2]]});}
          drawLines(a,lines,{color:'accent',width:1.1,alpha:.85});a.circle(0,0,1,{fill:'muted',fillAlpha:.5,color:'ink',width:2.4});
          const mapped=mp.accepted?lines.map(L=>L.map(p=>mp.zOf(p))):[],outline=Array.from({length:513},(_,j)=>{const t=TAU*j/512,r=Rf(t);return[r*Math.cos(t),r*Math.sin(t)];}),V=CA.bounds([...outline,...mp.boundary,...mapped.flat()]);s.setView(V.x,V.y);
          if(mp.accepted)drawLines(s,mapped,{color:'accent',width:1.1,alpha:.85});
          s.poly(outline,{fill:'muted',fillAlpha:.5,color:'ink',width:2.4});s.path([...mp.boundary,mp.boundary[0]],{color:mp.accepted?'green':'red',width:1.6,dash:[5,4]});
          let vm=null;if(mp.accepted){vm=0;for(let j=0;j<720;j++)vm=Math.max(vm,cabs(CA.mappedVelocity(mp,cpolar(1,TAU*(j+.5)/720),angle,G)));}else s.text('unresolved map',0,0,{color:'red',align:'center'});
          info={it:mp.it,error:mp.error,accepted:mp.accepted,minDerivative:mp.minDerivative,minAngleStep:mp.minAngleStep,vm,cap:U,flowKey,rr,V,mapped,boundary:mp.boundary};
        });
        v.legend([['accent','circle flow; mapped only after finite checks'],['green','candidate boundary: passed finite checks',{dash:true}],['red','unresolved candidate',{dash:true}]]);
        v.readout(()=>`Theodorsen iteration: ${info.it} steps; sampled radial residual $${v.sci(info.error,2)}$; ${info.accepted?'finite checks passed':'unresolved — mapped flow and speed withheld'}\ncapacity $${v.fix(info.cap,4)}$ scales the circle stream to physical far-field speed 1; sampled minimum $|F'|=${v.sci(info.minDerivative,2)}$${info.vm===null?'':`; sampled surface maximum speed $${v.fix(info.vm,4)}$`}\n128 angular nodes, 56 Laurent modes; boundary checks are finite, not a proof of injectivity or an exact maximum.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16', kind: 'Theorem', name: 'Circulation as a free parameter',
      statement: String.raw`Consider the exterior of a single smooth, simply connected bounded body in the plane, with a prescribed uniform stream at infinity. A regular incompressible irrotational velocity tangent to the body has one free circulation. Write $\Gamma$ positive clockwise: a clockwise loop of winding number one has integral $\Gamma$, a counterclockwise loop has $-\Gamma$, and a contractible fluid loop has zero. Once this circulation is fixed, the regular potential flow is unique. Its local potential gains $\Gamma$ on a clockwise circuit; the velocity itself is single-valued. In the whole plane, regular everywhere with the prescribed far stream, the only such flow is the uniform stream and its circulation is zero.`,
      idea: String.raw`An exterior conformal map carries the circle solution to the body. For the circle, $W(z)=U(z+a^2/z)+i\Gamma\log z/(2\pi)$ supplies arbitrary circulation while preserving zero normal velocity and the far stream. For uniqueness, subtract two solutions with the same circulation: the difference has a single-valued harmonic potential. Green's identity, zero normal derivative on the body and the decaying far-field difference force its Dirichlet energy to vanish. Merely saying that a potential can be many-valued does not establish uniqueness. Removing the body also requires regularity throughout the plane: a hidden point vortex would violate that assumption. Potential-flow boundary conditions alone do not select $\Gamma$; additional physics such as a Kutta condition is needed for a sharp trailing edge.`,
      caption: String.raw`Drag each loop's centre or radius handle. The numerical integral is explicitly **clockwise**. A loop encircling the cylinder approaches $\Gamma$; a fluid loop staying outside without enclosing it approaches zero. Loops intersecting, touching or lying inside the solid are invalid and grey. The readout shows quadrature residuals rather than claiming exact numerical equality. The camera includes both loops; radii are constrained to $0.1$–$3.5$, the full domain of the right plot. Switching off the body chooses the everywhere-regular uniform stream.`,
      deps: ['fluid-4.2', 'fluid-4.9', 'rca-10.40', 'vcalc-5.7'],
      refs: ['MIT 18.354, 2015 notes, §§18.4 and19.1–19.3; regular exterior uniqueness argument given here'],
      credit: 'Circle circulation solution and conformal construction: MIT 18.354 author notes',
      verify: false, tags: ['circulation', 'multiply connected', 'Kutta'],
      scope: String.raw`One smooth impermeable body, slip condition, no singularities in the fluid. The velocity difference after matching circulation decays sufficiently for the exterior Green identity. Several disjoint bodies require a circulation for each boundary component. The demonstration uses a unit circle and unit far-stream speed, in chosen units.`,
      viz(v){
        const gs=v.slider('clockwise circulation $\\Gamma$',-4,4,2,{step:.1}),body=v.toggle('cylinder present',true);
        const s=v.stage({x:[-4,4],y:[-2.5,2.5],equal:true,axes:false,height:400,weight:1.4,title:'clockwise loop integrals'}),q=v.stage({x:[0,3.65],y:[-4.5,4.5],axes:'box',gutter:true,height:400,weight:.85,xlabel:'radius of the blue loop',ylabel:'clockwise circulation',title:'full allowed radius range'});
        const centre=(color,x,y,label)=>s.handle(x,y,{color,r:7,label,labelPos:'nw',constrain:(x,y)=>[clamp(x,-3,3),clamp(y,-2,2)]});
        const CA=centre('accent',-.2,.2,'A'),CB=centre('orange',2.8,1.3,'B');
        const radius=(C,color,x,y)=>s.handle(x,y,{color,r:6,constrain:(x,y)=>{const dx=x-C.x,dy=y-C.y,d=Math.hypot(dx,dy),r=clamp(d,.1,3.5);return d?[C.x+r*dx/d,C.y+r*dy/d]:[C.x+.1,C.y];}});
        const RA=radius(CA,'accent',1.9,.2),RB=radius(CB,'orange',3.45,1.3);
        for(const [C,R] of[[CA,RA],[CB,RB]]){let old=[C.x,C.y];C.onDrag=()=>{R.set(R.x+C.x-old[0],R.y+C.y-old[1]);old=[C.x,C.y];};}
        let lines=[],key='',info={};
        v.render(()=>{
          const field=(x,y)=>BA.cylinderVelocity(x,y,gs.value,body.value),k=body.value+'|'+gs.value;
          const rA=Math.hypot(RA.x-CA.x,RA.y-CA.y),rB=Math.hypot(RB.x-CB.x,RB.y-CB.y),gA=BA.loopCirculation(CA.x,CA.y,rA,gs.value,body.value),gB=BA.loopCirculation(CB.x,CB.y,rB,gs.value,body.value);
          const x0=Math.min(-4,CA.x-rA-.25,CB.x-rB-.25),x1=Math.max(4,CA.x+rA+.25,CB.x+rB+.25),y0=Math.min(-2.5,CA.y-rA-.25,CB.y-rB-.25),y1=Math.max(2.5,CA.y+rA+.25,CB.y+rB+.25);s.setView([x0,x1],[y0,y1]);
          const cache=k+'|'+[x0,x1,y0,y1].map(x=>x.toFixed(2)).join(',');if(cache!==key){key=cache;lines=streamlines((x,y)=>body.value&&x*x+y*y<1.004?null:field(x,y),[x0,x1,y0,y1],{sep:.3,step:.055,seeds:[[-3.9,.3]]});}
          drawLines(s,lines,{color:'accent',width:1,alpha:.55});if(body.value)s.circle(0,0,1,{fill:'muted',fillAlpha:.55,color:'ink',width:2.4});
          for(const[C,r,g,color]of[[CA,rA,gA,'accent'],[CB,rB,gB,'orange']])s.circle(C.x,C.y,r,{color:g.value===null?'muted':color,width:3,fill:g.value===null?'muted':color,fillAlpha:.06});
          q.hline(0,{color:'muted',alpha:.6});if(body.value)q.hline(gs.value,{color:'green',dash:true,alpha:.8});
          const pts=Array.from({length:70},(_,j)=>{const r=.05*(j+1),g=BA.loopCirculation(CA.x,CA.y,r,gs.value,body.value);return g.value===null?null:[r,g.value];});q.path(pts,{color:'accent',width:2.6});if(gA.value!==null)q.dot(rA,gA.value,{r:7,color:'accent'});
          info={gA,gB,rA,rB,x0,x1,y0,y1};
        });
        v.legend([['accent','loop A'],['orange','loop B'],['green','$\\Gamma$',{dash:true}]]);
        const show=(g)=>g.value===null?'not wholly in the fluid':`$${v.fix(g.value,5)}$ · residual $${v.sci(g.error,2)}$`;
        v.readout(()=>`clockwise integral A: ${show(info.gA)}\nclockwise integral B: ${show(info.gB)}\n${body.value?`imposed $\\Gamma=${v.fix(gs.value,2)}$`:'everywhere-regular uniform stream: circulation zero'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.17
    {
      num:'4.17',kind:'Phenomenon',name:'Added mass of an accelerating body',
      statement:String.raw`A rigid sphere translating in an unbounded incompressible ideal fluid at rest at infinity experiences the inertial force $F=-m_a\dot U$, where $m_a=\tfrac12\rho_fV$. A circular cylinder translating perpendicular to its axis has $m_a=\rho_f\pi a^2$ **per unit length**. The fluid kinetic energy is $\tfrac12m_aU^2$. For a constant upward buoyancy-minus-weight force, with $\sigma=\rho_b/\rho_f$, the model gives
$$\dot U=\frac{1-\sigma}{\sigma+C_a}g,\qquad C_a=\tfrac12\text{ (sphere)},\quad C_a=1\text{ (cylinder)}.$$
A very light sphere approaches upward acceleration $2g$, a cylinder $g$; a denser body accelerates downward. General shapes have an added-mass tensor rather than one universal scalar coefficient.`,
      idea:String.raw`With coordinates relative to the translating centre, the lab-frame potentials are $\phi=-Ua^3\cos\theta/(2r^2)$ for the sphere and $\phi=-Ua^2\cos\theta/r$ for the cylinder. Integrating $\tfrac12\rho_f|\nabla\phi|^2$ gives the added masses above. In lab-frame unsteady Bernoulli, the time derivative includes the motion of the centre. The surface pressure splits into an acceleration term $p_a=\rho_fa\dot U\cos\theta/2$ (sphere), or $\rho_fa\dot U\cos\theta$ (cylinder), and a quadratic term: $\rho_fU^2(9\cos^2\theta-5)/8$ or $\rho_fU^2(4\cos^2\theta-3)/2$. Integrating $-p_a\mathbf n$ gives $-m_a\dot U$; the quadratic terms are fore/aft even and give zero resultant. Hydrostatic buoyancy is accounted for separately in the driving force.`,
      credit:'Potential-flow energy derivation: Benny Lautrup, Physics of Continuous Matter, revision7.7, §16.6',verify:false,
      caption:String.raw`The first panel follows the body. Streamline geometry shows its instantaneous dipole velocity field, with direction reversed for sinking and no flow at rest. Red/blue arrows show the sign of **acceleration pressure only**, normalized within each setting; they disappear at neutral buoyancy. The green acceleration arrow reverses when density exceeds the fluid's. The height plot includes both complete finite curves without capping the naive acceleration. At $\sigma=0$ the naive massless-body formula is undefined and omitted. At small positive density its large height range makes the physical curve appear close to zero. Changing a control resets the clock.`,
      deps:['fluid-4.3','fluid-4.8'],refs:['Lautrup, Physics of Continuous Matter, rev7.7, §16.6, Eqs16-55–16-65; translating-frame pressure and energy integrals derived here'],tags:['added mass','buoyancy','unsteady'],
      scope:String.raw`Rigid sphere or infinite circular cylinder in unbounded ideal fluid, initially at rest; no wake, viscosity, surface deformation or wall correction. The $0$–$1.2$s trajectory is a chosen model interval, not a measured drag-free validity interval. The plotted sphere flow is a meridional slice of its three-dimensional dipole. Pressure-force coefficients are numerical midpoint quadratures, with residuals displayed.`,
      viz(v){
        const reset=()=>{v.t=0;v.invalidate();},shape=v.select('body',[{value:'sph',label:'sphere'},{value:'cyl',label:'circular cylinder'}],'sph',{onChange:reset}),sg=v.slider('density ratio $\\rho_b/\\rho_f$',0,1.6,.1,{step:.01,onChange:reset});
        const s=v.stage({x:[-3,3],y:[-2.3,2.3],equal:true,axes:false,height:400,weight:1.1,title:'dipole flow and acceleration pressure'}),q=v.stage({x:[0,1.2],y:[-1,5],axes:'box',gutter:true,height:400,weight:.9,xlabel:'time $t$ (s)',ylabel:'height gained (m)',title:'released from rest: complete model curves'});
        let lines=[],key='',info={};
        v.animate(t=>{
          const sh=shape.value,sph=sh==='sph',sig=sg.value,{Ca,a,naive}=BA.addedMotion(sh,sig,G0),U=a*t,k=sh+'|'+Math.sign(U);
          if(k!==key){key=k;const sign=Math.sign(U),f=(x,y)=>{const r=Math.hypot(x,y);if(r<1.004||!sign)return null;const c=y/r,sn=x/r,ur=sign*c/r**(sph?3:2),ut=sign*sn/((sph?2:1)*r**(sph?3:2));return[ur*sn+ut*c,ur*c-ut*sn];};lines=streamlines(f,[-3,3,-2.3,2.3],{sep:.22,step:.04,seeds:[[.6,1.8]]});}
          drawLines(s,lines,{color:'accent',width:1.1,alpha:.75,arrows:true});s.circle(0,0,1,{fill:'gold',fillAlpha:.35,color:'ink',width:2.4});
          for(let j=0;j<24;j++){const th=TAU*(j+.5)/24,c=Math.cos(th),sn=Math.sin(th),p=BA.addedPressure(sh,c,U,a).acceleration;if(!p)continue;const L=.4*Math.abs(c),x=sn,y=c;if(p>0)s.arrow(x*(1+L),y*(1+L),x,y,{color:'red',width:1.6,head:5});else s.arrow(x,y,x*(1+L),y*(1+L),{color:'blue',width:1.6,head:5});}
          const arrow=.4*a/G0;if(a!==0){s.arrow(0,0,0,arrow,{color:'green',width:3.5});s.text('acceleration',.1,arrow/2,{color:'green',align:'left'});}
          const end=.5*a*1.44,ne=naive===null?null:.5*naive*1.44,lo=Math.min(0,end,ne??0),hi=Math.max(0,end,ne??0),pad=.1*(hi-lo)+.05;q.setView([0,1.2],[lo-pad,hi+pad]);q.hline(0,{color:'muted',alpha:.6});if(naive!==null)q.fn(x=>.5*naive*x*x,{color:'muted',width:2,dash:true,domain:[0,1.2]});q.fn(x=>.5*a*x*x,{color:'accent',width:2.8,domain:[0,1.2]});q.dot(t,.5*a*t*t,{r:7,color:'gold'});
          const ratio=BA.pressureForceCoefficient(sh);info={a,naive,Ca,ratio,sig,U,t,arrow,end,ne,lo:lo-pad,hi:hi+pad,pressureSign:Math.sign(a)};
        },{period:1.2,still:0});
        v.legend([['accent','with added mass'],['muted','naive finite-mass formula',{dash:true}]]);
        v.readout(()=>`$C_a=${info.Ca}$; pressure quadrature coefficient $${v.fix(info.ratio,7)}$ versus $-C_a$; residual $${v.sci(info.ratio+info.Ca,2)}$\nacceleration $${v.fix(info.a/G0,4)}g$, naive ${info.naive===null?'undefined at zero body mass':`$${v.fix(info.naive/G0,4)}g$`}; elapsed $${v.fix(info.t,2)}$s`);
      },
    },
  ],
};
