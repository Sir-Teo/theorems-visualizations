// Declared finite orbital/domain models for QCHEM6. No measured molecular data.
export const fmt=x=>x===null?'not determined':!Number.isFinite(x)?String(x):x===0?'0':Number(x.toPrecision(6)).toString();
export const samples=(fn,a,b,n=120)=>Array.from({length:n+1},(_,j)=>fn(a+(b-a)*j/n));
export function sum(xs){let s=0,c=0;for(const x of xs){const t=s+x;c+=Math.abs(s)>=Math.abs(x)?(s-t)+x:(x-t)+s;s=t;}return s+c;}
const finite=(x,label)=>{if(!Number.isFinite(x))throw new RangeError(label+' must be finite');return x;};
const integer=(x,a,b,label)=>{if(!Number.isInteger(x)||x<a||x>b)throw new RangeError(label+' must be an integer in '+a+'–'+b);return x;};
const positive=(x,label)=>{finite(x,label);if(!(x>0))throw new RangeError(label+' must be positive');return x;};
const nonnegative=(x,label)=>{finite(x,label);if(x<0)throw new RangeError(label+' must be nonnegative');return x;};
export const dot=(a,b)=>sum(a.map((x,j)=>x*b[j]));
export const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
export const norm=a=>Math.hypot(...a);
const unit=a=>{const d=norm(a);if(!(d>0))throw new RangeError('A direction must be nonzero');return a.map(x=>x/d);};
export function sinPiRatio(m,d){integer(m,-100000,100000,'integer phase numerator');integer(d,1,100000,'phase denominator');const r=((m%(2*d))+2*d)%(2*d);if(r===0||r===d)return 0;if(2*r===d)return 1;if(2*r===3*d)return-1;return Math.sin(Math.PI*r/d);}
export function cosPiRatio(m,d){integer(m,-100000,100000,'integer phase numerator');integer(d,1,100000,'phase denominator');const r=((m%(2*d))+2*d)%(2*d);if(r===0)return 1;if(r===d)return-1;if(2*r===d||2*r===3*d)return 0;return Math.cos(Math.PI*r/d);}

/** Scaled cyclic Jacobi; eigenvectors are columns. Diagnostics are numerical, not a certificate. */
export function eigenSymmetric(input){
 const n=input.length;integer(n,1,60,'matrix size');if(input.some(r=>!Array.isArray(r)||r.length!==n))throw new RangeError('Use a square real matrix');
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){finite(input[i][j],'matrix entry');if(input[i][j]!==input[j][i])throw new RangeError('Matrix must be symmetric');}
 const scale=Math.max(...input.flat().map(Math.abs)),a=input.map(r=>r.map(x=>scale===0?0:x/scale)),vectors=identity(n),frob=Math.hypot(...a.flat()),target=8*Number.EPSILON*Math.max(1,frob);let sweeps=0,off=Infinity;
 for(;sweeps<80;sweeps++){
  off=Math.hypot(...a.flatMap((r,i)=>r.slice(i+1)));if(off<=target)break;
  for(let p=0;p<n-1;p++)for(let q=p+1;q<n;q++){
   const b=a[p][q];if(b===0)continue;const d=(a[q][q]-a[p][p])/2,t=d===0?Math.sign(b):b/(d+Math.sign(d)*Math.hypot(d,b)),c=1/Math.hypot(1,t),s=t*c;
   a[p][p]-=t*b;a[q][q]+=t*b;a[p][q]=a[q][p]=0;
   for(let j=0;j<n;j++){if(j!==p&&j!==q){const ap=a[j][p],aq=a[j][q];a[j][p]=a[p][j]=c*ap-s*aq;a[j][q]=a[q][j]=s*ap+c*aq;}const vp=vectors[j][p],vq=vectors[j][q];vectors[j][p]=c*vp-s*vq;vectors[j][q]=s*vp+c*vq;}
  }
 }
 off=Math.hypot(...a.flatMap((r,i)=>r.slice(i+1)));
 const order=Array.from({length:n},(_,i)=>i).sort((i,j)=>a[i][i]-a[j][j]),values=order.map(i=>a[i][i]*scale),V=vectors.map(r=>order.map(i=>r[i]));
 for(let j=0;j<n;j++){let k=0;for(let i=1;i<n;i++)if(Math.abs(V[i][j])>Math.abs(V[k][j]))k=i;if(V[k][j]<0)for(let i=0;i<n;i++)V[i][j]*=-1;}
 const residual=Math.max(...values.map((e,k)=>norm(input.map((row,i)=>dot(row,V.map(r=>r[k]))-e*V[i][k])))),orthogonality=Math.max(...V.flatMap((_,i)=>V.map((__,j)=>Math.abs(sum(V.map(r=>r[i]*r[j]))-+(i===j)))));
 return{values,vectors:V,scale,sweeps,converged:off<=target,residual,orthogonality,tolerance:Math.max(32*Number.EPSILON*scale,4*residual)};
}

