import{matchingFunctionsItem}from'./source-audit-colorimetry-items.js';
// Visual Art & Color — Chapter 4: Trichromacy and colorimetry (items 4.1–4.8; 4.9–4.16 are in ch04-b.js)
import { METAMER_LAMPS, MIXTURE_OPS, metamerSurfaces, metamerMixture, metamerNumber } from './metamer-audit.js';
import { CONE_CURVES, CONE_AMOUNT_MAX, coneStimulus, coneLeastSquares, coneMatchTarget, coneMatch, coneDisplayPair } from './source-audit-cones.js';
import { cmf, cmfT, specRGB, rgbOf, spdXYZ, xyOf, xyz, planck, gauss, sigm, drawChromaticity, LOCUS, inLocus, dominant, specBars, SRGB, coneFund, conePeaks, coneResp, toLMS, fromLMS, primSet, CIERGB, EW, adaptXYZ, mv3, inv3, metamerNull } from './ch04.shared.js';

const CONE_COL = ['red', 'green', 'accent'], CONE_NAME = ['L', 'M', 'S'];
const CF = []; for (let l = 380; l <= 780; l++) CF.push(coneFund(l));
const cf = (l) => CF[Math.max(0, Math.min(400, Math.round(l) - 380))];
/** Move (x,y) toward the equal-energy white until it lies inside the spectral locus polygon. */
function clampLocus(x, y) {
  if (inLocus(x, y)) return [x, y];
  let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (inLocus(1 / 3 + (x - 1 / 3) * m, 1 / 3 + (y - 1 / 3) * m)) a = m; else b = m; }
  return [1 / 3 + (x - 1 / 3) * a, 1 / 3 + (y - 1 / 3) * a];
}
const up = (c) => { const d = c[0] + 15 * c[1] + 3 * c[2] || 1; return [(4 * c[0]) / d, (9 * c[1]) / d]; };
const fmt3 = (v, a) => a.map((u) => v.fix(u, 3)).join(', ');

