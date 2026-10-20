// A bounded source gallery. These spans describe different published quantities.
const CASES = [
  { id:'australia', name:'Australia', a:[59.3,70.7], e:[39.8,51.2],
    blue:'Madjedbebe occupation onset', red:'historical extinction model',
    note:'Clarkson 2017 models the lowest dense artefact-band onset at 65.0±5.7 kyr, total 95.4% uncertainty. Roberts 2001 reports a historical continent-wide extinction-model 95% confidence interval 39.8–51.2 ka (estimate 46.4), using articulated-remain burial ages, constant-intensity Poisson sampling and Gaussian dating errors. The two studies do not supply one joint posterior or a first-arrival date. The original source age conventions are retained without an exact common calendar adjustment.' },
  { id:'north-america', name:'North America', a:[21,23], e:[11.4,13.8],
    blue:'White Sands dated activity', red:'terminal last-appearance span',
    note:'The complete official USGS coauthor fact sheet (May 2026; report 2025–3046) describes activity across White Sands TH2–6 roughly 23–21 kyr ago, not the first continental arrival. Faith & Surovell 2009 use 12–10 radiocarbon kyr BP (approximately 13.8–11.4 calendar kyr BP) as the terminal last-appearance comparison span. Their sampling simulations are consistent with synchronous loss but also allow some earlier genus losses; this span is not a posterior for every genus or proof of simultaneous extinction. These two sources are not a single fitted chronology.' },
  { id:'south-island', name:'South Island moa', a:[.620,.656], e:[.470,.554],
    blue:'onset of moa-egg exploitation', red:'modelled whole-island loss',
    note:'Holdaway 2014 p 4 reports the onset of moa-egg exploitation 1294–1330 CE (95% HPD) from 93 archaeological eggshell ages, and whole South Island extinction 1396–1480 CE (HPD mass 0.949, described as 95%) from 270 natural-context ages. These become 0.620–0.656 and 0.470–0.554 kyr BP using 1950. They are distinct modelled quantities; the onset is not an independently measured first-settlement date. The paper’s eastern-lowland loss interval is different and is not substituted here. Uniform rectangles discard the published HPD shapes and do not assert empirical independence.' }
];
export const extinctionCases=()=>structuredClone(CASES);
export const extinctionDefault=()=>CASES.map(({a,e})=>({a:[...a],e:[...e]}));
const keys=(x,want)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===want.length&&want.every(k=>Object.hasOwn(x,k));
export function extinctionWindow(w){return Array.isArray(w)&&w.length===2&&w.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=.3&&x<=120&&Number(x.toPrecision(12))===x)&&w[0]<=w[1];}
export function extinctionState(s){return keys(s,['windows'])&&Array.isArray(s.windows)&&s.windows.length===CASES.length&&s.windows.every(w=>keys(w,['a','e'])&&extinctionWindow(w.a)&&extinctionWindow(w.e));}
// Analytic rectangle/line/point integrals, evaluated in binary floating point.
// Ages grow into the past: A>E means the blue dated presence is older than the red loss.
export function extinctionStats(a,e){
 if(!extinctionWindow(a)||!extinctionWindow(e))throw new RangeError('Ordered finite comparison spans in the saved domain required');
 const [a0,a1]=a,[e0,e1]=e,wa=a1-a0,we=e1-e0,unit=x=>Math.max(0,Math.min(1,x));let after,positiveLag,tie=0;
 if(wa===0&&we===0){after=+(a0>e0);tie=+(a0===e0);positiveLag=Math.max(a0-e0,0);}
 else if(wa===0){const d=a0-e0;if(d<=0){after=0;positiveLag=0;}else if(a0>=e1){after=1;positiveLag=(a0-e1)+we/2;}else{after=d/we;positiveLag=d*d/(2*we);}}
 else if(we===0){const l=Math.max(a0,e0),d=Math.max(0,a1-l);after=d/wa;positiveLag=d*((a1-e0)+(l-e0))/(2*wa);}
 else{const l=Math.max(a0,e0),h=Math.min(a1,e1),d=Math.max(0,h-l),u=h-e0,z=l-e0,t=Math.max(a0,e1),dt=Math.max(0,a1-t);
  after=(d*(u+z)/(2*we)+dt)/wa;
  positiveLag=(d*(u*u+u*z+z*z)/(6*we)+dt*((a1-e1)+(t-e1)+we)/2)/wa;
 }
 after=unit(after);const inside=we===0?+(e0>=a0&&e0<=a1):unit(Math.max(0,Math.min(a1,e1)-Math.max(a0,e0))/we);
 return{after,before:unit(1-after-tie),tie,positiveLag,conditionalLag:after>0?positiveLag/after:null,inside};
}
export const extinctionX=age=>-Math.log10(age);
export const extinctionAge=x=>10**(-x);