/** Equal occupations within an explicitly numerically unresolved cluster. */
export function fillLevels(values,electrons,tolerance=0){
 integer(electrons,0,2*values.length,'electron count');nonnegative(tolerance,'cluster tolerance');if(values.some((e,i)=>!Number.isFinite(e)||(i&&e<values[i-1])))throw new RangeError('Use ascending finite energies');
 const groups=[];for(let i=0;i<values.length;){let j=i+1;while(j<values.length&&values[j]-values[j-1]<=tolerance)j++;groups.push({start:i,end:j,size:j-i,low:values[i],high:values[j-1],width:values[j-1]-values[i]});i=j;}
 const occupations=values.map(()=>0);let left=electrons,frontier=null;for(const g of groups){const used=Math.min(left,2*g.size);g.occupation=used/g.size;for(let j=g.start;j<g.end;j++)occupations[j]=g.occupation;if(used>0&&used<2*g.size)frontier=g;left-=used;}
 let gap=null,status=electrons===0?'empty basis':electrons===2*values.length?'full basis':frontier?frontier.width===0?'partially occupied level':'unresolved frontier cluster':'closed shell';
 if(status==='closed shell')gap=values[electrons/2]-values[electrons/2-1];else if(status==='partially occupied level')gap=0;
 return{electrons,occupations,groups,frontier,gap,status,energy:sum(values.map((e,j)=>e*occupations[j]))};
}
export function density(vectors,occupations){const n=vectors.length;if(occupations.length!==n)throw new RangeError('One occupancy per spatial orbital');return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>sum(occupations.map((o,k)=>o*vectors[i][k]*vectors[j][k]))));}
export function bipartition(n,edges){const colors=Array(n).fill(null);let conflict=null;for(let root=0;root<n;root++){if(colors[root]!==null)continue;colors[root]=1;const queue=[root];for(let p=0;p<queue.length;p++){const i=queue[p];for(const[a,b,w=1]of edges){if(w===0)continue;const j=a===i?b:b===i?a:null;if(j===null)continue;if(colors[j]===null){colors[j]=-colors[i];queue.push(j);}else if(colors[j]===colors[i])conflict=[i,j];}}}return{colors,bipartite:conflict===null,conflict};}
export function graph(name='chain',n=6){
 integer(n,2,60,'site count');let edges,points;
 if(name==='chain'){edges=Array.from({length:n-1},(_,i)=>[i,i+1]);points=Array.from({length:n},(_,i)=>[i,.35*(i%2)]);}
 else if(name==='ring'){integer(n,3,60,'cyclic site count');edges=Array.from({length:n},(_,i)=>[i,(i+1)%n]);points=Array.from({length:n},(_,j)=>[Math.cos(2*Math.PI*j/n),Math.sin(2*Math.PI*j/n)]);}
 else if(name==='branched'){if(n!==6)throw new RangeError('The declared branched graph has six sites');edges=[[0,1],[1,2],[2,3],[3,4],[2,5]];points=[[0,0],[1,0],[2,0],[3,0],[4,0],[2,1]];}
 else if(name==='odd cycle and pendant'){if(n!==6)throw new RangeError('The declared odd-cycle graph has six sites');edges=[[0,1],[1,2],[2,3],[3,4],[4,0],[0,5]];points=Array.from({length:5},(_,j)=>[Math.cos(2*Math.PI*j/5),Math.sin(2*Math.PI*j/5)]);points.push([1.8,0]);}
 else throw new RangeError('Unknown declared graph');return{name,n,edges,points};
}
export function huckel({n=6,edges=graph('ring',n).edges,electrons=n,t=1,onsite=Array(n).fill(0)}={}){
 integer(n,2,60,'site count');nonnegative(t,'hopping magnitude');if(onsite.length!==n)throw new RangeError('One on-site offset per site');onsite.forEach(x=>finite(x,'on-site offset'));
 const matrix=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?t*onsite[i]:0)),seen=new Set();for(const[i,j,w=1]of edges){integer(i,0,n-1,'edge endpoint');integer(j,0,n-1,'edge endpoint');nonnegative(w,'edge weight');const key=[Math.min(i,j),Math.max(i,j)].join(':');if(i===j||seen.has(key))throw new RangeError('No self or repeated edges');seen.add(key);matrix[i][j]=matrix[j][i]=-t*w;}
 const eig=eigenSymmetric(matrix),fill=fillLevels(eig.values,electrons,eig.tolerance),P=density(eig.vectors,fill.occupations),populations=P.map((r,i)=>r[i]),charges=populations.map(p=>1-p),partition=bipartition(n,edges),anticommutator=matrix.map((r,i)=>r.map((x,j)=>x*(1+partition.colors[i]*partition.colors[j])));
 return{n,edges,electrons,t,onsite,matrix,eig,...fill,P,populations,charges,partition,chargeSum:sum(charges),populationSum:sum(populations),pairingHypothesis:partition.bipartite&&onsite.every(x=>x===0),pairingResidual:Math.max(...eig.values.map((e,j)=>Math.abs(e+eig.values[n-1-j]))),anticommutatorResidual:Math.max(...anticommutator.flat().map(Math.abs))};
}
export function chain(n=4,electrons=n,t=1){integer(n,2,60,'chain length');nonnegative(t,'hopping magnitude');const values=Array.from({length:n},(_,k)=>cosPiRatio(k+1,n+1)===0?0:-2*t*cosPiRatio(k+1,n+1)),vectors=Array.from({length:n},(_,j)=>Array.from({length:n},(_,k)=>Math.sqrt(2/(n+1))*sinPiRatio((j+1)*(k+1),n+1))),fill=fillLevels(values,electrons,0),P=density(vectors,fill.occupations);return{n,t,values,vectors,...fill,P,populations:P.map((r,i)=>r[i]),charges:P.map((r,i)=>1-r[i])};}
export function cycle(n=6,electrons=n,t=1){
 integer(n,3,60,'ring length');nonnegative(t,'hopping magnitude');const values=[-2*t],columns=[Array(n).fill(1/Math.sqrt(n))];for(let k=1;k<=(n-1)/2;k++){const e=-2*t*cosPiRatio(2*k,n);values.push(e,e);columns.push(Array.from({length:n},(_,j)=>Math.sqrt(2/n)*cosPiRatio(2*j*k,n)),Array.from({length:n},(_,j)=>Math.sqrt(2/n)*sinPiRatio(2*j*k,n)));}if(n%2===0){values.push(2*t);columns.push(Array.from({length:n},(_,j)=>(j%2?-1:1)/Math.sqrt(n)));}const vectors=Array.from({length:n},(_,j)=>columns.map(c=>c[j])),fill=fillLevels(values,electrons,0),P=density(vectors,fill.occupations);return{n,t,values,vectors,...fill,P,populations:P.map((r,i)=>r[i]),charges:P.map((r,i)=>1-r[i])};
}
export function benzene(delta=0,t=1){
 if(!(delta>=0&&delta<=1))throw new RangeError('Alternation must be in [0,1]');nonnegative(t,'hopping magnitude');const root=Math.hypot(1,Math.sqrt(3)*delta),energy=-4*t*(1+root),dimerReference=-6*t*(1+delta),delocalization=12*t*(1-delta)*(1-delta)/(4*root+2+6*delta),lowering=12*t*delta*delta/(root+1),logLowering=delta===0||t===0?-Infinity:Math.log(12)+Math.log(t)+2*Math.log(delta)-Math.log(root+1);
 return{delta,t,energy,dimerReference,delocalization,alternationLowering:lowering,logAlternationLowering:logLowering,loweringBelowRange:delta>0&&t>0&&lowering===0,gap:2*t*root,levels:[-2*t,-t*root,-t*root,t*root,t*root,2*t],strong:t*(1+delta),weak:t*(1-delta)};
}
export function hybrid(s=.25){
 if(!(s>=0&&s<=.5))throw new RangeError('An equal-s orthogonal pair requires 0–1/2 s fraction');const cosine=-s/(1-s),angle=Math.acos(cosine),directions=[[1,0,0],[cosine,Math.sqrt(Math.max(0,1-cosine*cosine)),0]],coefficients=directions.map(n=>[Math.sqrt(s),...n.map(x=>Math.sqrt(1-s)*x)]),overlap=dot(coefficients[0],coefficients[1]);
 return{s,cosine,angle,degrees:angle*180/Math.PI,directions,coefficients,overlap,peak:Math.sqrt(s)+Math.sqrt(3*(1-s)),amplitude:(row,n)=>coefficients[row][0]+Math.sqrt(3)*dot(coefficients[row].slice(1),n),usualCompleteFamily:s>0&&[2,3,4].some(n=>s===1/n)?Math.round(1/s):null};
}
export function pauling(basis='s and p',rotation=0){
 finite(rotation,'quartet rotation');let rows,directions,functions;
 if(basis==='s and p'){rows=[[.5,.5,.5,.5],[.5,.5,-.5,-.5],[.5,-.5,.5,-.5],[.5,-.5,-.5,.5]];directions=rows.map(r=>unit(r.slice(1)));functions=n=>[1,...n.map(x=>Math.sqrt(3)*x)];}
 else if(basis==='square planar'){rows=[[.5,Math.SQRT1_2,0,.5],[.5,-Math.SQRT1_2,0,.5],[.5,0,Math.SQRT1_2,-.5],[.5,0,-Math.SQRT1_2,-.5]];directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]];functions=([x,y])=>[1,Math.sqrt(3)*x,Math.sqrt(3)*y,Math.sqrt(15)*(x*x-y*y)/2];}
 else throw new RangeError('Unknown angular basis');
 const [a,b]=rows.map(r=>r.slice()),c=Math.cos(rotation),s=Math.sin(rotation);rows[0]=a.map((x,j)=>c*x+s*b[j]);rows[1]=a.map((x,j)=>-s*x+c*b[j]);const gram=rows.map(r=>rows.map(q=>dot(r,q))),values=directions.map((n,j)=>dot(rows[j],functions(n))),amplitude=(j,n)=>dot(rows[j],functions(n)),totalDensity=n=>sum(rows.map((_,j)=>amplitude(j,n)**2));
 return{basis,rotation,rows,directions,gram,values,amplitude,totalDensity,spBound:2,pureP:Math.sqrt(3),squarePlanarCanonical:.5+Math.sqrt(1.5)+Math.sqrt(15)/4};
}

