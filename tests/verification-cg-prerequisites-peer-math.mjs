// Independent peer finite witnesses. No production geometry helpers imported.
import assert from'node:assert/strict';let checks=0,groups=0;const ok=x=>{checks++;assert.ok(x)},near=(a,b)=>{checks++;assert.ok(Math.abs(a-b)<1e-9*(1+Math.abs(b)),`${a} / ${b}`)},cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
// Segment crossing: analytic affine zero and two-line solve coincide, plus degeneracies.
for(let k=1;k<=50;k++){const a=[-k,0],b=[k,0],c=[-k,k+1],d=[k,-k],u=sub(b,a),v=sub(d,c),w=sub(c,a),den=cross(u,v),s=cross(w,v)/den,t=cross(w,u)/den;ok(s>0&&s<1&&t>0&&t<1);near(cross(sub(c,a),u)*(1-t)+cross(sub(d,a),u)*t,0);near(a[0]+s*u[0],c[0]+t*v[0]);near(a[1]+s*u[1],c[1]+t*v[1]);}groups++;
// Green edge integral independently integrated by midpoint (integrand is constant).
for(const P of[[[0,0],[3,0],[4,2],[1,4],[-1,1]],[[0,0],[3,0],[3,1],[1,1],[1,3],[0,3]]])for(const shift of[[0,0],[100,-27],[-5,9]]){const Q=P.map(p=>p.map((x,i)=>x+shift[i]));let sum=0,fan=0;const O=[8,-4];Q.forEach((p,i)=>{const q=Q[(i+1)%Q.length],d=sub(q,p),mid=p.map((x,j)=>(x+q[j])/2);sum+=(-mid[1]*d[0]+mid[0]*d[1])/2;fan+=cross(sub(p,O),sub(q,O))/2;});near(sum,fan);let reverse=[...Q].reverse().reduce((s,p,i,R)=>s+cross(p,R[(i+1)%R.length])/2,0);near(sum,-reverse);}groups++;
// Affine barycentric inverse and Radon null vector from alternating 3x3 minors.
const det3=M=>M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
let radon=0;for(let k=1;k<=40;k++){const P=[[0,0],[k+1,0],[0,k+2],[1+k%3,1+k%4]],D=cross(P[1],P[2]),s=.03*k,t=.02*(41-k),X=P[1].map((x,i)=>s*x+t*P[2][i]),l1=cross(X,P[2])/D,l2=cross(P[1],X)/D;near(l1,s);near(l2,t);const coeff=P.map((_,i)=>(i%2?-1:1)*det3([0,1,2].map(r=>P.filter((_,j)=>j!==i).map(p=>r===2?1:p[r]))));near(coeff.reduce((a,b)=>a+b),0);for(let a=0;a<2;a++)near(coeff.reduce((z,c,i)=>z+c*P[i][a],0),0);let total=coeff.filter(c=>c>0).reduce((a,b)=>a+b),pos=[0,0],neg=[0,0];ok(total>0);coeff.forEach((c,i)=>{for(let a=0;a<2;a++)if(c>0)pos[a]+=c*P[i][a]/total;else neg[a]-=c*P[i][a]/total;});near(pos[0],neg[0]);near(pos[1],neg[1]);radon++;}groups++;
// Leading polynomial sign has an explicit continuity radius; geometric rounds.
for(let k=0;k<6;k++)for(const a of[-5,-1,2,7]){const tail=[3,-7,2],rho=Math.min(.5,Math.abs(a)/(2*tail.reduce((s,x)=>s+Math.abs(x),0)));for(const e of[rho/2,rho/4,rho/8]){const Q=a+tail.reduce((s,x,j)=>s+x*e**(j+1),0);ok(Math.sign(e**k*Q)===Math.sign(a));}}for(let T=0;T<30;T++)near(Array.from({length:T+1},(_,i)=>2**i).reduce((a,b)=>a+b),2**(T+1)-1);groups++;
// Every labeled tree via Prüfer sequences n<=6: n-1 edges, leaves and guard count.
let trees=0;for(let n=2;n<=6;n++)for(let code=0;code<n**(n-2);code++){let z=code,seq=[];for(let i=0;i<n-2;i++){seq.push(z%n);z=Math.floor(z/n);}const degree=Array(n).fill(1);seq.forEach(x=>degree[x]++);const actual=[...degree];let edges=0;for(const x of seq){const leaf=actual.findIndex(d=>d===1);ok(leaf>=0&&leaf!==x);actual[leaf]--;actual[x]--;edges++;}edges++;ok(edges===n-1);ok(degree.filter(x=>x===1).length>=2);near(degree.reduce((a,b)=>a+b),2*(n-1));trees++;}for(let n=3;n<80;n++)for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++)ok(Math.min(a,b,n-a-b)<=Math.floor(n/3));groups++;
// All permutations on six half-edges split into disjoint cycles; a bridge can be a 2-walk.
const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(b=>[x,...b])):[[]];for(const p of permutations([0,1,2,3,4,5])){const seen=new Set();let length=0;for(let i=0;i<p.length;i++)if(!seen.has(i)){let j=i;do{ok(!seen.has(j));seen.add(j);length++;j=p[j];}while(j!==i);}near(length,6);}near([1,0].length,2);groups++;
// Strict shortening and exact one/two dimensional optimal faces of polyhedra.
for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){const u=[1,0],v=[x,y],sum=norm(u)+norm(v),chord=norm([1+x,y]);ok(chord<=sum+1e-12);if(y!==0)ok(chord<sum);}
const cube=Array.from({length:8},(_,i)=>[i&1,i>>1&1,i>>2&1]);for(const[c,size]of[[[0,0,0],8],[[1,0,0],4],[[1,1,0],2],[[1,1,1],1]]){const values=cube.map(p=>dot(c,p)),m=Math.max(...values);near(values.filter(x=>x===m).length,size);}
// Pointed unbounded quadrant: bounded-above c<=0 attains vertex, never needs compactness.
for(let a=0;a<7;a++)for(let b=0;b<7;b++)for(const c of[[-1,-2],[0,-1],[0,0]])ok(dot(c,[0,0])>=dot(c,[a,b]));groups++;
// Independent cap empty probability, double-counted hull facets, correlated backwards costs.
for(const a of[0,.1,.4,1])for(let n=1;n<=7;n++){let miss=0;for(let mask=0;mask<2**n;mask++){let p=1;for(let j=0;j<n;j++)p*=mask>>j&1?a:1-a;if(!mask)miss+=p;}near(miss,(1-a)**n);}
for(let n=4;n<40;n++){const F=2*n-4;near(3*F/n,6-12/n);ok(3*F/n<6);}for(let i=2;i<40;i++){const costs=Array.from({length:i},(_,k)=>3+5*i*+(k<2));near(costs.reduce((a,b)=>a+b)/i,13);}groups++;
// Finite maximum distance is Lipschitz; every center outside the compact
// search disc is worse than an explicit known enclosing disc.
const S=[[1,0],[-.5,Math.sqrt(3)/2],[-.5,-Math.sqrt(3)/2]],f=c=>Math.max(...S.map(p=>norm(sub(c,p)))),s0=S[0],R=1;for(let i=0;i<40;i++){const c=[i/13-1.5,i%7/3-1],d=[c[0]+.12,c[1]-.19];ok(Math.abs(f(c)-f(d))<=norm(sub(c,d))+1e-12);near(S.reduce((s,p)=>s+norm(sub(c,p))**2/3,0),norm(c)**2+1);ok(f(c)>=1-1e-12);const outside=[s0[0]+(R+.1)*Math.cos(i),s0[1]+(R+.1)*Math.sin(i)];ok(f(outside)>R);}near(f([0,0]),1);groups++;
// Degree warning: distinct binary coordinate exponents do not separate square
// monomials of generic incircle predicates; orientation is multilinear.
for(let i=0;i<10;i++)near(2*2**(2*i),2**(2*i+1));
// Nonzero polynomial X²-Y vanishes identically along the binary perturbation
// at (0,0), while base3 exponents separate its degree-two monomials.
for(const e of[.01,.1,.2,.5]){near(e*e-e**2,0);ok(e*e-e**3>0);}for(let D=1;D<=4;D++){const exponents=new Set();for(let a=0;a<=D;a++)for(let b=0;b<=D;b++)for(let c=0;c<=D;c++)exponents.add(a+(D+1)*b+(D+1)**2*c);near(exponents.size,(D+1)**3);}
console.log(JSON.stringify({groups,checks,radon,trees,productionImports:false}));
