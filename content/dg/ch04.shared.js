// Differential Geometry — Chapter 4 (Regular surfaces): helpers shared by ch04.js and ch04-b.js.
// Re-exports the chapter-3 helpers (vectors add/sub/mul/dot/cross/len/unit, Frenet curves, ...) and adds parametrized surfaces:
// partial derivatives, a few standard patches, coordinate lines, a marching-tetrahedra mesher for implicit surfaces,
// shaded triangle drawing and ray casting.
export * from './ch03.shared.js';
import { TAU, cross, sub, add, mul, dot, len, unit } from './ch03.shared.js';

export const PI = Math.PI;

/** Partials of a patch F(u, w) → [x, y, z] by central differences: {Fu, Fv, n = Fu × Fv, J = |n|, N = n/J (0 if J ≈ 0)}. */
export function dF(F, u, w, h = 1e-4) {
  const a = F(u + h, w), b = F(u - h, w), c = F(u, w + h), d = F(u, w - h);
  const Fu = mul(sub(a, b), 1 / (2 * h)), Fv = mul(sub(c, d), 1 / (2 * h));
  const n = cross(Fu, Fv), J = len(n);
  return { Fu, Fv, n, J, N: J > 1e-12 ? mul(n, 1 / J) : [0, 0, 0] };
}

/** A 3D stage with the conventions of this chapter. */
export function stage3(v, o = {}) {
  return v.stage3d({ range: o.range ?? 2, height: o.height ?? 380, yaw: o.yaw ?? -0.6, pitch: o.pitch ?? 0.45, axes: false, weight: o.weight ?? 1.25, minWidth: o.minWidth ?? 300, title: o.title, persp: o.persp ?? 0, full: !!o.full });
}
/** A parameter-domain stage (boxed axes outside the data area). */
export function chart(v, o = {}) {
  return v.stage({ x: o.x, y: o.y, axes: 'box', gutter: true, height: o.height ?? 380, weight: o.weight ?? 0.8, minWidth: o.minWidth ?? 260, xlabel: o.xlabel ?? 'u', ylabel: o.ylabel ?? 'v', title: o.title, xticks: o.xticks, yticks: o.yticks, equal: !!o.equal });
}

/** Coordinate lines of a patch on a 3D stage: nu lines u = const and nv lines v = const. */
export function coordLines(S, F, [u0, u1], [v0, v1], nu, nv, st = {}) {
  for (let i = 0; i <= nu; i++) { const u = u0 + ((u1 - u0) * i) / nu; S.curve((t) => F(u, t), v0, v1, { n: 48, ...st }); }
  for (let j = 0; j <= nv; j++) { const w = v0 + ((v1 - v0) * j) / nv; S.curve((t) => F(t, w), u0, u1, { n: 48, ...st }); }
}
/** Boundary of the small parameter square [u, u+a] × [w, w+b] mapped by F (a curved quadrilateral, as points). */
export function squareImage(F, u, w, a, b, n = 10) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(F(u + (a * i) / n, w));
  for (let i = 0; i < n; i++) pts.push(F(u + a, w + (b * i) / n));
  for (let i = 0; i < n; i++) pts.push(F(u + a - (a * i) / n, w + b));
  for (let i = 0; i < n; i++) pts.push(F(u, w + b - (b * i) / n));
  return pts;
}
/** Parallelogram in a plane: centre p, orthonormal e1, e2, half-sizes r1, r2. */
export function planeQuad(p, e1, e2, r1, r2 = r1) {
  const c = (s, t) => add(p, add(mul(e1, s * r1), mul(e2, t * r2)));
  return [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)];
}
/** Orthonormal basis of the plane spanned by a, b (Gram–Schmidt). */
export function orthoBasis(a, b) {
  const e1 = unit(a), t = sub(b, mul(e1, dot(b, e1))), e2 = unit(t);
  return [e1, e2];
}

// ───────────────────────────────────────────────────────────── standard patches
/** Standard surfaces: F(u, w) → point, parameter rectangle U × V, a start point p0 in it. */
export const SURF = {
  sphere: { name: 'sphere', F: (u, w) => [Math.cos(w) * Math.cos(u), Math.cos(w) * Math.sin(u), Math.sin(w)], U: [-PI, PI], V: [-1.45, 1.45], p0: [0.7, 0.35] },
  torus: { name: 'torus', F: (u, w) => [(1.2 + 0.55 * Math.cos(w)) * Math.cos(u), (1.2 + 0.55 * Math.cos(w)) * Math.sin(u), 0.55 * Math.sin(w)], U: [0, TAU], V: [0, TAU], p0: [0.9, 0.8] },
  saddle: { name: 'saddle', F: (u, w) => [u, w, 0.5 * (u * u - w * w)], U: [-1.5, 1.5], V: [-1.5, 1.5], p0: [0.5, 0.4] },
  hill: { name: 'hill and valley', F: (u, w) => [u, w, 0.9 * Math.exp(-(u * u + w * w) / 1.2) - 0.35 * Math.cos(1.6 * u) * Math.sin(1.1 * w)], U: [-1.8, 1.8], V: [-1.8, 1.8], p0: [0.4, -0.3] },
};

