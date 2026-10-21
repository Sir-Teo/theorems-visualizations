// Macroeconomics — Chapter 4: helpers and data shared by ch04.js and ch04-b.js.
export * from './ch03.shared.js';
import { olsMulti } from './ch03.shared.js';

/** PWT level regressions; human capital is an efficiency level, not MRW's investment proxy.
 * Parameter counts include the intercept; fixed-slope models estimate only that intercept.
 */
export function growthRegressions(data, gd) {
  const ly = data.map(r => Math.log(r[3])), ls = data.map(r => Math.log(r[4]));
  const lh = data.map(r => Math.log(r[7])), lnd = data.map(r => Math.log(Math.expm1(r[5]) + gd));
  const n = data.length, mean = ly.reduce((a,b) => a+b,0)/n;
  const tss = ly.reduce((sum,y) => sum+(y-mean)**2,0);
  const summary = (pred,p,b) => {
    const rss = ly.reduce((sum,y,i) => sum+(y-pred[i])**2,0), r2 = 1-rss/tss;
    return {pred,r2,p,b,adjR2:1-(1-r2)*(n-1)/(n-p)};
  };
  const free = cols => {
    const X = ly.map((_,i) => [1,...cols.map(col => col[i])]), o = olsMulti(X,ly);
    return summary(X.map(row => row.reduce((sum,x,j) => sum+x*o.b[j],0)),X[0].length,o.b);
  };
  const fixed = human => {
    const raw = ls.map((s,i) => .5*(s-lnd[i])+(human?lh[i]:0));
    const intercept = ly.reduce((sum,y,i) => sum+y-raw[i],0)/n;
    return summary(raw.map(x => x+intercept),1);
  };
  return {sol:free([ls,lnd]),sol3:fixed(false),aug:free([ls,lnd,lh]),aug3:fixed(true)};
}

/** Illustrative annual log-step model, not a reconstruction of Galor–Weil.
 * Crossing the biological cap threshold is sufficient for rising income even at
 * maximum population growth; it is distinct from merely rising income today.
 */
export function escapePath(nu,g0,nm,transition,tau,T=1600) {
  const alpha=.7,eta=.02,threshold=(1-alpha)*nm,pts=[];
  let lnA=0,lnN=0,esc=null;
  for(let year=0;year<=T;year++) {
    const lny=lnA-(1-alpha)*lnN;
    let n=Math.max(-.02,Math.min(eta*lny,nm));
    if(transition)n/=1+Math.exp((lny-Math.log(tau))/.15);
    const g=Math.min(g0*Math.exp(nu*lnN),.02);
    pts.push([year,Math.exp(lny),g,(1-alpha)*n,Math.exp(lnN)]);
    if(esc===null&&g>threshold)esc=year;
    lnA+=g;lnN+=n;
  }
  return {pts,esc,threshold};
}

