// Vector Calculus — Chapter 4: helpers shared by ch04.js and ch04-b.js
export * from './ch03.shared.js';

/** Composite Simpson rule for g on [a, b] with n (even) panels. */
export function simpson(g, a, b, n = 200) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Signed area of a polygon (counter-clockwise positive). */
export function polyArea(P) {
  let a = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1];
  return a / 2;
}
/** Centroid of a simple polygon's region. */
export function polyCentroid(P) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const w = P[j][0] * P[i][1] - P[i][0] * P[j][1];
    a += w; cx += (P[j][0] + P[i][0]) * w; cy += (P[j][1] + P[i][1]) * w;
  }
  return [cx / (3 * a), cy / (3 * a)];
}
/** Even-odd point-in-polygon test. */
export function inPoly(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    if (P[i][1] > y !== P[j][1] > y && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  }
  return c;
}
/** Log-spaced integers 1..n (deduplicated), for convergence plots. */
export function logInts(n, k = 24) {
  const out = new Set();
  for (let i = 0; i < k; i++) out.add(Math.max(1, Math.round(Math.exp((Math.log(n) * i) / (k - 1)))));
  return [...out].sort((a, b) => a - b);
}

/** Functions used by the domain/range slicing example on [0,1]. */
export function sliceFunction(key, x) {
  if (key === 'chirp') return x > 0 ? .5 + .5 * Math.sin(1 / x) : .5;
  return .5 + .2 * (Math.sin(8 * x) + Math.sin(4 * x));
}
// f' = .8(2 cos(8x) + cos(4x)); with c=cos(4x), 4c²+c−2=0.
const waveCritical = [-1, 1].flatMap(sign => {
  const a = Math.acos((-1 + sign * Math.sqrt(33)) / 8);
  return [a / 4, (2 * Math.PI - a) / 4].filter(x => x > 0 && x < 1);
});
/** Actual interval infimum/supremum, including the infinitely oscillating first cell. */
export function sliceExtrema(key, a, b) {
  if (key === 'rat') return [0, 1];
  if (key === 'chirp' && a === 0) return [0, 1];
  const values = [sliceFunction(key, a), sliceFunction(key, b)];
  if (key === 'chirp') {
    const low = 1 / b, high = 1 / a;
    const contains = phase => Math.ceil((low - phase) / (2 * Math.PI)) <= Math.floor((high - phase) / (2 * Math.PI));
    if (contains(Math.PI / 2)) values.push(1);
    if (contains(3 * Math.PI / 2)) values.push(0);
  } else for (const x of waveCritical) if (x >= a && x <= b) values.push(sliceFunction(key, x));
  return [Math.min(...values), Math.max(...values)];
}
export function sliceDarboux(key, m) {
  let lo = 0, up = 0;
  for (let j = 0; j < m; j++) {
    const [mn, mx] = sliceExtrema(key, j / m, (j + 1) / m);
    lo += mn / m; up += mx / m;
  }
  return { lo, up };
}
/** Closed-form disc integral and high-resolution quadrature of the square. */
export function gaussianExhaustion(r) {
  const line = simpson(x => Math.exp(-x * x), -r, r, 800);
  return { d: -Math.PI * Math.expm1(-r * r), d2: -Math.PI * Math.expm1(-2 * r * r), q: line * line, line };
}

export const changeMaps = {
  polar: { label: 'polar', T: (u,v) => [u*Math.cos(v),u*Math.sin(v)], J: u => u, u: [.5,2], v: [.2,2.3] },
  para: { label: 'parabolic', T: (u,v) => [u*u-v*v,2*u*v], J: (u,v) => 4*(u*u+v*v), u: [.6,1.5], v: [.3,1.2] },
  shear: { label: 'linear shear', T: (u,v) => [u+.6*v,.8*v], J: () => .8, u: [0,1.6], v: [0,1.2] },
  reverse: { label: 'reversed shear', T: (u,v) => [-u-.6*v,.8*v], J: () => -.8, u: [0,1.6], v: [0,1.2] },
};
/** Independent polynomial/separable antiderivatives, rather than another midpoint grid. */
export function changeIntegral(key, fk) {
  const M = changeMaps[key], moment = (ab,p) => (ab[1]**(p+1)-ab[0]**(p+1))/(p+1);
  const B = (p,q) => moment(M.u,p)*moment(M.v,q);
  if (key === 'polar') return (M.v[1]-M.v[0])*(moment(M.u,1)+(fk==='one'?0:moment(M.u,3)));
  if (key === 'para') return 4*(B(2,0)+B(0,2)+(fk==='one'?0:B(6,0)+3*B(4,2)+3*B(2,4)+B(0,6)));
  return .8*(B(0,0)+(fk==='one'?0:B(2,0)+1.2*B(1,1)+B(0,2)));
}
export function changeSums(key, fk, n) {
  const M = changeMaps[key], du=(M.u[1]-M.u[0])/n, dv=(M.v[1]-M.v[0])/n;
  let sJ=0, sN=0;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const u=M.u[0]+(i+.5)*du, v=M.v[0]+(j+.5)*dv, [x,y]=M.T(u,v), f=fk==='one'?1:1+x*x+y*y;
    sJ+=f*Math.abs(M.J(u,v))*du*dv; sN+=f*du*dv;
  }
  return {sJ,sN};
}
/** Exact coordinate extrema for these four map presets. */
export function changeBounds(key) {
  const M=changeMaps[key], vs=[...M.v];
  if(key==='polar')for(let j=-4;j<=4;j++)if(j*Math.PI/2>M.v[0]&&j*Math.PI/2<M.v[1])vs.push(j*Math.PI/2);
  const pts=M.u.flatMap(u=>vs.map(v=>M.T(u,v))), xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const pad=(a,b)=>{const d=.12*(b-a);return[a-d,b+d];};
  return {x:pad(Math.min(...xs),Math.max(...xs)),y:pad(Math.min(...ys),Math.max(...ys))};
}