// ───────────────────────────────────────────────────────────── triangle meshes
/** Triangles {p: [a, b, c], n: unit normal} of a patch on a (nu × nv) grid (non-finite cells skipped). */
export function paramMesh(F, [u0, u1], [v0, v1], nu, nv) {
  const G = [];
  for (let i = 0; i <= nu; i++) { G.push([]); for (let j = 0; j <= nv; j++) G[i].push(F(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv)); }
  const out = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = G[i][j], b = G[i + 1][j], c = G[i + 1][j + 1], d = G[i][j + 1];
    if (![a, b, c, d].every((p) => p.every(Number.isFinite))) continue;
    for (const p of [[a, b, c], [a, c, d]]) { const n = cross(sub(p[1], p[0]), sub(p[2], p[0])), l = len(n); if (l > 1e-14) out.push({ p, n: mul(n, 1 / l) }); }
  }
  return out;
}

/**
 * Marching tetrahedra: triangles of the level set {f = c} inside the box [lo, hi] on an (nx × ny × nz) grid.
 * Each triangle is {p: [a, b, c], n: unit normal (from the gradient of f, so it points to increasing f)}.
 */
export function implicitMesh(f, c, lo, hi, nx, ny = nx, nz = nx) {
  const Nx = nx + 1, Ny = ny + 1, Nz = nz + 1, dx = (hi[0] - lo[0]) / nx, dy = (hi[1] - lo[1]) / ny, dz = (hi[2] - lo[2]) / nz;
  const val = new Float64Array(Nx * Ny * Nz), id = (i, j, k) => (i * Ny + j) * Nz + k;
  for (let i = 0; i < Nx; i++) for (let j = 0; j < Ny; j++) for (let k = 0; k < Nz; k++) val[id(i, j, k)] = f(lo[0] + i * dx, lo[1] + j * dy, lo[2] + k * dz) - c;
  const CO = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const TET = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  const h = 1e-4 * Math.max(dx, dy, dz) + 1e-7;
  const grad = (p) => [(f(p[0] + h, p[1], p[2]) - f(p[0] - h, p[1], p[2])) / (2 * h), (f(p[0], p[1] + h, p[2]) - f(p[0], p[1] - h, p[2])) / (2 * h), (f(p[0], p[1], p[2] + h) - f(p[0], p[1], p[2] - h)) / (2 * h)];
  const out = [];
  const push = (a, b, d) => {
    const g = grad([(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3, (a[2] + b[2] + d[2]) / 3]), l = len(g);
    if (!(l > 1e-12)) return;
    out.push({ p: [a, b, d], n: mul(g, 1 / l), g: l });
  };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const P = [], V = [];
    let bad = false, any = false, pos = false, neg = false;
    for (let q = 0; q < 8; q++) {
      const ii = i + CO[q][0], jj = j + CO[q][1], kk = k + CO[q][2], x = val[id(ii, jj, kk)];
      if (!Number.isFinite(x)) { bad = true; break; }
      P.push([lo[0] + ii * dx, lo[1] + jj * dy, lo[2] + kk * dz]); V.push(x);
      if (x > 0) pos = true; else neg = true;
    }
    if (bad || !(pos && neg)) continue;
    any = true;
    for (const T of TET) {
      const ins = [], outs = [];
      for (const q of T) (V[q] > 0 ? ins : outs).push(q);
      if (!ins.length || !outs.length) continue;
      const E = (a, b) => { const t = V[a] / (V[a] - V[b]); return [P[a][0] + t * (P[b][0] - P[a][0]), P[a][1] + t * (P[b][1] - P[a][1]), P[a][2] + t * (P[b][2] - P[a][2])]; };
      if (ins.length === 1) push(E(ins[0], outs[0]), E(ins[0], outs[1]), E(ins[0], outs[2]));
      else if (outs.length === 1) push(E(outs[0], ins[0]), E(outs[0], ins[1]), E(outs[0], ins[2]));
      else { const [a, b] = ins, [cc, d] = outs; push(E(a, cc), E(a, d), E(b, d)); push(E(a, cc), E(b, d), E(b, cc)); }
    }
  }
  return out;
}

