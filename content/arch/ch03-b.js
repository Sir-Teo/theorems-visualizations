// Architecture & Structural Form — Chapter 3: Arches and the line of thrust (items 3.8–3.14; 3.1–3.7 are in ch03.js)
//
// Sources checked (Oct 2026): see the header of ch03.js for Heyman (1966, 1969), the minimum-thickness literature, Hooke's anagram
// and Gaudí's hanging models. Additional sources used here:
//   Pointed arches: Nikolić, Savremena dostignuća u građevinarstvu, Subotica 2016, paper 019, Table 2 (minimum thickness t/R of
//     pointed arches by eccentricity ξ = e/(R−e) and embrace angle), used as a check of the engine for α = 90°.
//   Audited 3.10, 3.12 and 3.13: actual Rodríguez-Mayorga et al. 2015, Huerta 2006,
//     Derand's 1743 edition Part I chVI p10/plate1, Hooke 1676 p31 and Waller 1705 pxxi.
//     Authored exact plane/point-weight models are separate from those historical observations.
//     Source pages, independent derivations and native evidence: docs/verification/arch-buttresses-followup.md.

import { buttressPier } from './source-audit-buttress-pier.js';
import { pinnacle, proportion, hanging, HOOKE_PHRASE, HOOKE_LETTERS } from './source-audit-buttresses.js';

import { arch, archFromLine, thrustRows, thrustLP, thrustRange, thrustLine, hinges, collapseFactor, centralLine, bestFit, drawArch, drawThrust, momentCoef, rot, clamp, f2, blockAt, extradosY, drawSupport } from './ch03.shared.js';