/** Reject collapsed edges, zero area, overlapping backtracks, and nonadjacent contacts. */
export function simplePolygon(P) {
  const n=P.length, eps=1e-10, cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const on=(a,b,c)=>Math.abs(cross(a,b,c))<=eps&&c[0]>=Math.min(a[0],b[0])-eps&&c[0]<=Math.max(a[0],b[0])+eps&&c[1]>=Math.min(a[1],b[1])-eps&&c[1]<=Math.max(a[1],b[1])+eps;
  if(n<3||P.some(p=>!p.every(Number.isFinite))||Math.abs(polyArea(P))<eps)return false;
  for(let i=0;i<n;i++){
    const a=P[i],b=P[(i+1)%n],c=P[(i+2)%n];
    if(Math.hypot(a[0]-b[0],a[1]-b[1])<eps)return false;
    if(Math.abs(cross(a,b,c))<=eps&&(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1])<0)return false;
    for(let j=i+2;j<n;j++){
      if(i===0&&j===n-1)continue;
      const c=P[j],d=P[(j+1)%n],s=cross(a,b,c),t=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);
      if((s*t<0&&u*v<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))return false;
    }
  }
  return true;
}
/** Volume of the union after revolving a simple polygon about x=a.
 * Between vertex heights, slice endpoints are affine in y. Split at every
 * sign/order change of their folded radii. The union-of-annuli area is then
 * quadratic, so one Simpson panel integrates each piece exactly up to roundoff.
 */
export function polygonRevolutionVolume(P,a) {
  if(!simplePolygon(P))return NaN;
  const ys=[...new Set(P.map(p=>p[1]))].sort((x,y)=>x-y);
  let volume=0;
  for(let j=0;j<ys.length-1;j++){
    const y0=ys[j],y1=ys[j+1],mid=(y0+y1)/2,edges=[];
    for(let i=0;i<P.length;i++){
      const p=P[i],q=P[(i+1)%P.length];
      if(mid<=Math.min(p[1],q[1])||mid>=Math.max(p[1],q[1]))continue;
      const m=(q[0]-p[0])/(q[1]-p[1]);edges.push({m,c:p[0]+m*(mid-p[1])-a});
    }
    const cuts=[y0,y1],root=(m,c)=>{if(m!==0){const y=mid-c/m;if(y>y0&&y<y1)cuts.push(y);}};
    for(let i=0;i<edges.length;i++){
      root(edges[i].m,edges[i].c);
      for(let k=0;k<i;k++)for(const sign of [-1,1])root(edges[i].m+sign*edges[k].m,edges[i].c+sign*edges[k].c);
    }
    cuts.sort((x,y)=>x-y);
    const area=y=>{
      const xs=edges.map(e=>e.c+e.m*(y-mid)).sort((x,y)=>x-y),iv=[];
      for(let i=0;i<xs.length;i+=2){const l=xs[i],r=xs[i+1];iv.push([l<=0&&r>=0?0:Math.min(Math.abs(l),Math.abs(r)),Math.max(Math.abs(l),Math.abs(r))]);}
      iv.sort((p,q)=>p[0]-q[0]);let lo=0,hi=0,sum=0;
      for(const [l,r] of iv){if(l>hi){sum+=hi*hi-lo*lo;lo=l;hi=r;}else hi=Math.max(hi,r);}
      return Math.PI*(sum+hi*hi-lo*lo);
    };
    for(let i=1;i<cuts.length;i++){const l=cuts[i-1],r=cuts[i];volume+=(r-l)*(area(l)+4*area((l+r)/2)+area(r))/6;}
  }
  return volume;
}
/** Surface swept by polygon edges, counting overlapping sheets if the axis cuts it. */
export function polygonSweepArea(P,a) {
  let area=0;
  for(let i=0;i<P.length;i++){
    const p=P[i],q=P[(i+1)%P.length],l=p[0]-a,r=q[0]-a,len=Math.hypot(q[0]-p[0],q[1]-p[1]);
    const mean=l*r>=0?(Math.abs(l)+Math.abs(r))/2:(l*l+r*r)/(2*(Math.abs(l)+Math.abs(r)));
    area+=2*Math.PI*len*mean;
  }
  return area;
}
