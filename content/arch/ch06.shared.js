// ARCH6: bounded authored structural analogues. No historical-building or design certification.
import {bounded,integer} from './ch05.shared.js';
export {bounded,integer};
export const PI=Math.PI,TAU=2*PI;
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const range=(n,a=-1,b=1)=>Array.from({length:n},(_,i)=>i===n-1?b:a+(b-a)*i/(n-1));
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const scale=(a,k)=>a.map(x=>x*k);
export const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
export const norm=a=>Math.hypot(...a);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>scale(a,1/norm(a));
const mesh=(fn,n=13)=>range(n).map(x=>range(n).map(y=>fn(x,y)));

export function curvedStiffness({rise=.3,thin=.04,load=.00001}={}){
 bounded(rise,0,.7);bounded(thin,.02,.12);bounded(load,0,.00005);
 // a=E=b=1; equal total volume2t. Inclined bars are axial-only; reference beam bends.
 const length=Math.hypot(1,rise),area=thin/length,volume=2*length*area,beamK=thin**3/2,axialK=2*area/length*(rise/length)**2,force=load*thin;
 return{rise,thin,length,area,volume,beamK,axialK,ratio:axialK/beamK,force,beamDeflection:force/beamK,axialDeflection:axialK===0||!Number.isFinite(force/axialK)?null:force/axialK,beamSmallDeflection:force/beamK<=.02,barNodes:[[-1,0,0],[0,0,rise],[1,0,0]],curves:range(71,0,.7).map(h=>[h,2*thin*h*h/(1+h*h)**2/beamK])};
}

export function graphGeometry(x,y,fx,fy,fxx,fxy,fyy){
 const w=Math.hypot(1,fx,fy),H=((1+fy*fy)*fxx-2*fx*fy*fxy+(1+fx*fx)*fyy)/(2*w**3),K=(fxx*fyy-fxy*fxy)/w**4,d=Math.sqrt(Math.max(0,H*H-K));
 return{gradient:[fx,fy],hessian:[fxx,fxy,fyy],normal:[-fx/w,-fy/w,1/w],H,K,principal:[H+d,H-d]};
}
export function hypar({curvature=.7,x=.35,y=.3,ruling=.25}={}){
 bounded(curvature,0,1.2);bounded(x,-.8,.8);bounded(y,-.8,.8);bounded(ruling,-1,1);
 const c=curvature,z=c*x*y,point=[x,y,z],g=graphGeometry(x,y,c*y,c*x,0,c,0);
 return{curvature:c,x,y,ruling,point,...g,grid:mesh((x,y)=>[x,y,c*x*y]),rulings:[range(25).map(t=>[ruling,t,c*ruling*t]),range(25).map(t=>[t,ruling,c*t*ruling])],section:range(65).map(t=>[t,c*t*t]),otherSection:range(65).map(t=>[t,-c*t*t])};
}
export function tensionPatch({k1=.6,k2=-.4,T1=1,T2=1.5,pressure=0}={}){
 bounded(k1,-1,1);bounded(k2,-1,1);bounded(T1,.1,3);bounded(T2,.1,3);bounded(pressure,-3,3);
 const contributions=[T1*k1,T2*k2],requiredPressure=-sum(contributions),residual=sum(contributions)+pressure,shape=k1===0&&k2===0?'flat':k1*k2<0?'anticlastic':k1*k2>0?'synclastic':'cylindrical';
 return{k1,k2,T1,T2,pressure,contributions,requiredPressure,residual,shape,grid:mesh((x,y)=>[x,y,(k1*x*x+k2*y*y)/2]),sections:[range(65).map(x=>[x,k1*x*x/2]),range(65).map(y=>[y,k2*y*y/2])],originNormal:[0,0,1]};
}

