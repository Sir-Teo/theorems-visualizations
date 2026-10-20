import { waterWheels, smeatonWater } from './source-audit-power.js';
import { mortar, aqueduct } from './source-audit-water.js';
// History of Technology — Chapter 4: Building, water and power before steam (items 4.1–4.6; 4.7–4.12 are in ch04-b.js)
import { yearStage, drawYears, lump, plate, windCp, BETZ, archGeometry, archFeasible, thrustAt } from './ch04.shared.js';

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
      num:'4.4',kind:'Invention',name:'The water wheel',verify:false,
      credit:'River wheel and geared mill described by Vitruvius X.5; hydraulic comparisons authored here',
      statement:String.raw`A water wheel converts energy transferred by moving or descending water into shaft work. Vitruvius X.5 describes river-driven paddles and a geared water mill. Smeaton's 1759 experiments distinguish water acting by impulse, by its weight in buckets, and mixed arrangements. These passages establish described mechanisms; they do not establish a unique inventor, first date or priority between horizontal and vertical wheels.

An undershot arrangement receives water low on the wheel, an overshot arrangement receives it near the top, and a breastshot arrangement receives it partway down. Performance depends on the actual race, geometry, flow and losses. The comparison below is an explicit family of authored hydraulic rules; Smeaton's measurements are shown separately in 4.5.`,
      idea:String.raw`For the model's reservoir drop $H$ and discharge $Q$, available power is $P_0=\rho gQH$. A jet idealization gives $v=\sqrt{2gH}$. If a continuous captured stream leaves its one-direction momentum transfer moving at float speed $u$, the impulse formula is $P=\rho Q(v-u)u$ for $0\le u\le v$. It peaks at $u=v/2$, at half the incoming kinetic power; the plotted version retains 75% of that stream. This is a bound for that particular momentum model, not every undershot or impulse machine.

Bucket rules use physical radii $0.45H$ (undershot/overshot) or $0.4H$ (breastshot), a prescribed filling fraction, spilling angle and speed loss. Breastshot adds a specified impulse term using the head above its entry. Their coefficients are chosen assumptions, not measured efficiencies or a universal best-speed rule.`,
      caption:String.raw`Choose a wheel to inspect its arrangement, then vary head, flow, rim speed and elapsed model time. The diagram is normalized to a common drawing size; its phase uses the selected physical radius. It is schematic rather than a reconstruction of Vitruvius or Smeaton's apparatus. The other panel shows all three complete power-share curves over the offered 0–15 m/s range. Gold circles mark the selected rim speed, including speeds above the jet speed without silently changing the control. Hollow markers are the largest values on the 601-point comparison grid.`,
      deps:['tech-2.2','tech-2.9','energy-5.7'],see:['tech-4.5','tech-4.12'],
      refs:['Vitruvius, De architectura X.5.1–2; Morgan 1914 pp.294–295 and Gwilt 1826','Smeaton 1759, Phil. Trans. 51:100–174, Parts I–II and scholium pp.137–138'],tags:['ancient','prime mover','hydraulics'],
      scope:String.raw`The finite 601-point grids, captured fraction 0.75, bucket capacity, spilling angles, radius/head ratios and loss factors are authored. Water density is 1000 kg/m³ and gravity 9.81 m/s². The model omits detailed free-surface flow, blade deflection, gearing and bearing losses. Marks are finite-grid maxima, not continuous optimization certificates or experimental observations.`,
      links:{source:'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/10*.html',experiment:'https://www.engr.psu.edu/mtah/projects/pdf/smeaton1759.pdf'},
      viz(v){
        const head=v.slider('head H (m)',1,10,4,{step:'any',decimals:6}),flow=v.slider('flow Q (m³/s)',.05,1,.2,{step:'any',decimals:6}),speed=v.slider('rim speed u (m/s)',0,15,1,{step:'any',decimals:6}),time=v.slider('elapsed model time (s)',0,5,1,{step:'any',decimals:6}),kind=v.select('wheel',[{value:'under',label:'undershot'},{value:'breast',label:'breastshot'},{value:'over',label:'overshot'}],'under'),A=v.stage({x:[-1.3,1.3],y:[-.25,2.4],equal:true,axes:false,height:310,minWidth:260,title:'selected schematic arrangement'}),B=v.stage({x:[-.7,15.7],y:[-.12,1.12],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'rim speed (m/s)',ylabel:'power ÷ ρgQH',title:'complete authored speed family'});let info;
        v.legend([['orange','undershot'],['purple','breastshot'],['green','overshot'],['gold','selected speed',{dot:true}]]);
        v.render(()=>{const p=waterWheels(head.value,flow.value,speed.value,time.value,kind.value),cols=['orange','purple','green'];A.circle(0,1,.8,{color:'ink',width:1.6});A.circle(0,1,.55,{color:'muted',width:1});for(let i=0;i<12;i++){const a=p.phase+i*Math.PI/6;A.line(.55*Math.sin(a),1+.55*Math.cos(a),.8*Math.sin(a),1+.8*Math.cos(a),{color:'ink',width:1.4});}A.dot(0,1,{color:'ink',r:4,ring:false});if(p.kind==='under')A.arrow(-1.15,.25,-.45,.25,{color:'accent',width:3});else if(p.kind==='over')A.path([[-1.15,2.05],[-.1,2.05],[-.1,1.9]],{color:'accent',width:3});else A.arrow(-1.15,1.4,-.7,1.4,{color:'accent',width:3});A.text(p.kind==='under'?'undershot':p.kind==='over'?'overshot':'breastshot',0,2.25,{align:'center',color:'ink',size:12});for(let i=0;i<3;i++){B.path(p.curves[i],{color:cols[i],width:2});B.dot(p.peaks[i][0],p.peaks[i][1],{color:cols[i],r:4,hollow:true});B.dot(p.u,p.power[i]/p.available,{color:'gold',r:3.5,ring:false});}B.line(0,1,15,1,{color:'muted',dash:[4,3]});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Available ${v.fix(p.available/1000,9)} kW; jet ${v.fix(p.jet,9)} m/s. Selected speed ${v.fix(p.u,9)} m/s; physical radius ${v.fix(p.radius,9)} m; phase ${v.fix(p.phase,9)} rad.\nModel powers (undershot, breastshot, overshot): ${p.power.map(x=>v.fix(x/1000,9)).join(', ')} kW. Largest shares among 601 grid speeds: ${p.peaks.map(x=>`${v.fix(x[1],9)} at ${v.fix(x[0],3)} m/s`).join('; ')}. Authored rules, not source measurements.`;});
      },
    },

    // ------------------------------------------------------------------ 4.5
    {
      num:'4.5',kind:'Event',name:'Smeaton’s water-wheel experiments',verify:false,
      credit:'John Smeaton, experiments 1752–1753, published 1759',
      statement:String.raw`Smeaton measured model water wheels under controlled water supply and load. His 1759 paper gives 27 undershot sets in Table I (p.115) and 16 overshot sets in Table II (p.129). He explicitly warns that model results require checks at full size. His general comparison is that overshot work was about twice undershot work under like quantity and fall; this is his experimental conclusion, not a universal theorem about all wheels.

The two tabulated denominators require care. Table I's printed Power uses **virtual/effective head**, inferred from unloaded wheel speed. Table II reports both **whole descent** and **wheel diameter** power. An arithmetic mean of the plotted row ratios is not a controlled like-for-like estimate across identical conditions. The view preserves the printed power/effect columns and separately checks the printed ratios, including genuine internal discrepancies.`,
      idea:String.raw`His useful effect combines the raised weight and its rise, with stated machine corrections. The plot divides the **printed Effect** by the chosen **printed Power**, without replacing them by products of other rounded columns. The second plot subtracts the printed second term r of a 10:r ratio:
$$\delta=10\,\frac{\mathrm{Effect}}{\mathrm{Power}}-r.$$
Small residuals can reflect rounding. Larger discrepancies remain visible rather than being silently repaired. Table I row 11 prints Power 4800 and Effect 1505 with ratio 10:3.075; row 10 and row 20 also have conspicuous differences. Table II row 2 prints Effect 1060. These readings were checked against actual original page images.`,
      caption:String.raw`Both panels include all 43 sets. Choose the overshot denominator and select one row from each table using the sliders or clicking near a marker. Gold rings mark both selections; the readout gives raw printed columns and their independently recomputed fractions. The left means are explicitly unweighted means of these finite rows. The right plot shows every rounding/discrepancy residual on a complete dynamic range. Ancillary water-flow, speed and load columns are not transcribed or inferred here.`,
      deps:['tech-4.4','mech-3.6'],see:['tech-4.12'],refs:['Smeaton 1759, Phil. Trans. 51:100–174; actual pp.100–138, Table I p.115 and Table II p.129'],tags:['industrial','1759','experiment'],
      scope:String.raw`This is an arithmetic replay of selected printed columns. Published numbers and ratios are retained even when inconsistent; no correction of an alleged printing error is inferred. The two power bases, row-specific conditions, source approximations and full-size caveat prevent treating the ratio of row means as a universal efficiency multiplier.`,
      links:{source:'https://www.engr.psu.edu/mtah/projects/pdf/smeaton1759.pdf',doi:'https://doi.org/10.1098/rstl.1759.0019'},
      viz(v){
        const basis=v.select('overshot denominator',[{value:'whole',label:'whole descent'},{value:'wheel',label:'wheel diameter'}],'whole'),under=v.slider('Table I selected row',1,27,1,{int:true}),over=v.slider('Table II selected row',1,16,1,{int:true}),A=v.stage({x:[-.5,28.5],y:[-.12,1.12],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'set number within its table',ylabel:'printed Effect ÷ printed Power',title:'source columns, declared denominator'}),B=v.stage({x:[-.5,28.5],y:[-.2,.2],axes:'box',gutter:true,height:310,minWidth:260,xlabel:'set number within its table',ylabel:'10 × fraction − printed ratio term',title:'printed arithmetic discrepancies'});let info;
        const pick=(s,x,y)=>{const p=smeatonWater(basis.value,under.value,over.value),sets=[p.under,p.over];let best=null;sets.forEach((rs,k)=>rs.forEach(r=>{const yy=s===A?r.ratio:r.residual,d=Math.hypot(s.X(r.row)-s.X(x),s.Y(yy)-s.Y(y));if(!best||d<best.d)best={d,k,row:r.row};}));if(best&&best.d<=18)(best.k?over:under).set(best.row);};A.onClick((x,y)=>pick(A,x,y));B.onClick((x,y)=>pick(B,x,y));
        v.legend([['accent','Table I: virtual head'],['green','Table II: chosen basis'],['gold','selected rows',{dot:true}]]);
        v.render(()=>{const p=smeatonWater(basis.value,under.value,over.value);B.setView([-.5,28.5],p.residualY);B.line(0,0,28,0,{color:'muted',dash:[4,3]});for(const[rows,col,selected,m]of[[p.under,'accent',p.selectedUnder,p.meanUnder],[p.over,'green',p.selectedOver,p.meanOver]]){A.line(0,m,28,m,{color:col,dash:[4,3]});for(const r of rows){A.dot(r.row,r.ratio,{color:col,r:3.8,ring:false});B.dot(r.row,r.residual,{color:col,r:3.8,ring:false});}A.dot(selected.row,selected.ratio,{color:'gold',r:7,hollow:true});B.dot(selected.row,selected.residual,{color:'gold',r:7,hollow:true});}info=p;});
        v.readout(()=>{if(!info)return'';const p=info,describe=(label,r)=>`${label} row ${r.row}: printed Power ${r.power}, Effect ${r.effect}, ratio 10:${r.printed}; Effect/Power ${v.fix(r.ratio,9)}, residual ${v.fix(r.residual,9)}.`;return `${describe('Table I (virtual head)',p.selectedUnder)}\n${describe(`Table II (${p.basis==='whole'?'whole descent':'wheel diameter'})`,p.selectedOver)} Unweighted row means ${v.fix(p.meanUnder,9)} and ${v.fix(p.meanOver,9)}; differing source denominators and conditions must be retained.`;});
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