// AJR_DATA: the 64-country "base sample" of Acemoglu, Johnson & Robinson (2001), AER 91(5): 1369–1401, from the authors' replication file maketable4.dta
// (independently checked against the authors' MIT-linked maketable4.zip in Oct 2026;
// https://economics.mit.edu/people/faculty/daron-acemoglu/data-archive; reproduces Table 4, col. 1:
// OLS slope 0.52, first stage −0.61, 2SLS 0.94). Fields: ISO code, avexpr (protection against expropriation risk, 0–10, average 1985–95),
// logpgp95 (log GDP per capita 1995, PPP), logem4 (log settler mortality, deaths per 1000 per year), group (0 other, 1 Africa, 2 Asia, 3 neo-Europes AUS/CAN/NZL/USA). Rounded to 2 decimals.
export const AJR_DATA = "AGO,5.36,7.77,5.63,1 ARG,6.39,9.13,4.23,0 AUS,9.32,9.90,2.15,3 BFA,4.45,6.85,5.63,1 BGD,5.14,6.88,4.27,2 BHS,7.50,9.29,4.44,0 BOL,5.64,7.93,4.26,0 BRA,7.91,8.73,4.26,0 CAN,9.73,9.99,2.78,3 CHL,7.82,9.34,4.23,0 CIV,7.00,7.44,6.50,1 CMR,6.45,7.50,5.63,1 COG,4.68,7.42,5.48,1 COL,7.32,8.81,4.26,0 CRI,7.05,8.79,4.36,0 DOM,6.18,8.36,4.87,0 DZA,6.50,8.39,4.36,1 ECU,6.55,8.47,4.26,0 EGY,6.77,7.95,4.22,1 ETH,5.73,6.11,3.26,1 GAB,7.82,8.91,5.63,1 GHA,6.27,7.37,6.50,1 GIN,6.55,7.49,6.18,1 GMB,8.27,7.27,7.29,1 GTM,5.14,8.29,4.26,0 GUY,5.89,7.90,3.47,0 HKG,8.14,10.05,2.70,2 HND,5.32,7.69,4.36,0 HTI,3.73,7.15,4.87,0 IDN,7.59,8.07,5.14,2 IND,8.27,7.33,3.88,2 JAM,7.09,8.19,4.87,0 KEN,6.05,7.06,4.98,1 LKA,6.05,7.73,4.25,2 MAR,7.09,8.04,4.36,1 MDG,4.45,6.84,6.28,1 MEX,7.50,8.94,4.26,0 MLI,4.00,6.57,7.99,1 MLT,7.23,9.43,2.79,0 MYS,7.95,8.89,2.87,2 NER,5.00,6.73,5.99,1 NGA,5.55,6.81,7.60,1 NIC,5.23,7.54,5.10,0 NZL,9.73,9.76,2.15,3 PAK,6.05,7.35,3.61,2 PAN,5.91,8.84,5.10,0 PER,5.77,8.40,4.26,0 PRY,6.95,8.21,4.36,0 SDN,4.00,7.31,4.48,1 SEN,6.00,7.40,5.10,1 SGP,9.32,10.15,2.87,2 SLE,5.82,6.25,6.18,1 SLV,5.00,7.95,4.36,0 TGO,6.91,7.22,6.50,1 TTO,7.45,8.77,4.44,0 TUN,6.45,8.48,4.14,1 TZA,6.64,6.25,5.63,1 UGA,4.45,6.97,5.63,1 URY,7.00,9.03,4.26,0 USA,10.00,10.22,2.71,3 VEN,7.14,9.07,4.36,0 VNM,6.41,7.28,4.94,2 ZAF,6.86,8.89,2.74,1 ZAR,3.50,6.87,5.48,1";

/** Two-stage least squares with one regressor x, one instrument z and a constant:
 * OLS, first stage and 2SLS with the conventional homoskedastic standard error.
 * Independent reference fits: docs/verification/ajr-table4.json, scripts/verify-ajr.py.
 */
export function iv1(x, y, z, ols) {
  const n = x.length, o = ols(x, y), f = ols(z, x), xh = z.map((zi) => f.intercept + f.slope * zi), s = ols(xh, y);
  let rss = 0; for (let i = 0; i < n; i++) rss += (y[i] - s.intercept - s.slope * x[i]) ** 2;
  const mh = xh.reduce((a, b) => a + b, 0) / n, sxx = xh.reduce((a, b) => a + (b - mh) ** 2, 0);
  return { ols: o, fs: f, tsls: { slope: s.slope, intercept: s.intercept, se: Math.sqrt(rss / Math.max(1, n - 2) / sxx) } };
}

/** Exact log-capital path for dk/dt=s*A*k^alpha-d*k, k(0)=1,
 * with a saving-rate change at switchTime. Transform z=k^(1-alpha) to a linear ODE.
 */
export function capitalSavingPath(alpha, A, d, saving, after, switchTime = 50, T = 150, dt = .25) {
  const advance = (lnk, s, t) => {
    const r = 1-alpha;
    if (Math.abs(r) < 1e-10) return lnk + (s*A-d)*t;
    return lnk + Math.log1p((s*A/(d*Math.exp(r*lnk))-1) * -Math.expm1(-r*d*t))/r;
  };
  const atSwitch = advance(0, saving, switchTime), out = [];
  for (let i = 0; i <= Math.round(T/dt); i++) {
    const t = i*dt;
    out.push([t, t <= switchTime ? advance(0,saving,t) : advance(atSwitch,after,t-switchTime)]);
  }
  return out;
}
