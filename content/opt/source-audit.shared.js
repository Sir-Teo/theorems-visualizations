// Scoped exact calculations for the optimization source-review displays.
import {polyhedron,boxPoly} from './ch04.shared.js';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0],eps=1e-9;
export function lp2(c,hs,R=12){
 const ok=p=>hs.every(h=>h.nx*p[0]+h.ny*p[1]<=h.c+eps*(1+Math.abs(h.c))),P=[[0,0]];
 for(const h of hs){const q=h.nx*h.nx+h.ny*h.ny;if(q>1e-20)P.push([h.nx*h.c/q,h.ny*h.c/q]);}
 for(let i=0;i<hs.length;i++)for(let j=0;j<i;j++){const a=hs[i],b=hs[j],d=a.nx*b.ny-a.ny*b.nx;if(Math.abs(d)>1e-12)P.push([(a.c*b.ny-a.ny*b.c)/d,(a.nx*b.c-a.c*b.nx)/d]);}
 const candidates=P.slice().reverse().filter(ok),poly=polyhedron(hs,boxPoly(-R,-R,R,R));if(!candidates.length)return{status:'infeasible',poly:[],tied:[],active:[]};
 const D=[[-c[0],-c[1]]];for(const h of hs)D.push([h.ny,-h.nx],[-h.ny,h.nx]);
 const ray=D.filter(d=>Math.hypot(...d)>0).map(d=>d.map(x=>x/Math.hypot(...d))).find(d=>hs.every(h=>h.nx*d[0]+h.ny*d[1]<=1e-10*Math.hypot(h.nx,h.ny)*Math.hypot(...d))&&dot(c,d)<-1e-10*Math.hypot(...c)*Math.hypot(...d));
 if(ray)return{status:'unbounded',poly,x:candidates[0],ray:ray.map(t=>t/Math.hypot(...ray)),f:-Infinity,tied:[],active:[]};
 const f=Math.min(...candidates.map(p=>dot(c,p))),tied=candidates.filter(p=>dot(c,p)<=f+1e-9*(1+Math.abs(f))),x=tied[0],active=hs.flatMap((h,i)=>Math.abs(h.nx*x[0]+h.ny*x[1]-h.c)<1e-7*(1+Math.abs(h.c))?[i]:[]);
 let multipliers=[];if(Math.hypot(...c)>0){for(const i of active){const a=[hs[i].nx,hs[i].ny],q=dot(a,a),l=-dot(c,a)/q;if(l>=-1e-8&&Math.hypot(c[0]+l*a[0],c[1]+l*a[1])<1e-7){multipliers=[[i,Math.max(0,l)]];break;}}
 if(!multipliers.length)for(let k=0;k<active.length;k++)for(let l=0;l<k;l++){const i=active[k],j=active[l],a=[hs[i].nx,hs[i].ny],b=[hs[j].nx,hs[j].ny],d=cross(a,b);if(Math.abs(d)<1e-12)continue;const u=-cross(c,b)/d,v=-cross(a,c)/d;if(u>=-1e-8&&v>=-1e-8)multipliers=[[i,Math.max(0,u)],[j,Math.max(0,v)]];}}
 return{status:'optimal',poly,x,f,tied,active,multipliers};
}
/** Exact candidates for max c·x under a_i·x+rho||x||≤1; rows must surround the origin. */
export function robust2d(A,rho,c){const ph=Math.atan2(c[1],c[0]),angles=[ph,ph+Math.PI];for(let i=0;i<A.length;i++){for(let j=0;j<i;j++){const d=[A[i][0]-A[j][0],A[i][1]-A[j][1]],t=Math.atan2(d[0],-d[1]);angles.push(t,t+Math.PI);}if(rho>0){const q=cross(c,A[i])/(rho*Math.hypot(...c));if(Math.abs(q)<=1){const t=Math.asin(q);angles.push(ph-t,ph-Math.PI+t);}}}let best=-Infinity,bx=null;for(const t of angles){const u=[Math.cos(t),Math.sin(t)],den=Math.max(...A.map(a=>dot(a,u)))+rho;if(den<=0)throw new Error('Robust display requires bounded radial set.');const x=u.map(v=>v/den),f=dot(c,x);if(f>best){best=f;bx=x;}}return{best,bx,residual:Math.max(...A.map(a=>dot(a,bx)+rho*Math.hypot(...bx)-1))};}
export function gpOpt(A,g){const ratio=Math.min(g,Math.max(1/g,1+Math.sqrt(3))),w=Math.sqrt(A/(ratio+.5)),h=ratio*w;return{w,h,u:Math.log(w),v:Math.log(h),f:1/w+2/h,ratio};}
export const gpBoundary=(A,r)=>{const w=Math.sqrt(A/(r+.5));return[w,r*w];};
/** Linear minimization over a bounded intersection of closed discs and half-planes. */
export function lensMin(c,discs,hs=[]){const P=[],cn=Math.hypot(...c),ok=p=>discs.every(d=>Math.hypot(p[0]-d.x,p[1]-d.y)<=d.r+1e-8)&&hs.every(h=>h.nx*p[0]+h.ny*p[1]<=h.c+1e-8);
 for(const d of discs){P.push([d.x,d.y]);if(cn)P.push([d.x-d.r*c[0]/cn,d.y-d.r*c[1]/cn]);for(const h of hs){const n=Math.hypot(h.nx,h.ny),signed=(h.c-h.nx*d.x-h.ny*d.y)/n;if(Math.abs(signed)<=d.r+1e-10){const t=Math.sqrt(Math.max(0,d.r*d.r-signed*signed)),base=[d.x+signed*h.nx/n,d.y+signed*h.ny/n];P.push([base[0]-t*h.ny/n,base[1]+t*h.nx/n],[base[0]+t*h.ny/n,base[1]-t*h.nx/n]);}}}
 for(let i=0;i<discs.length;i++)for(let j=0;j<i;j++){const a=discs[i],b=discs[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-12||d>a.r+b.r+1e-10||d<Math.abs(a.r-b.r)-1e-10)continue;const q=(a.r*a.r-b.r*b.r+d*d)/(2*d),t=Math.sqrt(Math.max(0,a.r*a.r-q*q)),base=[a.x+q*dx/d,a.y+q*dy/d];P.push([base[0]-t*dy/d,base[1]+t*dx/d],[base[0]+t*dy/d,base[1]-t*dx/d]);}
 for(let i=0;i<hs.length;i++)for(let j=0;j<i;j++){const a=hs[i],b=hs[j],d=a.nx*b.ny-a.ny*b.nx;if(Math.abs(d)>1e-12)P.push([(a.c*b.ny-a.ny*b.c)/d,(a.nx*b.c-a.c*b.nx)/d]);}
 let best=null;for(const p of P.filter(ok)){const val=dot(c,p);if(!best||val<best.val)best={x:p[0],y:p[1],val};}return best;
}
export function paretoPoint(mode,l){if(mode==='ring'){const tied=Math.abs(l-.5)<1e-12;return{u:l<=.5?[1,0]:[0,1],ties:tied?[[1,0],[0,1]]:[],value:Math.min(l,1-l)};}const q=Math.hypot(l,1-l),u=[1.9-1.3*l/q,1.6-1.3*(1-l)/q];return{u,ties:[],value:l*u[0]+(1-l)*u[1]};}