/** Draw triangles shaded by their normal (two-sided Lambert); o: {color, alpha, colorFn(tri) → colour, wire}. */
export function drawMesh(S, v, tris, o = {}) {
  const L = [-0.35, 0.55, 0.75], nL = Math.hypot(...L), base = v.rgb(o.color ?? 'accent'), a = o.alpha ?? 0.92;
  for (const t of tris) {
    const nV = S._view(t.n), nl = Math.hypot(nV[0], nV[1], nV[2]) || 1;
    const k = 0.45 + 0.55 * Math.abs((nV[0] * L[0] + nV[1] * L[1] - nV[2] * L[2]) / (nl * nL));
    const c = o.colorFn ? v.rgb(o.colorFn(t)) : base;
    const rgb = [c[0] * k, c[1] * k, c[2] * k];
    S.poly(t.p, { fill: rgb, fillAlpha: a, color: rgb, alpha: a, width: 0.7 });
  }
}

/** Möller–Trumbore: parameters s > 0 at which the ray q + s d meets the triangle mesh. */
export function rayHits(tris, q, d) {
  const out = [];
  for (const t of tris) {
    const [a, b, c] = t.p, e1 = sub(b, a), e2 = sub(c, a), pv = cross(d, e2), det = dot(e1, pv);
    if (Math.abs(det) < 1e-12) continue;
    const inv = 1 / det, tv = sub(q, a), u = dot(tv, pv) * inv;
    if (u < 0 || u > 1) continue;
    const qv = cross(tv, e1), w = dot(d, qv) * inv;
    if (w < 0 || u + w > 1) continue;
    const s = dot(e2, qv) * inv;
    if (s > 1e-9) out.push({ s, t });
  }
  out.sort((x, y) => x.s - y.s);
  // merge hits that are the same crossing of an edge shared by two triangles
  return out.filter((h, i) => i === 0 || h.s - out[i - 1].s > 1e-7);
}
/** Segments where the plane z = z0 cuts the mesh: list of [[x, y], [x, y]]. */
export function sliceZ(tris, z0) {
  const segs = [];
  for (const t of tris) {
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const a = t.p[i], b = t.p[(i + 1) % 3], da = a[2] - z0, db = b[2] - z0;
      if ((da > 0) !== (db > 0)) { const s = da / (da - db); pts.push([a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])]); }
    }
    if (pts.length === 2) segs.push(pts);
  }
  return segs;
}