const deg = (r) => (r * 180) / Math.PI;
const GAM = 22; // kN/m³, illustrative unit weight of masonry
function solve3(A, b) {
  const M = A.map((r, i) => [...r, b[i]]); const n = 3;
  for (let i = 0; i < n; i++) { let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; for (let r = i + 1; r < n; r++) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; } }
  const x = [0, 0, 0]; for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c]; x[i] = s / M[i][i]; } return x;
}
export default {
  collection: 'arch',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Spreading supports and cracking are not failure',
      statement: String.raw`An abutment never stays exactly where the mason put it: the ground settles, the thrust itself pushes the support outward. A masonry arch follows a small outward movement of its supports by opening three hinges, a crack on the intrados at the crown and a crack on the extrados at each haunch, and becomes a statically determinate three-hinge arch whose line of thrust is fixed by the three hinge points. The horizontal thrust falls to the minimum that fits the geometry (arch-3.5), the arch stays in equilibrium, and the cracks are not failure. Only when the movement is gross, so that the changing geometry carries the line of thrust out of the masonry, does the arch collapse; before that, the cracks are evidence of past movement rather than of present danger.`,
      idea: String.raw`A masonry arch has three redundant reactions, so a movement of its supports is a way of choosing among the admissible thrust lines of arch-3.5. Spreading lowers $H$ until the line touches the stone at the crown (extrados) and at the two haunches (intrados), the least thrust that fits; those three contacts are hinges, and a three-hinge arch is statically determinate (three moment equations fix the three reactions). As the spread grows the upper pieces rotate rigidly about the haunch hinges, the crown drops, the geometry changes and so does the thrust line; the thrust, which first fell to the minimum, now rises again as the arch flattens (for a three-hinge arch $H$ is the moment of the loads divided by the rise), and the arch is safe as long as the line of the three-hinge arch stays inside the stone (arch-3.5): the right-hand plot follows both.`,
      caption: String.raw`Slide the spread of the abutments (as a share of the span). The lower courses move out with the abutments, the upper pieces tilt about the haunch hinges (red discs) and the crown drops; the cracks are drawn to scale. The red line is the thrust line of the three-hinge arch. The plot follows the thrust of the three-hinge arch (it starts inside the dashed band of thrusts the intact arch allowed, then rises as the crown drops); the red zone is where its line of thrust has left the stone. Thin the ring to see it fail sooner.`,
      deps: ['arch-3.6'],
      see: ['arch-3.5', 'arch-3.14'],
      refs: ['Heyman'],
      scope: String.raw`Rigid voussoirs, small rotations treated exactly (rigid-body geometry), symmetric spreading of both abutments, no sliding, no crushing; hinge positions taken from the minimum-thrust line of the intact arch.`,
      tags: ['hinges', 'support movement', 'cracking'],
      viz(v) {
        const N = 24, tS = v.slider('thickness t / R', 0.12, 0.4, 0.2, { step: 0.005 }), sS = v.slider('spread of the abutments, share of the span (%)', 0, 40, 6, { step: 0.1 });
        const A = v.stage({ x: [-1.45, 1.45], y: [-0.35, 1.35], equal: true, axes: false, height: 330, weight: 1.5, title: 'the arch after the supports move apart' });
        const B = v.stage({ x: [0, 40], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'spread (% of span)', ylabel: 'thrust H / W of the three-hinge arch', title: 'how far can it spread?' });
        const ZERO = [0, 0];
        function pickHinges(g, rg) {
          const hs = hinges(g, [], rg.min, {}, 1e-6).filter((h) => h.side === 'a' || h.side === 'b'), half = g.half;
          const crown = hs.find((h) => h.j === half && h.side === 'b') || { j: half, side: 'b' };
          const L = hs.filter((h) => h.side === 'a' && h.j < half).sort((a, b) => b.j - a.j)[0] || { j: 1, side: 'a' };
          return { jL: L.j, half };
        }
        function spread(g, hz, s) {
          const half = hz.half, jL = hz.jL, jR = g.N - jL, d = (s / 100) * g.span / 2, PL = g.joints[jL].a, C = g.joints[half].b;
          let lo = -0.9, hi = 0, ok = true; const f = (al) => rot(C, PL, al)[0] - d;
          if (f(lo) < 0) ok = false; for (let i = 0; i < 60 && ok; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
          const al = (lo + hi) / 2, PR = [-PL[0], PL[1]];
          const trL = (p) => { const q = rot(p, PL, al); return [q[0] - d, q[1]]; }, trR = (p) => { const q = rot(p, PR, -al); return [q[0] + d, q[1]]; };
          const mvL = (p) => [p[0] - d, p[1]], mvR = (p) => [p[0] + d, p[1]];
          const bodyOf = (k) => (k < jL ? 'LL' : k < half ? 'LU' : k < jR ? 'RU' : 'RL'), tfK = (k, p) => ({ LL: mvL, LU: trL, RU: trR, RL: mvR })[bodyOf(k)](p);
          const jf = (j) => (j < jL ? mvL : j <= half ? trL : j <= jR ? trR : mvR), rt = (j) => (j < jL ? 0 : j <= half ? al : j <= jR ? -al : 0);
          const joints = g.joints.map((J, j) => { const f1 = jf(j), a = rt(j), c = Math.cos(a), sn = Math.sin(a); return { a: f1(J.a), b: f1(J.b), tau: [c * J.tau[0] - sn * J.tau[1], sn * J.tau[0] + c * J.tau[1]] }; });
          const blocks = g.blocks.map((b, k) => { const q = tfK(k, [b.cx, b.cy]); return { ...b, cx: q[0], cy: q[1] }; });
          const gT = { ...g, joints, blocks, c0: mvL(g.c0) };
          // three-hinge reaction: M = 0 at the haunch hinge (joint jL, intrados), the crown hinge (extrados) and the right haunch hinge
          const pts = [[jL, joints[jL].a], [half, joints[half].b], [jR, joints[jR].a]], co = pts.map(([j, p]) => momentCoef(gT, [], j, p));
          const u = solve3(co.map((c) => [c.cH, c.cV, 1]), co.map((c) => -c.cst));
          const tl = thrustLine(gT, [], u), exceed = Math.max(0, ...tl.map((q) => Math.max(-q.t, q.t - 1)));
          return { ok, al, gT, tf: tfK, tl, u, exceed, margin: -exceed, hz: pts.map((p) => p[1]) };
        }
        let M = null;
        const curveCache = new Map();
        v.render(() => {
          const g = arch({ R: 1, t: tS.value, N }), rg = thrustRange(g, []);
          if (!rg) { drawArch(v, A, g); A.corner('this ring cannot stand even before the supports move', 'tl', { color: 'red' }); M = null; return; }
          const hz = pickHinges(g, rg), key = tS.value.toFixed(4);
          if (!curveCache.has(key)) { const pts = []; for (let s = 0; s <= 40.001; s += 0.8) { const r = spread(g, hz, s); pts.push([s, r.ok ? 100 * r.exceed : 100, r.ok ? r.u[0] / g.W : NaN]); } curveCache.clear(); curveCache.set(key, pts); }
          const pts = curveCache.get(key), r = spread(g, hz, sS.value);
          drawArch(v, A, g, { fillAlpha: 0.04, joints: false, ink: 'faint' });
          drawArch(v, A, g, { tfBlock: (k, p) => r.tf(k, p), fillAlpha: 0.15 });
          const good = r.ok && r.exceed < 1e-6;
          drawThrust(v, A, r.tl, { color: good ? 'red' : 'orange', width: 2.4, bad: 'orange' });
          if (sS.value > 0) for (const p of r.hz) A.dot(p[0], p[1], { r: 5.5, color: 'red' });
          A.corner(sS.value === 0 ? 'intact arch (any admissible thrust)' : good ? 'three cracks, the arch stands' : 'the line has left the stone: collapse', 'tl', { color: good ? 'muted' : 'red' });
          const lim = pts.find((p, i) => i > 0 && p[1] > 1e-6), smax = lim ? pts[pts.indexOf(lim) - 1][0] + 0.4 : null;
          const ymax = Math.min(1.2, Math.max(0.3, ...pts.filter((p) => Number.isFinite(p[2])).map((p) => p[2]))) * 1.08;
          B.setView([0, 40], [0, ymax]);
          if (smax !== null) B.vband(smax, 40, { color: 'red', alpha: 0.1 });
          B.path(pts.filter((p) => Number.isFinite(p[2])).map((p) => [p[0], Math.min(p[2], ymax)]), { color: 'accent', width: 2.4 });
          B.hline(rg.Hmin / g.W, { color: 'green', width: 1.2, dash: [4, 3] }); B.hline(rg.Hmax / g.W, { color: 'green', width: 1.2, dash: [4, 3] });
          B.dot(sS.value, Math.min(r.u[0] / g.W, ymax), { r: 5.5, color: good ? 'green' : 'red' });
          M = { g, rg, r, pts, smax, good, hz };
        });
        v.legend([['red', 'thrust line of the three-hinge arch'], ['accent', 'its thrust'], ['green', 'thrusts allowed before cracking', { dash: true }], ['red', 'spread beyond which the line leaves the stone', { area: true }]]);
        v.readout(() => {
          if (!M) return 'The ring is below the minimum thickness: no thrust line fits (arch-3.7).';
          const { g, rg, r, smax } = M;
          return `Intact arch: any thrust from ${f2(rg.Hmin / g.W, 3)} to ${f2(rg.Hmax / g.W, 3)} of its weight. After a spread of ${f2(sS.value, 2)}% the three hinges fix $H = ${f2(r.u[0] / g.W, 3)}$ W (crown drop ${f2(g.joints[g.half].b[1] - r.gT.joints[g.half].b[1], 3)} R), and the line ${M.good ? 'stays inside the stone: **safe**' : `leaves the stone by ${f2(100 * r.exceed, 1)}% of the thickness: **not safe**`}. ${smax ? `For this ring the line leaves the stone at a spread of about ${f2(smax, 1)}% of the span.` : 'For this ring the line stays inside up to 40% of the span.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.9
    {
      num:'3.9',kind:'Concept',name:'Buttresses: bringing the thrust to the ground',
      statement:String.raw`An arch delivers an outward horizontal force and a downward reaction to its supports. A rectangular buttress must transmit their resultant to its base. Under the no-sliding, no-crushing plane model, an outer-toe moment condition checks outward overturning for those imposed reactions. Widening the pier or adding a centred top load can help. Increasing its height under the same arch reaction can make it worse: the horizontal force's lever arm also grows. The drawing separates this conditional equilibrium check from a whole-building assessment.`,
      idea:String.raw`At depth d, write $X(d)=[Vx_0+\gamma wd\,x_c-Hd]/[V+\gamma wd]$. With outer toe $x_o=x_i-w$ and pier axis $x_c=x_i-w/2$, the factor against outward overturning is $F(h)=V(x_0-x_o)/(Hh)+\gamma w^2/(2H)$. Its first term decreases with height; its limit is at least1 only when $w\ge\sqrt{2H/\gamma}$. This is an asymptotic criterion, not a necessary width for every finite-height pier. For the fixed arch used here, the maximum-H state also minimizes this factor over all admissible arch reactions: every reaction has $x_0\ge-3.25$ m and $V/H\ge V_*/H_*\approx2.109979923$, where the starred reaction is the maximum-H state and both bounds are attained there. Since $w\ge0.6>0.5$ m, these bounds and $H\le H_{\max}$ give the result. It is a property of this fixed example, not a theorem about arbitrary vaults.`,
      caption:String.raw`A fixed authored arch of mean radius 3 m and ring thickness 0.5 m (clear span 5.5 m), represented by 24 polygonal blocks. Change pier width/height and select a minimum, middle or maximum horizontal-thrust state. The complete curves show the required width for the two extreme states and the asymptotic width limits. At width 1.2 m, the maximum-thrust case satisfies the toe condition at height 1 m and fails at height 12 m. A middle-third label refers to the usual linear full-contact normal-stress assumption.`,
      deps:['arch-3.2'],see:['arch-3.10','arch-3.12'],refs:[],
      scope:String.raw`Authored finite polygon-block equilibrium with radial joints, masonry weight 22 kN/m³ and unit depth. The drawn arch uses exact polygon areas/centroids, not a certified continuous annular-arch minimum. Independent enumeration of all 30 reaction vertices and a positive dual certificate establish the stated fixed-case bound; source/proof details are retained in docs/verification/arch-buttress-pier-followup.md. The historical/geometrical context follows Huerta's complete “Geometry and equilibrium: The gothic theory of structural design” (2006), pp23–28, and the conditional use of plane no-tension analysis in Rodríguez-Mayorga et al. (2015), §5.1; neither paper supplies these authored dimensions. Foundation failure, material crushing, sliding, wind, support movements and a complete vault/three-dimensional building are excluded. A resultant outside the middle third would require tension under a linear full-contact stress distribution; it does not alone demonstrate overall collapse.`,
      verify:true,tags:['buttress','overturning'],
      viz(v){const width=v.slider('pier width w (m)',.6,4,1.2,{step:'any',decimals:6}),height=v.slider('pier height h (m)',1,12,4,{step:'any',decimals:6}),choice=v.select('fixed arch reaction',[{value:'min',label:'least thrust'},{value:'mid',label:'middle'},{value:'max',label:'greatest thrust'}],'max');const A=v.stage({x:[-6,6],y:[-5,4],equal:true,axes:false,height:350,title:'fixed arch and rectangular piers'}),B=v.stage({x:[0,12.8],y:[-.2,4.5],axes:'box',gutter:true,height:320,xlabel:'pier height h (m)',ylabel:'required width w (m)',title:'finite-height and asymptotic toe criteria'});let info;
        v.render(()=>{const p=buttressPier(width.value,height.value,choice.value);info=p;const I=p.selected,xmax=3+p.w+1.5;A.setView([-xmax,xmax],[-p.h-.9,4]);for(const b of p.blocks)A.poly(b.poly,{fill:'muted',fillAlpha:.14,color:'ink',width:.8});for(const sign of[-1,1])A.rect(sign<0?p.innerFace-p.w:-p.innerFace,-p.h,sign<0?p.innerFace:-p.innerFace+p.w,0,{fill:'muted',fillAlpha:.2,color:'ink',width:1.2});A.line(-xmax+.6,-p.h,xmax-.6,-p.h,{color:'faint',width:1});A.path(I.line,{color:'red',width:2.2});for(const sign of[-1,1]){A.path(I.curve.map(([x,y])=>[sign*x,y]),{color:p.inside?'red':'orange',width:2.4});A.dot(sign*I.base,-p.h,{r:5,color:p.inside?'green':'orange'});}A.line(I.limit,0,I.limit,-p.h,{color:'muted',width:1,dash:[3,4]});A.corner(p.inside?(p.middle?'inside middle third':'inside base'):'outside outer toe','tl',{color:p.inside?'muted':'orange'});
          const ymax=Math.max(4,...p.highCurve.map(q=>q[1]))*1.15;B.setView([0,12.8],[-.06*ymax,ymax]);B.path(p.lowCurve,{color:'green',width:2.1});B.path(p.highCurve,{color:'red',width:2.1});for(const[s,color]of[[p.min,'green'],[p.max,'red']])B.line(.25,s.infiniteWidth,12,s.infiniteWidth,{color,width:1,dash:[4,3]});B.dot(p.h,p.w,{r:6,color:'accent'});
        });v.legend([['red','maximum-H width / selected arch line'],['green','minimum-H width'],['muted','asymptotic position / dashed width limits'],['accent','selected pier'],['orange','selected resultant outside base']]);v.readout(()=>{const p=info,I=p.selected;return `Fixed arch weight ${f2(p.weight,6)} kN/m; selected H=${f2(I.H,6)}, V=${f2(I.V,6)} kN/m. Outer-toe clearance ${f2(I.clearance,6)} m; factor ${f2(I.FS,6)}. ${p.inside?'The selected reaction satisfies the toe condition.':'The selected reaction fails the toe condition.'} Required width at this height: ${f2(p.needLow,6)} m for minimum H; ${f2(p.needHigh,6)} m for maximum H. Increasing height at fixed width/reaction decreases the factor. The maximum-H guarantee applies to this fixed arch; it does not establish whole-building safety.`;});
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10', kind: 'Concept', name: 'Flying buttresses and pinnacles',
      statement: String.raw`A flying buttress can transfer a vault's lateral thrust to an outer pier. A centred pinnacle adds vertical load and can improve that pier's resistance to outward overturning. The effect depends on the force, its height and the position of the added weight: a pinnacle is not a universal guarantee of stability. Rodríguez-Mayorga, Yanes-Bustamante and Sáez-Pérez's investigation of Santiago in Jerez shows why the actual geometry matters: its high flyers contributed little to the calculated balancing of the vault, and the position of pinnacles worsened an already unbalanced arrangement.`,
      idea: String.raw`Here a massless straight strut delivers $H$ and $V=H\tan\theta$ to the inner face $x_i$ of a rectangular pier. Its axis is $x_c=x_i+w/2$, its outer toe $x_o=x_i+w$, and its upper part weighs $W_t$. At depth $d$ below the strut, moment balance gives $X(d)=[Vx_i+(P+W_t+\gamma wd)x_c+Hd]/[V+P+W_t+\gamma wd]$. The outer-toe condition is $Hd\le Vw+(P+W_t+\gamma wd)w/2$. Both sides are affine in $d$, so checking the top and base checks every intermediate horizontal cut. This gives $P_{\min}=\max(0,2Hh/w-2V-W_t-\gamma wh)$.`,
      caption: String.raw`An authored plane section, not a surveyed church. Change the vault thrust, pier width and centred pinnacle load. The full plot shows the exact minimum load for the displayed pier, including values above the initial setting. “Admissible” means the resultant stays between the two faces on every horizontal cut; equality at the toe is a limiting case.`,
      deps: ['arch-3.9'], see: ['arch-3.5', 'arch-4.2'], refs: [],
      credit: 'Authored plane equilibrium example; Rodríguez-Mayorga, Yanes-Bustamante and Sáez-Pérez, case study',
      scope: String.raw`Unit thickness into the page; masonry weight 22 kN/m³; strut endpoints (0,13) and (3.6,10.2) m; pier top 14 m. The strut is massless, so there is no additional vertical load hidden in its reaction. P is an imposed centred top force; the pictured spire is a symbol, not a volume-to-weight calculation. Assumes no sliding, crushing or foundation failure and does not test the flyer itself, wind, vault or whole church. Source: “Analysis and Diagnosis of the Church of Santiago in Jerez de la Frontera (Spain)”, Informes de la Construcción 67(540), e127 (2015), §§4–5, Figs 6–8, doi:10.3989/ic.15.030. The source's measured building and numerical analysis are not reproduced.`,
      verify: false, tags: ['gothic', 'pinnacle', 'flying buttress'],
      viz(v) {
        const H=v.slider('vault thrust H (kN/m)',10,120,60,{step:'any',decimals:6}),w=v.slider('pier width w (m)',.8,3,1.5,{step:'any',decimals:6}),P=v.slider('centred pinnacle force P (kN/m)',0,3000,260,{step:'any',decimals:6});
        const A=v.stage({x:[-2.6,11],y:[-1,20.5],equal:true,axes:false,height:400,title:'a strut and a loaded pier'}),B=v.stage({x:[0,130],y:[-150,3100],axes:'box',gutter:true,height:310,xlabel:'H (kN/m)',ylabel:'P (kN/m)',title:'outer-toe equilibrium threshold'});let info;
        v.render(()=>{const p=pinnacle(H.value,w.value,P.value);info=p;
          A.setView([-2.6,Math.max(10.5,...p.curve.map(q=>q[0]))+1],[ -1,20.5]);A.line(-2,0,9,0,{color:'faint'});A.rect(-1,0,0,15.2,{fill:'muted',fillAlpha:.12,color:'ink'});A.poly([[0,13.3],[3.6,10.5],[3.6,9.9],[0,12.7]],{fill:'muted',fillAlpha:.2,color:'ink'});A.rect(p.xi,0,p.toe,14,{fill:'muted',fillAlpha:.18,color:'ink'});A.poly([[p.xi+.12*p.w,14],[p.toe-.12*p.w,14],[p.axis,17.4]],{fill:'orange',fillAlpha:.22,color:'orange'});A.arrow(-1.8,13,-.1,13,{color:'gold',head:8});if(p.P>0)A.arrow(p.axis,19,p.axis,17.7,{color:'gold',head:8});A.path([[0,13],[3.6,10.2]],{color:'muted',width:2.1});A.path(p.curve,{color:p.admissible?'red':'orange',width:2.5});A.dot(p.base,0,{color:p.admissible?'green':'orange',r:5});
          const curve=Array.from({length:81},(_,j)=>{const h=10+110*j/80;return[h,pinnacle(h,p.w,0).need];}),ymax=Math.max(600,p.P,...curve.map(q=>q[1]))*1.15;B.setView([0,130],[-.06*ymax,ymax]);B.path(curve,{color:'accent',width:2.4});B.dot(p.H,p.P,{color:p.admissible?'green':'orange',r:6});
        });v.legend([['red','admissible resultant'],['orange','resultant outside pier'],['accent','minimum P for this pier'],['gold','imposed forces']]);v.readout(()=>{const p=info;if(!p)return'';return `Vertical strut reaction ${f2(p.vertical,3)} kN/m; upper pier weight ${f2(p.topWeight,3)} kN/m. Minimum centred P ${f2(p.need,3)} kN/m; selected ${f2(p.P,3)} kN/m. Base resultant ${f2(p.toe-p.base,4)} m inside the outer toe (negative means outside). ${p.admissible?'Every horizontal cut satisfies the face inequalities.':'The outer-toe inequality fails at the base.'} This is conditional equilibrium, not a whole-building safety test.`;});
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Pointed versus round arches',
      statement: String.raw`A pointed (two-centred) arch is built from two circular arcs whose centres lie on the springing line, each on the far side of the axis, at distance $e$ from it; the eccentricity $\xi = e/(R - e)$ measures the pointedness ($\xi = 0$ is the round arch, $\xi = 1$ the equilateral arch whose radius equals its span). For the same span a pointed arch is taller, and so its thrust lines are steeper: its horizontal thrust per unit of weight is smaller, the least thickness that can stand under its own weight falls (from $t/R = 0.1075$ for the semicircle to about $0.040$ for the equilateral arch, with radial joints), and a concentrated load at the crown, such as a heavy keystone, a lantern or a pinnacle, can be larger for the same ring. The price is paid elsewhere: more height for the same span and, in a vault, more wall.`,
      idea: String.raw`For an arch with a crown hinge and two haunch hinges, $H = M/f$: the bending moment at the crown that the weights induce, divided by the rise $f$, so more rise means less thrust (arch-3.2). A load at the crown is the interesting case: the funicular polygon of one concentrated load is two straight lines meeting at the load, a peak, and a pointed profile follows it much more closely than a semicircle does, so the thrust line stays inside a much thinner ring. The numbers on the plots are computed by the linear program of arch-3.5 for radial joints; the values for the minimum thickness agree with the tabulated ones for $\alpha = 90^\circ$ to within about 1%.`,
      caption: String.raw`Slide the pointedness $\xi$ from round (0) through equilateral (1) to lancet (3) and watch the arch, its lowest and highest thrust lines, and the crown load it can carry (gold arrow; its share of the arch's own weight is the slider). The plots show, for the current thickness, how the allowed thrust and the largest crown load change with $\xi$. Thin the ring so that the round arch falls and the pointed one stands.`,
      deps: ['arch-3.2'],
      see: ['arch-3.7', 'arch-4.2'],
      refs: ['Heyman'],
      scope: String.raw`Plane two-centred arch of half-span 1, constant thickness, radial joints, self-weight plus a point load on the crown; the result depends on the way the joints are cut (Gaspar et al. 2021 study this for pointed arches), here radial.`,
      tags: ['pointed arch', 'gothic', 'thrust'],
      viz(v) {
        const N = 40, half = N / 2;
        const xS = v.slider('pointedness ξ = e/(R − e)', 0, 3, 1, { step: 0.05 }), tS = v.slider('thickness t (half-span = 1)', 0.04, 0.3, 0.12, { step: 0.005 }), pS = v.slider('crown load, share of the arch weight', 0, 2, 0.15, { step: 0.01 });
        const PUB = [[0, 0.10748], [0.1, 0.08856], [0.2, 0.07587], [0.25, 0.0709], [0.33, 0.06399], [0.5, 0.0537], [0.6, 0.04902], [0.8, 0.0418], [1, 0.03964], [1.5, 0.03855], [2, 0.03588], [2.5, 0.03303], [3, 0.03038]];
        const A = v.stage({ x: [-1.4, 1.4], y: [-0.2, 3.1], equal: true, axes: false, height: 340, weight: 1.2, title: 'the arch' });
        const B = v.stage({ x: [0, 3], y: [0, 0.5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 220, xlabel: 'pointedness ξ', ylabel: 'H / W', title: 'allowed horizontal thrust' });
        const C = v.stage({ x: [0, 3], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 220, xlabel: 'pointedness ξ', ylabel: 'largest crown load / W', title: 'crown load the ring can carry' });
        const mk = (xi, t) => arch({ R: 1 + xi, e: xi, t, N });
        const crown = (g, P, vr) => [{ x: -1e-3, P: P / 2, k: half - 1, var: vr }, { x: 1e-3, P: P / 2, k: half, var: vr }];
        const cache = new Map();
        const curves = (t) => {
          const key = t.toFixed(4); if (cache.has(key)) return cache.get(key);
          const out = []; for (let i = 0; i <= 20; i++) { const xi = i * 0.15, g = mk(xi, t), r = thrustRange(g, []), c = r ? collapseFactor(g, crown(g, g.W, true)) : null; out.push({ xi, lo: r ? r.Hmin / g.W : NaN, hi: r ? r.Hmax / g.W : NaN, cap: c ? c.lam : NaN }); }
          if (cache.size > 10) cache.clear(); cache.set(key, out); return out;
        };
        let M = null;
        v.render(() => {
          const xi = xS.value, t = tS.value, g = mk(xi, t), rg = thrustRange(g, []), cv = curves(t);
          A.setView([-1.4, 1.4], [-0.2, g.rise + 0.55]);
          drawArch(v, A, g, { fillAlpha: 0.12 });
          const P = pS.value * g.W, cf = rg ? collapseFactor(g, crown(g, g.W, true)) : null, ok = rg && cf && P <= cf.lam * g.W + 1e-9;
          if (rg) {
            for (const [u, c] of [[rg.min, 'accent'], [rg.max, 'green']]) { const tl = thrustLine(g, [], u); for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: 'muted', width: 1.2, dash: [4, 3] }); }
            if (P > 0) { const lo = crown(g, P, false), c = centralLine(g, lo); if (c) drawThrust(v, A, thrustLine(g, lo, c.u), { color: 'red', width: 2.6 }); const yt = g.joints[half].b[1]; A.arrow(0, yt + 0.25 + 0.6 * Math.min(1, pS.value), 0, yt + 0.02, { color: 'gold', width: 3.5, head: 10 }); }
            else { const c = centralLine(g, []); if (c) drawThrust(v, A, thrustLine(g, [], c.u), { color: 'red', width: 2.6 }); }
          }
          A.corner(!rg ? 'no thrust line fits: the arch falls under its own weight' : ok ? 'stands under the crown load' : 'the crown load is too big: it collapses', 'tl', { color: ok ? 'muted' : 'red' });
          // plots
          const good = cv.filter((c) => Number.isFinite(c.lo));
          B.setView([0, 3], [0, Math.max(0.3, ...good.map((c) => c.hi)) * 1.1]);
          if (good.length) B.poly([...good.map((c) => [c.xi, c.hi]), ...good.slice().reverse().map((c) => [c.xi, c.lo])], { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.4 });
          B.vline(xi, { color: 'accent', width: 1.6, dash: [4, 3] });
          const capg = cv.filter((c) => Number.isFinite(c.cap)); C.setView([0, 3], [0, Math.max(0.5, ...capg.map((c) => c.cap)) * 1.1]);
          if (capg.length) C.path(capg.map((c) => [c.xi, c.cap]), { color: 'gold', width: 2.6 });
          C.vline(xi, { color: 'accent', width: 1.6, dash: [4, 3] }); C.hline(pS.value, { color: 'red', width: 1.2, dash: [3, 3] });
          if (rg && cf) C.dot(xi, cf.lam, { r: 5.5, color: 'gold' });
          M = { g, rg, cf, ok, P, tmin: null };
        });
        v.legend([['green', 'allowed thrust (plot)', { area: true }], ['red', 'line of thrust under the crown load'], ['muted', 'lowest and highest lines, self-weight only', { dash: true }], ['gold', 'crown load']]);
        v.readout(() => {
          if (!M) return '';
          const { g, rg, cf } = M, xi = xS.value;
          const f = bestFit((t) => mk(xi, t), () => [], {}, 1e-3, 0.6, 22), pub = PUB.find((p) => Math.abs(p[0] - xi) < 0.011);
          const tmin = f ? f.t / g.R : NaN;
          return `Rise ${f2(g.rise, 2)} for a span of 2; ${rg ? `self-weight thrust from ${f2(rg.Hmin / g.W, 3)} to ${f2(rg.Hmax / g.W, 3)} of the arch weight (${f2(rg.Hmin, 1)} to ${f2(rg.Hmax, 1)} kN/m)` : 'this ring is below the minimum thickness'}. Minimum thickness $t_{\\min}/R = ${f2(tmin, 4)}$${pub ? ` (tabulated: ${pub[1]})` : ''}; largest crown load ${cf ? f2(cf.lam, 2) + ' W = ' + f2(cf.lam * g.W, 1) + ' kN/m' : '—'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12', kind: 'Method', name: 'Medieval rules of proportion for buttresses',
      statement: String.raw`Huerta's survey describes a Gothic buttress rule reproduced from Derand: divide the transverse arch's intrados into three equal arc lengths, join a third-point to its adjacent springing, and extend that segment by its own length. The extended point fixes the buttress's outer edge by vertical projection. For a semicircle the resulting depth is one quarter of the clear span. Huerta also records a late-Gothic German rule with wall thickness s/10 and buttress depth three times that, 3s/10, adjusted for masonry quality and tapered with height. These were rules used with a builder's wider experience, not universal structural guarantees.`,
      idea: String.raw`The geometrical construction scales exactly with the span. But not every historical rule is proportional: Huerta explicitly distinguishes Rodrigo Gil de Hontañón's non-proportional arithmetic rules. Here the geometry is compared with a separate, authored rectangular-pier benchmark. Write its height as h/s=η, width as w/s=u, and imposed top forces as V=βγs², H=αγs², with β=1/4 and α=β(H/V). The base toe condition is βu+ηu²/2≥αη, hence u_min=2αη/[β+sqrt(β²+2αη²)]. All quantities are per unit depth. This checks the chosen imposed forces, not the unknown thrust of a historical vault.`,
      caption: String.raw`Purple draws the equal-arc construction, including its extension and projection. The grey pier has the selected rule's width. Its red or orange curve is the resultant under the explicitly selected H/V and the benchmark vertical load. The plot compares the three geometric widths with the exact benchmark width as the pier gets taller. The displayed arch is a geometric guide, not a solved masonry ring.`,
      deps: ['arch-3.9'], see: ['arch-3.10', 'arch-3.11'], refs: [],
      credit: 'Gothic construction reproduced by Derand; Huerta survey',
      scope: String.raw`Source: Santiago Huerta, “Geometry and equilibrium: The gothic theory of structural design”, The Structural Engineer, 17 January 2006, pp23–28, especially p24 Fig3 and pp25–28. The full survey and its reproduced diagram were checked, as were Derand’s 1743 edition, Part I chapter VI p10 and plate1 (figures N–Q), doi:10.3931/e-rara-4695. This is an actual later edition, not a claim to have read the 1643 original. Huerta distinguishes the rule’s Gothic vault-buttress context from its later use for simple arches. Earlier manuscripts, first-publication priority and use in individual buildings are not certified here. Circular and two-centred ideal profiles have clear span 2; their equal arc lengths are analytic, not polyline estimates. The independent pier model ignores sliding, crushing, foundations and vault compatibility. Its three widths are illustrative comparisons, not prescriptions.`,
      verify: false, tags: ['proportion', 'gothic', 'buttress'],
      viz(v){
        const shape=v.select('arch profile',[{value:'round',label:'round'},{value:'equi',label:'equilateral'},{value:'lancet',label:'lancet'},{value:'segment',label:'segmental 120°'}],'round'),rule=v.select('width rule',[{value:'derand',label:'geometrical construction'},{value:'quarter',label:'span / 4'},{value:'three-tenths',label:'3 span / 10'}],'derand'),height=v.slider('pier height / clear span',.2,3,1,{step:'any',decimals:6}),ratio=v.slider('imposed force ratio H / V',0,1.5,.4,{step:'any',decimals:6});
        const A=v.stage({x:[-3.4,1.4],y:[-2.5,2.8],equal:true,axes:false,height:360,title:'geometric rule and separate pier benchmark'}),B=v.stage({x:[0,3.2],y:[-.05,1.2],axes:'box',gutter:true,height:310,xlabel:'pier height / span',ylabel:'width / span',title:'proportions versus imposed-load benchmark'});let info;
        v.render(()=>{const p=proportion(shape.value,rule.value,height.value,ratio.value);info=p;const g=p.geometry,minx=Math.min(-1-2*p.width,...p.curve.map(q=>q[0]),g.extension[0]);A.setView([minx-.5,1.5],[Math.min(-2*p.height,g.extension[1])-.7,g.rise+.7]);A.path(g.points,{color:'ink',width:2.2});A.rect(-1-2*p.width,-2*p.height,-1,0,{fill:'muted',fillAlpha:.18,color:'ink'});A.path(p.curve,{color:p.admissible?'red':'orange',width:2.2});A.path([g.third,g.spring,g.extension],{color:'purple',width:1.6,dash:[4,3]});A.line(g.extension[0],g.extension[1],g.extension[0],0,{color:'purple',dash:[3,3]});A.line(-1,0,g.extension[0],0,{color:'purple',width:2.2});for(const q of[g.third,g.other,g.spring,g.extension])A.dot(...q,{color:'purple',r:4});
          const ymax=Math.max(.35,p.width,...p.comparison.map(q=>q[1]))*1.2;B.setView([0,3.2],[-.06*ymax,ymax]);B.path(p.comparison,{color:'accent',width:2.4});for(const[y,color]of[[g.width/2,'purple'],[.25,'gold'],[.3,'orange']])B.line(.05,y,3,y,{color,width:1.4,dash:[4,3]});B.dot(p.height,p.width,{color:p.admissible?'green':'orange',r:6});
        });v.legend([['purple','equal-arc construction'],['gold','s/4'],['orange','3s/10'],['accent','benchmark minimum width']]);v.readout(()=>{const p=info;if(!p)return'';return `Construction width ${f2(p.geometry.width/2,6)} s; selected width ${f2(p.width,6)} s. For imposed H/V=${f2(p.ratio,6)} and V=γs²/4, benchmark minimum ${f2(p.need,6)} s. Base clearance ${f2(p.baseClearance,6)} s. ${p.admissible?'The benchmark pier satisfies the outer-toe condition.':'The benchmark pier fails the outer-toe condition.'} This comparison does not determine a historical vault's thrust.`;});
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13', kind: 'Paper', name: 'A Description of Helioscopes, and Some Other Instruments',
      paper:{authors:'Robert Hooke',year:1676,title:'A Description of Helioscopes, and Some Other Instruments',venue:'London, p31, invention 2; Richard Waller, Life of Hooke, in The Posthumous Works (1705), pxxi',url:'https://doi.org/10.3931/e-rara-2171'},
      introduces:['arch-3.1'],
      statement:String.raw`On p31 Hooke announces an arch-and-abutment result as a letter cipher in the second entry of a list of proposed inventions. Waller's biographical introduction to the Posthumous Works prints its solution on pxxi: *ut pendet continuum flexile, sic stabit contiguum rigidum inversum*. The principle reverses a tensile equilibrium into a compressive one while preserving the same vertical loads. It does not say that every finite stone ring following a catenary carries its own weight at arbitrarily small thickness: the distribution and points of application of the loads must agree.`,
      idea:String.raw`For this exact finite example, 23 equal downward point loads sit at equally spaced internal nodes between supports $x=-1$ and $x=1$. The 24 straight links are massless. Their vertical support reactions are $V=23/2$. At internal node j, the beam moment is $M_j=V(x_j+1)-\sum_{i<j}(x_j-x_i)$. Horizontal tension $H$ gives hanging height $-M_j/H$. After inversion, horizontal compression $H$ and the same weights balance at every node. Every positive reciprocal thrust $k=1/H$ gives height $kM_j$. For internal nodes only, put $L=\max(0,\max_j((c_j-t/2)/M_j))$ and $U=\min_j((c_j+t/2)/M_j)$. A vertical envelope centred at $c_j$ contains a funicular exactly when $L\le U$ and $U>0$. The supports have zero height; their inequalities are automatic. Straight segments and envelope edges make the nodal inequalities sufficient between nodes too.`,
      caption:String.raw`Left: an exact polygon of 24 massless links carrying 23 equal node weights, calibrated to the chosen rise. Right: its inversion, a vertically measured envelope, and a funicular for those same fixed weights. A local bump changes only the envelope. The analytic interval test determines whether any positive-thrust funicular fits this family; the readout gives its minimum vertical thickness. It is not a finite-voussoir self-weight calculation. The registered decipher control switches between the normalised letter multiset and Waller's Latin solution.`,
      deps:['arch-2.1'],refs:[],credit:'R. Hooke, 1676',
      scope:String.raw`The original 1676 p31 and Waller's actual 1705 pxxi were inspected in ETH's scans: doi:10.3931/e-rara-2171 and doi:10.3931/e-rara-88704. Letters are recomputed from Waller's sentence, with v normalised to u and spaces removed; this is not a diplomatic transcription of either cipher's typography. Waller calls the curve a catenary; the model deliberately uses discrete point weights and straight massless links rather than a continuous uniform chain. The right-hand envelope has vertical, not normal, thickness. No finite stone weights, friction, crushing, support movements or whole-arch safety are simulated.`,
      verify:false,tags:['hooke','history','funicular'],
      viz(v){const rise=v.slider('polygon rise / half-span',.2,1.3,.7,{step:'any',decimals:6}),thickness=v.slider('vertical envelope thickness',.005,.4,.05,{step:'any',decimals:6}),bump=v.slider('local envelope bump',-.2,.2,0,{step:'any',decimals:6}),position=v.slider('bump position',-.85,.85,-.4,{step:'any',decimals:6}),decipher=v.select('cipher display',[{value:'letters',label:'normalised letters'},{value:'solution',label:'deciphered solution'}],'letters');
        const S=v.stage({x:[-1.25,1.25],y:[-1.6,.3],equal:true,axes:false,height:290,title:'massless links with fixed node weights'}),A=v.stage({x:[-1.25,1.25],y:[-.4,1.8],equal:true,axes:false,height:320,title:'the same weights in compression'});let info;
        v.render(()=>{const p=hanging(rise.value,thickness.value,bump.value,position.value);info=p;S.setView([-1.25,1.25],[-p.rise-.25,.25]);A.setView([-1.25,1.25],[Math.min(-.15,...p.envelope.map(q=>q[1]),...p.line.map(q=>q[1]))-.2,Math.max(.3,...p.envelope.map(q=>q[1]),...p.line.map(q=>q[1]))+.3]);S.path(p.chain,{color:'red',width:2.2});for(const q of p.chain)S.dot(...q,{color:'accent',r:2.5});for(const j of[3,9,15,21])S.arrow(p.chain[j][0],p.chain[j][1]+.1,p.chain[j][0],p.chain[j][1]-.1,{color:'gold',head:5});A.poly(p.envelope,{fill:'muted',fillAlpha:.18,color:'ink',width:1.2});A.path(p.centreline,{color:'muted',dash:[4,3],width:1.2});A.path(p.line,{color:p.admissible?'red':'orange',width:2.5});for(let j=0;j<p.line.length;j++)A.dot(...p.line[j],{color:j===0||j===24?'ink':'accent',r:j===0||j===24?4:2.5});
        });v.legend([['red','hanging / admissible compression polygon'],['orange','best fitting polygon outside envelope'],['muted','envelope centre'],['gold','representative fixed node weights']]);v.readout(()=>{const p=info;if(!p)return'';const cipher=decipher.value==='solution'?`**${HOOKE_PHRASE}** — as the flexible line hangs, so the inverted rigid assembly stands.`:`Normalised solution letters (${HOOKE_LETTERS.length}): ${HOOKE_LETTERS}`;return `${cipher}\nAnalytic minimum vertical thickness ${f2(p.minimum,6)}; selected ${f2(p.thickness,6)}. ${p.admissible?'A positive-thrust funicular for these same 23 weights fits the envelope.':'No positive-thrust funicular for these same weights fits this envelope.'} Drawn horizontal compression ${f2(1/p.k,6)} in node-weight units; vertical reaction ${f2(p.V,3)} at each support. The links are massless; this does not certify a finite stone ring under its own weight.`;});
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'The Stone Skeleton',
      paper: { authors: 'Jacques Heyman', year: 1966, title: 'The stone skeleton', venue: 'International Journal of Solids and Structures 2 (2): 249–279', doi: '10.1016/0020-7683(66)90018-7' },
      introduces: ['arch-3.4', 'arch-3.5'],
      statement: String.raw`Heyman's paper argues that the safety of a masonry structure is a question of geometry and equilibrium, not of stress. If masonry has no tensile strength, has compressive strength that is never approached, and does not slide (arch-3.4), a structure of it is a rigid-plastic body to which the theorems of plastic theory apply: a thrust line inside the masonry, in equilibrium with the loads, proves the structure safe (arch-3.5), and collapse comes by the formation of hinges (arch-3.6). He works the idea out for the arch and for the Gothic cathedral, where the flying buttress and the quadripartite vault are treated in some detail, with a brief look at domes. The practical consequence is that safety is measured by proportions, not by stress: an arch and a copy of it ten times larger are equally safe in this sense, while their stresses differ tenfold.`,
      idea: String.raw`Earlier writers, from Couplet (1730), had used thrust lines and hinge mechanisms, and the same three conditions were the working hypotheses for calculating masonry arches throughout the nineteenth century; the dominant tool, however, was the search for the one true state of stress, which depends on small support movements nobody can know. Heyman recognised that, with the three conditions made explicit, the masonry structure falls within limit analysis, so that one admissible state suffices (the safe theorem), and the true state, with its cracks and settlements, need not be found. The paper introduces the three assumptions (arch-3.4) and the safe theorem (arch-3.5) as the working basis of the theory, and applies them to arches, vaults and buttresses; later work (arch-3.7, arch-3.8) turned them into numbers such as the minimum thickness and the effect of settlement.`,
      caption: String.raw`The paper's own figures and numbers are not reproduced (I did not have the full text): what is recreated is its argument. The map on the right shows, for a semicircular arch with a point load at the chosen position, which combinations of ring thickness and load stand (green) and which do not (red); drag the disc. The arch on the left shows the thrust line that fits, or, when none does, the line at the instant of collapse with its hinges. The readout gives the two safety measures that follow: the geometric factor $t/t_{\min}$ and the load factor, and the stress, which grows with the span.`,
      deps: ['arch-3.2', 'solid-4.10'],
      refs: [],
      credit: 'J. Heyman, 1966',
      scope: String.raw`Reconstruction of the argument for a semicircular arch with radial joints, self-weight 22 kN/m³ and one point load; the paper's own examples (cathedral section, vault, flying buttress) and numbers are not used. The attribution of the individual results to this paper rather than to the later arch literature is as stated in secondary sources (the paper itself was not read).`,
      verify: true,
      tags: ['heyman', 'limit analysis', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Line_of_thrust' },
      viz(v) {
        const N = 24, xS = v.slider('load position x / R', -0.92, 0.92, -0.5, { step: 0.01 }), spS = v.slider('span of the real arch (m)', 5, 150, 20, { log: true });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.25, 1.45], equal: true, axes: false, height: 340, weight: 1.35, title: 'the arch' });
        const B = v.stage({ x: [0.1, 0.4], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'ring thickness t / R', ylabel: 'point load / arch weight', title: 'map of safety: drag the disc' });
        const hnd = B.handle(0.2, 0.25, { color: 'accent', r: 8, constrain: { x: [0.1, 0.4], y: [0, 3] } });
        const bound = new Map();
        const curve = (x) => { const key = x.toFixed(3); if (bound.has(key)) return bound.get(key); const pts = []; for (let i = 0; i <= 30; i++) { const t = 0.1 + (0.3 * i) / 30, g = arch({ R: 1, t, N }), c = collapseFactor(g, [{ x, P: g.W, var: true, k: blockAt(g, x) }]); pts.push([t, c ? c.lam : 0]); } if (bound.size > 8) bound.clear(); bound.set(key, pts); return pts; };
        let M = null;
        v.render(() => {
          const x = xS.value, pts = curve(x), t = hnd.x, share = hnd.y, g = arch({ R: 1, t, N }), k = blockAt(g, x), loadsV = [{ x, P: g.W, var: true, k }], cf = collapseFactor(g, loadsV);
          const ymax = Math.min(3, Math.max(0.6, ...pts.map((p) => p[1]))) * 1.05; B.setView([0.1, 0.4], [0, ymax]); if (hnd.y > ymax) hnd.set(hnd.x, ymax);
          B.poly([...pts.map((p) => [p[0], Math.min(p[1], ymax)]), [0.4, 0], [0.1, 0]], { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.8 });
          B.poly([...pts.map((p) => [p[0], Math.min(p[1], ymax)]), [0.4, ymax], [0.1, ymax]], { fill: 'red', fillAlpha: 0.1, color: 'red', stroke: false });
          B.text('stands', 0.3, ymax * 0.12, { size: 12, color: 'green', align: 'center' }); B.text('collapses', 0.3, ymax * 0.92, { size: 12, color: 'red', align: 'center' });
          drawArch(v, A, g, { fillAlpha: 0.12 });
          const yl = extradosY(g, x), lam = cf ? cf.lam : 0, stands = cf && share <= lam + 1e-9;
          let u = null, hs = [];
          if (stands) { const lo = [{ x, P: share * g.W, k }], c = centralLine(g, lo); if (c) { u = c.u; const rg = thrustRange(g, lo); if (rg) for (const uu of [rg.min, rg.max]) { const tl = thrustLine(g, lo, uu); for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: 'muted', width: 1.1, dash: [4, 3] }); } drawThrust(v, A, thrustLine(g, lo, c.u), { color: 'green', width: 2.8 }); } }
          else if (cf) { u = cf.u; drawThrust(v, A, thrustLine(g, loadsV, cf.u), { color: 'red', width: 2.8 }); hs = hinges(g, loadsV, cf.u, {}, 1e-6); for (const h of hs) { const p = h.side === 'a' ? g.joints[h.j].a : g.joints[h.j].b; A.dot(p[0], p[1], { r: 5.5, color: 'red' }); } }
          else A.corner('this ring cannot even stand alone', 'tl', { color: 'red' });
          if (share > 0) A.arrow(x, yl + 0.15 + 0.6 * Math.min(1, share), x, yl + 0.02, { color: 'gold', width: 3.5, head: 10 });
          if (cf) A.corner(stands ? 'a thrust line fits: safe' : 'no thrust line fits: collapse (hinges shown)', 'tl', { color: stands ? 'green' : 'red' });
          const fit = share > 0 ? bestFit((tt) => arch({ R: 1, t: tt, N }), (gg) => [{ x, P: share * gg.W, k: blockAt(gg, x) }], {}, 0.05, 0.6, 22) : bestFit((tt) => arch({ R: 1, t: tt, N }), () => [], {}, 0.05, 0.6, 22);
          let F = 0; if (u) { const tl = thrustLine(g, stands ? [{ x, P: share * g.W, k }] : loadsV, u); F = Math.max(...tl.map((q) => Math.hypot(...q.F))); }
          M = { g, cf, share, stands, tmin: fit ? fit.t : NaN, F, t, lam };
        });
        v.legend([['green', 'thrust line that fits'], ['red', 'line at collapse, hinges'], ['muted', 'lowest and highest lines', { dash: true }]]);
        v.readout(() => {
          if (!M || !M.cf) return 'This ring cannot stand even under its own weight.';
          const R = spS.value / 2, stress = (M.F * R) / M.t / 1000;
          return `Ring $t/R = ${f2(M.t, 3)}$, point load ${f2(M.share, 2)} of the arch weight at $x = ${f2(xS.value, 2)}\\,R$. Collapse load ${f2(M.lam, 2)} W, so the **load factor** is ${M.share > 0 ? f2(M.lam / M.share, 2) : '∞'}; the thinnest ring that would carry this load is $t_{\\min}/R = ${f2(M.tmin, 3)}$, so the **geometric factor** is $t/t_{\\min} = ${f2(M.t / M.tmin, 2)}$ — neither depends on the size of the arch.\nFor a span of ${spS.value.toFixed(0)} m the largest force in the arch is about ${f2((M.F * R * R) / 1, 0)} kN/m, a mean stress of roughly ${f2(stress, 2)} MPa over the joint: it grows in proportion to the span while the safety measures above do not.`;
        });
      },
    },
  ],
};
