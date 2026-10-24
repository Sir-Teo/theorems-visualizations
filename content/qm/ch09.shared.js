// Chapter-local symmetry and lattice models. Unless specified, hbar = 1.
import * as Q from './ch05.shared.js';
import {eigSym} from '../../assets/js/viz/math.js';
export {Q};
export const TAU=2*Math.PI;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function rotate(r,axis,angle){const norm=Math.hypot(...axis);if(!norm)return r.slice();const n=axis.map(x=>x/norm),c=Math.cos(angle),s=Math.sin(angle),p=cross(n,r),a=dot(n,r)*(1-c);return r.map((x,i)=>x*c+p[i]*s+n[i]*a);}
export const transition=(a,b)=>(1+dot(a,b))/2;
export function wigner(mode='unitary',angle=.8,stretch=1.5){
 const states=Array.from({length:18},(_,i)=>{const z=1-2*(i+.5)/18,phi=i*Math.PI*(3-Math.sqrt(5));return[Math.sqrt(1-z*z)*Math.cos(phi),Math.sqrt(1-z*z)*Math.sin(phi),z];});
 const map=r=>{let x=r.slice();if(mode==='antiunitary')x[1]*=-1;if(mode==='stretched'){x[2]*=stretch;const n=Math.hypot(...x);x=x.map(y=>y/n);}return rotate(x,[1,2,3],angle);},images=states.map(map),pairs=[];
 for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++)pairs.push({i,j,before:transition(states[i],states[j]),after:transition(images[i],images[j])});
 return{states,images,pairs,map,maxError:Math.max(...pairs.map(p=>Math.abs(p.after-p.before))),orientation:mode==='antiunitary'?-1:1};
}
export function conservation(epsilon=.3,omega=1,theta=1,time=2){const initial=[Math.sin(theta),0,Math.cos(theta)],field=[epsilon,0,omega],rate=Math.hypot(...field),at=t=>rotate(initial,field,rate*t),state=at(time);return{initial,field,at,state,g:state[2]/2,rhs:epsilon*state[1]/2,energy:dot(field,state)/2,initialEnergy:dot(field,initial)/2,commutatorNorm:Math.abs(epsilon)/Math.sqrt(2)};}
export function fourierPacket(center=.5,width=2,k0=1,M=12){
 const modes=Array.from({length:2*M+1},(_,i)=>i-M),raw=modes.map(n=>Q.cscale(Q.cis(-n*center),Math.exp(-((n-k0)**2)/(4*width*width)))),coeffs=Q.vnormalize(raw);
 const wave=(x,c=coeffs)=>{let z=[0,0];modes.forEach((n,i)=>z=Q.cadd(z,Q.cmul(c[i],Q.cis(n*x))));return Q.cscale(z,1/Math.sqrt(TAU));};
 const translate=a=>coeffs.map((c,i)=>Q.cmul(c,Q.cis(-modes[i]*a))),reflected=coeffs.slice().reverse(),even=coeffs.map((c,i)=>Q.cscale(Q.cadd(c,reflected[i]),.5)),odd=coeffs.map((c,i)=>Q.cscale(Q.csub(c,reflected[i]),.5));
 return{modes,coeffs,wave,translate,reflected,even,odd,evenWeight:Q.vnorm(even)**2,oddWeight:Q.vnorm(odd)**2,parity:Q.ip(coeffs,reflected)[0],momentum:modes.reduce((s,n,i)=>s+n*Q.cabs2(coeffs[i]),0)};
}
export function realSpectrum(A){const r=eigSym(A),idx=r.values.map((_,i)=>i).sort((i,j)=>r.values[i]-r.values[j]);return{values:idx.map(i=>r.values[i]),vectors:idx.map(i=>r.vecs[i])};}
export function residual(A,E,v){return Math.hypot(...A.map((row,i)=>dot(row,v)-E*v[i]));}
// Fourth-order centered kinetic stencil; odd ghost extension enforces the Dirichlet endpoints.
export function well(a=.5,g=.05,tilt=0,N=65,L=6){
 if(!Number.isInteger(N)||N<5||N%2!==1||N>161||!(L>0)||g<0)throw new RangeError('Use an odd finite grid, positive domain and nonnegative quartic coefficient.');
 const dx=2*L/(N+1),x=Array.from({length:N},(_,i)=>(i-(N-1)/2)*dx),potential=x.map(z=>a*z*z+g*z**4+tilt*z),A=x.map((_,i)=>x.map((_,j)=>i===j?(30-(i===0||i===N-1?1:0))/(24*dx*dx)+potential[i]:Math.abs(i-j)===1?-2/(3*dx*dx):Math.abs(i-j)===2?1/(24*dx*dx):0)),eigen=realSpectrum(A);
 const states=eigen.vectors.map(v=>v.map(y=>y/Math.sqrt(dx))),parities=eigen.vectors.map(v=>dot(v,v.slice().reverse()));
 return{x,dx,potential,A,...eigen,states,parities,residuals:eigen.vectors.slice(0,8).map((v,i)=>residual(A,eigen.values[i],v))};
}
export function dipoles(q,count=6){return Array.from({length:count},(_,i)=>Array.from({length:count},(_,j)=>q.vectors[i].reduce((s,y,k)=>s+y*q.x[k]*q.vectors[j][k],0)));}
// Plane-wave Galerkin basis for V(x)=V0(1-cos(2 pi x))/2, period a=1, hbar^2/(2m)=1.
export function bloch(k=.6,V0=8,M=4){
 const modes=Array.from({length:2*M+1},(_,i)=>i-M),A=modes.map((n,i)=>modes.map((_,j)=>i===j?(k+TAU*n)**2+V0/2:Math.abs(i-j)===1?-V0/4:0)),eigen=realSpectrum(A);
 const periodic=(x,band=0)=>modes.reduce((z,n,i)=>Q.cadd(z,Q.cscale(Q.cis(TAU*n*x),eigen.vectors[band][i])),[0,0]);
 return{k,V0,M,modes,A,...eigen,periodic,wave:(x,band=0)=>Q.cmul(Q.cis(k*x),periodic(x,band)),residuals:eigen.vectors.slice(0,3).map((v,i)=>residual(A,eigen.values[i],v))};
}
const sinc=x=>Math.abs(x)<1e-5?1-x*x/6+x**4/120:Math.sin(x)/x;
export function layer(E,V,width){const delta=E-V;if(delta===0)return[[1,width],[0,1]];if(delta>0){const k=Math.sqrt(delta),c=Math.cos(k*width),b=width*sinc(k*width);return[[c,b],[-delta*b,c]];}const k=Math.sqrt(-delta),c=Math.cosh(k*width),b=Math.sinh(k*width)/k;return[[c,b],[-delta*b,c]];}
export const mul2=(A,B)=>A.map(r=>[r[0]*B[0][0]+r[1]*B[1][0],r[0]*B[0][1]+r[1]*B[1][1]]);
export function kronig(E,height=10,fraction=.3,cells=5){
 if(!(E>0)||height<0||!(fraction>=0&&fraction<=1)||!Number.isInteger(cells)||cells<0||cells>20)throw new RangeError('Invalid periodic rectangular barrier.');
 const cell=mul2(layer(E,height,fraction),layer(E,0,1-fraction)),trace=(cell[0][0]+cell[1][1])/2,allowed=Math.abs(trace)<=1,tolerance=4e-14*Math.max(1,Math.abs(trace));let total=[[1,0],[0,1]];for(let j=0;j<cells;j++)total=mul2(cell,total);
 const [[a,b],[c,d]]=total,k=Math.sqrt(E),den=(E*b-c)**2+E*(a+d)**2,T=4*E/den,R=((E*b+c)**2+E*(a-d)**2)/den;
 return{cell,total,trace,allowed,edgeUncertain:Math.abs(Math.abs(trace)-1)<=tolerance,blochPhase:allowed?Math.acos(trace):null,decay:allowed?0:Math.acosh(Math.abs(trace)),T,R,ledger:T+R};
}
export function chain(N=12,hopping=1,boundary='periodic'){
 if(!Number.isInteger(N)||N<4||N>81||hopping<0)throw new RangeError('Invalid chain.');
 const A=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>Math.abs(i-j)===1||(boundary==='periodic'&&Math.abs(i-j)===N-1)?-hopping:0)),eigen=realSpectrum(A),analytic=Array.from({length:N},(_,i)=>-2*hopping*Math.cos(boundary==='periodic'?TAU*i/N:Math.PI*(i+1)/(N+1))).sort((a,b)=>a-b);
 return{A,N,hopping,boundary,...eigen,analytic,bandwidth:4*hopping,residuals:eigen.vectors.map((v,i)=>residual(A,eigen.values[i],v))};
}
export function evolveReal(eigen,initial,time){const projections=eigen.vectors.map(v=>v.reduce((z,y,i)=>Q.cadd(z,Q.cscale(initial[i],y)),[0,0]));return initial.map((_,i)=>eigen.values.reduce((z,E,j)=>Q.cadd(z,Q.cscale(Q.cmul(projections[j],Q.cis(-E*time)),eigen.vectors[j][i])),[0,0]));}
export function spectralDiagnostics(A,eigen){const n=A.length;let residualSquared=0,orthSquared=0;for(let j=0;j<n;j++){const v=eigen.vectors[j];residualSquared+=residual(A,eigen.values[j],v)**2;for(let k=0;k<n;k++)orthSquared+=(dot(v,eigen.vectors[k])-(j===k?1:0))**2;}return{residualNorm:Math.sqrt(residualSquared),orthogonalDefect:Math.sqrt(orthSquared),hamiltonianNorm:Math.hypot(...A.flat())};}
export function blochDynamics(hopping=1,force=.6,N=81){
 const sites=Array.from({length:N},(_,i)=>i-(N-1)/2),A=sites.map((x,i)=>sites.map((_,j)=>i===j?-force*x:Math.abs(i-j)===1?-hopping:0)),eigen=realSpectrum(A);
 const diagnostics=spectralDiagnostics(A,eigen);return{sites,A,...eigen,diagnostics,evolve(width=4,k0=.5,time=0){const initial=Q.vnormalize(sites.map(x=>Q.cscale(Q.cis(k0*x),Math.exp(-x*x/(4*width*width))))),psi=evolveReal(eigen,initial,time),probs=psi.map(Q.cabs2),coherence=initial.slice(0,-1).reduce((z,c,i)=>Q.cadd(z,Q.cmul(Q.cconj(c),initial[i+1])),[0,0]),mean=dot(sites,probs),prediction=force===0?2*hopping*coherence[1]*time:2*hopping/force*Q.cmul(coherence,Q.csub([1,0],Q.cis(force*time)))[0];const errorEstimate=diagnostics.orthogonalDefect+Math.abs(time)*diagnostics.residualNorm*Math.sqrt(N)+64*Number.EPSILON*N*(1+Math.abs(time)*diagnostics.hamiltonianNorm),returnFidelity=Q.cabs2(Q.ip(initial,psi));return{initial,psi,probs,errorEstimate,fidelityResolved:Math.sqrt(returnFidelity)>16*errorEstimate,norm:probs.reduce((a,b)=>a+b),mean,prediction,coherence,edgeProbability:probs.slice(0,4).concat(probs.slice(-4)).reduce((a,b)=>a+b),returnFidelity,period:force===0?Infinity:TAU/Math.abs(force)};}};
}
export function ringHamiltonian(N=21,flux=0,hopping=1){return Q.mat(N,N,(i,j)=>{if(i===(j+1)%N)return Q.cscale(Q.cis(flux/N),-hopping);if(j===(i+1)%N)return Q.cscale(Q.cis(-flux/N),-hopping);return 0;});}
export function timeReversal(flux=1,time=4,reverseField=false,N=21){
 const sites=Array.from({length:N},(_,i)=>i-(N-1)/2),initial=Q.vnormalize(sites.map(x=>Q.cscale(Q.cis(.7*x),Math.exp(-x*x/18)))),H=ringHamiltonian(N,flux),U=Q.propagator(H,time),forward=Q.mvec(U,initial),reversed=forward.map(Q.cconj),Hsecond=reverseField?ringHamiltonian(N,-flux):H,echo=Q.mvec(Q.propagator(Hsecond,time),reversed),target=initial.map(Q.cconj);
 return{sites,H,Hsecond,initial,forward,echo,target,fidelity:Q.cabs2(Q.ip(target,echo)),norm:Q.vnorm(echo)**2,breaking:Q.fnorm(Q.msub(H,H.map(row=>row.map(Q.cconj))))};
}
export function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};}
export const tensor=(A,B)=>Q.mat(A.length*B.length,A[0].length*B[0].length,(i,j)=>Q.cmul(A[Math.floor(i/B.length)][Math.floor(j/B[0].length)],B[i%B.length][j%B[0].length]));
export const thetaSpin=psi=>psi.flatMap((_,i)=>i%2?[]:[Q.cconj(psi[i+1]),Q.cscale(Q.cconj(psi[i]),-1)]);
export function kramers(seed=17,field=.2){
 const random=rng(seed),d=Array.from({length:5},()=>2*random()-1),I=Q.eye(2),gamma=[tensor(Q.SZ,I),tensor(Q.SX,I),tensor(Q.SY,Q.SX),tensor(Q.SY,Q.SY),tensor(Q.SY,Q.SZ)],base=gamma.reduce((A,G,i)=>Q.madd(A,Q.mscale(G,d[i])),Q.zerosC(4)),H=Q.madd(base,Q.mscale(tensor(I,Q.SZ),field)),eigen=Q.heig(H),psi=eigen.vectors[0],partner=thetaSpin(psi);
 const T=tensor(I,[[[0,0],[1,0]],[[-1,0],[0,0]]]),transformed=Q.mmul(Q.mmul(T,H.map(row=>row.map(Q.cconj))),Q.adj(T)),r=Math.hypot(...d),q=Math.hypot(d[0],d[1],d[4]),hi=Math.sqrt(Math.max(0,r*r+field*field+2*field*q)),lo=Math.sqrt(Math.max(0,r*r+field*field-2*field*q)),analytic=[-hi,-lo,lo,hi].sort((a,b)=>a-b);
 return{d,base,H,...eigen,analytic,psi,partner,overlap:Q.cabs2(Q.ip(psi,partner)),thetaSquareResidual:Q.vnorm(Q.vadd(thetaSpin(partner),psi)),partnerEnergyResidual:Q.vnorm(Q.vsub(Q.mvec(H,partner),Q.vscale(partner,[eigen.values[0],0]))),breaking:Q.fnorm(Q.msub(H,transformed))};
}
export function multiplet(ell=2,strength=.3,angle=.6){
 if(!Number.isInteger(ell)||ell<0||ell>6)throw new RangeError('Use integer orbital angular momentum.');
 const J=Q.spinOps(ell),I=Q.eye(J.dim),base=ell*(ell+1),z=Q.msub(Q.mmul(J.Sz,J.Sz),Q.mscale(I,base/3)),xy=Q.msub(Q.mmul(J.Sx,J.Sx),Q.mmul(J.Sy,J.Sy)),perturbation=Q.mscale(Q.madd(Q.mscale(z,Math.cos(angle)),Q.mscale(xy,Math.sin(angle))),1/Math.max(1,ell*ell)),H=Q.madd(Q.mscale(I,base),Q.mscale(perturbation,strength)),eigen=Q.heig(H);
 return{ell,strength,angle,J,H,perturbation,base,...eigen,rotationalBreaking:Math.hypot(Q.fnorm(Q.comm(H,J.Sx)),Q.fnorm(Q.comm(H,J.Sy)),Q.fnorm(Q.comm(H,J.Sz)))};
}