function scherkHeight(a,x,y){
 if(a===0)return 0;
 if(a<.0001){const a2=a*a;return a*((x*x-y*y)/2+a2*((x**4-y**4)/12+a2*(x**6-y**6)/45));}
 return(Math.log1p(-2*Math.sin(a*y/2)**2)-Math.log1p(-2*Math.sin(a*x/2)**2))/a;
}
export function minimalPoint(a,trial,x,y){
 const tx=Math.tan(a*x),ty=Math.tan(a*y),z=scherkHeight(a,x,y)+trial*(1-x*x)*(1-y*y),fx=tx-2*trial*x*(1-y*y),fy=-ty-2*trial*y*(1-x*x),fxx=a*(1+tx*tx)-2*trial*(1-y*y),fyy=-a*(1+ty*ty)-2*trial*(1-x*x),fxy=4*trial*x*y,g=graphGeometry(x,y,fx,fy,fxx,fxy,fyy);
 // Exact analytic minimal-graph identity; the unrounded formula remains a separate diagnostic.
 return{point:[x,y,z],...g,H:trial===0?0:g.H,floatingMeanResidual:g.H};
}
function graphArea(a,trial){
 const n=32,h=2/n;let total=0;
 for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){
  const x=-1+i*h,y=-1+j*h,fx=Math.tan(a*x)-2*trial*x*(1-y*y),fy=-Math.tan(a*y)-2*trial*y*(1-x*x),weight=(i===0||i===n?1:i%2?4:2)*(j===0||j===n?1:j%2?4:2);
  total+=weight*Math.hypot(1,fx,fy);
 }
 return total*h*h/9;
}
export function minimalGraph({a=.8,trial=0,x=.35,y=.2}={}){
 bounded(a,0,1.2);bounded(trial,-.4,.4);bounded(x,-.8,.8);bounded(y,-.8,.8);
 const selected=minimalPoint(a,trial,x,y),grid=mesh((x,y)=>minimalPoint(a,trial,x,y).point),area=graphArea(a,trial),baseArea=graphArea(a,0);
 return{a,trial,x,y,selected,grid,area,baseArea,quadratureIntervals:32,areaCurve:range(17,-.4,.4).map(d=>[d,graphArea(a,d)]),boundary:range(25).map(t=>[[-1,t,scherkHeight(a,-1,t)],[1,t,scherkHeight(a,1,t)],[t,-1,scherkHeight(a,t,-1)],[t,1,scherkHeight(a,t,1)]])};
}