export default {
  collection: 'art',
  chapter: 4,
  title: 'Trichromacy and colorimetry',
  summary: String.raw`The eye compresses each spectrum into three cone responses, so infinitely many spectra look alike. Grassmann’s laws make colour matching linear, which lets the CIE encode any colour as three numbers and draw all colours on a chromaticity diagram, where mixtures fall on straight lines. Gamuts, colour temperature, sRGB and colour blindness all become geometry in that diagram.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num:'4.1',kind:'Concept',name:'Cone fundamentals: L, M and S',
      statement:String.raw`Photopic trichromatic colour matching can be modelled by three relative cone signals. Here $\bar l,\bar m,\bar s$ are the **CIE 2006 2° energy-based cone fundamentals**: standard-observer corneal sensitivities, including the effects of ocular filtering. For spectral power density $S(\lambda)$ in consistent energy units,
$$q_i=\int S(\lambda)\,\bar c_i(\lambda)\,d\lambda.$$
Here $i=L,M,S$.
A cone obeys univariance: its response depends on absorption rate rather than a separate wavelength label. These three relative signals are not a complete account of spatial, temporal or adapted colour appearance.`,
      idea:String.raw`Multiplying the spectrum by a sensitivity curve weights the wavelengths that contribute to that cone signal; integration adds their contributions. Scaling the spectrum scales every signal. A single signal cannot distinguish an intensity change from a wavelength change that gives the same response. The curves overlap, so ratios can carry information under restricted stimulus assumptions, but $L/M$ alone does not identify an arbitrary spectrum or its perceived hue.

The numerical source tabulates energy-based sensitivities separately normalized for the three classes; their heights do not measure relative cone counts or absolute gains. We linearly interpolate the published 5 nm table and integrate numerically. Bars divide each $q_i$ by that cone’s response to unit, equal-energy spectral density over the table range, so that reference gives $(1,1,1)$. The spectrum concept is art-3.2.`,
      caption:String.raw`Choose an authored spectrum, its intensity, and the cone whose product is shaded. Broad and narrow bands are Gaussian shapes; narrow means 8 nm FWHM, not a delta function. The gold spectrum and shaded product use the same relative spectral-density scale. Compare the actual integral bars, including zero intensity and the equal-energy reference. The black-body option is an authored 2856 K Planck spectrum, not a measured lamp.`,
      deps:['art-3.2'],
      refs:['CIE 170-1:2006 Table 6.7, official energy-based 2° dataset/metadata, DOI 10.25039/CIE.DS.tijidesg','Stockman & Sharpe (2000), §§1.1–1.2; Stockman & Rider (2023), §§1/1.1,2.3,6–7'],
      tags:['cones','vision','spectrum'],
      scope:String.raw`Standard-observer photopic, centrally viewed 2° matching conditions; individual observers vary. The CIE table is a standardized estimate, not three raw single-cone recordings. Its L/M columns cover 390–830 nm; its S column ends at 615 nm. Missing S values are zero-extended as specified by the dataset convention, not asserted to be physiological zeros. Spectra are restricted to this numerical band; FWHM describes the Gaussian before that band limit. The published 2000 paper’s own Table 2 is quantal; it is not the energy table used here. No display colour or subjective hue is inferred from these bars.`,
      links:{source:'https://cie.co.at/datatable/cie-2006-lms-cone-fundamentals-2-field-size-terms-energy',account:'https://doi.org/10.1002/col.22879'},verify: false,
      viz(v){
        const mode=v.select('authored spectrum',[{value:'bump',label:'broad Gaussian'},{value:'mono',label:'8 nm Gaussian'},{value:'eq',label:'equal energy'},{value:'tung',label:'2856 K black body'}],'bump');
        const center=v.slider('Gaussian centre (nm)',400,700,540,{int:true}),width=v.slider('Gaussian FWHM (nm)',20,160,80,{int:true}),intensity=v.slider('spectral-density multiplier',0,2,1,{step:'any',fmt:x=>String(+x.toFixed(6))});
        const pick=v.select('product with',[{value:0,label:'L cone'},{value:1,label:'M cone'},{value:2,label:'S cone'}],1);
        const A=v.stage({x:[378,842],y:[-.12,1.14],axes:'box',gutter:true,height:340,minWidth:300,weight:1.4,xlabel:'wavelength (nm)',ylabel:'relative sensitivity / density',title:'CIE table, authored spectrum and product'});
        const B=v.stage({x:[-.2,3.2],y:[-.15,1.2],axes:false,height:340,minWidth:260,weight:.85,title:'signals / equal-energy reference'});
        let info;
        v.render(()=>{
          const p=coneStimulus(mode.value,center.value,width.value,intensity.value);info=p;
          center.el.hidden=!['bump','mono'].includes(mode.value);width.el.hidden=mode.value!=='bump';
          const top=Math.max(1,intensity.value);A.setView([378,842],[-.12*top,1.14*top]);
          A.path(p.products[pick.value],{color:CONE_COL[pick.value],fill:CONE_COL[pick.value],fillAlpha:.22,width:1});
          CONE_CURVES.forEach((points,k)=>A.path(points,{color:CONE_COL[k],width:k===pick.value?2.5:1.4,alpha:k===pick.value?1:.7}));
          A.path(p.light,{color:'gold',width:2});
          const bt=Math.max(1,...p.relative)*1.25;B.setView([-.2,3.2],[-.2*bt,bt]);
          B.line(0,1,3,1,{color:'muted',width:1,dash:true});
          p.relative.forEach((q,k)=>{B.rect(k+.15,0,k+.85,q,{fill:CONE_COL[k],fillAlpha:.7,stroke:false});B.text(CONE_NAME[k],k+.5,-.06*bt,{align:'center',baseline:'top',size:13});B.text(v.fix(q,4),k+.5,q+.025*bt,{align:'center',baseline:'bottom',size:11.5});});
        });
        v.legend([['red','L sensitivity'],['green','M sensitivity'],['accent','S sensitivity'],['gold','authored spectrum']]);
        v.readout(()=>`Relative signals $(L,M,S)=(${info.relative.map(x=>v.fix(x,6)).join(', ')})$. ${info.ratio===null?'The computed L/M ratio is undefined (zero computed M signal).':`Relative $L/M=${v.fix(info.ratio,6)}$; this is not a general hue estimate.`} Source sample maxima: L 570 nm, M 545 nm, S 445 nm (5 nm samples, not exact continuous peaks). Integrals use Simpson quadrature of the interpolated source; S ends at 615 nm.`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num:'4.2',kind:'Principle',name:'Trichromacy and independent primaries',
      statement:String.raw`For symmetric, photopic colour matches at fixed viewing conditions, the linear three-cone model represents a uniform light by a triple $\mathbf t=(L,M,S)$. Let the response triples of three fixed primary lights be independent columns of $P$. Then
$$P\mathbf a=\mathbf t$$
has one real solution for every target triple. A negative amount is implemented by adding that primary to the **test** side; positive amounts go to the comparison side. Three independent primaries therefore suffice within this model when signed matching is allowed.

One or two primaries span only a line or plane and cannot match arbitrary three-dimensional targets. They **can** match targets in that span, including a primary itself. A positive-only mixture of three real primaries has a restricted gamut.`,
      idea:String.raw`Each column is obtained from the same cone fundamentals as art-4.1. Linearity adds the primary responses. The basis criterion (ladr-2.28) makes representation both possible and unique for three independent columns; it does not make two columns fail for every individual target.

Here the authored monochromatic primaries are 540, 610 and 450 nm, each with one unit of integrated radiant power. The target is a unit-power spectral line at the selected wavelength mixed with a unit-power equal-energy spectrum: $\mathbf t=(1-w)\mathbf c(\lambda)+w\mathbf e$, where $\mathbf e$ is the equal-energy integral divided by 440 nm. For fewer primaries, the solve button finds the unconstrained least-squares projection in these LMS coordinates. This residual is a numerical model distance, not a perceptual colour-difference threshold.`,
      caption:String.raw`Adjust the signed amounts or solve for the selected primaries. “Test first primary” supplies a known match even with one primary; “test blue primary” supplies a counterexample when blue is omitted. The LMS bars compare the two physical sides after negative amounts have moved to the test. The split-field patches are display proxies; similar screen colours do not certify equal responses. Every computed solution for the offered target family fits the displayed amount bounds without clipping.`,
      deps:['art-4.1','ladr-2.28'],
      refs:['Stockman & Sharpe (2000), §1.2/Eqs 1–3','Stockman & Rider (2023), complete §§6–7/Eqs 11–14; CIE 2006 2° energy dataset'],
      tags:['trichromacy','colour matching'],
      scope:String.raw`Authored standard-observer calculation, not experimental responses or a calibrated on-screen matching task. This uses CIE 2006 energy fundamentals, not CIE 1931 fits or the CIE RGB primary matrix. The display proxy transforms LMS to cone-based XYZ_F with the published 2° matrix, then uses an sRGB-style matrix/transfer and an authored channel-lift/scale gamut map. XYZ_F uses a different observer from the 1931 XYZ underlying sRGB, so these patches are illustrative, not a standard colorimetric reproduction. Actual matching comparisons use the unmodified LMS signals. No historical priority claim or all-context colour-appearance equivalence is asserted.`,
      links:{source:'https://doi.org/10.1002/col.22879',data:'https://cie.co.at/datatable/cie-2006-lms-cone-fundamentals-2-field-size-terms-energy'},verify: false,
      viz(v){
        const lambda=v.slider('test line wavelength (nm)',400,700,580,{int:true}),white=v.slider('equal-energy fraction $w$',0,1,0,{step:'any',fmt:x=>String(+x.toFixed(6))});
        const n=v.select('active primaries',[{value:1,label:'1: green'},{value:2,label:'2: green + red'},{value:3,label:'3: green + red + blue'}],3);
        const names=['green 540','red 610','blue 450'],cols=['green','red','accent'];
        const amounts=names.map(name=>v.slider(`${name} nm signed amount`,-CONE_AMOUNT_MAX,CONE_AMOUNT_MAX,0,{step:'any',fmt:x=>x.toFixed(6)}));
        const solve=()=>{const a=coneLeastSquares(coneMatchTarget(lambda.value,white.value),n.value);a.forEach((x,j)=>{if(Math.abs(x)>CONE_AMOUNT_MAX)throw new Error('Proved primary range exceeded');amounts[j].set(x);});};
        v.button('Solve least squares',solve);v.button('Test first primary',()=>{lambda.set(540);white.set(0);solve();});v.button('Test blue primary',()=>{lambda.set(450);white.set(0);solve();});solve();
        const F=v.stage({x:[-.08,2.08],y:[-.08,1.25],axes:false,height:210,minWidth:280,weight:1.1,title:'illustrative display proxy; compare LMS below'});
        const B=v.stage({x:[-.2,3.2],y:[-2.35,2.35],axes:false,height:210,minWidth:280,weight:1,title:'signed primary amounts'});
        const C=v.stage({x:[-.2,3.2],y:[-.15,1.2],axes:false,height:250,minWidth:280,title:'actual model LMS on the two sides'});
        let info;
        v.render(()=>{
          amounts.forEach((c,j)=>{c.el.hidden=j>=n.value;});
          const p=coneMatch(lambda.value,white.value,n.value,amounts.map(c=>c.value));info=p;const colors=coneDisplayPair(p.left,p.right);
          F.rect(0,0,1,1,{fill:colors[0],fillAlpha:1,stroke:false});F.rect(1,0,2,1,{fill:colors[1],fillAlpha:1,stroke:false});F.line(1,0,1,1,{color:'panel',width:1});
          F.text('test side',.5,1.12,{align:'center',baseline:'middle',size:12});F.text('comparison',1.5,1.12,{align:'center',baseline:'middle',size:12});
          for(let j=0;j<3;j++){const a=j<n.value?amounts[j].value:0;B.rect(j+.15,0,j+.85,a,{fill:cols[j],fillAlpha:.7,stroke:false});B.text(names[j],j+.5,0,{align:'center',baseline:a>=0?'top':'bottom',dy:a>=0?4:-4,size:11});}
          B.line(0,0,3,0,{color:'muted',width:1});
          const top=Math.max(.05,...p.left,...p.right)*1.3;C.setView([-.2,3.2],[-.2*top,top]);
          for(let k=0;k<3;k++){C.rect(k+.12,0,k+.45,p.left[k],{fill:'blue',fillAlpha:.7,stroke:false});C.rect(k+.55,0,k+.88,p.right[k],{fill:'orange',fillAlpha:.7,stroke:false});C.text(CONE_NAME[k],k+.5,-.06*top,{align:'center',baseline:'top',size:13});}
        });
        v.legend([['blue','test-side LMS'],['orange','comparison-side LMS'],['green','540 nm primary'],['red','610 nm primary'],['accent','450 nm primary']]);
        v.readout(()=>`Current relative LMS residual: $${v.sci(info.relative,4)}$. Least possible residual in this ${info.n}-primary span: $${v.sci(info.bestRelative,4)}$. These are numerical distances, not perceptual thresholds.\nTest side: (${info.left.map(x=>v.fix(x,6)).join(', ')}); comparison: (${info.right.map(x=>v.fix(x,6)).join(', ')}). ${info.negative?'Negative amounts have been added to the test side.':'All active amounts are nonnegative.'} ${info.n===3?'Three independent columns give an exact algebraic solution; the solved residual reflects floating-point evaluation.':'A smaller span can match special targets; try the first primary itself.'}`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num:'4.3',kind:'Phenomenon',name:'Metamerism',
      statement:String.raw`**Metamers** have different spectra but identical tristimulus values in a **specified colorimetric system**. For a fixed illuminant $I$ and observer functions $\bar c_k$, the reflectance response map is
$$T_I(R)_k=\int_{380}^{780}IR\,\bar c_k\,d\lambda.$$
The integrand functions are evaluated at $\lambda$. Physically admissible model reflectances are continuous functions with $0\le R\le1$. A nonzero $n$ in the kernel gives a distinct metamer $R+an$ only when that perturbation remains admissible. Uniformly interior reflectances admit small such perturbations; this does **not** hold for every boundary reflectance. Equality for $I_a$ need not imply equality for $I_b$, but changing the illuminant does not necessarily break every match (proportional illuminants have the same kernel).`,
      idea:String.raw`Choose four continuous, disjoint triangular bumps. Their four response vectors in $\mathbb R^3$ are dependent by ladr-2.22, using the three standard basis vectors as a spanning list. Thus a nonzero combination of the bumps lies in the kernel. Disjoint supports ensure that combination is not the zero function. Normalize its coefficient absolute sum to at most $1$; then $|n(\lambda)|\le1$ at **every** wavelength. If $\delta\le R\le1-\delta$, any $|a|\le\delta$ gives an admissible perturbation. By contrast, black has no distinct nonnegative continuous metamer when $I\bar y$ is strictly positive: a zero integral then forces $R=0$.

The reflected spectrum is the product $IR$ (art-3.2). This widget uses the Wyman–Sloan–Shirley CIE 1931 2° analytic fit. Its authored baseline obeys $0.12\le R_1\le0.67$, and $R_2=R_1+0.12tn$ with $0\le t\le1$, so globally $0\le R_2\le0.79$. A cofactor identity constructs a kernel vector for the **declared quadrature matrix**. The computed reference residual and its refined-quadrature check are numerical evidence, not an exact continuous-integral or empirical matching certificate.`,
      caption:String.raw`Choose one of four authored illuminants and a continuous perturbation strength. The full curves remain admissible between sample points by the coefficient bound. Strength zero gives identical reflectances. In exact arithmetic, positive strength gives distinct reflectances; very small floating-point perturbations may round away. Inspect raw $XYZ$ before the optional **authored XYZ white-balance proxy**. The patches additionally use a common sRGB display mapping; screen similarity does not certify a metamer. The $u'v'$ number is only a chromaticity-coordinate distance, with no universal visibility cutoff.`,
      deps:['art-3.2','ladr-2.22'],
      refs:['CIE S 017:2020 e-ILV 17-23-006 and 17-23-008','Wyman, Sloan & Shirley (2013), §2.2, Eq.4, Table1, Listing1 and numerical-error discussion','Stockman & Rider (2023), §6'],
      tags:['metamerism','spectrum'],verify: false,
      scope:String.raw`Authored, continuous finite-band reflectances and lamp spectra, not measured paints or calibrated display matches. The 6504 K black body is a reference model, not measured daylight or CIE D65; 2856 K, LED and three-band spectra are separate models. Each lamp is normalized so that a unit reflectance has $Y=1$; raw XYZ means before white balance and display mapping. CIE 1931 fitted XYZ is distinct from the CIE 2006/XYZ_F observer in 4.1–4.2. Quadrature uses composite 8-point Gauss rules on intervals at most 5 nm, split at fit/bump corners; refinement uses 16 points and at most 2.5 nm. Refinement differences are not rigorous error bounds. No adaptation physiology or perceptual detection threshold is inferred.`,
      links:{source:'https://jcgt.org/published/0002/02/01/',definition:'https://cie.co.at/eilvterm/17-23-006'},
      viz(v){
        const lamp=v.select('authored illuminant',METAMER_LAMPS.map(([value,label])=>({value,label})),'day');
        const strength=v.slider('reflectance perturbation strength t',0,1,1,{step:'any',decimals:6,fmt:metamerNumber});
        const balance=v.toggle('authored XYZ white-balance proxy',false);
        const A=v.stage({x:[370,790],y:[-.06,1.08],axes:'box',gutter:true,xlabel:'wavelength (nm)',ylabel:'reflectance; lamp rescaled',height:320,minWidth:280,weight:1.3,title:'globally admissible reflectances'});
        const F=v.stage({x:[-.1,2.1],y:[-.1,1.22],axes:false,height:230,minWidth:260,title:'sRGB display proxies; compare raw XYZ'});
        let info;
        v.render(()=>{info=metamerSurfaces(lamp.value,strength.value,balance.value);info.spectra.forEach((p,j)=>A.path(p,{color:j?'orange':'accent',width:2}));A.path(info.lamp,{color:'muted',width:1,dash:true});
          info.display.colors.forEach((color,j)=>F.rect(j,0,j+1,1,{fill:color,fillAlpha:1,stroke:false}));F.text('surface 1',.5,1.10,{align:'center',size:11});F.text('surface 2',1.5,1.10,{align:'center',size:11});});
        v.legend([['accent','reflectance 1'],['orange','reflectance 2'],['muted','lamp, rescaled',{dash:true}]]);
        v.readout(()=>{const m=info,f=metamerNumber;return `Raw XYZ surface 1: (${m.raw[0].map(f).join(', ')}); surface 2: (${m.raw[1].map(f).join(', ')}).\nRelative raw XYZ residual ${m.relative.toExponential(3)}; raw chromaticity distance Δu′v′ ${m.uv===null?'undefined':m.uv.toExponential(3)}. These are numerical coordinates, not visibility thresholds.\nReference-illuminant relative residual ${m.referenceRelative.toExponential(3)}; refined check ${m.referenceRefinedRelative.toExponential(3)}. Maximum current-lamp quadrature/refinement difference ${m.refinement.toExponential(3)} (not an error enclosure).\nGlobal reflectance-2 bound [${m.bounds.map(f).join(', ')}]; coefficient absolute sum ≤1. ${m.strength===0?'Both reflectances are identical.':m.plottedDistinct?'The authored reflectances differ.':'Positive strength, but plotted differences round away at this precision.'}\n${m.balance?'Common authored gain diag(D65white / lampwhite) is applied to both raw triples; this is a display white-balance proxy, not validated eye adaptation.':'No white-balance proxy applied.'} Display exposure ${m.display.exposure}; common linear-RGB lift ${f(m.display.lift)}, divisor ${f(m.display.scale)}, then sRGB transfer and 8-bit rounding. Patches may hide or distort a numerical mismatch.`;});
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num:'4.4',kind:'Principle',name:'Grassmann’s laws in a linear colour model',
      credit:'Modern linear-model exposition: Stockman & Rider (2023), §§6–7.',
      statement:String.raw`Fix an observer and matching context, and let $T$ be the linear tristimulus map on spectra. Define model matching by $A\sim B$ exactly when $T(A)=T(B)$. Then matching is symmetric and transitive, and
$$A\sim B\ \Longrightarrow\ kA\sim kB\quad(k\ge0),$$
$$A\sim B\ \Longrightarrow\ A+C\sim B+C.$$
Physical light spectra and $C$ are nonnegative; signed differences are algebraic comparisons, not negative light. The image of nonnegative spectra is a convex cone. Its span has dimension three **if the response map has rank three**, an independent assumption not implied by additivity or proportionality alone. These algebraic laws do not assert unrestricted colour-appearance equivalence.`,
      idea:String.raw`Spectrum superposition and integration are linear (art-3.5). If $T(A-B)=0$, then $T(kA-kB)=kT(A-B)=0$ and $T((A+C)-(B+C))=T(A-B)=0$. Symmetry and transitivity follow from equality of triples. A one-dimensional response map satisfies the same identities, so three-dimensional matching requires separate independent responses; the laws alone cannot prove trichromacy.

The baseline pair is constructed as in art-4.3, now with an equal-energy weighting and nonnegative light spectra. The same bounded perturbation is added without clipping: $L_0\ge0.5$, $|n|\le1$ and amplitude $0.2$ imply $R_0\ge0.3$. Adding $C$ to one side changes the difference by $T(C)$; scaling just the left gives $kT(L_0)-T(R_0)$. These operations preserve a match at the degenerate settings $C=0$ or $k=1$. Moreover one-sided scaling changes XYZ intensity while leaving chromaticity unchanged, so equality of $u'v'$ is insufficient for a tristimulus match.`,
      caption:String.raw`Inspect the two authored nonnegative spectra, then apply any operation. Every parameter and complete curve stays within its declared domain. Common addition or scaling preserves the baseline quadrature match up to numerical residuals; unilateral operations have explicit difference formulas and degenerate settings. The split patches use a common display proxy; use the unmodified XYZ triples and their residual, not screen appearance or chromaticity alone.`,
      deps:['art-4.3','art-3.5'],
      refs:['Stockman & Rider (2023), complete §§6–7','Wyman, Sloan & Shirley (2013), §2.2/Eq.4/Table1/Listing1','W3C CSS Color4, sample XYZ(D65)/sRGB conversion code, 9 October 2026 snapshot'],
      tags:['Grassmann','linearity','colour mixing'],verify: false,
      scope:String.raw`Exact implications of a declared linear matching model, illustrated numerically with the same CIE 1931 analytic fit as 4.3. Symmetric photopic matching at fixed context is distinct from asymmetric/adapted appearance. Spectra are authored, not observations. The original Grassmann 1853 paper was not acquired or audited; no historical priority/year attribution is inferred here. All XYZ triples use one fixed equal-energy-$Y$ normalization, preserving linearity. Numerical quadrature and display mapping have the limits stated in 4.3.`,
      links:{account:'https://doi.org/10.1002/col.22879',conversion:'https://www.w3.org/TR/css-color-4/#color-conversion-code'},
      viz(v){
        const center=v.slider('baseline Gaussian centre (nm)',450,650,560,{int:true});
        const operation=v.select('operation',MIXTURE_OPS.map(([value,label])=>({value,label})),'none');
        const wavelength=v.slider('added Gaussian centre (nm)',420,680,620,{int:true}),amount=v.slider('added density multiplier',0,2,.6,{step:'any',decimals:6,fmt:metamerNumber}),k=v.slider('scale factor k',.2,3,1.8,{step:'any',decimals:6,fmt:metamerNumber});
        const A=v.stage({x:[370,790],y:[-.12,1.32],axes:'box',gutter:true,xlabel:'wavelength (nm)',ylabel:'relative spectral density',height:320,minWidth:280,weight:1.3,title:'complete spectra after the operation'});
        const F=v.stage({x:[-.1,2.1],y:[-.1,1.22],axes:false,height:230,minWidth:260,title:'sRGB display proxies; compare raw XYZ'});
        let info;
        v.render(()=>{info=metamerMixture(center.value,operation.value,wavelength.value,amount.value,k.value);[wavelength,amount].forEach(c=>{c.el.hidden=!['addB','addL'].includes(operation.value);});k.el.hidden=!['scB','scL'].includes(operation.value);const top=info.bounds[1];A.setView([370,790],[-.08*top,1.12*top]);info.spectra.forEach((p,j)=>A.path(p,{color:j?'orange':'accent',width:2}));
          info.display.colors.forEach((color,j)=>F.rect(j,0,j+1,1,{fill:color,fillAlpha:1,stroke:false}));F.text('left spectrum',.5,1.10,{align:'center',size:11});F.text('right spectrum',1.5,1.10,{align:'center',size:11});});
        v.legend([['accent','left spectrum'],['orange','right spectrum']]);
        v.readout(()=>{const m=info,f=metamerNumber;return `Raw XYZ left: (${m.raw[0].map(f).join(', ')}); right: (${m.raw[1].map(f).join(', ')}).\nDifference left − right: (${m.difference.map(f).join(', ')}); relative XYZ residual ${m.relative.toExponential(3)}. Chromaticity distance Δu′v′ ${m.uv===null?'undefined':m.uv.toExponential(3)} is not a full colour match test.\n${m.preserves?'This common or degenerate operation preserves the baseline linear-model identity; the remaining residual is numerical.':'A unilateral nondegenerate operation need not preserve the baseline identity; the displayed XYZ difference is the comparison.'} Maximum quadrature/refinement difference ${m.refinement.toExponential(3)} (not an enclosure).\nNonnegative-spectrum upper bound ${f(m.bounds[1])}; no negative-spectrum clipping. Display: common exposure ${m.display.exposure}, linear-RGB lift ${f(m.display.lift)}, divisor ${f(m.display.scale)}, sRGB transfer, 8-bit rounding. These patches are illustrative and can obscure differences.`;});
      },
    },
    // Source-audited colorimetry 4.5
    matchingFunctionsItem,
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'CIE 1931 XYZ tristimulus values',
      credit: 'Commission Internationale de l’Éclairage, 1931',
      statement: String.raw`The CIE 1931 standard colorimetric observer is defined by three functions $\bar x,\bar y,\bar z$ of wavelength, obtained from the experimental $\bar r,\bar g,\bar b$ by a fixed linear transformation (art-4.5) chosen so that all three are non-negative and $\bar y(\lambda)$ equals the luminous-efficiency function $V(\lambda)$. The tristimulus values of a light $S(\lambda)$ are
$$X=\int S\,\bar x\,d\lambda,\quad Y=\int S\,\bar y\,d\lambda,\quad Z=\int S\,\bar z\,d\lambda ,$$
so $Y$ is the luminance, and the equal-energy stimulus has $X=Y=Z$. Two lights match for the standard observer exactly when their $XYZ$ agree.`,
      idea: String.raw`A change of primaries is a $3\times3$ matrix $T$ acting on the matching functions (and on all tristimulus triples); because the algebra of mixing is linear (art-4.4), any invertible $T$ gives equally valid coordinates. The CIE picked the one with $\bar x,\bar y,\bar z\ge0$ (no negative lobes, so calculations by hand had no sign problems) and with all luminance in $Y$ alone. The price is that the primaries $X,Y,Z$ are imaginary: they lie outside the spectral locus (art-4.7) and cannot be produced by any light.`,
      caption: String.raw`Top: the matching functions (choose $XYZ$ or the CIE RGB system they come from). Bottom: drag the seven handles to draw a spectrum $S(\lambda)$; the shaded area under $S\bar y$ is $Y$. The readout gives $X,Y,Z$, the chromaticity $(x,y)$, and recomputes $X,Y,Z$ from the $\bar r\bar g\bar b$ route with the standard matrix to show that the two coordinate systems carry the same information.`,
      deps: ['art-4.5', 'pma-9.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['CIE 1931', 'XYZ'],
      scope: String.raw`The curves are the Wyman–Sloan–Shirley analytic fit to the 1931 two-degree tables, accurate to within about a percent of the peak; the matrix with the constant $0.17697$ is the one quoted for the CIE RGB to $XYZ$ conversion. 2° field, photopic vision.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CIE_1931_color_space' },
      viz(v) {
        const basis = v.select('matching functions', [{ value: 'xyz', label: '$\\bar x,\\bar y,\\bar z$' }, { value: 'rgb', label: '$\\bar r,\\bar g,\\bar b$' }], 'xyz');
        const A = v.stage({ x: [380, 780], y: [-0.4, 2.2], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'sensitivity', height: 260, weight: 1.2, title: 'colour-matching functions' });
        const B = v.stage({ x: [380, 780], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'relative power', height: 260, weight: 1.2, title: 'a spectrum $S(\\lambda)$ (drag the handles)' });
        const wl = [400, 450, 500, 550, 600, 650, 700], init = [0.2, 0.9, 0.6, 0.35, 0.8, 0.5, 0.1];
        const hs = wl.map((w, i) => B.handle(w, init[i], { color: 'gold', r: 6, constrain: (x, y) => [w, Math.max(0, Math.min(1.1, y))] }));
        const S = (l) => { if (l <= wl[0]) return hs[0].y; if (l >= wl[6]) return hs[6].y; let i = 0; while (l > wl[i + 1]) i++; const t = (l - wl[i]) / 50; return hs[i].y * (1 - t) + hs[i + 1].y * t; };
        let info = {};
        const RGBX = [[0.49, 0.31, 0.2], [0.17697, 0.8124, 0.01063], [0, 0.01, 0.99]];
        v.render(() => {
          const rgb = basis.value === 'rgb';
          const g = (l) => (rgb ? CIERGB.cmf(l) : cmf(l));
          // normalise the xyz curves to unit area for plotting at the same scale as r g b
          const sc = rgb ? EW[0] : 1;
          const cols = rgb ? ['red', 'green', 'accent'] : ['red', 'green', 'accent'];
          A.setView([380, 780], rgb ? [-0.9, 2.9] : [-0.1, 1.9]);
          for (let i = 0; i < 3; i++) A.fn((l) => g(l)[i] * sc, { color: cols[i], width: i === 1 && !rgb ? 2.6 : 1.8, domain: [380, 780] });
          A.hline(0, { color: 'ink', width: 0.8, alpha: 0.6 });
          B.fn((l) => S(l) * cmf(l)[1] / 1.0, { color: 'green', fill: 'green', fillAlpha: 0.22, width: 1, domain: [380, 780], alpha: 0.7 });
          B.fn(S, { color: 'gold', width: 2.4, domain: [380, 780] });
          const c = spdXYZ(S, 2), [xx, yy] = xyOf(c), rg = [0, 1, 2].map((i) => { let s = 0; for (let l = 380; l <= 780; l += 2) s += S(l) * CIERGB.cmf(l)[i]; return s * 2; });
          const viaM = RGBX.map((r) => r[0] * rg[0] + r[1] * rg[1] + r[2] * rg[2]);
          info = { c, xx, yy, viaM, rel: [0, 1, 2].map((i) => viaM[i] / (c[i] / EW[i]) - 1) };
        });
        v.legend([['red', '$\\bar x$ (or $\\bar r$)'], ['green', '$\\bar y$ (or $\\bar g$)'], ['accent', '$\\bar z$ (or $\\bar b$)']]);
        v.readout(() => `$X=${v.fix(info.c[0], 2)},\\ Y=${v.fix(info.c[1], 2)},\\ Z=${v.fix(info.c[2], 2)}$ · chromaticity $x=${v.fix(info.xx, 4)},\\ y=${v.fix(info.yy, 4)}$ · $Y$ is the luminance (green area)\nvia the $\\bar r\\bar g\\bar b$ route and the standard matrix the same triple comes out (relative difference ${v.sci(Math.max(...info.rel.map(Math.abs)) + 1e-16, 1)}): the change of primaries is an exact $3\\times3$ linear map, which is why either system describes the same colours`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Chromaticity diagram and the spectral locus',
      credit: 'CIE, 1931',
      statement: String.raw`The chromaticity coordinates of a light with tristimulus values $(X,Y,Z)$ are
$$x=\frac{X}{X+Y+Z},\qquad y=\frac{Y}{X+Y+Z},\qquad z=1-x-y ,$$
which forget the overall intensity and keep the colour quality. The monochromatic lights trace the horseshoe-shaped **spectral locus**; the straight **line of purples** joins its two ends; every real light has its chromaticity inside the region they enclose. The point $(x,y)=(\tfrac13,\tfrac13)$ is the equal-energy white.`,
      idea: String.raw`Because $(X,Y,Z)$ is positive and linear in the spectrum (art-4.6), a spectrum is a positive combination of monochromatic lights, so its chromaticity is an average of locus points and cannot leave the locus’s convex hull. The projection divides by a positive sum, so scaling a light does not move its point (proportionality, art-4.4): the diagram is the plane of colours with brightness divided out, and the third coordinate $Y$ (luminance) is the one dropped.`,
      caption: String.raw`Build a spectrum from one or two bands, drag the sliders, and watch its point move inside the horseshoe. A single narrow band sits on the locus; widening it or adding a second band pulls the point inward toward white, and two bands far apart land on the purple side. The brightness slider changes $Y$ but not the point. The dashed ray is the line from white through the point to the locus, whose wavelength is the dominant wavelength.`,
      deps: ['art-4.6'],
      refs: ['Fairchild ch. 3'],
      tags: ['chromaticity', 'CIE 1931'],
      scope: String.raw`Standard 2° observer, analytic fit of the matching functions; the locus is drawn from 420 to 700 nm. Colours inside the diagram are shown as they would appear after mapping into sRGB, so the saturated ones are only approximate.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xy_chromaticity_diagram_and_the_CIE_xyY_color_space' },
      viz(v) {
        const c1 = v.slider('band 1: centre (nm)', 420, 700, 520, { step: 1 });
        const w1 = v.slider('band 1: width (nm)', 4, 200, 10, { step: 1 });
        const two = v.toggle('add a second band', false);
        const c2 = v.slider('band 2: centre (nm)', 420, 700, 650, { step: 1 });
        const mix = v.slider('band 2 relative power', 0.05, 5, 1, { step: 0.01, log: true });
        const br = v.slider('overall brightness', 0.1, 10, 1, { step: 0.01, log: true });
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 430, weight: 1.2, title: 'CIE 1931 chromaticity diagram' });
        const Sx = v.stage({ x: [380, 780], y: [0, 1.1], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', ylabel: 'power', height: 430, weight: 0.8, minWidth: 250, title: 'the spectrum' });
        let info = {};
        v.render(() => {
          c2.el.hidden = mix.el.hidden = !two.value;
          const f = (l) => br.value * (gauss(l, c1.value, w1.value) / 1 + (two.value ? mix.value * gauss(l, c2.value, w1.value) : 0));
          drawChromaticity(D, v);
          const c = spdXYZ(f, 1), [x, y] = xyOf(c), dm = dominant(x, y);
          D.dot(1 / 3, 1 / 3, { r: 4, hollow: true, color: 'ink', label: 'E', labelPos: 'sw' });
          if (dm.l) { const hl = dm.purple ? null : LOCUS[Math.round(dm.l) - 420]; if (hl) D.line(1 / 3, 1 / 3, hl[1], hl[2], { color: 'ink', dash: [4, 4], width: 1 }); }
          D.dot(x, y, { r: 9, color: 'ink' });
          D.dot(x, y, { r: 6.5, color: rgbOf(c.map((u) => u / c[1] * 0.6)) });
          const g = (l) => f(l) / Math.max(1e-9, 10 * br.value);
          let m = 0; for (let l = 380; l <= 780; l += 2) m = Math.max(m, f(l));
          Sx.setView([380, 780], [0, Math.max(1.1, m * 1.1)]);
          specBars(Sx, f, 380, 780, 3, { alpha: 0.5 });
          Sx.fn(f, { color: 'ink', width: 1.6, domain: [380, 780] });
          info = { x, y, Y: c[1], dm, inside: inLocus(x, y) };
        });
        v.readout(() => `$(x,y)=(${v.fix(info.x, 4)},\\ ${v.fix(info.y, 4)})$ · $Y=${v.fix(info.Y, 2)}$ · ${info.dm.l ? `${info.dm.purple ? 'complementary' : 'dominant'} wavelength ${v.fix(info.dm.l, 0)} nm, excitation purity ${v.fix(info.dm.purity, 2)}` : 'achromatic'} · ${info.inside ? 'inside the spectral locus' : 'on the locus boundary'}`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Mixtures lie on segments; gamuts are convex hulls',
      statement: String.raw`Let lights $1,\dots,n$ have chromaticities $(x_i,y_i)$ and luminances $Y_i>0$. Their superposition has chromaticity
$$(x,y)=\sum_i m_i\,(x_i,y_i),\qquad m_i=\frac{Y_i/y_i}{\sum_j Y_j/y_j}\ \ (m_i>0,\ \textstyle\sum m_i=1),$$
a weighted average of the $(x_i,y_i)$. Hence mixtures of two lights fill exactly the segment joining them, and mixtures of three fill exactly the triangle (the $n$ lights give their convex hull, the **gamut**). A chromaticity outside the hull can be matched only with a negative amount, which no mixing produces.`,
      idea: String.raw`Tristimulus values add (art-4.4), so $X=\sum X_i$ and likewise $Y,Z$; and $X_i+Y_i+Z_i=Y_i/y_i$. Dividing, $x=\sum X_i/\sum(X_i+Y_i+Z_i)=\sum m_ix_i$ with the weights $m_i$ above, positive and summing to one. By varying the positive amounts $Y_i$ the weights $m_i$ take every positive value in the simplex, so the whole open triangle is reached. Think of $m_i$ as masses placed at the points: the mixture is the centre of mass.`,
      caption: String.raw`Drag the three primaries inside the horseshoe and set their amounts $Y_i$ with the sliders; the gold dot is the mixture, always inside the triangle at the centre of mass of the weights $Y_i/y_i$. Drag the target (the open dot) anywhere: the readout gives the amounts needed to reproduce it, and they turn negative exactly when it lies outside the triangle.`,
      deps: ['art-4.7', 'art-4.4'],
      refs: ['Fairchild ch. 3'],
      tags: ['gamut', 'convexity', 'chromaticity'],
      scope: String.raw`Mixing is of lights (additive); for paints and filters the rules differ (art-3.6, art-3.7). Primaries are restricted to the interior of the spectral locus because real lights have chromaticities there.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gamut' },
      viz(v) {
        const D = v.stage({ x: [0, 0.8], y: [0, 0.9], equal: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', height: 440, weight: 1.3, title: 'three primaries, their mixture and a target' });
        const start = [[0.65, 0.32], [0.2, 0.7], [0.16, 0.08]], nm = ['1', '2', '3'];
        const H = start.map(([x, y], i) => D.handle(x, y, { color: ['red', 'green', 'accent'][i], r: 8, label: nm[i], constrain: (px, py) => clampLocus(px, py) }));
        const T = D.handle(0.42, 0.45, { color: 'ink', r: 8, label: 'target', constrain: (px, py) => clampLocus(px, py) });
        const am = start.map((_, i) => v.slider(`amount $Y_${i + 1}$`, 0, 1, [0.4, 0.5, 0.3][i], { step: 0.005 }));
        let info = {};
        v.render(() => {
          const P = H.map((h) => [h.x, h.y]);
          drawChromaticity(D, v, { fade: 0.4 });
          D.poly(P, { fill: 'accent', fillAlpha: 0.1, color: 'ink', width: 1.4 });
          const w = P.map(([, y], i) => am[i].value / y), W = w.reduce((a, b) => a + b, 0) || 1;
          const m = w.map((u) => u / W);
          const mx = m.reduce((a, mi, i) => a + mi * P[i][0], 0), my = m.reduce((a, mi, i) => a + mi * P[i][1], 0);
          // XYZ sum check
          const sum = [0, 0, 0]; P.forEach(([x, y], i) => { const c = xyz(x, y, am[i].value); for (let k = 0; k < 3; k++) sum[k] += c[k]; });
          const [sx, sy] = xyOf(sum);
          D.dot(mx, my, { r: 7, color: 'gold', label: 'mixture', labelPos: 'ne' });
          // barycentric coordinates of the target
          const [a, b, c] = P, den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
          const l1 = ((b[1] - c[1]) * (T.x - c[0]) + (c[0] - b[0]) * (T.y - c[1])) / den, l2 = ((c[1] - a[1]) * (T.x - c[0]) + (a[0] - c[0]) * (T.y - c[1])) / den, l3 = 1 - l1 - l2;
          const lam = [l1, l2, l3], need = lam.map((l, i) => l * P[i][1]), ns = need.reduce((x2, y2) => x2 + Math.abs(y2), 0);
          D.dot(T.x, T.y, { r: 8, hollow: true, color: 'ink' });
          info = { mx, my, sx, sy, lam, need, inside: lam.every((l) => l >= -1e-9), m };
        });
        v.readout(() => `masses $m=(${fmt3(v, info.m)})$ · mixture $(${v.fix(info.mx, 4)},\\ ${v.fix(info.my, 4)})$ from the weights; from the summed $XYZ$: $(${v.fix(info.sx, 4)},\\ ${v.fix(info.sy, 4)})$ ✓\ntarget in barycentric coordinates $(${fmt3(v, info.lam)})$: ${info.inside ? 'inside the triangle, reachable with non-negative amounts' : 'outside the triangle: at least one amount would be negative'}; relative amounts $Y_i\\propto\\lambda_i y_i$: $(${fmt3(v, info.need.map((u) => u / Math.max(1e-9, info.need.reduce((a, b) => a + Math.abs(b), 0))))})$`);
      },
    },
  ],
};
