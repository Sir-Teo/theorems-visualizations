// Topology — Chapter 4: helpers shared by ch04.js, ch04-b.js and ch04-c.js (plain named exports).
//
//  1. Re-exports of chapter 3's helpers (and through them chapters 1 and 2).
//  2. Open intervals on the line: seeded random covers and the greedy "finite subcover" extractor used by
//     several items (it is exact: for open intervals covering a closed interval, always taking the interval that
//     reaches farthest from the current point gives a minimal subcover).
//  3. Small drawing helpers for stacks of intervals.
export * from './ch03.shared.js';

/** n+1 open intervals (c − r, c + r) centred at k/n of [lo, hi], with r seeded in [rmin, rmax]. Covers when rmin > (hi − lo)/(2n). */
export function randIntervals(rng, n, rmin, rmax, lo = 0, hi = 1) {
  const out = [];
  for (let k = 0; k <= n; k++) { const c = lo + ((hi - lo) * k) / n, r = rmin + (rmax - rmin) * rng(); out.push([c - r, c + r]); }
  return out;
}
/**
 * Greedy subcover of the closed interval [lo, hi] by open intervals [a, b]: from the current point p take the interval
 * containing p that reaches farthest right. Returns {ok, chosen: indices, reach: points p_0=lo, p_1, …, stuck}.
 * When ok is false, `stuck` is the first point that no interval contains.
 */
export function greedyCover(ints, lo, hi) {
  const chosen = [], reach = [lo]; let p = lo;
  for (let guard = 0; guard < ints.length + 2; guard++) {
    let best = -1;
    for (let i = 0; i < ints.length; i++) { const [a, b] = ints[i]; if (a < p && p < b && (best < 0 || b > ints[best][1])) best = i; }
    if (best < 0) return { ok: false, chosen, reach, stuck: p };
    chosen.push(best); p = ints[best][1]; reach.push(p);
    if (p > hi) return { ok: true, chosen, reach };
  }
  return { ok: false, chosen, reach, stuck: p };
}
/** Is the point x in some open interval of the list? */
export const coveredBy = (ints, x) => ints.some(([a, b]) => a < x && x < b);
/** Draw open intervals as thin bars at heights y0 + k·dy (k = row). `rows` maps interval index → row; colours by `col(i)`. */
export function drawBars(s, ints, rowOf, y0, dy, col, { width = 3, alpha = 1, r = 2.6, clip } = {}) {
  ints.forEach(([a, b], i) => {
    const y = y0 + dy * rowOf(i), c = col(i);
    if (c == null) return;
    const A = clip ? Math.max(a, clip[0]) : a, B = clip ? Math.min(b, clip[1]) : b;
    s.line(A, y, B, y, { color: c, width, alpha, cap: 'butt' });
    if (!clip || a >= clip[0]) s.dot(a, y, { r, hollow: true, color: c, width: 1.3, alpha });
    if (!clip || b <= clip[1]) s.dot(b, y, { r, hollow: true, color: c, width: 1.3, alpha });
  });
}
export const CYC = ['blue', 'orange', 'green', 'pink', 'purple', 'teal'];
export const mn = (s) => s.replace(/-/g, '−');

/** Finite prefix of the Cantor nested-interval construction avoiding xs[k] at step k. */
export function cantorAvoid(xs,n=xs.length) {
  let lo=0,hi=1;const intervals=[],bits=[],steps=[];
  for(let k=0;k<n;k++){
    const width=(hi-lo)/3,left=[lo,lo+width],right=[hi-width,hi],x=xs[k];
    const pick=x>=left[0]-1e-12&&x<=left[1]+1e-12?1:0;
    steps.push({lo,hi,left,right,pick,x});bits.push(pick?2:0);
    [lo,hi]=pick?right:left;intervals.push([lo,hi]);
  }
  // The left endpoint (remaining digits all zero) is in C. The midpoint generally is not.
  return {lo,hi,candidate:lo,intervals,bits,steps};
}
/** Inverse stereographic projection to the unit sphere, with infinity at its north pole. */
export function stereographicSphere(x,y) {
  const q=x*x+y*y;return [2*x/(q+1),2*y/(q+1),(q-1)/(q+1)];
}