// A separate Cholesky implementation, for the positive anchored weighted graph only.
function solveSPD(A,b){
 const n=b.length,L=Array.from({length:n},()=>Array(n).fill(0));
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
  let value=A[i][j];for(let k=0;k<j;k++)value-=L[i][k]*L[j][k];
  if(i===j){if(!(value>0))throw Error('anchored positive graph required');L[i][j]=Math.sqrt(value);}else L[i][j]=value/L[j][j];
 }
 const y=Array(n).fill(0),x=Array(n).fill(0);
 for(let i=0;i<n;i++){let q=b[i];for(let j=0;j<i;j++)q-=L[i][j]*y[j];y[i]=q/L[i][i];}
 for(let i=n-1;i>=0;i--){let q=y[i];for(let j=i+1;j<n;j++)q-=L[j][i]*x[j];x[i]=q/L[i][i];}
 return x;
}
export function cableNet({qX=1,qY=1,rise=.8,load=-.3,selected=1,flatBoundary=false,bias=0}={}){
 bounded(qX,.25,4);bounded(qY,.25,4);bounded(rise,0,1.2);bounded(load,-2,0);bounded(bias,-.8,.8);integer(selected,0,8);
 if(typeof flatBoundary!=='boolean')throw Error('flatBoundary');
 const n=5,coordinates=[],free=[],fixed=[],edges=[],densities=[],loads=[];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const x=-1+i/2,y=-1+j/2,k=i*n+j,boundary=i===0||j===0||i===n-1||j===n-1;
  coordinates.push([x,y,boundary&&!flatBoundary?rise*(x*x-y*y):0]);(boundary?fixed:free).push(k);loads.push([0,0,boundary?0:load*(1+bias*x)]);
  if(i<n-1){edges.push([k,k+n]);densities.push(qX);}if(j<n-1){edges.push([k,k+1]);densities.push(qY);}
 }
 const index=new Map(free.map((k,i)=>[k,i])),L=free.map(()=>Array(free.length).fill(0)),rhs=free.map(k=>[...loads[k]]);
 edges.forEach(([a,b],edge)=>{const q=densities[edge];for(const[u,v]of[[a,b],[b,a]])if(index.has(u)){const i=index.get(u);L[i][i]+=q;if(index.has(v))L[i][index.get(v)]-=q;else for(let c=0;c<3;c++)rhs[i][c]+=q*coordinates[v][c];}});
 for(let c=0;c<3;c++){const answer=solveSPD(L,rhs.map(q=>q[c]));free.forEach((k,i)=>{coordinates[k][c]=answer[i];});}
 const lengths=edges.map(([a,b])=>norm(sub(coordinates[b],coordinates[a]))),tensions=lengths.map((l,i)=>l*densities[i]),forces=coordinates.map(()=>[0,0,0]);
 edges.forEach(([a,b],e)=>{const F=scale(sub(coordinates[b],coordinates[a]),densities[e]);forces[a]=add(forces[a],F);forces[b]=sub(forces[b],F);});
 const balances=forces.map((F,i)=>add(F,loads[i])),residuals=free.map(k=>norm(balances[k])),node=free[selected],jointForces=[];
 edges.forEach(([a,b],e)=>{if(a===node||b===node){const other=a===node?b:a;jointForces.push(scale(sub(coordinates[other],coordinates[node]),densities[e]));}});jointForces.push([...loads[node]]);
 const forcePolygon=[[0,0,0]];for(const F of jointForces)forcePolygon.push(add(forcePolygon.at(-1),F));
 return{qX,qY,rise,load,selected,bias,flatBoundary,coordinates,free,fixed,edges,densities,lengths,tensions,loads,L,rhs,balances,residuals,maximumResidual:Math.max(...residuals),reactions:fixed.map(k=>scale(balances[k],-1)),node,jointForces,forcePolygon,energy:.5*sum(lengths.map((l,i)=>densities[i]*l*l))-sum(coordinates.map((p,i)=>dot(loads[i],p)))};
}
export function hangingModel({weight=.5,bias=.4,loadChange=1,selected=1}={}){
 bounded(weight,0,2);bounded(bias,-.8,.8);bounded(loadChange,.5,1.5);integer(selected,0,8);
 const net=cableNet({load:-weight,bias,selected,flatBoundary:true}),inverted=net.coordinates.map(([x,y,z])=>[x,y,-z]),densities=net.densities.map(q=>-q),loads=net.loads.map(F=>scale(F,loadChange)),internal=inverted.map(()=>[0,0,0]);
 net.edges.forEach(([a,b],e)=>{const F=scale(sub(inverted[b],inverted[a]),densities[e]);internal[a]=add(internal[a],F);internal[b]=sub(internal[b],F);});
 const residuals=net.free.map(k=>norm(add(internal[k],loads[k])));
 return{weight,bias,loadChange,selected,net,inverted,densities,loads,compression:net.tensions.map(T=>-T),residuals,maximumResidual:Math.max(...residuals),geometryMatchesDesignLoad:loadChange===1||weight===0};
}
export function dynamicRelaxation({qX=1,qY=1,rise=.8,load=-.3,damping=1,dt=.2,steps=60,selected=1}={}){
 bounded(damping,0,4);bounded(dt,.02,.3);integer(steps,0,120);
 const net=cableNet({qX,qY,rise,load,selected}),b=net.rhs.map(p=>p[2]),target=net.free.map(k=>net.coordinates[k][2]),L=net.L,matvec=z=>L.map(row=>dot(row,z)),residual=z=>{const Lz=matvec(z);return b.map((x,i)=>x-Lz[i]);},z=net.free.map(()=>0),r0=residual(z),v=r0.map(x=>-dt*x/2),A=dt/(1+damping*dt/2),B=(1-damping*dt/2)/(1+damping*dt/2),history=[];
 for(let iteration=0;iteration<=steps;iteration++){
  const R=residual(z),next=v.map((x,i)=>A*R[i]+B*x),velocity=v.map((x,i)=>(x+next[i])/2),error=z.map((x,i)=>x-target[i]);
  history.push({iteration,z:[...z],velocity,residual:R,kinetic:.5*dot(velocity,velocity),potential:.5*dot(error,matvec(error)),residualNorm:norm(R),errorNorm:norm(error)});
  if(iteration<steps)for(let i=0;i<z.length;i++){v[i]=next[i];z[i]+=dt*next[i];}
 }
 const lambdaMax=(2+Math.SQRT2)*(qX+qY),frame=history.at(-1),coordinates=net.coordinates.map(p=>[...p]);net.free.forEach((k,i)=>{coordinates[k][2]=frame.z[i];});
 return{damping,dt,steps,selected,A,B,lambdaMax,criticalStep:2/Math.sqrt(lambdaMax),stepFraction:dt*Math.sqrt(lambdaMax)/2,net,history,frame,coordinates};
}

