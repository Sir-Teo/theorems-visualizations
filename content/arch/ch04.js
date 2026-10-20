// Architecture & Structural Form — Chapter 4: Vaults and domes (items 4.1–4.5; 4.6–4.11 are in ch04-b.js)
//
// Sources checked (Oct 2026):
//   Membrane theory of a spherical shell under its own weight: vertical equilibrium of the cap above the cut gives the meridional force
//   N_phi = -w a / (1 + cos phi); the normal equilibrium gives N_theta = w a (1/(1 + cos phi) - cos phi); N_theta = 0 at
//   cos phi (1 + cos phi) = 1, i.e. cos phi = (sqrt5 - 1)/2, phi = 51.83° (51°49'). This is the classical result (Timoshenko & Woinowsky-Krieger,
//   Flügge); the sign change and its dependence on the thickness profile are discussed by Rapallini (1997) and in Sajtos et al. (2019) according
//   to a literature search (Penn State "Geometry of the crack-free spherical masonry dome"; Princeton CASCE "Spherical domes II").
//   For a vertical load p per unit PLAN area: N_phi = -p a / 2, N_theta = -(p a / 2) cos 2 phi.
//   Everything is recomputed numerically from vertical and radial equilibrium (see ch04.shared.js: membrane()).
//   Cracked domes as sliced arches: Heyman, The Stone Skeleton (CUP 1995) and "Equilibrium of shell structures" (OUP 1977) — cited at book level;
//   the thrust-line check of a gore is computed with the chapter 3 engine, not copied from a table.
//   Groin and rib vaults: corrected max-surface geometry, authored vertical-load accounting and
//   a conditional plane-rib candidate are isolated in vault-audit.js; no complete 3D force network is claimed.

import { crossVault, domeSlice, sphereMid, profile, membrane, hoopZero, deg, archFromLine, bestFit, centralLine, thrustLine, thrustRange, thrustLP, hinges, drawThrust, clamp, f2, placeLabels, blockAt } from './ch04.shared.js';
import { vaultHeight, vaultAccounting, vaultRib, validVaultCamera, canonicalVaultYaw } from './vault-audit.js';