/** Principal-axis family sum L_i x_i² + 2 ell z = k, including lower-dimensional degeneracies. */
export function classifyQuadric(L,ell,k) {
 const eps=1e-9,nz=L.map((x,i)=>i).filter(i=>Math.abs(L[i])>eps),rank=nz.length,center=[0,0,Math.abs(L[2])>eps?-ell/L[2]:0],level=k+(Math.abs(L[2])>eps?ell*ell/L[2]:0);
 let name,mode='mesh';
 if(Math.abs(L[2])<=eps&&Math.abs(ell)>eps){
  name=rank===2?(L[0]*L[1]>0?'elliptic paraboloid':'hyperbolic paraboloid'):rank===1?'parabolic cylinder':'plane';
 }else if(Math.abs(level)<=eps){
  const definite=nz.every(i=>L[i]>0)||nz.every(i=>L[i]<0);
  if(rank===3){name=definite?'a single point':'cone';if(definite)mode='point';}
  else if(rank===2){name=definite?'a line':'two crossing planes';mode=definite?'line':'planes';}
  else if(rank===1){name='a plane (double)';mode='planes';}
  else{name='all of space';mode='all';}
 }else{
  const positive=nz.filter(i=>L[i]*level>0).length;
  if(!positive){name='empty set';mode='empty';}
  else if(rank===3)name=positive===3?'ellipsoid':positive===2?'hyperboloid of one sheet':'hyperboloid of two sheets';
  else if(rank===2)name=positive===2?'elliptic cylinder':'hyperbolic cylinder';
  else{name='two parallel planes';mode='planes';}
 }
 const planes=[];
 if(mode==='planes'){
  if(rank===1){const i=nz[0],a=Math.sqrt(Math.max(0,level/L[i])),n=[0,0,0];n[i]=1;for(const d of a?[a,-a]:[0])planes.push({n:n.slice(),d:d+dot(n,center)});}
  else{const [i,j]=nz,a=Math.sqrt(Math.abs(L[i])),b=Math.sqrt(Math.abs(L[j]));for(const sign of [-1,1]){const n=[0,0,0];n[i]=a;n[j]=sign*b;planes.push({n,d:dot(n,center)});}}
 }
 return {name,mode,center,level,rank,nz,planes};
}
/** Finite planar polygon from clipping a plane n.x=d to the display cube. */
export function planeInBox(n,d,extent=1.8) {
 const vertices=[];for(let free=0;free<3;free++)if(Math.abs(n[free])>1e-12){const other=[0,1,2].filter(i=>i!==free);for(const a of [-extent,extent])for(const b of [-extent,extent]){const p=[0,0,0];p[other[0]]=a;p[other[1]]=b;p[free]=(d-n[other[0]]*a-n[other[1]]*b)/n[free];if(Math.abs(p[free])<=extent+1e-10&&!vertices.some(q=>len(sub(p,q))<1e-9))vertices.push(p);}}
 if(vertices.length<3)return [];
 const center=mul(vertices.reduce((a,p)=>add(a,p),[0,0,0]),1/vertices.length),N=unit(n),u=unit(sub(vertices[0],center)),v=cross(N,u);
 return vertices.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),u))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),u)));
}
export const genusTwoLevel=(x,y,z)=>(x*x*(1-x*x)-y*y)**2+z*z-.03;
export const kleinFigureEight=(u,w)=>{const r=2+Math.cos(u/2)*Math.sin(w)-Math.sin(u/2)*Math.sin(2*w);return [.5*r*Math.cos(u),.5*r*Math.sin(u),.5*(Math.sin(u/2)*Math.sin(w)+Math.cos(u/2)*Math.sin(2*w))];};
/** Signed implicit equations; the negative sublevel is the bounded inside in each embedded example. */
export function surfaceLevel(key,p) {
 const [x,y,z]=p;if(key==='sphere')return x*x+y*y+z*z-1;
 if(key==='torus')return (Math.hypot(x,y)-1.2)**2+z*z-.55**2;
 return genusTwoLevel(x,y,z);
}
export function surfaceNormal(key,p) {
 const [x,y,z]=p;
 if(key==='sphere')return unit(p);
 if(key==='torus'){const r=Math.hypot(x,y);return unit([2*(r-1.2)*x/r,2*(r-1.2)*y/r,2*z]);}
 const q=x*x*(1-x*x)-y*y;return unit([2*q*(2*x-4*x*x*x),-4*q*y,2*z]);
}
/** Analytic +x ray intersections. Tangent contacts are identified rather than counted as crossings. */
export function surfaceRay(key,Q) {
 const [qx,y,z]=Q,roots=[];
 const addSquared=r=>{if(r>=-1e-12){const a=Math.sqrt(Math.max(0,r));roots.push(-a,a);}};
 if(key==='sphere')addSquared(1-y*y-z*z);
 else if(key==='torus'){
  const q=.55**2-z*z;if(q>=-1e-12){const a=Math.sqrt(Math.max(0,q));for(const r of [1.2-a,1.2+a])if(r>=0)addSquared(r*r-y*y);}
 }else{
  const q=.03-z*z;if(q>=-1e-12){const a=Math.sqrt(Math.max(0,q));for(const v of [-a,a]){const disc=1-4*(y*y+v);if(disc>=-1e-12){const b=Math.sqrt(Math.max(0,disc));addSquared((1-b)/2);addSquared((1+b)/2);}}}
 }
 roots.sort((a,b)=>a-b);const unique=roots.filter((x,i)=>!i||x-roots[i-1]>1e-8),value=surfaceLevel(key,Q),location=Math.abs(value)<1e-9?'on the surface':value<0?'inside':'outside';
 const hits=unique.filter(x=>x>qx+1e-9).map(x=>{const p=[x,y,z],normal=surfaceNormal(key,p);return {p,normal,tangent:Math.abs(normal[0])<1e-7};});
 return {hits,location,value};
}
/** Clipped segment of p+t*d inside the display cube. */
export function lineInBox(p,d,extent=1.8) {
 let lo=-Infinity,hi=Infinity;for(let i=0;i<3;i++){
  if(Math.abs(d[i])<1e-12){if(Math.abs(p[i])>extent)return [];}
  else{const a=(-extent-p[i])/d[i],b=(extent-p[i])/d[i];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));}
 }return lo<=hi?[add(p,mul(d,lo)),add(p,mul(d,hi))]:[];
}