export function domainEnergy(points,sizes){
 const n=points.length;if(sizes.length!==n)throw new RangeError('One size per domain');sizes.forEach(s=>positive(s,'domain size'));let energy=0;const gradient=points.map(()=>[0,0,0]);
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const v=points[i].map((x,k)=>x-points[j][k]),d=norm(v);if(!(d>1e-10))return{energy:Infinity,gradient,residual:Infinity};const w=(sizes[i]+sizes[j])/2;energy+=w/d;for(let k=0;k<3;k++){const f=-w*v[k]/d**3;gradient[i][k]+=f;gradient[j][k]-=f;}}
 const tangent=gradient.map((g,i)=>{const radial=dot(g,points[i]);return g.map((x,k)=>x-radial*points[i][k]);});return{energy,gradient:tangent,residual:Math.hypot(...tangent.flat())};
}
export function domainCanonical(n){
 integer(n,2,6,'domain count');if(n===2)return[[1,0,0],[-1,0,0]];if(n===3)return Array.from({length:3},(_,j)=>[cosPiRatio(2*j,3),sinPiRatio(2*j,3),0]);if(n===4)return[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(unit);if(n===5)return[[0,0,1],[0,0,-1],...domainCanonical(3)];return[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
}
function domainRelax(start,sizes){
 let points=start.map(unit),state=domainEnergy(points,sizes),step=.3;const trace=[{iteration:0,energy:state.energy,points:points.map(p=>p.slice()),residual:state.residual}];let stop='iteration limit',iterations=0;
 for(let it=1;it<=1600;it++){if(state.residual<2e-8){stop='force tolerance';break;}let h=step,accepted=false,next,q;
  for(let b=0;b<35;b++){q=points.map((p,i)=>unit(p.map((x,k)=>x-h*state.gradient[i][k])));next=domainEnergy(q,sizes);if(next.energy<=state.energy-1e-4*h*state.residual**2){accepted=true;break;}h/=2;}
  if(!accepted){stop='line search resolution';break;}points=q;state=next;iterations=it;trace.push({iteration:it,energy:state.energy,points:points.map(p=>p.slice()),residual:state.residual});step=Math.min(.8,h*1.3);
 }
 return{...state,points,iterations,trace,stop,converged:state.residual<2e-8};
}
export function vsepr(n=4,lonePairs=2,loneSize=1.15){
 integer(n,2,6,'domain count');integer(lonePairs,0,Math.min(2,n),'lone-pair count');positive(loneSize,'lone-pair size');const sizes=Array.from({length:n},(_,i)=>i<lonePairs?loneSize:1),base=domainCanonical(n),starts=[];
 const choose=(start,left,out)=>{if(left===0){const rest=Array.from({length:n},(_,i)=>i).filter(i=>!out.includes(i));starts.push([...out,...rest].map(i=>base[i]));return;}for(let i=start;i<=n-left;i++)choose(i+1,left-1,[...out,i]);};choose(0,lonePairs,[]);
 // Fixed deterministic starts supplement all canonical lone-pair assignments.
 if(lonePairs>0&&loneSize!==1)for(let seed=0;seed<6;seed++)starts.push(Array.from({length:n},(_,j)=>{const z=1-2*(j+.5)/n,a=(j+1)*(2.399963229728653+seed*.371);return[Math.sqrt(1-z*z)*Math.cos(a),Math.sqrt(1-z*z)*Math.sin(a),z];}));
 let best=null;for(const start of starts){const q=domainRelax(start,sizes);if(best===null||q.energy<best.energy)best=q;}
 const angles=[];for(let i=lonePairs;i<n;i++)for(let j=i+1;j<n;j++)angles.push(Math.acos(Math.max(-1,Math.min(1,dot(best.points[i],best.points[j]))))*180/Math.PI);
 const snapshots=Array.from({length:21},(_,j)=>best.trace[Math.round(j*(best.trace.length-1)/20)]);return{n,lonePairs,loneSize,sizes,...best,starts:starts.length,angles,minBondAngle:angles.length?Math.min(...angles):null,maxBondAngle:angles.length?Math.max(...angles):null,snapshots};
}

export function walsh(angle=100,electrons=8,repulsion=2){
 if(!(angle>=60&&angle<=180))throw new RangeError('AH2 angle must be in [60,180] degrees');if(![4,8].includes(electrons))throw new RangeError('Choose the declared 4- or 8-electron model');nonnegative(repulsion,'H–H repulsion');const theta=angle*Math.PI/360,s=Math.sin(theta),c=angle===180?0:Math.cos(theta),matrix=Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>i===j?(i===0?-20:i<4?-10:-13):0));
 for(let j=4;j<6;j++){matrix[0][j]=matrix[j][0]=-4;matrix[1][j]=matrix[j][1]=(j===4?-5:5)*s;matrix[3][j]=matrix[j][3]=-5*c;}
 const eig=eigenSymmetric(matrix),fill=fillLevels(eig.values,electrons,eig.tolerance),nuclear=repulsion/(2*s);return{angle,electrons,repulsion,matrix,eig,...fill,electronic:fill.energy,nuclear,total:fill.energy+nuclear};
}
export function walshMinimum(electrons=8,repulsion=2){
 const grid=Array.from({length:49},(_,j)=>walsh(60+2.5*j,electrons,repulsion));let j=grid.reduce((a,q,i)=>q.total<grid[a].total?i:a,0);if(j===0||j===48)return{...grid[j],boundary:true,bracket:0,iterations:0};
 let a=grid[j-1].angle,b=grid[j+1].angle,c=b-(b-a)/((1+Math.sqrt(5))/2),d=a+(b-a)/((1+Math.sqrt(5))/2),fc=walsh(c,electrons,repulsion),fd=walsh(d,electrons,repulsion),iterations=0;
 while(b-a>1e-7&&iterations++<80){if(fc.total<fd.total){b=d;d=c;fd=fc;c=b-(b-a)/((1+Math.sqrt(5))/2);fc=walsh(c,electrons,repulsion);}else{a=c;c=d;fc=fd;d=a+(b-a)/((1+Math.sqrt(5))/2);fd=walsh(d,electrons,repulsion);}}
 const q=fc.total<fd.total?fc:fd;return{...q,boundary:false,bracket:b-a,iterations};
}