const kN = (x, d = 3) => `${Math.abs(x) < 0.05 ? 0 : x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;

export default {
  collection: 'arch',
  chapter: 4,
  title: 'Vaults and domes',
  summary: String.raw`Vaults extend the arch into space, and domes extend it around a vertical axis. A dome carries load by meridional compression and by hoop forces that turn to tension low down, which is why masonry domes crack along meridians and why their builders used chains, rings and thickened haunches. From the Pantheon to Brunelleschi to modern thrust-network analysis, the same equilibrium reasoning applies.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1', kind: 'Concept', name: 'Barrel and groin vaults',
      statement: String.raw`A **barrel vault** extrudes an arch along a straight line. A square **groin vault** joins four cylindrical webs along two diagonal groins. For the equal semicircular cylinders shown here, centred on $[-R,R]^2$, its upper surface is
$$f(s)=\sqrt{R^2-s^2},$$
$$z=\max\{f(x),f(y)\}.$$
Each perimeter edge is an open semicircular arch; each diagonal is a semiellipse of rise $R$ and span $2\sqrt2R$. Geometry alone does not determine how a masonry vault distributes its forces. Parallel barrel strips and web strips supported by the groins are two **chosen models**, with continuous wall reactions in the first and corner weight allocation in the second.`,
      idea: String.raw`Give the surface the areal weight $w=\gamma t$. Integrating cylindrical arc length gives the barrel area $2\pi R^2$ and groin area $4(\pi-2)R^2$. In our groin allocation, a web strip is a short arch between two groins. Its curved length is $2R\arcsin(|s|/R)$; assigning half its weight to either endpoint and adding the adjacent web gives $dW=q(s)\,ds$ at the diagonal point $(s,\pm s)$: the density is per metre of the coordinate $s$.
$$q(s)=2wR\arcsin(|s|/R).$$
It vanishes at the crown and increases towards the corners. Its integral is half the bay weight, so symmetry assigns a quarter to each corner. The orange arrows additionally use a three-hinged diagonal **plane-arch candidate under those vertical loads only**, as in arch-1.5. They omit the horizontal web reactions; this accounting is not a complete three-dimensional equilibrium network. Block's alternative networks show why a real vault need not follow a unique skeleton.

Arc length as the integral of speed (pma 6.27) supplies the web-weight calculation. Parametrize a circular cross-section by $(R\sin u,R\cos u)$, whose speed is $R$; the strip between the groins has angular half-width $\arcsin(|s|/R)$ and hence length $2R\arcsin(|s|/R)$. Multiplying that length by the areal weight and allocating half to each endpoint yields the stated $q(s)$ after adding the adjacent web. Extruding the semicircular arc over length $2R$ likewise gives the barrel area. This integration determines weight in the chosen allocation, not the omitted horizontal web reactions or a complete vault equilibrium.`,
      caption: String.raw`Compare both surfaces, one to three bays, and wall openings. Circles show the chosen corner weight allocation; the barrel bands show the unchanged model's required continuous line support. Orange arrows indicate the conditional plane-arch thrust, on a common scale within each plan. The opening slider changes the wall drawing only: it supplies no lintel, redistribution or safety calculation. Drag the space view to rotate it. Here $R=3$ m, $t=0.3$ m and $\gamma=22$ kN/m³.`,
      deps: ['arch-3.2', 'arch-1.5', 'pma-6.27'], see: ['arch-4.2', 'arch-4.11'], tags: ['vaults', 'load path'], refs: [],
      scope: String.raw`Authored square-bay geometry and thin-surface areal-weight accounting. The corner allocation and vertical-only plane arches are conditional examples; horizontal web forces, shell equilibrium, support adequacy, finite-thickness intersections and construction are not solved. Openings are geometry, not permission to remove a supporting wall.`,
      credit: 'Source discussion: Philippe Block (2009), §§2.1.2–2.1.3, 4.1.1 and 6.2; Santiago Huerta (2009), pp.842–843. The formulas and allocation here are an authored illustration.',
      verify: false,
      links: { source: 'https://web.mit.edu/masonry/papers/Block_PhD_2009.pdf', discussion: 'https://oa.upm.es/2497/1/HUERTA_PON_2009_01A.pdf' },
      viz(v) {
        const R = 3, HW = 2.4, cv = vaultAccounting();
        const kind = v.select('vault', [{ value: 'barrel', label: 'barrel vault' }, { value: 'groin', label: 'groin vault' }], 'groin');
        const nb = v.slider('bays along the nave', 1, 3, 2, { int: true });
        const open = v.slider('wall openings (share of wall length)', 0, .8, 0, { step: 'any', decimals: 6, fmt: x => Number(x.toPrecision(6)).toString() });
        const S3 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, minWidth: 240, title: 'space: geometry, not a force network' });
        const sc = v.scene3(S3, { yaw: -.75, pitch: .42, axes: false });
        v.shareState('vault camera', { get: () => ({ yaw: canonicalVaultYaw(sc.yaw), pitch: sc.pitch }), validate: validVaultCamera, set: d => { sc.yaw = d.yaw; sc.pitch = d.pitch; } });
        const PL = v.stage({ x: [-2, 20], y: [-5.2, 5.2], equal: true, axes: false, height: 300, minWidth: 240, title: 'plan: chosen vertical weight allocation' });
        let info;
        v.render(() => {
          const n = nb.value, groin = kind.value === 'groin', cloud = [], P = (x,y,z) => { const p = [x-n*R,y,z]; cloud.push(p); return p; };
          sc.yaw = canonicalVaultYaw(sc.yaw); sc.begin();
          sc.poly([P(0,-R,-HW),P(2*R*n,-R,-HW),P(2*R*n,R,-HW),P(0,R,-HW)], { fill: 'muted', fillAlpha: .04, color: 'faint' });
          for (const sy of [-1,1]) for (let b=0;b<n;b++) {
            const x=2*R*b, a=x+R*(1-open.value), c=x+R*(1+open.value);
            const wall=(l,r,lo,hi)=>sc.poly([P(l,sy*R,lo),P(r,sy*R,lo),P(r,sy*R,hi),P(l,sy*R,hi)],{fill:'muted',fillAlpha:.12,color:'muted',width:.7});
            if (!open.value) wall(x,x+2*R,-HW,0);
            else { wall(x,a,-HW,0); wall(c,x+2*R,-HW,0); wall(a,c,-HW,-.75*HW); wall(a,c,-.25*HW,0); }
          }
          const G=16;
          for(let b=0;b<n;b++) for(let i=0;i<G;i++) for(let j=0;j<G;j++) {
            const x=-R+2*R*i/G,y=-R+2*R*j/G,dx=2*R/G;
            const ps=[[x,y],[x+dx,y],[x+dx,y+dx],[x,y+dx]], color=groin&&Math.abs(x+dx/2)>Math.abs(y+dx/2)?'orange':'accent';
            sc.poly(ps.map(([a,c])=>P(2*R*b+R+a,c,vaultHeight(a,c,R,groin?'groin':'barrel'))),{fill:color,fillAlpha:.22,edge:true,color,width:.55,alpha:.3});
          }
          if(groin) for(let b=0;b<n;b++) for(const sign of[-1,1]) sc.path(Array.from({length:49},(_,i)=>{const s=-R+2*R*i/48;return P(2*R*b+R+s,sign*s,Math.sqrt(Math.max(0,R*R-s*s)));}),{color:'red',width:2.3});
          for(let b=0;b<=n;b++) for(const sy of[-1,1]) sc.line(P(2*R*b,sy*R,0),P(2*R*b,sy*R,-HW),{color:'ink',width:3},1);
          const projected=cloud.map(sc.P), mx=Math.max(...projected.map(p=>Math.abs(p[0]))), my=Math.max(...projected.map(p=>Math.abs(p[1])));
          S3.setView([-mx*1.18-.15,mx*1.18+.15],[-my*1.18-.15,my*1.18+.15]); sc.flush();
          PL.setView([-1.5,2*R*n+1.5],[-5.2,5.2]);
          for(let b=0;b<n;b++) PL.rect(2*R*b,-R,2*R*(b+1),R,{color:'muted',fill:'muted',fillAlpha:.04,width:1});
          for(let b=0;b<=n;b++) for(const sy of[-1,1]) PL.rect(2*R*b-.22,sy*R-.22,2*R*b+.22,sy*R+.22,{fill:'ink',fillAlpha:.2,color:'ink'});
          if(groin) {
            for(let b=0;b<n;b++) for(const sign of[-1,1]) PL.line(2*R*b,-sign*R,2*R*(b+1),sign*R,{color:'red',width:1.3,alpha:.65});
            for(let b=0;b<=n;b++) for(const sy of[-1,1]) {
              const adj=b===0||b===n?1:2, fx=b===0?-1:b===n?1:0, fy=adj*sy, x=2*R*b,y=sy*R;
              PL.circle(x,y,.18*Math.sqrt(adj),{fill:'accent',fillAlpha:.4,color:'accent',width:1.5});
              PL.arrow(x,y,x+.48*fx,y+.48*fy,{color:'orange',width:2,head:6});
              PL.text(`${Math.round(adj*cv.corner)}`,x,y-sy*.85,{size:11,color:'accent',align:'center'});
            }
          } else for(const sy of[-1,1]) for(let b=0;b<n;b++) {
            const x=2*R*b; PL.rect(x,sy*R,x+2*R,sy*(R+.5),{fill:'accent',fillAlpha:.25,color:'accent',width:1});
            for(const u of[.5,1.5]) PL.arrow(x+u*R,sy*(R+.55),x+u*R,sy*(R+1.15),{color:'orange',width:1.7,head:6});
            if(open.value) PL.line(x+R*(1-open.value),sy*R,x+R*(1+open.value),sy*R,{color:'red',width:2.5,dash:[3,3]});
          }
          info={n,groin,opening:open.value};
          v.legend(groin?[['accent','corner weight, kN',{dot:true}],['red','groins'],['orange','conditional plane thrust']]:[['accent','required line support',{area:true}],['red','opening: transfer not solved',{dash:true}],['orange','plane-strip thrust']]);
        });
        v.readout(()=>info.groin
          ? `${info.n} bay(s): **${kN(cv.Wgroin)} per bay**, ${kN(cv.corner)} per bay-corner; an interior pier receives two such weight shares. One diagonal receives ${kN(cv.Wgroin/2)}. The vertical-only three-hinged candidate has $H=${f2(cv.Hdiagonal,2)}$ kN along that diagonal. Horizontal web reactions and complete 3D equilibrium are omitted. Wall openings ${(100*info.opening).toFixed(0)}%: **no support-safety conclusion**.`
          : `${info.n} bay(s): **${kN(cv.Wbarrel)} per bay**; the unchanged strip model requires ${f2(cv.wall,2)} kN/m vertically along each wall and plane-strip thrust ${f2(cv.Hbarrel,2)} kN/m. Opening ${(100*info.opening).toFixed(0)}% of a wall requires an additional transfer/support model; this drawing supplies none.`);
      },
    },

    // ───────────────────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2', kind: 'Concept', name: 'Rib vaults and the Gothic skeleton',
      statement: String.raw`A **rib vault** has distinct arches along its groins and often along its bay edges, with webs between them. A skeleton of ribs is one useful structural interpretation, not a universal measured load path. Ribs and webs can interact in different ways, and alternative compression networks can carry load towards the corners. Here we impose the vertical web-weight allocation of arch-4.1 on a single diagonal rib and test **one specified plane-arch candidate**. This does not determine the actual force distribution of a Gothic vault.`,
      idea: String.raw`The diagonal is a semiellipse, not a semicircle: its half-span is $\sqrt2R$ and its rise is $R$. Divide its mean curve into 24 blocks, offset their joints normally by half the chosen rib depth, and compute each polygon's area and centroid. Integrate each web-load bin and its first moment, rather than replacing the whole web by a crown load. Symmetry gives $V=W/2$; moment balance of the left half fixes $H$ for a candidate passing through the mean springings and crown (arch-1.5). At every joint, balance moments to locate the resultant and check compressive force and containment (arch-3.2). A candidate leaving the rib rules out that candidate only. No universal depth-to-radius rule or monotone thickness conclusion follows.

The load positions in the rib calculation use the actual mass/centroid integrals of vcalc 4.9. For each positive-area polygonal rib block, uniform density gives its weight from area and its gravity line from the first area moment. For each web-load bin, integrating the nonnegative density and its position-weighted first moment similarly preserves both total vertical force and moment when it is replaced by one resultant. This is why a crown lump is generally not equivalent: matching total weight alone misses its moment about the springing. These exact load resultants do not supply the horizontal reactions omitted from the imposed plane-arch model.`,
      caption: String.raw`Lift off the webs, vary their areal-weight thickness, and change the rib depth. The space view shows mean rib curves with illustrative stroke widths; the plane view shows the actual 24 model blocks. Blue arrows are imposed vertical web loads, normalized to a common visible scale. Green segments connect joint-resultant points whose endpoint checks pass; orange marks a failed endpoint check. Support and crown dots mark the specified candidate's mean-line crossings. Drag the space view to rotate. Bay $6\times6$ m, rib width 0.3 m, masonry unit weight 22 kN/m³.`,
      deps: ['arch-4.1', 'arch-3.4', 'vcalc-4.9'], see: ['arch-3.5', 'arch-3.9', 'arch-3.10'], tags: ['gothic', 'ribs'], refs: [],
      scope: String.raw`Conditional two-dimensional rigid-block model: vertical loads only; no tension, unlimited compressive strength and no sliding are assumed. The web's horizontal reactions, edge-rib loads, shell compatibility, support motion, finite strength and construction sequence are omitted. All joint checks refer to this polygonal model and a numerical tolerance, not a masonry design certificate or proof of collapse.`,
      credit: 'Source discussion: Philippe Block (2009), §6.2, and Santiago Huerta (2009), pp.842–843. The 24-block candidate is an authored illustration, not a reconstruction of a particular building.',
      verify: false,
      links: { source: 'https://web.mit.edu/masonry/papers/Block_PhD_2009.pdf', discussion: 'https://oa.upm.es/2497/1/HUERTA_PON_2009_01A.pdf' },
      viz(v) {
        const R=3, web=v.toggle('webs in place',true), tw=v.slider('web thickness (m)',.08,.5,.15,{step:'any',decimals:6,fmt:x=>Number(x.toPrecision(6)).toString()}), dr=v.slider('rib depth (m)',.1,1,.7,{step:'any',decimals:6,fmt:x=>Number(x.toPrecision(6)).toString()});
        const S3=v.stage({x:[-4,4],y:[-4,4],equal:true,axes:false,height:330,minWidth:240,title:'space: mean rib curves and webs'}), sc=v.scene3(S3,{yaw:-.7,pitch:.38,axes:false});
        v.shareState('vault camera',{get:()=>({yaw:canonicalVaultYaw(sc.yaw),pitch:sc.pitch}),validate:validVaultCamera,set:d=>{sc.yaw=d.yaw;sc.pitch=d.pitch;}});
        const A=v.stage({x:[-5,5],y:[-.7,4.3],equal:true,axes:false,height:330,minWidth:240,title:'plane: one prescribed thrust candidate'});
        let model;
        v.render(()=>{
          const m=model=vaultRib({web:web.value,webThickness:tw.value,ribDepth:dr.value}), cloud=[], P=(x,y,z)=>{const p=[x,y,z-.8];cloud.push(p);return p;};sc.yaw=canonicalVaultYaw(sc.yaw);sc.begin();
          if(web.value) for(let i=0;i<16;i++) for(let j=0;j<16;j++) {
            const x=-R+2*R*i/16,y=-R+2*R*j/16,d=2*R/16,c=Math.abs(x+d/2)>Math.abs(y+d/2)?'orange':'accent';
            sc.poly([[x,y],[x+d,y],[x+d,y+d],[x,y+d]].map(([a,b])=>P(a,b,vaultHeight(a,b))),{fill:c,fillAlpha:.14+.3*tw.value,edge:false});
          }
          for(const sign of[-1,1]) sc.path(Array.from({length:49},(_,i)=>{const s=-R+2*R*i/48;return P(s,sign*s,Math.sqrt(Math.max(0,R*R-s*s)));}),{color:'red',width:1.6+dr.value*7});
          for(const a of[-R,R]) for(const swap of[false,true]) sc.path(Array.from({length:49},(_,i)=>{const s=-R+2*R*i/48;return P(...(swap?[s,a]:[a,s]),Math.sqrt(Math.max(0,R*R-s*s)));}),{color:'ink',width:1.4+dr.value*4});
          for(const x of[-R,R])for(const y of[-R,R])sc.line(P(x,y,0),P(x,y,-1.2),{color:'ink',width:3.4},1);
          const ps=cloud.map(sc.P),mx=Math.max(...ps.map(p=>Math.abs(p[0]))),my=Math.max(...ps.map(p=>Math.abs(p[1])));S3.setView([-mx*1.2-.2,mx*1.2+.2],[-my*1.2-.2,my*1.2+.2]);sc.flush();
          const maxP=Math.max(...m.loads.map(l=>l.P)), arrows=m.loads.filter(l=>l.P>0).map(l=>{const y=(m.pts[l.k][1]+m.pts[l.k+1][1])/2+.2;return[l.x,y+.15+.7*l.P/maxP,y];});
          const ext=[...m.g.blocks.flatMap(b=>b.poly),...m.joints.map(j=>j.point),...arrows.flatMap(([x,hi,lo])=>[[x,hi],[x,lo]])],xmin=Math.min(...ext.map(p=>p[0])),xmax=Math.max(...ext.map(p=>p[0])),ymin=Math.min(...ext.map(p=>p[1])),ymax=Math.max(...ext.map(p=>p[1]));
          A.setView([xmin-.55,xmax+.55],[ymin-.55,ymax+.55]);
          m.g.blocks.forEach((b,i)=>A.poly(b.poly,{fill:'red',fillAlpha:.13+(i%2)*.07,color:'ink',width:.8}));
          for(let i=1;i<m.joints.length;i++){const a=m.joints[i-1],b=m.joints[i];A.line(...a.point,...b.point,{color:a.inside&&b.inside?'green':'orange',width:2.5});}
          arrows.forEach(([x,hi,lo])=>A.arrow(x,hi,x,lo,{color:'accent',width:1.4,head:4,alpha:.8}));
          for(const i of[0,12,24])A.dot(...m.pts[i],{r:4,color:'ink'});
          v.legend([['red','24 rib blocks',{area:true}],['green','candidate: endpoint checks pass'],['orange','candidate: endpoint check fails'],['accent','imposed vertical web loads']]);
        });
        v.readout(()=>{
          const m=model;
          return `${web.value?`Web ${f2(tw.value,2)} m`:'Web lifted off'}: one diagonal receives **${kN(m.Wweb)}** of web weight plus ${kN(m.Wrib)} of model rib weight. Depth ${f2(dr.value,2)} m: ${m.contained?'**this candidate passes all 25 joint checks**':'**this candidate leaves a joint**, by up to '+f2(m.excess,3)+' m; another candidate has not been searched'}. Reaction at each springing: $H=${f2(m.H,2)}$ kN, $V=${f2(m.V,2)}$ kN. Joint-fraction tolerance $10^{-8}$; largest moment residual ${m.residual.toExponential(1)} kN·m. This is a vertical-load plane model, not a 3D vault safety assessment.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Membrane theory of domes',
      statement: String.raw`A thin shell of revolution can carry its load by forces in its own surface alone, with no bending: a **meridional force** $N_\varphi$ along each meridian and a **hoop force** $N_\theta$ along each parallel circle, both per unit length of the shell. For a spherical dome of radius $a$ and constant thickness, with weight $w$ per unit area of surface, cutting the dome at the polar angle $\varphi$ from the crown gives
$$\begin{gathered}N_\varphi=-\frac{w a}{1+\cos\varphi},\\N_\theta=w a\Big(\frac1{1+\cos\varphi}-\cos\varphi\Big)\end{gathered}$$
(compression negative). For a vertical load $p$ per unit area of *plan* (snow) the forces are $N_\varphi=-pa/2$ and $N_\theta=-\tfrac12 pa\cos2\varphi$. The meridional force is always compressive; the hoop force starts as compression at the crown and, for a deep dome, changes sign lower down.`,
      idea: String.raw`Cut the dome along a parallel circle and keep the cap above the cut. Its weight must be balanced by the vertical components of $N_\varphi$ around the circle of radius $a\sin\varphi$, which fixes $N_\varphi$ (this is the equilibrium of arch-1.2 applied to a cap). The weight of a small element has a component normal to the surface that $N_\varphi$ and $N_\theta$ must balance together, as the tension of a balloon balances pressure, and that equation gives $N_\theta$ once $N_\varphi$ is known. A dome is therefore a statically determinate system of arches (the meridians) held in place by rings (the parallels), which is why one can read off whether it can stand without tension (arch-4.4).

The distinction between surface weight and plan load uses the surface-area element of pma 10.46. For the sphere $$\begin{aligned}&\Phi(\varphi,\theta)=\\&\quad(a\sin\varphi\cos\theta,\\&\quad a\sin\varphi\sin\theta,a\cos\varphi),\end{aligned}$$ the norm of the cross product of its partial derivatives is $a^2\sin\varphi$. Thus a cap of polar angle $\varphi$ has weight $2\pi wa^2(1-\cos\varphi)$; a uniform plan load instead contributes $p\pi a^2\sin^2\varphi$. Substitution into the same vertical cap equilibrium yields respectively $-wa/(1+\cos\varphi)$ and $-pa/2$ for the meridional resultant. The pole is treated by a limiting chart or by removing a zero-area point, not by dividing by its zero circle radius.`,
      caption: String.raw`Choose a load, set the opening angle of the dome, and drag the gold handle along the section: the plot shows $N_\varphi$ (blue) and $N_\theta$ (red) in units of $wa$ (or $pa$), and the dome is coloured along the meridian, blue where the hoop force is compression and red where it is tension. The dashed curves are the closed-form formulas; the full curves are computed numerically from equilibrium of every cap, so the two agree. With a lantern the crown is open and a ring load is added at its edge.`,
      deps: ['arch-3.2', 'pma-10.46'],
      see: ['arch-4.4', 'arch-6.1'],
      tags: ['dome', 'shells', 'membrane'],
      refs: ['Heyman'],
      scope: String.raw`Thin, smoothly curved shell of revolution, loaded symmetrically, with supports free to follow the membrane forces (no edge bending). Near the base of a real dome, where the support restrains the hoop strain, bending develops that membrane theory cannot show.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dome#Structure' },
      viz(v) {
        const D2R = Math.PI / 180;
        const mode = v.select('load', [{ value: 'self', label: 'own weight' }, { value: 'snow', label: 'snow on the plan' }, { value: 'lantern', label: 'own weight + lantern' }], 'self');
        const end = v.slider('opening angle of the dome (°)', 30, 120, 90, { step: 1 });
        const lam = v.slider('lantern weight (fraction of the dome’s own)', 0, 0.6, 0.25, { step: 0.01 });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.75, 1.25], equal: true, axes: false, height: 320, weight: 1, minWidth: 280, title: 'the meridian section' });
        const B = v.stage({ x: [0, 120], y: [-2.4, 1.6], axes: 'box', gutter: true, xlabel: 'angle from the crown, φ (°)', ylabel: 'force per length / (w a)', height: 320, weight: 1.15, minWidth: 320 });
        let phiC = 60, data = null;
        const h = A.handle(Math.sin(60 * D2R), Math.cos(60 * D2R), { color: 'gold', label: 'cut', labelPos: 'e', constrain: (x, y) => { const p = clamp(Math.atan2(Math.abs(x), y), (mode.value === 'lantern' ? 10 : 0.5) * D2R, end.value * D2R); return [Math.sin(p), Math.cos(p)]; }, onDrag: () => { phiC = deg(Math.atan2(h.x, h.y)); } });
        const compute = () => {
          const p0 = mode.value === 'lantern' ? 10 : 0, P = profile({ type: 'sphere', R: 1, phi0: p0, phi1: end.value, n: 300 });
          const wf = mode.value === 'snow' ? (q) => Math.cos(q.psi) : 1;
          const W = membrane(P, wf).W.at(-1), m = membrane(P, wf, mode.value === 'lantern' ? lam.value * W : 0);
          return { P, m, zero: hoopZero(P, m.Ntheta), p0 };
        };
        v.render(() => {
          const d = data = compute(), { P, m } = d;
          phiC = clamp(phiC, Math.max(d.p0, 0.5), end.value);
          h.set(Math.sin(phiC * D2R), Math.cos(phiC * D2R));
          const z0 = Math.cos(end.value * D2R);
          for (let i = 1; i < P.length; i++) {
            const nt = (m.Ntheta[i] + m.Ntheta[i - 1]) / 2, c = nt > 0 ? 'red' : 'accent', al = clamp(0.25 + 0.55 * Math.abs(nt) / 1.2, 0.25, 0.9);
            for (const sg of [-1, 1]) A.line(sg * P[i - 1].r, P[i - 1].z + z0, sg * P[i].r, P[i].z + z0, { color: c, width: 7, alpha: al });
          }
          A.line(-1.15, z0, 1.15, z0, { color: 'faint', dash: [3, 4], width: 1 });
          A.line(0, -0.6, 0, 1.15, { color: 'faint', dash: [2, 4], width: 1 });
          if (d.zero !== null && d.zero < end.value * D2R) { const z = d.zero; for (const sg of [-1, 1]) A.dot(sg * Math.sin(z), Math.cos(z), { r: 4, color: 'green' }); A.text(`${f2(deg(z), 1)}°`, 1.0 * Math.sin(z) + 0.05, Math.cos(z) + 0.1, { size: 12, color: 'green', align: 'left' }); }
          // plot
          const ds = P.map((q, i) => [deg(q.psi), m.Nphi[i]]), dt = P.map((q, i) => [deg(q.psi), m.Ntheta[i]]);
          B.hline(0, { color: 'faint', width: 1 });
          if (d.zero !== null && d.zero < end.value * D2R) B.vline(deg(d.zero), { color: 'green', dash: [4, 4], width: 1.2 });
          if (mode.value === 'self' || mode.value === 'snow') {
            const cl = mode.value === 'self' ? [(f) => -1 / (1 + Math.cos(f)), (f) => 1 / (1 + Math.cos(f)) - Math.cos(f)] : [() => -0.5, (f) => -0.5 * Math.cos(2 * f)];
            B.curve((t) => [t, cl[0](t * D2R)], 0.5, end.value, { color: 'accent', dash: [4, 4], width: 1.3, alpha: 0.7 });
            B.curve((t) => [t, cl[1](t * D2R)], 0.5, end.value, { color: 'red', dash: [4, 4], width: 1.3, alpha: 0.7 });
          }
          B.path(ds, { color: 'accent', width: 2.6 }); B.path(dt, { color: 'red', width: 2.6 });
          const i = clamp(Math.round(((phiC * D2R - P[0].psi) / (P[P.length - 1].psi - P[0].psi)) * (P.length - 1)), 0, P.length - 1);
          B.dot(phiC, m.Nphi[i], { r: 5, color: 'accent' }); B.dot(phiC, m.Ntheta[i], { r: 5, color: 'red' });
          v.legend([['accent', 'meridional $N_\\varphi$'], ['red', 'hoop $N_\\theta$'], ['muted', 'closed form', { dash: true }]]);
        });
        v.readout(() => {
          const { P, m, zero } = data, i = clamp(Math.round(((phiC * D2R - P[0].psi) / (P[P.length - 1].psi - P[0].psi)) * (P.length - 1)), 0, P.length - 1), u = mode.value === 'snow' ? 'pa' : 'wa';
          return `At $\\varphi=${f2(phiC, 0)}^\\circ$: $N_\\varphi=${f2(m.Nphi[i], 3)}\\,${u}$ (compression), $N_\\theta=${f2(m.Ntheta[i], 3)}\\,${u}$ (${m.Ntheta[i] > 0 ? '**tension**' : 'compression'}). ${zero !== null && zero < end.value * D2R ? `The hoop force changes sign at $\\varphi=${f2(deg(zero), 2)}^\\circ$.` : 'No tension anywhere in this dome.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Proposition',
      name: 'Hoop tension below 51.8° in a hemisphere',
      statement: String.raw`For a spherical dome of constant thickness carrying only its own weight, the membrane hoop force $N_\theta$ is compressive near the crown, vanishes at the polar angle $\varphi^*$ with $\cos\varphi^*(1+\cos\varphi^*)=1$, that is $\cos\varphi^*=\tfrac{\sqrt5-1}{2}=0.618\ldots$, $\varphi^*\approx51.83^\circ$ ($51^\circ49'$), and is **tensile** for $\varphi>\varphi^*$. A dome whose opening angle (measured from the crown) is at most $\varphi^*$ is in compression everywhere; a full hemisphere has a belt of hoop tension between $51.8^\circ$ and the base. The angle moves if the thickness varies or if a lantern loads the crown.`,
      idea: String.raw`Set $N_\theta=0$ in the formula of arch-4.3: $\dfrac1{1+\cos\varphi}=\cos\varphi$, which is the quadratic $c^2+c-1=0$ in $c=\cos\varphi$, whose positive root is the reciprocal of the golden ratio. Physically, above $\varphi^*$ the shell is steep enough that each meridian arch can carry its weight and also squeezes the parallel circles as it contracts; below $\varphi^*$ the meridians push outward on the parallels, which are then pulled apart like the hoops of a barrel. A material with no tensile strength must crack there (arch-4.5) or be tied by a chain (arch-4.8).`,
      caption: String.raw`The left panel is the dome section with the tension belt in red; use the **opening angle** to cut the dome off (the colour of the band is the sign of the hoop force and its width is the relative weight). The right panel plots $N_\theta/(wa)$ against $\varphi$ (the faint curve is the constant-thickness case). Choose a thickness distribution and a lantern load to *break the hypothesis* of constant thickness: a heavier haunch or a lantern move the angle at which tension begins, and a dome opened less than that angle has no tension at all.`,
      deps: ['arch-4.3'],
      see: ['arch-4.7', 'arch-4.8'],
      tags: ['dome', 'hoop tension'],
      refs: ['Heyman'],
      scope: String.raw`Membrane state of a thin spherical shell under its own weight, free at the base; the classical value $51.8^\circ$ is for constant thickness and no lantern. Other thickness laws shift it (the factor $w(\varphi)$ below is an illustration, not a particular building).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dome#Structure' },
      viz(v) {
        const D2R = Math.PI / 180;
        const thick = v.select('thickness', [{ value: 'uni', label: 'constant' }, { value: 'heavy', label: 'heavier toward the base' }, { value: 'light', label: 'lighter toward the base' }], 'uni');
        const kk = v.slider('strength of the variation k', 0, 3, 1, { step: 0.05 });
        const lam = v.slider('lantern weight (fraction of the dome’s own)', 0, 0.6, 0, { step: 0.01 });
        const end = v.slider('opening angle of the dome (°)', 30, 100, 90, { step: 1 });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.2, 1.25], equal: true, axes: false, height: 300, weight: 1, minWidth: 280, title: 'tension belt of the dome' });
        const B = v.stage({ x: [0, 100], y: [-1.6, 1.8], axes: 'box', gutter: true, xlabel: 'angle from the crown, φ (°)', ylabel: 'hoop force / (w a)', height: 300, weight: 1.15, minWidth: 320 });
        let data = null;
        const wfn = () => { const k = kk.value; return thick.value === 'heavy' ? (q) => 1 + k * (q.psi / (Math.PI / 2)) ** 2 : thick.value === 'light' ? (q) => 1 / (1 + k * (q.psi / (Math.PI / 2)) ** 2) : () => 1; };
        const compute = () => {
          const p0 = lam.value > 0 ? 8 : 0, P = profile({ type: 'sphere', R: 1, phi0: p0, phi1: 100, n: 400 }), wf = wfn();
          const Wt = membrane(P, wf).W.at(-1), m = membrane(P, wf, lam.value * Wt), ref = membrane(P, 1);
          return { P, m, ref, zero: hoopZero(P, m.Ntheta), zref: hoopZero(P, ref.Ntheta) };
        };
        v.render(() => {
          const wrel = wfn(), d = data = compute(), { P, m } = d, e = end.value * D2R, z0 = Math.cos(e), c100 = Math.cos(100 * D2R);
          for (let i = 1; i < P.length; i++) {
            if (P[i].psi > e) break;
            const nt = (m.Ntheta[i] + m.Ntheta[i - 1]) / 2;
            for (const sg of [-1, 1]) A.line(sg * P[i - 1].r, P[i - 1].z + c100, sg * P[i].r, P[i].z + c100, { color: nt > 0 ? 'red' : 'accent', width: clamp(3 + 4 * wrel(P[i]), 3, 20), alpha: clamp(0.3 + Math.abs(nt) * 0.5, 0.3, 0.9) });
          }
          A.line(-1.15, z0, 1.15, z0, { color: 'faint', dash: [3, 4], width: 1 });
          if (d.zero !== null) for (const sg of [-1, 1]) A.dot(sg * Math.sin(d.zero), Math.cos(d.zero), { r: 5, color: 'green' });
          const dt = P.filter((q) => q.psi <= e).map((q, i) => [deg(q.psi), m.Ntheta[i]]), dr = P.filter((q) => q.psi <= e).map((q, i) => [deg(q.psi), d.ref.Ntheta[i]]);
          B.hline(0, { color: 'faint', width: 1 });
          if (thick.value !== 'uni' || lam.value > 0) B.path(dr, { color: 'muted', width: 1.6, dash: [4, 4], alpha: 0.8 });
          B.path(dt, { color: 'red', width: 2.8 });
          B.vline(51.83, { color: 'muted', dash: [2, 4], width: 1 }); B.text('51.8°', 51.83 + 1, -1.4, { size: 11, color: 'muted', align: 'left' });
          if (d.zero !== null) { B.vline(deg(d.zero), { color: 'green', width: 1.4 }); B.dot(deg(d.zero), 0, { r: 5, color: 'green' }); }
          v.legend([['red', 'hoop force, this dome'], ['muted', 'constant thickness', { dash: true }], ['green', 'sign change']]);
        });
        v.readout(() => {
          const d = data, e = end.value;
          const zdeg = d.zero === null ? null : deg(d.zero);
          const maxT = Math.max(0, ...d.P.map((q, i) => (deg(q.psi) <= e ? d.m.Ntheta[i] : 0)));
          return `Constant thickness: $\\varphi^*=${f2(deg(d.zref), 3)}^\\circ$ (formula: $\\arccos\\frac{\\sqrt5-1}2=${f2(deg(Math.acos((Math.sqrt(5) - 1) / 2)), 3)}^\\circ$). This dome: ${zdeg === null ? 'no sign change' : `$\\varphi^*=${f2(zdeg, 2)}^\\circ$`}. Opened to ${f2(e, 0)}°: ${zdeg !== null && e > zdeg ? `a tension belt of ${f2(e - zdeg, 1)}°, peak $N_\\theta=${f2(maxT, 2)}\\,wa$` : '**compression only**'}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Phenomenon',
      name: 'Meridional cracking and the dome as sliced arches',
      statement: String.raw`Masonry cannot take the hoop tension that arch-4.4 predicts below about $52^\circ$ from the crown, so a masonry dome cracks along **meridians**, from the base upwards, at some angular spacing. The cracks are not a failure: each gore between two cracks is an arch of its own, in compression, whose width grows from zero at the crown to its maximum at the base. The dome stands if a thrust line fits inside the thickness of one such gore (Heyman's safe theorem, arch-3.5). The cracked dome no longer pulls on itself in the hoop direction; its base pushes outward instead, and the outward thrust of all the gores has to be taken by the support, by a buttress ring or by iron or timber ties.`,
      idea: String.raw`Cracking removes the tensile hoop stress by changing the structure: the shell becomes a set of independent arches (arch-4.3, arch-4.4 say where the membrane theory would need tension; arch-3.4 says masonry has none to give). Each gore weighs in proportion to its width $\sin\varphi$, so its loading differs from that of a plane arch of constant width, but arch-3.5 applies unchanged: find *any* admissible line of thrust. The hoop tension that was relieved reappears as the outward thrust at the base, equal to the ring tension a tie would have to carry. Because the cracks are a consequence of the dome's shape and not a sign of weakness, a dome can be cracked for centuries and still be safe, while a tie, or a change in the supports, can make the cracks grow.`,
      caption: String.raw`The left panel is the dome seen from above with its meridional cracks (opening exaggerated twenty times) rising from the rim to the angle where the membrane hoop tension ends. The right panel is one gore with its opposite gore, as an arch of the chapter-3 engine: weights proportional to the gore width, voussoirs normal to the shell, the most central thrust line in green (orange where it leaves the masonry). Thin the shell until it cannot hold a line (the readout gives the smallest thickness), tick the box to see the hinges of the thinnest dome that stands, and spread the base to open the cracks.`,
      deps: ['arch-4.4', 'arch-3.5'],
      see: ['arch-4.6', 'arch-3.6'],
      tags: ['cracking', 'dome', 'limit analysis'],
      refs: ['Heyman'],
      scope: String.raw`Axisymmetric dome of constant thickness cut into gores by radial joints and loaded by its own weight; no sliding between the voussoirs and no tensile or crushing failure; the gore is treated as a plane arch whose weight is proportional to its width, with the crown joint as a pin (the gores meet at a point there).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dome#Structure' },
      viz(v) {
        const D2R = Math.PI / 180, R0 = 10, GAM = 22;
        const ng = v.slider('number of meridional cracks', 6, 36, 16, { int: true });
        const tr = v.slider('thickness t / R', 0.02, 0.15, 0.07, { step: 0.002 });
        const end = v.slider('opening angle of the dome (°)', 60, 90, 90, { step: 1 });
        const spread = v.slider('outward spread of the base (cm), R = 10 m', 0, 12, 4, { step: 0.5 });
        const showMin = v.toggle('show the thinnest dome that stands (with its hinges)', false);
        const A = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 330, weight: 0.95, minWidth: 260, title: 'plan: cracks rise from the base' });
        const B = v.stage({ x: [-13, 13], y: [-1.5, 11.5], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 300, title: 'one gore and its opposite, as an arch' });
        let M = null;
        const model = () => {
          const e = end.value, N = 24, mid = sphereMid(R0, e, N), dth = (2 * Math.PI) / ng.value;
          const mk = (t) => domeSlice(mid, t * R0, { gamma: GAM, dtheta: dth });
          const g = mk(tr.value), c = centralLine(g, []), fit = bestFit(mk, () => [], {}, 0.002, 0.4, 26);
          const P = profile({ type: 'sphere', R: 1, phi1: e, n: 300 }), mem = membrane(P, 1), zero = hoopZero(P, mem.Ntheta);
          return { g, c, fit, zero, mk, dth };
        };
        v.render(() => {
          const m = M = model(), Gs = showMin.value && m.fit ? m.fit.g : m.g, u = showMin.value && m.fit ? m.fit.u : m.c ? m.c.u : m.fit ? m.fit.u : [0, 0, 0];
          // plan
          const rc = m.zero !== null ? Math.sin(m.zero) : 1, ow = (20 * 2 * Math.PI * (spread.value / 100)) / (ng.value * R0);
          A.circle(0, 0, 1, { color: 'ink', fill: 'muted', fillAlpha: 0.08, width: 1.6 });
          A.circle(0, 0, rc, { color: 'green', width: 1.2, dash: [4, 4] });
          for (let k = 0; k < ng.value; k++) {
            const th = (2 * Math.PI * (k + 0.5)) / ng.value, c = Math.cos(th), s = Math.sin(th);
            A.poly([[rc * c, rc * s], [c + ow * 0.5 * s, s - ow * 0.5 * c], [c - ow * 0.5 * s, s + ow * 0.5 * c]], { fill: 'red', fillAlpha: 0.6, color: 'red', width: 1.2 });
            A.line(rc * c, rc * s, c, s, { color: 'red', width: 1.6 });
          }
          A.text(m.zero !== null ? `no cracks above φ = ${f2(deg(m.zero), 1)}°` : 'no tension: no cracks', 0, 0, { size: 12, color: 'green', align: 'center' });
          // gore as an arch
          const e = end.value, zb = Math.cos(e * D2R);
          Gs.blocks.forEach((b, i) => {
            const phi = deg(Math.atan2(Math.abs(b.cx), b.cy + R0 * zb)), tens = m.zero !== null && phi > deg(m.zero);
            B.poly(b.poly, { fill: tens ? 'red' : 'accent', fillAlpha: 0.13 + (i % 2) * 0.07, color: 'ink', width: 0.8, alpha: 0.8 });
          });
          const tl = thrustLine(Gs, [], u);
          drawThrust(v, B, tl, { color: 'green', bad: 'orange', width: 2.6 });
          if (showMin.value && m.fit) for (const h of hinges(m.fit.g, [], m.fit.u, {}, 1e-6)) { const J = m.fit.g.joints[h.j], p = h.side === 'a' ? J.a : J.b; B.dot(p[0], p[1], { r: 5, color: 'red' }); }
          B.line(-12, 0, 12, 0, { color: 'faint', dash: [3, 4], width: 1 });
          v.legend([['green', 'thrust line (inside)'], ['orange', 'thrust line (outside)'], ['red', 'cracked zone / hinges'], ['accent', 'uncracked zone', { area: true }]]);
        });
        v.readout(() => {
          const m = M, ok = !!m.c, Hk = (showMin.value && m.fit ? m.fit.u : m.c ? m.c.u : m.fit.u)[0], Ttot = (Hk * ng.value) / (2 * Math.PI);
          return `Thickness $t/R=${f2(showMin.value && m.fit ? m.fit.t : tr.value, 3)}$: ${showMin.value ? 'this is the **thinnest** dome with a thrust line' : ok ? 'the gore **stands**' : '**no thrust line fits**: the gores would fall'}; smallest thickness $t_{\\min}/R=${f2(m.fit ? m.fit.t : NaN, 4)}$ (mean radius). Thrust of one gore at the crown ${f2(Hk, 1)} kN (R = 10 m, 22 kN/m³), so a ring tie at the base must carry $T=nH/2\\pi=${f2(Ttot, 0)}$ kN to stop the cracks from opening. The membrane hoop tension ends at $\\varphi=${m.zero !== null ? f2(deg(m.zero), 1) : '—'}^\\circ$.`;
        });
      },
    },
  ],
};