export const DCP_AT = {
          square: { n: 1, curv: 'convex', mono: ['sgn'], f: (a) => a * a, sign: () => 'nn', tex: (a) => `(${a})^2` },
          abs: { n: 1, curv: 'convex', mono: ['sgn'], f: (a) => Math.abs(a), sign: () => 'nn', tex: (a) => `|${a}|` },
          exp: { n: 1, curv: 'convex', mono: ['inc'], f: Math.exp, sign: () => 'nn', tex: (a) => `e^{${a}}` },
          inv: { n: 1, curv: 'convex', mono: ['dec'], f: (a) => (a > 0 ? 1 / a : NaN), sign: () => 'nn', tex: (a) => `\\frac{1}{${a}}`, needsPos: true },
          log: { n: 1, curv: 'concave', mono: ['inc'], f: (a) => (a > 0 ? Math.log(a) : NaN), sign: () => 'unk', tex: (a) => `\\log(${a})` },
          sqrt: { n: 1, curv: 'concave', mono: ['inc'], f: (a) => (a >= 0 ? Math.sqrt(a) : NaN), sign: () => 'nn', tex: (a) => `\\sqrt{${a}}` },
          neg: { n: 1, curv: 'affine', mono: ['dec'], f: (a) => -a, sign: (s) => (s[0] === 'nn' ? 'np' : s[0] === 'np' ? 'nn' : 'unk'), tex: (a) => `-(${a})` },
          add: { n: 2, curv: 'affine', mono: ['inc', 'inc'], f: (a, b) => a + b, sign: (s) => (s[0] === 'nn' && s[1] === 'nn' ? 'nn' : s[0] === 'np' && s[1] === 'np' ? 'np' : 'unk'), tex: (a, b) => `(${a})+(${b})` },
          max: { n: 2, curv: 'convex', mono: ['inc', 'inc'], f: Math.max, sign: (s) => (s.includes('nn') ? 'nn' : s[0] === 'np' && s[1] === 'np' ? 'np' : 'unk'), tex: (a, b) => `\\max(${a},${b})` },
          min: { n: 2, curv: 'concave', mono: ['inc', 'inc'], f: Math.min, sign: (s) => (s[0] === 'nn' && s[1] === 'nn' ? 'nn' : 'unk'), tex: (a, b) => `\\min(${a},${b})` },
          norm: { n: 2, curv: 'convex', mono: ['sgn', 'sgn'], f: Math.hypot, sign: () => 'nn', tex: (a, b) => `\\|(${a},${b})\\|` },
        };