export function frontier(acceptor='butadiene',site=0,coupling=.3,separation=2){
 nonnegative(coupling,'donor coupling');positive(separation,'donor–LUMO separation');let q;if(acceptor==='butadiene')q=chain(4,4);else if(acceptor==='allyl cation')q=chain(3,2);else if(acceptor==='benzene')q=cycle(6,6);else throw new RangeError('Unknown declared acceptor');integer(site,0,q.n-1,'acceptor site');
 const low=q.electrons/2,group=q.groups.find(g=>low>=g.start&&low<g.end),weights=q.vectors.map(row=>sum(row.slice(group.start,group.end).map(c=>c*c))),weight=weights[site],bright=coupling*Math.sqrt(weight),root=Math.hypot(separation/2,bright),denominator=root+separation/2,logGain=coupling===0||weight===0?-Infinity:Math.log(2)+2*Math.log(coupling)+Math.log(weight)-Math.log(denominator),gain=logGain===-Infinity?0:Math.exp(logGain),logWeak=coupling===0||weight===0?-Infinity:Math.log(2)+2*Math.log(coupling)+Math.log(weight)-Math.log(separation);
 return{acceptor,site,coupling,separation,model:q,group,weights,weight,bright,gain,logGain,gainBelowRange:logGain>-Infinity&&gain===0,weakGain:logWeak===-Infinity?0:Math.exp(logWeak),logWeak,brightValues:[-separation/2-root,-separation/2+root]};
}
export function electrocyclic(n=4,excited=false,left=45,right=45,closure=.5){
 if(![4,6].includes(n))throw new RangeError('Choose 4 or 6 pi electrons');finite(left,'left rotation');finite(right,'right rotation');nonnegative(closure,'closure hopping');const q=chain(n),occupations=q.occupations.slice(),homo=n/2-1,lumo=n/2;if(excited){occupations[homo]--;occupations[lumo]++;}const P=density(q.vectors,occupations),a=left*Math.PI/180,b=right*Math.PI/180,geometry=-Math.sin(a)*Math.sin(b),hopping=-closure*geometry,expectation=hopping===0?0:2*hopping*P[0][n-1],frontierIndex=excited?lumo:homo;
 return{n,excited,left,right,closure,model:q,occupations,P,terminalDensity:P[0][n-1],geometry,hopping,expectation,frontierIndex,terminalCoefficients:[q.vectors[0][frontierIndex],q.vectors[n-1][frontierIndex]],facingProduct:geometry*q.vectors[0][frontierIndex]*q.vectors[n-1][frontierIndex],preferred:(n===4)!==excited?'conrotatory':'disrotatory'};
}

