import { mortar, aqueduct } from './source-audit-water.js';
// History of Technology — Chapter 4: Building, water and power before steam (items 4.1–4.6; 4.7–4.12 are in ch04-b.js)
import { yearStage, drawYears, lump, RHO, G, undershotP, overshotP, breastP, plate, windCp, BETZ, archGeometry, archFeasible, thrustAt } from './ch04.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- 4.1 helpers
/** Smallest ring thickness (fraction of intrados radius) that still holds a thrust line, by bisection on the joint constraints. */
function minThickness(alpha) {
  let lo = 0.004, hi = 0.6;
  if (!archFeasible(archGeometry(hi, alpha, 180), 2, 2).ok) return NaN;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (archFeasible(archGeometry(mid, alpha, 180), 2, 2).ok) hi = mid; else lo = mid;
  }
  return hi;
}
/** Harmonic number H_n. */
const harm = (n) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i; return s; };


export default {
  collection: 'tech',
  chapter: 4,
  title: 'Building, water and power before steam',
  summary: String.raw`Roman engineers combined the arch and hydraulic concrete into aqueducts, bridges and domes. Water wheels and windmills, spreading through medieval Europe, were the first prime movers that did not eat, and with cams and cranks they drove hammers, saws and bellows. Agriculture changed too, with the heavy plough and the horse collar, and canals lifted boats with pound locks. Many of the stories told about these inventions are older than their evidence: where a date, an inventor or an effect is disputed, the item says so, and a picture that is a model (not a reconstruction of a measurement) is called a model. The one place in this chapter where original data survives is John Smeaton's 1759 experiments, whose tables are replayed.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Invention',
      name: 'The true arch in Roman engineering',
      credit: 'No single inventor. Arched openings are older than Rome (Near East and Egypt); Roman builders made the semicircular arch the basis of bridges, aqueducts and vaults',
      verify: true,
      statement: String.raw`A **true arch** is a curved span of wedge-shaped blocks (**voussoirs**) that press on one another, so that the load travels along the curve in compression and nothing is asked to resist bending or tension. The weight of the stones pushes outward at the feet (the **thrust**), which the piers or abutments must resist. A **corbelled** opening is different: each course projects a little beyond the one below, and every block is a cantilever held down by the weight above and behind it.

The arch was not a Roman invention. Arched openings in brick and stone are found in the Near East and Egypt well before Rome (the earliest dates quoted vary between sources, from the fourth millennium BCE for debated Mesopotamian finds to about 2000 BCE for firmly dated examples), and the Etruscans passed arch building to Rome. What Roman builders did was use the semicircular arch as a system: bridges, aqueducts (4.3), amphitheatres and vaults, built in cut stone and then in concrete (4.2).

Scope of the picture: it takes stone with no tensile strength, effectively unlimited compressive strength and no sliding between voussoirs (the standard assumptions for masonry), a circular arch carrying only its own weight, and abutments that do not move.`,
      idea: String.raw`If the stones are free to carry only compression, the arch stands if and only if some line of thrust, the curve along which the force passes from joint to joint, lies inside the ring everywhere (Heyman's safe theorem, arch-3.5). Cutting a symmetric arch at the crown leaves one unknown horizontal thrust $H$ and the height $y_c$ where it crosses the crown joint; statics then gives the thrust line through every other joint from the weights of the voussoirs (arch-3.2). Hooke's remark that "as hangs the flexible line, so but inverted will stand the rigid arch" is the same statement: a chain hangs in a pure tension curve, and its mirror image is a pure compression curve.

A free-standing stack of blocks has no such freedom. A block can overhang its support by at most half its own length, and a stack of $n$ equal blocks can reach out by $\tfrac12(1+\tfrac12+\dots+\tfrac1n)$ lengths in all, which grows like $\tfrac12\ln n$. To close a gap of $S$ block lengths the two sides need about $e^{S-\gamma}$ courses, so reach is paid for with height, exponentially. Real corbel vaults load the courses from behind with masonry and do far better, but the geometry of the cantilever is why a corbel opens in height and an arch in width.`,
      caption: String.raw`Left: a voussoir arch of the chosen span and shape under its own weight. Thickness is measured relative to the intrados radius $R_i$; the readout also converts the limiting thickness to the mean-radius convention of arch-3.7. The ring is shaded; the **orange** and **purple** dashed curves are the thrust lines of smallest and largest horizontal thrust that stay inside the ring, and any line in between would do as well. Thin the ring with the **thickness** slider: for a semicircle the two lines merge and then no line fits (the readout then says there is no admissible thrust line, and the red thrust line leaves the masonry at the hinge points). Right: a corbel of the same span, built from free-standing courses of unit blocks. Raise the **courses** until the two sides meet; the readout says how many the span needs.`,
      deps: ['arch-3.2', 'arch-3.5'],
      see: ['arch-3.13', 'arch-3.7', 'tech-4.3'],
      refs: ['Makris & Alexakis (2013), radial joints: t/R_m = 0.1075; https://doi.org/10.1007/s00419-013-0763-4', 'Mokyr ch. 2', 'Heyman, The Stone Skeleton (1966), Int. J. Solids Struct. 2:249', 'Woodman & Bloom (eds), Arch (2003), as cited by Wikipedia "Arch"'],
      tags: ['ancient', 'masonry', 'statics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arch' },
      viz(v) {
        const A = v.stage({ x: [-2.5, 2.5], y: [-0.8, 2.2], equal: true, axes: false, height: 330, weight: 1.25, minWidth: 340, title: 'voussoir arch: self-weight, thrust lines' });
        const B = v.stage({ x: [-4, 4], y: [-1, 6], equal: true, axes: false, height: 330, weight: 1, minWidth: 300, title: 'corbel of free-standing courses' });
        const shape = v.select('shape', [{ value: 'semi', label: 'semicircle' }, { value: 'seg', label: 'segmental (60°)' }], 'semi');
        const span = v.slider('span $S$ (block lengths)', 1, 6, 3, { step: 0.1 });
        const thick = v.slider('ring thickness $t/R_i$', 0.03, 0.3, 0.16, { step: 0.005 });
        const nC = v.slider('corbel courses $n$', 1, 40, 6, { int: true });
        const tMinCache = {};
        let cacheKey = '', geo = null, feas = null;
        const NJ = 24;
        v.render(() => {
          const alpha = (shape.value === 'semi' ? 90 : 60) * D2R, S = span.value, t = thick.value;
          const key = `${shape.value}|${t.toFixed(4)}`;
          if (key !== cacheKey) { cacheKey = key; geo = archGeometry(t, alpha, NJ); feas = archFeasible(geo, 90, 60); }
          if (!(shape.value in tMinCache)) tMinCache[shape.value] = minThickness(alpha);
          const r0 = S / (2 * Math.sin(alpha)), Re = r0 * (1 + t), ysp = r0 * Math.cos(alpha);
          const pt = (rho, th, sgn) => [sgn * rho * r0 * Math.sin(th), rho * r0 * Math.cos(th)];
          const okc = feas.ok ? 'green' : 'red';
          const halfW = Re * Math.sin(alpha) + 0.45, top = Math.max(Re, ysp) + 0.35;
          A.setView([-halfW, halfW], [ysp - 1.3 - 0.0, top]);
          // piers
          for (const sg of [-1, 1]) {
            const a = pt(1, alpha, sg), b = pt(1 + t, alpha, sg);
            A.poly([a, b, [b[0], ysp - 1.2], [a[0], ysp - 1.2]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.2 });
          }
          A.line(-halfW, ysp - 1.2, halfW, ysp - 1.2, { color: 'muted', width: 2 });
          // voussoirs
          for (let k = 0; k < NJ; k++) for (const sg of [-1, 1]) {
            const t0 = k * geo.dth, t1 = (k + 1) * geo.dth;
            A.poly([pt(1, t0, sg), pt(1 + t, t0, sg), pt(1 + t, t1, sg), pt(1, t1, sg)], { fill: feas.ok ? 'orange' : 'red', fillAlpha: feas.ok ? 0.16 : 0.12, color: 'muted', width: 0.9 });
          }
          // thrust lines
          const draw = (H, yc, col, dash, w) => {
            const p = thrustAt(geo, H, yc);
            for (const sg of [-1, 1]) {
              const pts = p.map((rho, k) => pt(rho, k * geo.dth, sg));
              A.path(pts, { color: col, width: w, dash });
            }
          };
          if (feas.ok) {
            draw(feas.max.H, feas.max.yc, 'purple', [5, 3], 1.8);
            draw(feas.min.H, feas.min.yc, 'orange', [5, 3], 1.8);
            draw(feas.middle.H, feas.middle.yc, 'green', null, 2.6);
          } else if (feas.best) {
            draw(feas.best.H, feas.best.yc, 'red', null, 2.4);
            A.text('no thrust line fits: hinges form', 0, top - 0.1, { size: 12, color: 'red', weight: 700, align: 'center', plate: true });
          }
          A.text('crown', 0, Re + 0.15, { size: 10.5, color: 'muted', align: 'center' });
          // ---- corbel
          const n = nC.value, h = 0.36, Hn = harm(n);
          let need = 1; while (harm(need) < S && need < 2e6) need++;
          const reach = (j) => { let s = 0; for (let i = j; i <= n; i++) s += 1 / (2 * i); return s; };
          const closed = Hn >= S;
          B.setView([-S / 2 - 1.8, S / 2 + 1.8], [-1.0, Math.max(3.5, n * h + 0.7)]);
          B.rect(-S / 2 - 1.8, -1, -S / 2, 0, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.2 });
          B.rect(S / 2, -1, S / 2 + 1.8, 0, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.2 });
          for (let j = n; j >= 1; j--) {
            const y0 = (n - j) * h, tip = Math.min(reach(j), S / 2);
            B.rect(-S / 2 + tip - 1, y0, -S / 2 + tip, y0 + h, { fill: closed ? 'green' : 'orange', fillAlpha: 0.22, color: 'muted', width: 0.9 });
            B.rect(S / 2 - tip, y0, S / 2 - tip + 1, y0 + h, { fill: closed ? 'green' : 'orange', fillAlpha: 0.22, color: 'muted', width: 0.9 });
          }
          B.measure(-S / 2, -0.55, S / 2, -0.55, `span ${v.fmt(S, 2)}`);
          B.corner(closed ? 'the courses meet' : `gap of ${v.fix(S - Hn, 2)} remains`, 'tr', { color: closed ? 'green' : 'red', weight: 700 });
          B._need = need; B._Hn = Hn;
        });
        v.legend([['green', 'a thrust line inside the ring'], ['orange', 'least thrust', { dash: [5, 3] }], ['purple', 'greatest thrust', { dash: [5, 3] }], ['red', 'no line fits', {}]]);
        v.readout(() => {
          const tmin = tMinCache[shape.value], t = thick.value;
          const hmin = feas && feas.ok ? `thrust between **${v.fix(feas.min.H, 2)}** and **${v.fix(feas.max.H, 2)}** of a half-arch's weight` : '**no admissible thrust line**';
          return `${shape.value === 'semi' ? 'semicircle' : 'segmental arch'}, ring $t/R_i = ${v.fix(t, 3)}$: ${hmin}; the thinnest ring that stands is $t/R_i \\approx ${v.fix(tmin, 3)}$ (180 joints per half-arch; mean-radius ratio $t/R_m=${v.fix(tmin / (1 + tmin / 2), 5)}$)\nCorbel with $n=${nC.value}$ courses reaches $H_n=${v.fix(B._Hn, 2)}$ block lengths; spanning $S=${v.fix(span.value, 1)}$ needs $n \\ge ${B._need}$ courses`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num:'4.2',kind:'Invention',name:'Roman concrete (pozzolana)',verify:false,
      statement:String.raw`Roman builders combined lime, volcanic material, water and coarse stone into concrete. Vitruvius II.6 describes material from the Bay of Naples that binds underwater. His proportions must be read in context: **II.5 gives three parts pit sand to one lime**, or two parts river/sea sand to one lime. **V.12 gives two parts volcanic powder to one lime for harbour work**. These are not one universal 3:1 pozzolana recipe.

Jackson and colleagues (2013) examined ancient marine concrete from Baianus Sinus and identified C-A-S-H binder and Al-tobermorite in relict lime clasts. Seymour and colleagues (2023) studied Privernum architectural mortar, proposed quicklime hot mixing as the origin of characteristic lime clasts, and tested crack healing in modern analogues. Their modern samples support a mechanism; they are not measurements of every ancient structure's behavior.`,
      idea:String.raw`Ordinary air-lime carbonation consumes carbon dioxide: $\mathrm{Ca(OH)_2+CO_2\to CaCO_3+H_2O}$. Pozzolanic reactions with reactive silica/alumina and lime can form cementitious hydrates in the presence of water. Reaction rates, phase assemblages and transport depend on the actual materials and environment; a simple front is not a universal carbonation law.

This authored illustration assigns a hydraulic fraction $a=c(1-e^{-mt/0.3})$, where $c=\min(1,r/2.5)$, the ratio r is an illustrative capacity control, and m is a chosen moisture factor. A logistic carbonation proxy b has nominal depth $d=0.02s\sqrt t$ metres. Combine them as
$$u=a+(1-a)b.$$
Thus 0≤u≤1: carbonation acts on the remaining unconverted fraction. In the submerged comparison b is set to zero as a model assumption; dissolved carbon dioxide is not asserted to be physically absent.`,
      caption:String.raw`Choose environment, age and the authored ash:lime ratio. Each 60 cm strip has 60 equal cells, shaded by its computed lime-conversion proxy. The readout and curve use exactly the same cell average. The age plot includes the whole offered range, from 0.005 to 2000 years. Select submerged conditions and set ash to zero to remove this model's hydraulic contribution. Green conversion is not measured strength, a fitted reaction rate or a durability forecast.`,
      deps:['tech-1.7'],see:['mat-2.8','tech-4.1'],refs:['Vitruvius, De architecturaII.5.1,II.6.1 and V.12.2; Morgan translation 1914','Jackson et al. (2013), Am. Mineral. 98:1669–1687, materials/mineralogy and thermal-model discussion','Seymour et al. (2023), Sci. Adv. 9:eadd1602, ancient sample analysis and modern crack-healing tests'],tags:['ancient','materials','chemistry'],
      credit:'Roman practice described by Vitruvius; modern studies: Jackson et al. (2013) and Seymour et al. (2023)',
      scope:String.raw`Rates, effective capacity ratio 2.5, moisture factors, logistic front, two-face geometry and 60-cell discretization are authored, with years/metres only for scale. This is not a mass-balanced chemical speciation model, a fitted carbonation PDE or a replay of either modern study. Phase chemistry and concentrations are not inferred from the green shading. The Roman recipes distinguish sand from volcanic powder; the plotted ratio is not a recommended historical or modern mix.`,
      links:{source:'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/2*.html',marine:'https://open.metu.edu.tr/bitstream/handle/11511/39621/index.pdf',experiment:'https://doi.org/10.1126/sciadv.add1602'},
      viz(v){
        const env=v.select('environment',[{value:'dry',label:'dry air'},{value:'damp',label:'damp wall'},{value:'sea',label:'submerged comparison'}],'sea'),age=v.slider('model age (years)',.005,2000,.5,{log:true,sig:6,decimals:6}),ratio=v.slider('authored ash : lime ratio',0,5,2,{step:'any',decimals:6}),A=v.stage({x:[-.12,1.52],y:[-.12,1.1],axes:false,height:260,minWidth:260,title:'60 equal cells per wall section'}),B=v.stage({x:[-2.5,3.5],y:[-.15,1.15],axes:'box',gutter:true,height:300,minWidth:260,xlabel:'log₁₀ model age in years',ylabel:'mean conversion proxy',title:'same finite-cell mean at every age'});let info;
        v.legend([['orange','plain lime proxy'],['green','lime + ash proxy'],['gold','selected age',{dot:true}]]);
        v.render(()=>{const p=mortar(env.value,age.value,ratio.value);for(const[ox,arr,label]of[[0,p.plain,'plain'],[.8,p.mixed,'with ash']]){for(let i=0;i<60;i++)A.rect(ox+i*.01,.08,ox+(i+1)*.01,.78,{fill:'green',fillAlpha:.06+.7*arr[i],stroke:false});A.rect(ox,.08,ox+.6,.78,{color:'muted',width:1});A.text(label,ox+.3,.91,{align:'center',size:11,color:'ink'});}for(let i=0;i<2;i++)B.path(p.curves[i],{color:i?'green':'orange',width:2.3});B.dot(Math.log10(p.age),p.meanPlain,{color:'orange',r:4,ring:false});B.dot(Math.log10(p.age),p.meanMixed,{color:'gold',r:4,ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Model age ${p.age.toPrecision(9)} yr; ratio ${v.fix(p.ratio,6)}. The 60-cell means are plain ${v.fix(p.meanPlain,9)}, with ash ${v.fix(p.meanMixed,9)}. Hydraulic proxy ${v.fix(p.hydraulic,9)}; nominal carbonation depth ${v.fix(p.front,9)} m. These are authored conversion proxies, not strength or source measurements.`;});
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num:'4.3',kind:'Invention',name:'Aqueducts and the inverted siphon',verify:false,
      statement:String.raw`A gravity aqueduct can combine open channels, tunnels, arcades and a closed pressure pipe crossing a valley. An **inverted siphon** descends and rises while its outlet reservoir remains below its inlet reservoir; it does not lift water above its energy source. Vitruvius VIII.6 describes channels, lead or earthenware pipes, and the valley's lower run, the venter.

VIII.6.1 differs across the translations consulted: Gwilt 1826 gives half a foot per hundred feet (5 m/km), whereas Morgan 1914 prints a quarter of an inch per hundred feet (about0.208 m/km). Neither rendering establishes a measured universal gradient of Roman aqueducts. The terrain, levels, 30 km route and pipe comparison below are authored; no Nîmes/Pergamon dimensions, uncertain pipe-material attribution or lead-strength measurement is reproduced.`,
      idea:String.raw`The open-channel profile is $z(x)=300-\gamma x$, with $x$ in kilometres and $\gamma$ in metres per kilometre. The city reference is 268 m, so endpoint height is sufficient exactly when $300-30\gamma\ge268$. This height test alone says nothing about channel discharge or construction feasibility.

For the comparison pipe, choose one finite polyline and include its vertical tank connections in length $L$. The reservoir drop is $\Delta z=7\gamma$. An explicitly ideal long-pipe Darcy model uses constant $f=0.02$, diameter $D$ and $n$ identical parallel pipes. Its capacity speed is
$$v=\sqrt{2g\Delta zD/(fL)},$$
and total capacity is $n\pi D^2v/4$. Compare the requested flow's friction loss with $\Delta z$; an excessive request does not force the outlet hundreds of metres below its design level. The hydraulic grade drops linearly with cumulative pipe length, giving gauge pressure head $H-z$. A thin-wall nominal stress is $p r_m/t=p/(t/r_m)$, using mean radius $r_m$; the wall control is restricted to $t/r_m\le0.1$.`,
      caption:String.raw`Choose arcade or pressure-pipe crossing, gradient and valley depth. The upper panel contains the entire terrain, channel, tanks and pipe. Orange sections are sampled tunnel/cutting classifications, blue are the remaining channel; a height readout counts the finite route intervals. For the pipe, green is the hydraulic grade at the model's computed capacity, red the specified route. The other panel shows its complete pressure-head profile even when the arcade is selected, as a clearly hypothetical pipe comparison.

Flow demand, bore, parallel pipes and wall ratio change the comparison. Capacity and adequate arrival height are reported separately. The readout gives nominal stress without calling a pipe “safe,” “holds” or “bursts.”`,
      deps:['fluid-2.2'],see:['fluid-2.9','solid-3.8','tech-4.1','tech-4.2'],refs:['Vitruvius, De architecturaVIII.6.1–9, channel fall, lead pipes and venter; Morgan 1914 and Gwilt 1826 translations','MIT 1.060 Engineering Mechanics II, spring 2006, Lecture 16 pp1–2, Darcy–Weisbach pressure drop'],tags:['ancient','hydraulics','civil engineering'],
      credit:'Pressure-channel construction described by Vitruvius VIII.6; finite hydraulic comparison authored here',
      scope:String.raw`This ideal finite polyline model assumes steady full-pipe flow, identical parallel pipes, a constant Darcy factor and negligible velocity-head corrections and entrance/exit losses. It excludes leakage, transients, sediment, cavitation, pipe joints, creep and material failure. The pressure profile and thin-wall nominal stress do not validate a lead pipe or a real aqueduct. Terrain sampling and route-classification counts are finite approximations. The fixed tank elevations and entire plotted family remain explicit at every demand setting.`,
      links:{source:'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/8*.html',translation:'https://www.chenarch.com/images/arch-texts/0000-Vitruvius-50BC-Ten-Books-of-Architecture.pdf',hydraulics:'https://ocw.mit.edu/courses/1-060-engineering-mechanics-ii-spring-2006/3a800660e36bf54f7920afabc2cdd229_lecture16.pdf'},
      viz(v){
        const gradient=v.slider('channel gradient (m/km)',.1,2,.8,{step:'any',decimals:6}),depth=v.slider('valley depth (m)',20,110,60,{step:'any',decimals:6}),demand=v.slider('requested total flow (L/s)',20,600,100,{step:'any',decimals:6}),diameter=v.slider('pipe bore (m)',.1,.4,.3,{step:'any',decimals:6}),pipes=v.slider('parallel pipes',1,9,4,{int:true}),wall=v.slider('thin-wall ratio t/rₘ',.01,.1,.05,{step:'any',decimals:6}),mode=v.select('valley crossing',[{value:'arcade',label:'arcade'},{value:'siphon',label:'inverted siphon'}],'arcade'),A=v.stage({x:[-1.5,31.5],y:[150,340],axes:'box',gutter:true,height:320,minWidth:260,xlabel:'route distance (km)',ylabel:'elevation (m)',title:'entire authored route'}),B=v.stage({x:[12,20],y:[-10,100],axes:'box',gutter:true,height:280,minWidth:260,xlabel:'valley distance (km)',ylabel:'gauge pressure head (m)',title:'pipe comparison at computed capacity'});let info;
        v.legend([['muted','terrain'],['accent','channel'],['orange','tunnel / cutting'],['red','specified pipe'],['green','capacity hydraulic grade']]);
        v.render(()=>{const p=aqueduct(gradient.value,depth.value,demand.value,diameter.value,pipes.value,wall.value,mode.value);A.setView([-1.5,31.5],p.y);B.setView([12,20],p.pressureY);A.path(p.terrain,{color:'muted',width:1.4});for(const s of p.segments)A.path(s.points,{color:s.kind==='tunnel'?'orange':'accent',width:2.2});if(p.mode==='siphon'){A.path(p.pipe,{color:'red',width:2});A.path(p.grade,{color:'green',width:1.6,dash:[4,3]});A.dot(12.5,p.headIn,{color:'green',r:3,ring:false});A.dot(19.5,p.headOut,{color:'green',r:3,ring:false});}A.dot(0,300,{color:'green',r:4,ring:false});A.dot(30,268,{color:'gold',r:4,ring:false});A.dot(30,p.arrival,{color:p.cityHighEnough?'green':'red',r:4,hollow:true});B.path(p.pressure,{color:'red',width:2.2});B.line(12.5,0,19.5,0,{color:'muted',dash:[4,3]});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Selected ${p.mode}; arrival height ${v.fix(p.arrival,9)} m versus 268 m: ${p.cityHighEnough?'height sufficient':'height insufficient'} (separate from discharge). Sampled tunnel/cutting ${v.fix(p.tunnel,3)} km, arcade ${v.fix(p.arcade,3)} km; maximum sampled arcade height ${v.fix(p.maxArcade,6)} m.\nPipe comparison: specified length ${v.fix(p.length,6)} m; available drop ${v.fix(p.available,9)} m; capacity ${v.fix(p.capacity,9)} L/s at ${v.fix(p.speed,9)} m/s. Requested ${v.fix(p.demand,6)} L/s needs ${v.fix(p.requestedLoss,6)} m friction head: ${p.demandSupported?'within ideal capacity':'exceeds ideal capacity'}. Gauge pressure-head range[${v.fix(p.minPressureHead,6)}, ${v.fix(p.maxPressureHead,6)}]m; nominal thin-wall peak stress ${v.fix(p.nominalStress/1e6,6)} MPa at t/rₘ=${v.fix(p.wallRatio,6)}. No material-failure prediction.`;});
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Invention',
      name: 'The water wheel',
      credit: 'Hellenistic Greek world. Earliest textual evidence: Philo of Byzantium, 3rd century BCE; first technical description: Vitruvius, c. 25 BCE. Whether the horizontal or the vertical wheel came first is disputed',
      verify: true,
      statement: String.raw`A **water wheel** turns the energy of falling water into rotation of a shaft. The vertical wheel comes in three arrangements. An **undershot** wheel dips floats into a fast stream, which pushes them by impulse. In a **breastshot** wheel the water enters at about the height of the axle and works partly by impulse and partly by its weight in buckets. In an **overshot** wheel the water is led over the top into buckets and its weight turns the wheel, so it needs a fall but hardly any speed. The ceiling for all three is the power of the water, $P_\mathrm{max}=\rho g Q H$, for a flow $Q$ falling through a head $H$.

The earliest evidence is textual: passages attributed to Philo of Byzantium (3rd century BCE) describe a water-driven wheel, an epigram of Antipater of Thessalonica (around the turn of the era) describes a mill, and Vitruvius gives the first technical description, of a geared undershot mill. Historians differ on whether the horizontal-wheeled "Greek" mill or the vertical-wheeled gear-driven mill came first, and the dates proposed for each rest on interpretations of these texts (M. J. T. Lewis argues for the 3rd century BCE for both).

Scope of the picture: it is a **model** with plausible but uncalibrated losses (the floats' leakage, buckets that spill, water thrown out by rotation). It is not a fit to measurements; for the measurements of an eighteenth-century experimenter see 4.5 and 4.12.`,
      idea: String.raw`Whatever the arrangement, the wheel cannot deliver more than the water gives up, $\rho g Q H$ (energy-5.7). The jet from a sluice leaves at the speed $v=\sqrt{2gH}$ that turns the whole head into motion (Bernoulli, fluid-2.9), so an undershot wheel is an impulse machine: floats moving at $u$ take a momentum $\rho Q (v-u)$ per second out of the jet and deliver power $\rho Q(v-u)u$ (mech-2.1), which is greatest at $u=v/2$ and then equals half of the jet's power. No amount of care with the floats gets past that half, because water leaves still moving at $v-2u\neq0$ unless it is slowed in a closed channel.

An overshot wheel uses the weight of the water instead. It has no such limit, its losses are the part of the head not used (the race above the wheel and the fall of the water as it spills out of the buckets) and the kinetic energy it carries off, and it works best at a slow rim speed, because buckets must have time to fill and must keep their water until low on the wheel. That is why the three curves peak at very different rim speeds.`,
      caption: String.raw`The same stream of head $H$ drives three wheels at the same rim speed $u$ (the picture turns at that speed; the blue dots are loaded buckets). Below, the share of the stream's power each wheel delivers, against rim speed. Drag **rim speed** and watch each wheel's share move along its curve: the undershot wheel wants a rim speed near half the jet speed, the overshot wheel a speed of about a metre per second whatever the head. Open circles mark each wheel's best. Raise the head and only the undershot wheel's best speed moves.`,
      deps: ['tech-2.2', 'tech-2.9', 'energy-5.7'],
      see: ['tech-4.5', 'tech-4.12', 'tech-8.3'],
      refs: ['Usher, “Water wheels and windmills”', 'Mokyr ch. 3', 'Lewis, Millstone and Hammer (1997), as cited by Wikipedia “Watermill”'],
      tags: ['ancient', 'c. 250 BCE', 'prime mover'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Watermill' },
      viz(v) {
        const Wst = v.stage({ x: [0, 6.5], y: [-0.12, 1.2], equal: true, axes: false, height: 250, full: true, title: 'the same stream, three wheels, one rim speed' });
        const Pst = v.stage({ x: [0, 9], y: [0, 1], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'rim speed $u$ (m/s)', ylabel: 'power ÷ ρgQH', title: 'share of the stream’s power delivered' });
        const Hs = v.slider('head $H$ (m)', 1, 10, 4, { step: 0.1 });
        const Qs = v.slider('flow $Q$ (m³/s)', 0.05, 1, 0.2, { step: 0.01 });
        const Us = v.slider('rim speed $u$ (m/s)', 0.1, 9, 1, { step: 0.05 });
        const RN = { under: 0.45, over: 0.45, breast: 0.4 };
        const eff = (k, u, H, Q) => {
          const o = { Q, H };
          const P = k === 'under' ? undershotP(u, o) : k === 'over' ? overshotP(u, o).P : breastP(u, o);
          return P / (RHO * G * Q * H);
        };
        let best = {};
        const bestOf = (k, H, Q, vmax) => { let b = 0, bu = 0; for (let i = 1; i <= 240; i++) { const u = (vmax * i) / 240, e = eff(k, u, H, Q); if (e > b) { b = e; bu = u; } } return { e: b, u: bu }; };
        function wheel(ox, kind, ang, u, H, Q, label) {
          const R = RN[kind], cx = ox + 1.45, cy = R, dir = kind === 'over' ? 1 : -1;
          const fillF = bucketFillX(u), thD = (125 + 55 * (1 - fillF)) * D2R;
          Wst.rect(ox, 0, ox + 0.55, 1, { fill: 'accent', fillAlpha: 0.2, stroke: false });
          Wst.line(ox, 1, ox + 0.55, 1, { color: 'accent', width: 1.5 });
          Wst.line(ox - 0.05, 0, ox + 2.3, 0, { color: 'muted', width: 2 });
          if (kind === 'under') {
            Wst.line(ox + 0.55, 1, ox + 0.55, 0.14, { color: 'muted', width: 3 });
            Wst.rect(ox + 0.55, 0, cx + 0.85 * R, 0.1, { fill: 'accent', fillAlpha: 0.35, stroke: false });
            Wst.arrow(ox + 0.65, 0.05, ox + 0.9, 0.05, { color: 'accent', width: 1.6, head: 6 });
          } else if (kind === 'over') {
            Wst.path([[ox + 0.55, 1.0], [cx - 0.05, 2 * R + 0.03]], { color: 'accent', width: 3, alpha: 0.7 });
            Wst.line(ox + 0.55, 1.0, ox + 0.55, 0.9, { color: 'muted', width: 2 });
          } else {
            const ex = cx - R * Math.sin(Math.PI / 3), ey = cy + R * Math.cos(Math.PI / 3);
            Wst.line(ox + 0.55, 1, ox + 0.55, ey + 0.08, { color: 'muted', width: 3 });
            Wst.path([[ox + 0.55, ey + 0.04], [ex, ey + 0.01]], { color: 'accent', width: 3, alpha: 0.7 });
          }
          Wst.circle(cx, cy, R, { color: 'ink', width: 1.6, fill: false });
          Wst.circle(cx, cy, 0.78 * R, { color: 'ink', width: 1, alpha: 0.6, fill: false });
          const NB = 12;
          for (let k = 0; k < NB; k++) {
            const ph = (k / NB) * 2 * Math.PI + dir * ang, px = Math.sin(ph), py = Math.cos(ph);
            Wst.line(cx + 0.78 * R * px, cy + 0.78 * R * py, cx + R * px, cy + R * py, { color: 'ink', width: 1.2, alpha: 0.8 });
            const phn = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            let loaded = false;
            if (kind === 'over') loaded = phn <= thD;
            else if (kind === 'breast') { const q = (2 * Math.PI - phn) % (2 * Math.PI); loaded = q >= Math.PI / 3 && q <= thD; }
            else { const bot = Math.abs(((phn - Math.PI + Math.PI) % (2 * Math.PI)) - Math.PI) ; loaded = Math.abs(phn - Math.PI) < 0.45; }
            if (loaded) {
              const pm = ph + (dir * Math.PI) / NB * (kind === 'under' ? 0 : 1) * 1;
              const mid = ph + (Math.PI / NB) * (kind === 'over' ? 1 : -1);
              if (kind === 'under') Wst.dot(cx + 0.9 * R * Math.sin(ph), cy + 0.9 * R * Math.cos(ph), { r: 3, color: 'accent' });
              else Wst.dot(cx + 0.89 * R * Math.sin(mid), cy + 0.89 * R * Math.cos(mid), { r: 2 + 4 * fillF, color: 'accent' });
            }
          }
          Wst.dot(cx, cy, { r: 3, color: 'ink' });
          Wst.text(label, ox + 1.2, 1.12, { size: 12, color: 'ink', align: 'center', weight: 700 });
          Wst.text(`${v.fix(100 * eff(kind, u, H, Q), 0)}% of ρgQH`, ox + 1.2, -0.08, { size: 11.5, color: 'muted', align: 'center' });
        }
        // buckets of the overshot/breastshot wheels are sized so that they just fill at u = 1/1.5 m/s
        function bucketFillX(u) { return Math.min(1, 1 / Math.max(1e-6, 1.5 * u)); }
        v.animate((t) => {
          const H = Hs.value, Q = Qs.value, vj = Math.sqrt(2 * G * H), u = Math.min(Us.value, vj);
          for (const [i, k, lab] of [[0, 'under', 'undershot'], [1, 'breast', 'breastshot'], [2, 'over', 'overshot']]) {
            const ang = ((u / (RN[k] * H)) * t) % (2 * Math.PI * 1000);
            wheel(2.15 * i, k, ang, u, H, Q, lab);
            best[k] = bestOf(k, H, Q, vj);
          }
          Pst.setView([0, vj], [0, 1]);
          const cols = { under: 'orange', breast: 'purple', over: 'green' };
          Pst.hline(1, { color: 'muted', width: 1.2, dash: [5, 3] });
          Pst.text('all of $\\rho g Q H$', vj * 0.99, 0.96, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
          for (const k of ['under', 'breast', 'over']) {
            Pst.fn((x) => eff(k, x, H, Q), { color: cols[k], width: 2.4, n: 300 });
            Pst.dot(best[k].u, best[k].e, { r: 5, color: cols[k], hollow: true });
            Pst.dot(u, eff(k, u, H, Q), { r: 5, color: cols[k] });
          }
          Pst.vline(u, { color: 'gold', width: 1.3, dash: [4, 3] });
        }, { period: 1e9, still: 1.2 });
        v.legend([['orange', 'undershot'], ['purple', 'breastshot'], ['green', 'overshot'], ['gold', 'rim speed', { dash: [4, 3] }]]);
        v.readout(() => {
          const H = Hs.value, Q = Qs.value, vj = Math.sqrt(2 * G * H), u = Math.min(Us.value, vj);
          const kw = (k) => eff(k, u, H, Q) * RHO * G * Q * H / 1000;
          return `head ${v.fix(H, 1)} m, flow ${v.fix(Q, 2)} m³/s: the stream carries $\\rho g Q H = ${v.fix(RHO * G * Q * H / 1000, 1)}$ kW, jet speed ${v.fix(vj, 1)} m/s\nat $u=${v.fix(u, 2)}$ m/s: undershot **${v.fix(kw('under'), 2)}** kW, breastshot **${v.fix(kw('breast'), 2)}** kW, overshot **${v.fix(kw('over'), 2)}** kW · best shares: ${v.fix(100 * (best.under?.e ?? 0), 0)}% (at ${v.fix(best.under?.u ?? 0, 1)} m/s), ${v.fix(100 * (best.breast?.e ?? 0), 0)}% (${v.fix(best.breast?.u ?? 0, 1)} m/s), ${v.fix(100 * (best.over?.e ?? 0), 0)}% (${v.fix(best.over?.u ?? 0, 1)} m/s) · the undershot ideal is 50% (at $u=v/2$) before leakage`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Event',
      name: 'Smeaton’s water-wheel experiments',
      credit: 'John Smeaton, experiments begun 1752, reported to the Royal Society 1759',
      verify: true,
      statement: String.raw`In the 1750s the English engineer **John Smeaton** built a working model of a water wheel, with a cistern at a controlled head, a sluice, and a cord that lifted a weight, and measured how much work it did for a given quantity of water. He ran 27 sets of experiments on **undershot** wheels (his Table I) and 16 on **overshot** wheels (Table II), recording for each the power of the water (weight of water used times the height it fell) and the effect (weight raised times the height). He published the results in 1759. The result that mattered: **at the same quantity of water and the same fall, an overshot wheel does about twice the work of an undershot wheel**, and, for each wheel, the maximum effect comes with the wheel turning slowly (for his undershot wheel about two-fifths of the speed of the water). At the time it was widely believed that undershot wheels were the more powerful; Smeaton's measurements are the source of the engineering rule that water's weight, not its impulse, should be used where there is a fall.

How the numbers below were obtained: the two tables were read from an OCR transcription of the 1759 paper (Philosophical Transactions 51, in an online archive), not from page images. The ratio of effect to power was recomputed from the printed Power and Effect columns and agrees with his printed ratios to about 0.05 in 41 of the 43 rows; in rows 10 and 20 of Table I the printed ratio differs by about 0.1, which may be an OCR error or a misprint. The figures called "Smeaton's" are therefore marked unverified against the original pages.`,
      idea: String.raw`The experiment is a clean application of conservation of energy (mech-3.6): what the water gives up in falling is $W_\mathrm{water}\,h$, the useful part is the weight raised times its rise, and the ratio of the two is an efficiency that Smeaton could measure for every setting of the sluice and the load. The load was increased until the product of load and turns of the wheel (the effect) was greatest, as that is the working point of a mill.

The replay shows what a theory of impulse alone would not: for an impulse wheel an ideal argument predicts that the best rim speed is half the water's speed and the best load half of the load that just stops the wheel, and an efficiency of at most one half. Smeaton measured about a third, a best speed of two-fifths and a best load three-quarters of the stopping load (his "4 : 3"), and so showed that the ideal picture overstates how the wheel behaves, while the weight of water in the buckets of the overshot wheel gives more than twice as much.`,
      caption: String.raw`Left: every experiment of Smeaton's Tables I (27 undershot sets, blue) and II (16 overshot sets, green) as the share of the water's power that was delivered as work; click a point to read its row. Choose whether the overshot share is of the power of the **whole descent** or of the **wheel's own diameter**. The two horizontal lines are the means. Right: the modelled share against load for the same two wheel types (the models of 4.4 at a head of 0.8 m, about his 27–35 inches), with his measured ranges as bands and his measured load ratio for the undershot wheel as a vertical line: the model's best load for an impulse wheel is 0.5 of the stopping load, his was about 0.75.`,
      deps: ['tech-4.4', 'mech-3.6'],
      see: ['tech-4.12'],
      refs: ['Mokyr ch. 5', 'Smeaton 1759, Phil. Trans. 51:100–174 (doi 10.1098/rstl.1759.0019), Tables I and II (OCR transcription at jimclifford.ca)', 'Smeaton 1776, Phil. Trans. 66 (one-half versus one-third of the water’s speed)'],
      tags: ['industrial', '1759', 'experiment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/John_Smeaton' },
      viz(v) {
        const A = v.stage({ x: [0, 28], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.15, minWidth: 340, xlabel: 'experiment number', ylabel: 'effect ÷ power', title: 'Smeaton’s Tables I and II' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 320, xlabel: 'load ÷ load that stops the wheel', ylabel: 'effect ÷ power', title: 'modelled wheels at a head of 0.8 m' });
        // [power, effect]  — Table I (undershot), Smeaton 1759, as transcribed
        const T1 = [[4358, 1411], [3970, 1266], [3329, 1044], [2890, 901.4], [2439, 735.7], [1970, 561.8], [1524, 442.5], [1173, 328], [733, 213.7], [404.7, 117], [4890, 1505], [4009, 1223], [2993, 975], [2659, 774], [1872, 549], [1280, 390], [712, 212], [3748, 1210], [2887, 878], [1734, 541], [1064, 317], [3338, 1006], [2257, 686], [1231, 385], [2588, 783], [1544, 450], [1811, 534]];
        // [descent in, water lb/min, turns/min, weight lb, power whole descent, power of wheel, effect] — Table II (overshot)
        const T2 = [[27, 30, 19, 6.5, 810, 720, 556], [27, 56, 16.5, 14.5, 1530, 1360, 1050], [27, 56, 20.5, 12.5, 1530, 1360, 1167], [27, 63, 20.5, 13.5, 1710, 1524, 1245], [27, 76, 21.5, 15.5, 2070, 1840, 1500], [28.5, 73.5, 18.5, 17.5, 2090, 1764, 1476], [28.5, 96.5, 20.5, 20.5, 2755, 2320, 1868], [30, 90, 20, 19.5, 2700, 2160, 1755], [30, 96.5, 20.5, 20.5, 2900, 2320, 1914], [30, 113.5, 21, 23.5, 3400, 2720, 2221], [33, 56.5, 20.5, 13.5, 1870, 1360, 1230], [33, 106.5, 22.5, 21.5, 3520, 2560, 2153], [33, 146.5, 23, 27.5, 4840, 3520, 2846], [35, 65, 19.5, 16.5, 2275, 1560, 1466], [35, 120, 21.5, 25.5, 4200, 2880, 2467], [35, 163.5, 25, 26.5, 5728, 3924, 2981]];
        const r1 = T1.map(([p, e]) => e / p), mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
        const basis = v.select('overshot share of', [{ value: 'whole', label: 'whole descent' }, { value: 'wheel', label: 'wheel’s own fall' }], 'whole');
        let sel = null;
        const r2 = () => T2.map((r) => (basis.value === 'whole' ? r[6] / r[4] : r[6] / r[5]));
        A.onClick((x, y) => {
          let bestD = 1e9, pick = null;
          const test = (kind, i, xx, yy) => { const d = Math.hypot((xx - x) * 8, (yy - y) * 80); if (d < bestD) { bestD = d; pick = { kind, i }; } };
          r1.forEach((r, i) => test('u', i, i + 1, r)); r2().forEach((r, i) => test('o', i, i + 1, r));
          sel = pick; v.invalidate();
        });
        const HM = 0.8, QM = 0.2, vj = Math.sqrt(2 * G * HM);
        const curve = (kind) => {
          const pts = [], F0 = (() => { const u0 = 0.01; const P = kind === 'under' ? undershotP(u0, { Q: QM, H: HM }) : overshotP(u0, { Q: QM, H: HM }).P; return P / u0; })();
          for (let i = 1; i <= 400; i++) {
            const u = (vj * i) / 400, P = kind === 'under' ? undershotP(u, { Q: QM, H: HM }) : overshotP(u, { Q: QM, H: HM }).P;
            if (P <= 0 && i > 5) break;
            pts.push([clamp(P / u / F0, 0, 1.2), P / (RHO * G * QM * HM), u]);
          }
          return pts;
        };
        const cu = curve('under'), co = curve('over');
        const peak = (c) => c.reduce((b, p) => (p[1] > b[1] ? p : b), c[0]);
        v.render(() => {
          const o = r2();
          A.hband(mean(r1) - 0.003, mean(r1) + 0.003, { color: 'accent', alpha: 0.9 });
          A.hband(mean(o) - 0.003, mean(o) + 0.003, { color: 'green', alpha: 0.9 });
          r1.forEach((r, i) => A.dot(i + 1, r, { r: 4.5, color: 'accent' }));
          o.forEach((r, i) => A.dot(i + 1, r, { r: 4.5, color: 'green' }));
          A.text(`undershot mean ${v.fix(mean(r1), 2)}`, 27.6, mean(r1) + 0.03, { size: 11, color: 'accent', align: 'right', baseline: 'bottom', plate: true });
          A.text(`overshot mean ${v.fix(mean(o), 2)}`, 27.6, mean(o) + 0.03, { size: 11, color: 'green', align: 'right', baseline: 'bottom', plate: true });
          if (sel) { const y = sel.kind === 'u' ? r1[sel.i] : o[sel.i]; A.circle(sel.i + 1, y, 0.0, {}); A.dot(sel.i + 1, y, { r: 8, color: 'gold', hollow: true }); }
          // model
          B.hband(Math.min(...r1), Math.max(...r1), { color: 'accent', alpha: 0.12 });
          B.hband(Math.min(...o), Math.max(...o), { color: 'green', alpha: 0.12 });
          B.path(cu.map((p) => [p[0], p[1]]), { color: 'accent', width: 2.4 });
          B.path(co.map((p) => [p[0], p[1]]), { color: 'green', width: 2.4 });
          const pu = peak(cu), po = peak(co);
          B.dot(pu[0], pu[1], { r: 5, color: 'accent', hollow: true }); B.dot(po[0], po[1], { r: 5, color: 'green', hollow: true });
          B.vline(0.75, { color: 'orange', width: 1.4, dash: [5, 3] });
          B.text('Smeaton: best load\n≈ ¾ of stopping load', 0.74, 0.04, { size: 10.5, color: 'orange', align: 'right', baseline: 'bottom', plate: true });
          B.text('Table I range', 0.02, Math.max(...r1) + 0.01, { size: 10.5, color: 'accent', baseline: 'bottom' });
          B.text('Table II range', 0.02, Math.min(...o) - 0.01, { size: 10.5, color: 'green', baseline: 'top' });
        });
        v.legend([['accent', 'undershot'], ['green', 'overshot'], ['gold', 'selected row', { dot: true }], ['orange', 'measured best load', { dash: [5, 3] }]]);
        v.readout(() => {
          const o = r2();
          const pu = peak(cu), po = peak(co);
          const row = sel ? (sel.kind === 'u' ? `Table I no. ${sel.i + 1}: power ${T1[sel.i][0]}, effect ${T1[sel.i][1]}, effect ÷ power = ${v.fix(r1[sel.i], 3)}` : (() => { const r = T2[sel.i]; return `Table II no. ${sel.i + 1}: descent ${r[0]} in, water ${r[1]} lb/min, ${r[2]} turns/min, raised ${r[3]} lb; power ${r[4]} (wheel's own: ${r[5]}), effect ${r[6]}, share ${v.fix(o[sel.i], 3)}`; })()) : 'click a point to read its row';
          return `mean share: undershot **${v.fix(mean(r1), 3)}** (range ${v.fix(Math.min(...r1), 2)}–${v.fix(Math.max(...r1), 2)}), overshot **${v.fix(mean(o), 3)}** (range ${v.fix(Math.min(...o), 2)}–${v.fix(Math.max(...o), 2)}) → ratio **${v.fix(mean(o) / mean(r1), 2)}**, Smeaton's "about double"\nmodel: undershot best at load ${v.fix(pu[0], 2)} of the stopping load (${v.fix(100 * pu[1], 0)}%) and rim speed ${v.fix(pu[2] / vj, 2)} of the jet's (Smeaton: ¾ and 0.4); overshot best share ${v.fix(100 * po[1], 0)}%\n${row}`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Invention',
      name: 'The windmill',
      credit: 'Panemone (vertical-axis) windmills reported from Persia, dated between the 7th and 10th centuries by different authors; horizontal-axis post mills in north-west Europe from the 1180s (earliest certain English reference 1185, Weedley, Yorkshire)',
      verify: true,
      statement: String.raw`A **windmill** turns the kinetic energy of the wind into rotation of a shaft that grinds grain or pumps water. Two quite different machines carry the name. The **panemone**, with sails turning in a horizontal plane about a vertical axis, is reported from Persian lands, with the date placed between the 7th and 10th centuries depending on how the early accounts are read (an anecdote about the caliph Umar is questioned because it was recorded only in the 10th century). The **post mill** of northern Europe has its sails on a horizontal axis in a wooden body that balances on a single upright post and can be turned by hand to face the wind; documentary evidence for European windmills begins in the 1180s, and the earliest certain English reference, in 1185, does not say which type it was. Whether the European mill descended from the Persian one or was invented independently is not settled.

The power in a wind of speed $U$ through a disc of area $A=\pi R^2$ is $\tfrac12\rho A U^3$, and no machine can take more than the fraction $\tfrac{16}{27}\approx0.593$ of it (the Betz limit). That limit was derived by Lanchester (1915), Betz (1919, published 1920) and Joukowski (1920) independently, so it carries Betz's name by convention and not by priority.

Scope of the picture: the sails are modelled as flat boards with a thin-plate lift and drag (the lift and drag coefficients are made up for the picture, not measured on medieval sails), so the power coefficient it shows (about 0.1–0.2) is a model result.`,
      idea: String.raw`Slow the wind to a fraction of its speed behind the sails and the energy taken out is the difference of kinetic energy fluxes. If the sails slow the air passing through them by a fraction $a$ (the axial induction), mass and momentum conservation (fluid-2.12) give a power coefficient $C_p=4a(1-a)^2$, whose maximum $16/27$ falls at $a=\tfrac13$ (energy-5.2). Take too little wind speed out and the air is not used; take too much and it goes round the disc instead of through it.

A real sail is limited further by the lift and drag of its cloth or board at each radius. Along a blade the sail moves at $\Omega r$ and the wind arrives axially at $U$, so the apparent wind meets it at an angle $\phi=\arctan\bigl(U/(\Omega r)\bigr)$ that grows toward the hub: the sail must be twisted, with a steeper angle of weather near the hub, to keep a good angle of attack everywhere (a point Smeaton made in 1759, see 4.12). Facing the wind matters too: if the axis is turned by an angle $\psi$ from the wind, the wind component along it is $U\cos\psi$ and the power falls like $\cos^3\psi$ in the simplest estimate, which is why a post mill is built to be turned.`,
      caption: String.raw`Top view (left): drag the **gold wind** handle (where the wind comes from) and the **orange sail-facing** handle (which way the sails point). The grey bar is the width of wind the sails face, and the power factor is $\cos^3\psi$ of the misalignment. Middle: the power coefficient of a four-sail windmill against tip-speed ratio $\lambda$, for the **sail angle** and **sail area** you choose, under the Betz limit (dashed). Right: the power in a given wind and the cube law; the dashed curve is the Betz ceiling.`,
      deps: ['tech-4.4', 'energy-5.2'],
      see: ['energy-5.1', 'energy-5.3', 'tech-4.12', 'aero-7.3'],
      refs: ['Usher, “Water wheels and windmills”', 'Mokyr ch. 3', 'Wikipedia “Windmill” (Persian panemone, Weedley 1185) and “Betz’s law” (Lanchester 1915, Betz 1919, Zhukovsky 1920)'],
      tags: ['medieval', 'c. 1180', 'prime mover'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Windmill' },
      viz(v) {
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 280, title: 'post mill from above' });
        const B = v.stage({ x: [0, 6], y: [0, 0.7], axes: 'box', gutter: true, height: 300, weight: 1.1, minWidth: 320, xlabel: 'tip-speed ratio $\\lambda=\\Omega R/U$', ylabel: '$C_p$', title: 'power coefficient of the sails' });
        const C = v.stage({ x: [0, 20], y: [0, 100], axes: 'box', gutter: true, height: 300, weight: 1.1, minWidth: 320, xlabel: 'wind speed (m/s)', ylabel: 'power (kW)', title: 'power in the wind' });
        const beta = v.slider('sail angle of weather (°)', 3, 45, 12, { step: 0.5 });
        const solid = v.slider('sail area ÷ swept area', 0.1, 0.6, 0.3, { step: 0.01 });
        const Rs = v.slider('sail radius $R$ (m)', 4, 16, 9, { step: 0.5 });
        const Us = v.slider('wind $U$ (m/s)', 2, 20, 8, { step: 0.5 });
        const lam = v.slider('tip-speed ratio $\\lambda$', 0.5, 6, 2, { step: 0.05 });
        const wind = A.handle(Math.cos(55 * D2R) * 1.4, Math.sin(55 * D2R) * 1.4, { color: 'gold', r: 8, label: 'wind', labelPos: 'ne', constrain: (x, y) => { const a = Math.atan2(y, x); return [1.4 * Math.cos(a), 1.4 * Math.sin(a)]; } });
        const face = A.handle(Math.cos(20 * D2R) * 0.85, Math.sin(20 * D2R) * 0.85, { color: 'orange', r: 8, label: 'sails face', labelPos: 'se', constrain: (x, y) => { const a = Math.atan2(y, x); return [0.85 * Math.cos(a), 0.85 * Math.sin(a)]; } });
        let cache = '', cp = [];
        const lamGrid = Array.from({ length: 56 }, (_, i) => 0.4 + (i * 5.6) / 55);
        v.render(() => {
          const wa = Math.atan2(wind.y, wind.x), fa = Math.atan2(face.y, face.x);
          let psi = Math.abs(wa - fa); if (psi > Math.PI) psi = 2 * Math.PI - psi;
          const fac = psi < Math.PI / 2 ? Math.cos(psi) ** 3 : 0;
          // ---- A: top view
          A.circle(0, 0, 1.4, { color: 'faint', width: 1, dash: [3, 4], fill: false });
          const fx = Math.cos(fa), fy = Math.sin(fa), nx = -fy, ny = fx;
          A.poly([[-0.28 * fx + 0.22 * nx, -0.28 * fy + 0.22 * ny], [0.1 * fx + 0.22 * nx, 0.1 * fy + 0.22 * ny], [0.1 * fx - 0.22 * nx, 0.1 * fy - 0.22 * ny], [-0.28 * fx - 0.22 * nx, -0.28 * fy - 0.22 * ny]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.4 });
          A.line(-0.6 * fx, -0.6 * fy, -0.28 * fx, -0.28 * fy, { color: 'muted', width: 3 });
          A.text('tail pole', -0.68 * fx, -0.68 * fy, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
          const sx = 0.12 * fx, sy = 0.12 * fy;
          A.line(sx + 0.8 * nx, sy + 0.8 * ny, sx - 0.8 * nx, sy - 0.8 * ny, { color: 'ink', width: 4 });
          // wind arrow and stream tube
          const wdx = -Math.cos(wa), wdy = -Math.sin(wa); // blowing toward the mill
          const wnx = -wdy, wny = wdx, half = 0.8 * Math.abs(Math.cos(psi));
          A.line(Math.cos(wa) * 1.15 + half * wnx, Math.sin(wa) * 1.15 + half * wny, Math.cos(wa) * 1.15 - half * wnx, Math.sin(wa) * 1.15 - half * wny, { color: 'gold', width: 5, alpha: 0.8 });
          for (const o of [-0.8, -0.4, 0, 0.4, 0.8]) { const off = o * half / 0.8; A.arrow(Math.cos(wa) * 1.4 + off * wnx, Math.sin(wa) * 1.4 + off * wny, Math.cos(wa) * 0.95 + off * wnx, Math.sin(wa) * 0.95 + off * wny, { color: 'gold', width: 1.4, head: 6, alpha: 0.8 }); }
          A.text(`misaligned by ${v.fix(psi / D2R, 0)}°`, 0, -1.55, { size: 12, color: 'ink', align: 'center', weight: 600 });
          // ---- B: Cp(lambda)
          const key = `${beta.value}|${solid.value}`;
          if (key !== cache) { cache = key; cp = lamGrid.map((l) => windCp(l, () => beta.value * D2R, { solidity: solid.value })); }
          B.hline(BETZ, { color: 'muted', width: 1.3, dash: [6, 4] });
          B.text('Betz limit 16/27', 5.95, BETZ + 0.015, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          B.path(lamGrid.map((l, i) => [l, cp[i]]), { color: 'accent', width: 2.6 });
          const cpHere = windCp(lam.value, () => beta.value * D2R, { solidity: solid.value });
          B.dot(lam.value, cpHere, { r: 6, color: 'gold' });
          B._cp = cpHere; B._max = Math.max(...cp); B._lmax = lamGrid[cp.indexOf(Math.max(...cp))];
          // ---- C: power
          const area = Math.PI * Rs.value ** 2, wnd = (U) => 0.5 * 1.225 * area * U ** 3 / 1000;
          C.setView([0, 20], [0, Math.max(10, wnd(20) * BETZ * 1.05)]);
          C.fn((U) => wnd(U) * BETZ, { color: 'muted', width: 1.6, dash: [6, 4] });
          C.fn((U) => wnd(U) * B._cp * fac, { color: 'accent', width: 2.6 });
          C.vline(Us.value, { color: 'gold', width: 1.3, dash: [4, 3] });
          C.dot(Us.value, wnd(Us.value) * B._cp * fac, { r: 6, color: 'gold' });
          C._p = wnd(Us.value) * B._cp * fac; C._w = wnd(Us.value);
        });
        v.legend([['gold', 'wind and operating point'], ['accent', 'the sails (model)'], ['muted', 'Betz ceiling', { dash: [6, 4] }]]);
        v.readout(() => {
          const wa = Math.atan2(wind.y, wind.x), fa = Math.atan2(face.y, face.x);
          let psi = Math.abs(wa - fa); if (psi > Math.PI) psi = 2 * Math.PI - psi;
          const fac = psi < Math.PI / 2 ? Math.cos(psi) ** 3 : 0;
          return `wind power through the disc: **${v.fix(C._w, 1)}** kW at ${v.fix(Us.value, 1)} m/s ($\\tfrac12\\rho A U^3$, cube law); sails at $\\lambda=${v.fix(lam.value, 2)}$: $C_p=${v.fix(B._cp, 3)}$ (best $${v.fix(B._max, 3)}$ at $\\lambda\\approx${v.fix(B._lmax, 1)}$; Betz limit ${v.fix(BETZ, 3)}); facing error ${v.fix(psi / D2R, 0)}° → factor $\\cos^3\\psi=${v.fix(fac, 2)}$\nmodel output: **${v.fix(C._p, 2)}** kW. Make the angle of weather large and the best $\\lambda$ falls to about 1; make it small and the sails need to spin faster.`;
        });
      },
    },
  ],
};