export const discFunctions = {wave:(x,y)=>Math.sin(2.5*x)+Math.cos(2*y)+.4*x*y,plane:(x,y)=>x+.6*y};
/** Finite polar-grid extrema: sample statistics, not extrema certificates. */
export function discSampleExtrema(key,N,closed) {
  const f=discFunctions[key];let best=[f(0,0),0,0],low=best.slice();
  for(let k=1;k<=(closed?N:N-1);k++){
    const r=k/N,m=Math.max(8,Math.round(6*k*Math.max(1,40/N)));
    for(let j=0;j<m;j++){const t=2*Math.PI*j/m,x=r*Math.cos(t),y=r*Math.sin(t),z=f(x,y);if(z>best[0])best=[z,x,y];if(z<low[0])low=[z,x,y];}
  }
  return {best,low};
}
/** Unique interior maximum of the wave example; Newton approximation, not a sampled maximum. */
export function waveMaximum() {
  let x=.63,y=.06;
  for(let i=0;i<15;i++){
    const gx=2.5*Math.cos(2.5*x)+.4*y,gy=-2*Math.sin(2*y)+.4*x;
    const a=-6.25*Math.sin(2.5*x),b=.4,c=-4*Math.cos(2*y),det=a*c-b*b;
    x-=(c*gx-b*gy)/det;y-=(-b*gx+a*gy)/det;
  }
  return [discFunctions.wave(x,y),x,y];
}
/** Largest admissible local radius for the examples, capped at the domain width. */
export function continuityLocalRadius(key,x,epsilon,a=.2) {
  const lo=key==='inv'?a:0,hi=key==='inv'?1:2,width=hi-lo;
  let delta=width;
  const consider=y=>{if(y>=lo-1e-14&&y<=hi+1e-14)delta=Math.min(delta,Math.abs(y-x));};
  if(key==='inv'){
    consider(x/(1+epsilon*x));
    if(epsilon*x<1)consider(x/(1-epsilon*x));
  }else{
    const value=Math.sin(3*x*x);
    for(const target of [value-epsilon,value+epsilon]){
      if(target< -1-1e-14||target>1+1e-14)continue;
      const alpha=Math.asin(Math.max(-1,Math.min(1,target)));
      for(let k=-1;k<=3;k++)for(const phase of [alpha+2*Math.PI*k,Math.PI-alpha+2*Math.PI*k])if(phase>=0&&phase<=12)consider(Math.sqrt(phase/3));
    }
  }
  return delta;
}
/** A uniform radius: exact capped optimum for 1/x, derivative-bound guarantee for sin(3x²). */
export function continuityUniformRadius(key,epsilon,a=.2) {
  if(key==='sin')return epsilon/12;
  const width=1-a,range=1/a-1;
  return epsilon>=range?width:Math.min(width,epsilon*a*a/(1-epsilon*a));
}