export function gridshell({rise=.6,shear=20,brace=true}={}){
 bounded(rise,0,1);bounded(shear,-35,35);if(typeof brace!=='boolean')throw Error('brace');
 const grid=mesh((x,y)=>[x,y,rise*(1-x*x)*(1-y*y)],11),edges=[];
 for(let i=0;i<11;i++)for(let j=0;j<11;j++){if(i<10)edges.push([grid[i][j],grid[i+1][j]]);if(j<10)edges.push([grid[i][j],grid[i][j+1]]);}
 const extensions=edges.map(([a,b])=>norm(sub(b,a))/.2-1),t=shear*PI/180,cell=[[0,0],[1,0],[1+Math.sin(t),Math.cos(t)],[Math.sin(t),Math.cos(t)]],diagonal=norm(sub(cell[2],cell[0])),rest=Math.SQRT2,energy=brace?.5*(diagonal-rest)**2:0;
 return{rise,shear,brace,grid,edges,extensions,maximumExtension:Math.max(...extensions),cell,sideLengths:cell.map((a,i)=>norm(sub(cell[(i+1)%4],a))),diagonal,rest,angle:90-shear,energy,energyCurve:range(71,-35,35).map(d=>{const l=Math.sqrt(2+2*Math.sin(d*PI/180));return[d,brace?.5*(l-rest)**2:0];})};
}
function prismCoordinates(R,height,theta){return Array.from({length:6},(_,i)=>{const t=TAU*(i%3)/3+(i<3?0:theta);return[R*Math.cos(t),R*Math.sin(t),i<3?0:height];});}
export function tensegrity({radius=1,height=1.8,prestress=1,twist=0}={}){
 bounded(radius,.5,1.5);bounded(height,1,3);bounded(prestress,0,2);bounded(twist,-10,10);
 const R=radius,theta0=5*PI/6,theta=theta0+twist*PI/180,strutLength=Math.hypot(height,2*R*Math.sin(theta0/2)),crossLength=Math.hypot(height,2*R*Math.sin(PI/12)),stiffness=20,restLength=crossLength*(1-prestress/stiffness);
 // lc(theta)^2=lc0^2+4sqrt(3)R²sin²(delta/2). Preserve zero prestress
 // exactly and avoid subtracting two almost equal cable lengths or energies.
 const form=d=>{const t=theta0+d*PI/180,h=d===0?height:Math.sqrt(strutLength**2-2*R*R*(1-Math.cos(t))),extra=2*3**.25*R*Math.sin(d*PI/360),l=Math.hypot(crossLength,extra),lengthIncrease=extra*extra/(l+crossLength),extension=lengthIncrease+prestress*crossLength/stiffness;return{theta:t,height:h,length:l,lengthIncrease,energy:1.5*stiffness*extension*extension};},above=d=>{const dl=form(d).lengthIncrease;return 3*prestress*crossLength*dl+1.5*stiffness*dl*dl;},current=form(twist),coordinates=prismCoordinates(R,current.height,theta),edges=[],types=[];
 for(let i=0;i<3;i++){edges.push([i,(i+1)%3],[i+3,(i+1)%3+3],[i,(i+2)%3+3],[i,i+3]);types.push('ring','ring','cross','strut');}
 const crossTension=stiffness*current.lengthIncrease+prestress*crossLength,q=crossTension/current.length,densities=types.map(t=>t==='strut'?-q:t==='ring'?q/Math.sqrt(3):q),lengths=edges.map(([a,b])=>norm(sub(coordinates[b],coordinates[a]))),forces=coordinates.map(()=>[0,0,0]);
 edges.forEach(([a,b],e)=>{const F=scale(sub(coordinates[b],coordinates[a]),densities[e]);forces[a]=add(forces[a],F);forces[b]=sub(forces[b],F);});
 return{radius,height,prestress,twist,theta,strutLength,crossLength,stiffness,restLength,current,energyChange:above(twist),coordinates,edges,types,densities,lengths,memberForces:lengths.map((l,i)=>l*densities[i]),balances:forces,maximumResidual:Math.max(...forces.map(norm)),selfEquilibriumForm:twist===0,symmetricTwistStiffness:3*Math.sqrt(3)*prestress*R*R,energyCurve:range(81,-10,10).map(d=>[d,above(d)])};
}