export function analyzeDcp(e){
          if (!e.args) return { e, convex: true, concave: true, sign: 'nn', kids: [], str: e.op, val: (x, y) => (e.op === 'x' ? x : y), name: e.op };
          const at = DCP_AT[e.op], kids = e.args.map(analyzeDcp);
          const cond = (isConvexOuter) => kids.every((k, i) => {
            const aff = k.convex && k.concave; if (aff) return true;
            let m = at.mono[i]; if (m === 'sgn') m = k.sign === 'nn' ? 'inc' : k.sign === 'np' ? 'dec' : null;
            if (m === 'inc') return isConvexOuter ? k.convex : k.concave;
            if (m === 'dec') return isConvexOuter ? k.concave : k.convex;
            return false;
          });
          const convex = (at.curv === 'convex' || at.curv === 'affine') && cond(true);
          const concave = (at.curv === 'concave' || at.curv === 'affine') && cond(false);
          const posOK = true; // Positivity is an implicit atom-domain constraint, not a required sign proof.
          return { e, convex: convex && posOK, concave: concave && posOK, sign: at.sign(kids.map((k) => k.sign)), kids, name: e.op, str: at.tex(...kids.map((k) => k.str)), val: (x, y) => at.f(...kids.map((k) => k.val(x, y))) };
        }
/** Finite chord diagnostics, never a proof of global curvature. */
export function dcpChords(f,n=2500){let seed=9,tested=0,skipped=0,convexViolations=0,concaveViolations=0;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);for(let k=0;k<n;k++){const a=[.2+3.8*rand(),.2+3.8*rand()],b=[.2+3.8*rand(),.2+3.8*rand()],l=rand(),u=f(...a),v=f(...b),w=f(l*a[0]+(1-l)*b[0],l*a[1]+(1-l)*b[1]);if(![u,v,w].every(Number.isFinite)){skipped++;continue;}tested++;const rhs=l*u+(1-l)*v,tol=1e-8*(1+Math.abs(rhs));if(w>rhs+tol)convexViolations++;if(w<rhs-tol)concaveViolations++;}return{tested,skipped,convexViolations,concaveViolations};}

export const DIET_FOODS = [
          { n: 'bread', a: [266, 8.9, 151], p: 0.3 },
          { n: 'milk', a: [61, 3.2, 113], p: 0.12 },
          { n: 'beans', a: [127, 8.7, 35], p: 0.2 },
          { n: 'orange', a: [47, 0.9, 40], p: 0.35 },
          { n: 'oats', a: [389, 16.9, 54], p: 0.25 },
        ];
export const DIET_NUT = [{ n: 'energy', r: 2000, u: 'kcal' }, { n: 'protein', r: 56, u: 'g' }, { n: 'calcium', r: 1000, u: 'mg' }];

export const dietRows=(ia,ib)=>DIET_NUT.map((n,i)=>({nx:-DIET_FOODS[ia].a[i],ny:-DIET_FOODS[ib].a[i],c:-n.r})).concat([{nx:-1,ny:0,c:0},{nx:0,ny:-1,c:0},{nx:1,ny:0,c:8},{nx:0,ny:1,c:8}]);

export const ROBUST_ROWS=[[1,.1],[.4,1],[-.7,.8],[-.9,-.5],[.3,-1],[.9,-.5]];
export const SDP_GEOMETRY={disc:{label:'disc',discs:[{x:0,y:0,r:1.5}],hs:[]},cut:{label:'disc and two cuts',discs:[{x:0,y:0,r:1.6}],hs:[{nx:1,ny:0,c:.9},{nx:-.6,ny:-1,c:1.1}]},three:{label:'three discs',discs:[{x:.5,y:0,r:1.9},{x:-.3,y:.65,r:1.9},{x:-.3,y:-.65,r:1.9}],hs:[]}};