// Exact sphere monomial moments, with floating coefficients for normalized real d functions.
const mono=(x,y,z,c=1)=>[[x,y,z,c]];
const polyProduct=(a,b)=>a.flatMap(([x,y,z,c])=>b.map(([u,v,w,d])=>[x+u,y+v,z+w,c*d]));
const doubleFactorial=n=>{let q=1;for(let j=n;j>1;j-=2)q*=j;return q;};
export function sphereMoment(x,y,z){if(x%2||y%2||z%2)return 0;return doubleFactorial(x-1)*doubleFactorial(y-1)*doubleFactorial(z-1)/doubleFactorial(x+y+z+1);}
const averagePolynomial=a=>sum(a.map(([x,y,z,c])=>c*sphereMoment(x,y,z)));
export function crystalField(geometry='octahedral',radius=1){
 positive(radius,'ligand radius');const ligands=geometry==='octahedral'?domainCanonical(6):geometry==='tetrahedral'?domainCanonical(4):null;if(ligands===null)throw new RangeError('Choose octahedral or tetrahedral ligands');
 const d=[mono(1,1,0,Math.sqrt(15)),mono(1,0,1,Math.sqrt(15)),mono(0,1,1,Math.sqrt(15)),[...mono(2,0,0,Math.sqrt(15)/2),...mono(0,2,0,-Math.sqrt(15)/2)],[...mono(0,0,2,Math.sqrt(5)),...mono(2,0,0,-Math.sqrt(5)/2),...mono(0,2,0,-Math.sqrt(5)/2)]];
 const p4=ligands.flatMap(([x,y,z])=>{const u=[...mono(1,0,0,x),...mono(0,1,0,y),...mono(0,0,1,z)],u2=polyProduct(u,u),u4=polyProduct(u2,u2);return[...u4.map(([a,b,c,v])=>[a,b,c,35*v/8]),...u2.map(([a,b,c,v])=>[a,b,c,-30*v/8]),...mono(0,0,0,3/8)];});
 const raw=Array.from({length:5},()=>Array(5).fill(0));for(let i=0;i<5;i++)for(let j=i;j<5;j++)raw[i][j]=raw[j][i]=averagePolynomial(polyProduct(polyProduct(d[i],d[j]),p4));
 const barycenter=sum(raw.map((r,i)=>r[i]))/5,scale=.6/radius**5,matrix=raw.map((r,i)=>r.map((v,j)=>(v-(i===j?barycenter:0))*scale)),eig=eigenSymmetric(matrix),delta=eig.values[4]-eig.values[0],gram=d.map(a=>d.map(b=>averagePolynomial(polyProduct(a,b))));
 return{geometry,radius,ligands,raw,barycenter,matrix,eig,delta,gram,scale,orbitalNames:['dxy','dxz','dyz','dx²−y²','dz²'],referenceDelta:1/radius**5,expectedDelta:(geometry==='octahedral'?1:4/9)/radius**5};
}
export function spinD6(delta=1,pairing=1){
 nonnegative(delta,'octahedral splitting');nonnegative(pairing,'pairing cost');const levels=[-.4*delta,-.4*delta,-.4*delta,.6*delta,.6*delta],states=[];
 for(let code=0;code<243;code++){let c=code;const occupancy=Array.from({length:5},()=>{const q=c%3;c=Math.floor(c/3);return q;});if(sum(occupancy)!==6)continue;const pairs=occupancy.filter(x=>x===2).length,unpaired=occupancy.filter(x=>x===1).length,upper=occupancy[3]+occupancy[4],energy=delta*(upper-2.4)+pairing*pairs;states.push({occupancy,pairs,unpaired,upper,energy,moment:Math.sqrt(unpaired*(unpaired+2))});}
 const pairsAllowed=delta===pairing?[1,2,3]:delta>pairing?[3]:[1],ground=states.filter(q=>pairsAllowed.includes(q.pairs)&&(delta===0||q.upper===3-q.pairs)),unpaired=[...new Set(ground.map(q=>q.unpaired))].sort((a,b)=>a-b),moments=unpaired.map(q=>Math.sqrt(q*(q+2))),hs=-.4*delta+pairing,ls=-2.4*delta+3*pairing;
 return{delta,pairing,levels,states,ground,groundUnpaired:unpaired,moments,highSpin:hs,lowSpin:ls,tie:delta===pairing,energy:ground[0].energy};
}
// The displayed E⊗e model uses delta=0. Nonzero delta adds an orthogonal
// Pauli term in the complex basis; it is not a generic real static field.
export function jahnTeller({K=1,g=1,delta=0,x=0,y=0}={}){
 positive(K,'elastic coefficient');nonnegative(g,'linear coupling');nonnegative(delta,'pre-splitting');finite(x,'distortion x');finite(y,'distortion y');const r=Math.hypot(x,y),gr=g*r,radialSplit=Math.hypot(delta,gr),elastic=K*r*r/2,lower=elastic-radialSplit,upper=elastic+radialSplit,logRatio=g===0?-Infinity:delta===0?Infinity:2*Math.log(g)-Math.log(K)-Math.log(delta),distorted=g>0&&(delta===0||logRatio>0),ratio=delta===0?0:Math.exp(-logRatio),factor=distorted?Math.sqrt(-Math.expm1(-2*logRatio)):0,logRadius=distorted?Math.log(g)-Math.log(K)+(delta===0?0:Math.log(factor)):-Infinity,radius=logRadius===-Infinity?0:Math.exp(logRadius),logDrop=distorted?2*Math.log(g)-Math.log(2*K)+2*Math.log1p(-ratio):-Infinity,drop=logDrop===-Infinity?0:Math.exp(logDrop),shift=gr===0?elastic:elastic-gr*(gr/(radialSplit+delta));
 return{K,g,delta,x,y,r,elastic,lower,upper,shift,radialSplit,distorted,logRatio,radius,logRadius,radiusBelowRange:distorted&&radius===0,drop,logDrop,dropBelowRange:distorted&&drop===0};
}
export function peierls(n=12,delta=.2,t=1,periodic=false,stiffness=.5){
 integer(n,4,40,'even chain size');if(n%2)throw new RangeError('Use an even half-filled chain');if(!(delta>=0&&delta<=1))throw new RangeError('Alternation must be in [0,1]');positive(t,'hopping magnitude');nonnegative(stiffness,'elastic stiffness');const edges=Array.from({length:periodic?n:n-1},(_,j)=>[j,(j+1)%n,1+(j%2?-delta:delta)]),model=huckel({n,edges,electrons:n,t}),elastic=stiffness*n*delta*delta,bulkGap=4*t*delta,logBulkGap=delta===0?-Infinity:Math.log(4)+Math.log(t)+Math.log(delta);
 return{n,delta,t,periodic,stiffness,edges,model,electronic:model.energy,elastic,total:model.energy+elastic,gap:model.gap,bulkGap,logBulkGap,bulkGapBelowRange:delta>0&&bulkGap===0,rawAlternation:delta>0,terminal:periodic?'periodic':'strong terminal bonds',averageHopping:t*(1+(periodic?0:delta/(n-1)))};
}
export function ringClosure(n=6,closure=.5){
 integer(n,4,10,'even ring size');if(n%2)throw new RangeError('Use an even neutral ring');if(!(closure>=0&&closure<=1))throw new RangeError('Closing-edge weight must be in [0,1]');const edges=[...graph('chain',n).edges,[n-1,0,closure]],model=huckel({n,edges,electrons:n}),open=chain(n),dimerReference=-n;return{n,closure,model,open,dimerReference,gain:dimerReference-model.energy,closureShift:model.energy-open.energy,rawClosed:closure>0};
}