/** Ambient open-disc covers used by the Lebesgue-number example. */
export function lebesgueDiscs(compact,scale=1,J=5) {
  if(compact)return [[0,0,.6*scale],...Array.from({length:6},(_,i)=>[.8*Math.cos(Math.PI*i/3),.8*Math.sin(Math.PI*i/3),.55*scale])];
  const discs=[];for(let j=0;j<=J;j++){const s=2**-j;for(let k=0;k<14;k++){const t=2*Math.PI*(k+.5*(j%2))/14;discs.push([.75*s*Math.cos(t),.75*s*Math.sin(t),.4*s]);}}return discs;
}
/** Largest ambient open-ball radius fitting inside a drawn disc; not the relative-space clearance. */
export function ambientClearance(discs,x,y) {
  let value=-Infinity,index=-1;discs.forEach(([cx,cy,r],i)=>{const d=r-Math.hypot(x-cx,y-cy);if(d>value){value=d;index=i;}});return {value,index};
}
/** Exact minimum ambient clearance of the seven-disc cover over r0 <= |x| <= 1. */
export function compactCoverMinimum(scale,r0=0) {
  const c=Math.cos(Math.PI/6),cross=(.64-.0025*scale*scale)/(1.6*c-.1*scale);
  const candidates=[r0,1];if(cross>=r0&&cross<=1)candidates.push(cross);
  const clearance=r=>Math.max(.6*scale-r,.55*scale-Math.sqrt(r*r+.64-1.6*r*c));
  let r=candidates[0];for(const q of candidates)if(clearance(q)<clearance(r))r=q;
  return {value:clearance(r),point:[r*c,r*.5],cross};
}
/** Each ring covers s/2 <= r <= s with margin at least c*s >= c*r. */
export const punctureCoverConstant=.4-Math.sqrt(Math.max(.8125-.75*Math.cos(Math.PI/14),1.5625-1.5*Math.cos(Math.PI/14)));

export const compactnessArrows=[['C','LP',true],['S','LP',true],['LP','C',false],['LP','S',false],['C','S',false],['S','C',false]];
export const compactnessExamples={
 I:{name:'$[0,1]$',c:1,l:1,q:1,m:1,why:'a closed bounded interval: every cover has a finite subcover and every sequence has a convergent subsequence.'},
 O:{name:'$(0,1)$',c:0,l:0,q:0,m:1,why:'the sequence $1/(n+1)$ has no convergent subsequence in the space; its range has no limit point there. The cover by $(1/n,1)$ has no finite subcover.'},
 R:{name:'$\\R$',c:0,l:0,q:0,m:1,why:'the sequence $n$ has no convergent subsequence; $\\mathbb N$ has no limit point, and $(-n,n)$ has no finite subcover.'},
 N:{name:'$\\mathbb N$ discrete',c:0,l:0,q:0,m:1,why:'the singleton cover has no finite subcover; the infinite set of all points has no limit point.'},
 B:{name:'$\\mathbb N\\times\\{0,1\\}$, indiscrete pairs',c:0,l:1,q:0,m:0,why:'each pair is an open fibre, and every neighborhood of either point contains its mate. Thus every nonempty subset has a limit point. The fibre cover has no finite subcover; the sequence $(n,0)$ has no convergent subsequence because each fibre contains only one term. This space is not T0, hence not metrizable.'},
 W:{name:'$[0,\\omega_1)$',c:0,l:1,q:1,m:0,why:'every countable set of ordinals is bounded in a compact ordinal interval, so infinite sets have limit points. A sequence either repeats a value infinitely often or has an increasing subsequence converging to its countable supremum. The initial-segment cover has no finite subcover.'},
 P:{name:'$[0,1]^{[0,1]}$',c:1,l:1,q:0,m:0,why:'compact by Tychonoff. Let $f_n(t)$ be the nth binary digit of t, using terminating expansions for dyadic t. For any proposed subsequence, choose a nondyadic t whose selected digits alternate 0 and 1. That coordinate does not converge, so there is no pointwise-convergent subsequence.'},
};
/** Finite-prefix illustration only: choosing a majority does not prove infinitely many terms remain. */
export function finiteBisection(values,depth,window=[0,1]) {
 let [a,b]=window,I=values.map((_,i)=>i+1);const wins=[[a,b]];
 for(let k=0;k<depth;k++){
  const m=(a+b)/2,L=I.filter(i=>values[i-1]<=m),R=I.filter(i=>values[i-1]>=m);
  if(L.length>=R.length&&L.length){I=L;b=m;}else if(R.length){I=R;a=m;}else break;
  wins.push([a,b]);
 }
 return {I,a,b,wins};
}