function capRecord(a,N,alpha,h){
 const radius=h===0?null:(a*a+h*h)/(2*h),curvature=2*h/(a*a+h*h),pressure=2*N*alpha/a,secondDerivative=2*PI*N*(a*a-h*h)/(a*a+h*h),phi=2*Math.atan(h/a);
 return{h,radius,curvature,phi,area:PI*(a*a+h*h),volume:PI*h*(3*a*a+h*h)/6,pressureCheck:2*N*curvature,secondDerivative,stability:h<a?'minimum':h>a?'maximum':'fold',grid:Array.from({length:17},(_,i)=>Array.from({length:33},(_,j)=>{const angle=phi*i/16,t=TAU*j/32;return h===0?[a*i/16*Math.cos(t),a*i/16*Math.sin(t),0]:[radius*Math.sin(angle)*Math.cos(t),radius*Math.sin(angle)*Math.sin(t),h-radius+radius*Math.cos(angle)];})),localEnergy:range(65,Math.max(-.25,-h/a),.25).map(u=>{const delta=a*u;return[u,.5*secondDerivative*delta*delta-PI*pressure*delta**3/6];})};
}
export function pneumatic({a=1,N=1,alpha=.6,branch='shallow'}={}){
 bounded(a,.5,3);bounded(N,.25,3);if(alpha!==0)bounded(alpha,.02,1.2);if(!['shallow','tall'].includes(branch))throw Error('branch');
 const pressure=2*N*alpha/a,peakPressure=2*N/a,exists=alpha<=1,root=exists?Math.sqrt((1-alpha)*(1+alpha)):null,small=exists?capRecord(a,N,alpha,alpha===0?0:a*alpha/(1+root)):null,large=exists&&alpha>0?capRecord(a,N,alpha,a*(1+root)/alpha):null,selected=branch==='shallow'?small:large;
 return{a,N,alpha,branch,pressure,peakPressure,exists,small,large,selected,pressureCurve:range(91,0,PI).map(phi=>[phi*180/PI,peakPressure*Math.sin(phi)])};
}
export function shellThinness({ratio=300,nu=.3,angle=30}={}){
 bounded(ratio,50,1500);bounded(nu,.15,.45);bounded(angle,5,75);
 const phi=angle*PI/180,t=1/ratio,classical=2*t*t/Math.sqrt(3*(1-nu*nu)),lambda=(12*(1-nu*nu))**.25*Math.sqrt(ratio)*2*Math.sin(phi/2),margin=1e-12,sourceDomain=lambda>2+margin?'supported':lambda<2-margin?'outside':'unresolved boundary',factor=sourceDomain==='supported'?.14+3.2/(lambda*lambda):null;
 return{ratio,nu,angle,phi,t,spanThickness:2*ratio*Math.sin(phi),classical,lambda,sourceDomain,factor,correlated:factor===null?null:classical*factor,bendingToMembrane:t*t/(12*(1-nu*nu)),scaling:range(65,Math.log10(50),Math.log10(1500)).map(x=>{const r=10**x;return[r,2/(r*r*Math.sqrt(3*(1-nu*nu)))];}),correlationCurve:range(81,Math.log10(2.000001),2).map(u=>{const x=10**u;return[x,.14+3.2/(x*x)];}),section:range(65,-phi,phi).map(x=>[Math.sin(x),Math.cos(x)-Math.cos(phi)])};
}
