// Modern finite-basis models, atomic units. Not a reconstruction of 1927 numbers.
const finite=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const integer=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
export function stoIon(R=2){
 if(!finite(R,.2,20))throw new RangeError('Use separation 0.2–20 Bohr');
 const S=Math.exp(-R)*(1+R+R*R/3),J=Math.exp(-2*R)*(1+1/R)-1/R,K=-Math.exp(-R)*(1+R);
 const alpha=-.5+J+1/R,beta=(-.5+1/R)*S+K,coupling=beta-alpha*S;
 return {R,S,J,K,alpha,beta,coupling,bonding:alpha+coupling/(1+S),antibonding:alpha-coupling/(1-S),atomic:-.5};
}
export function stoOrbital(R=2,x=0,y=0,odd=false){
 const q=stoIon(R);if(!finite(x,-30,30)||!finite(y,-30,30)||typeof odd!=='boolean')throw new RangeError('Use finite declared slice coordinates');
 const a=Math.exp(-Math.hypot(x+R/2,y))/Math.sqrt(Math.PI),b=Math.exp(-Math.hypot(x-R/2,y))/Math.sqrt(Math.PI),psi=(a+(odd?-b:b))/Math.sqrt(2*(1+(odd?-q.S:q.S)));
 return{psi,density:psi*psi,a,b,interference:(odd?-1:1)*a*b/(1+(odd?-q.S:q.S))};
}
export function overlapLevels(S=.3,alpha=-1,beta=-.5){
 if(!finite(S,0,.9)||!finite(alpha,-4,2)||!finite(beta,-5,3))throw new RangeError('Use the finite positive-definite overlap model');
 const delta=beta-alpha*S,plus=alpha+delta/(1+S),minus=alpha-delta/(1-S);
 return{S,alpha,beta,delta,plus,minus,plusShift:plus-alpha,minusShift:minus-alpha,ratio:(1+S)/(1-S),bondingConvention:delta<0};
}
export function boys0(t){
 if(!finite(t,0,1000))throw new RangeError('Use Boys argument 0–1000');
 if(t>=36)return Math.sqrt(Math.PI/t)/2;
 let term=1,sum=1;for(let k=0;k<300;k++){term*=2*t/(2*k+3);sum+=term;if(term<sum*2e-16)break;}
 return Math.exp(-t)*sum;
}
export function gaussianPair(R=1.6,alpha=.3){
 if(!finite(R,.5,12)||!finite(alpha,.15,1.5))throw new RangeError('Use R=0.5–12 Bohr and Gaussian exponent0.15–1.5 inverse-square Bohr');
 const centers=[-R/2,R/2],S=Math.exp(-alpha*R*R/2),overlap=(i,j)=>i===j?1:S,coulombScale=2*Math.sqrt(2*alpha/Math.PI),eriScale=2*Math.sqrt(alpha/Math.PI);
 const kinetic=(i,j)=>alpha/2*(3-alpha*(centers[i]-centers[j])**2)*overlap(i,j);
 const attraction=(i,j,k)=>-coulombScale*overlap(i,j)*boys0(2*alpha*((centers[i]+centers[j])/2-centers[k])**2);
 const h=(i,j)=>kinetic(i,j)+attraction(i,j,0)+attraction(i,j,1);
 const eri=(i,j,k,l)=>eriScale*overlap(i,j)*overlap(k,l)*boys0(alpha*((centers[i]+centers[j]-centers[k]-centers[l])/2)**2);
 const haa=h(0,0),hab=h(0,1),direct=2*haa+eri(0,0,1,1),exchange=2*S*hab+eri(0,1,1,0),repulsion=1/R;
 const singlet=(direct+exchange)/(1+S*S)+repulsion,triplet=(direct-exchange)/(1-S*S)+repulsion;
 const g=[1,1].map(v=>v/Math.sqrt(2*(1+S))),u=[1,-1].map(v=>v/Math.sqrt(2*(1-S)));
 const one=(c)=>c.flatMap((v,i)=>c.map((w,j)=>v*w*h(i,j))).reduce((a,b)=>a+b,0);
 const two=(a,b,c,d)=>{let q=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)for(let l=0;l<2;l++)q+=a[i]*b[j]*c[k]*d[l]*eri(i,j,k,l);return q;};
 const Hgg=2*one(g)+two(g,g,g,g)+repulsion,Huu=2*one(u)+two(u,u,u,u)+repulsion,Hgu=two(g,u,g,u);
 const half=(Huu-Hgg)/2,gap=Math.hypot(half,Hgu),ciEnergy=(Hgg+Huu)/2-gap;
 // atan2 avoids subtractive cancellation in the lower-eigenvector coefficients.
 const angle=.5*Math.atan2(2*Hgu,Huu-Hgg),cg=Math.cos(angle),cu=-Math.sin(angle);
 const atom=1.5*alpha-coulombScale;
 return{R,alpha,S,haa,hab,kineticAA:kinetic(0,0),kineticAB:kinetic(0,1),attractionAA:attraction(0,0,0),attractionAB:attraction(0,1,0),electronDirect:eri(0,0,1,1),electronExchange:eri(0,1,1,0),onSite:eri(0,0,0,0),direct,exchange,repulsion,singlet,triplet,Hgg,Huu,Hgu,ciEnergy,cg,cu,ciNorm:cg*cg+cu*cu,atom,separated:2*atom,eri,centers,g,u};
}
export function pairAmplitude(R=1.6,alpha=.3,x=0,y=0,triplet=false){
 if(!finite(R,.5,12)||!finite(alpha,.15,1.5)||!finite(x,-15,15)||!finite(y,-15,15)||typeof triplet!=='boolean')throw new RangeError('Use declared Gaussian and electron-axis coordinates');
 const S=Math.exp(-alpha*R*R/2);
 const N=(2*alpha/Math.PI)**.75,a=z=>N*Math.exp(-alpha*(z+R/2)**2),b=z=>N*Math.exp(-alpha*(z-R/2)**2);
 const direct=a(x)*b(y),swapped=b(x)*a(y),psi=(direct+(triplet?-swapped:swapped))/Math.sqrt(2*(1+(triplet?-S*S:S*S)));
 return{psi,density:psi*psi,direct,swapped};
}
export function ciMix(R=1.6,alpha=.3,angle=0){
 if(!finite(angle,-Math.PI/2,Math.PI/2))throw new RangeError('Use a normalized real CI angle');
 const q=gaussianPair(R,alpha),g=Math.cos(angle),u=Math.sin(angle),energy=g*g*q.Hgg+u*u*q.Huu+2*g*u*q.Hgu;
 const ionicAmplitude=g/(2*(1+q.S))+u/(2*(1-q.S)),covalentAmplitude=g/(2*(1+q.S))-u/(2*(1-q.S));
 return{...q,angle,g,u,energy,ionicAmplitude,covalentAmplitude,norm:g*g+u*u,optimalAngle:Math.atan2(q.cu,q.cg)};
}
export function moOccupation(electrons=10,early=false){
 if(!integer(electrons,0,16)||typeof early!=='boolean')throw new RangeError('Use 0–16 valence electrons');
 const groups=[{id:'sigma2s',g:1,bond:1},{id:'sigma2s*',g:1,bond:-1},...(early?[{id:'pi2p',g:2,bond:1},{id:'sigma2p',g:1,bond:1}]:[{id:'sigma2p',g:1,bond:1},{id:'pi2p',g:2,bond:1}]),{id:'pi2p*',g:2,bond:-1},{id:'sigma2p*',g:1,bond:-1}];
 let left=electrons,bonding=0,antibonding=0,unpaired=0;
 const levels=groups.map(q=>{const n=Math.min(left,2*q.g);left-=n;const slots=Array.from({length:q.g},(_,k)=>Number(n>k)+Number(n>q.g+k));if(q.bond>0)bonding+=n;else antibonding+=n;unpaired+=slots.filter(v=>v===1).length;return{...q,n,slots};});
 return{electrons,early,levels,bonding,antibonding,bondOrder:(bonding-antibonding)/2,unpaired};
}
export function spinTriplet(field=0){
 if(!finite(field,-5,5))throw new RangeError('Use dimensionless field −5–5');
 const weights=[Math.exp(-field),1,Math.exp(field)],partition=weights.reduce((a,b)=>a+b),probabilities=weights.map(q=>q/partition),mean=2*Math.sinh(field)/(1+2*Math.cosh(field));
 return{field,probabilities,mean,partition,singletMean:0};
}
export function sigmaMix(delta=2,coupling=1,pi=.2){
 if(!finite(delta,.2,8)||!finite(coupling,0,2)||!finite(pi,-1,1))throw new RangeError('Use declared sigma mixing domain');
 const gap=Math.hypot(delta/2,coupling),upper=coupling*(coupling/(gap+delta/2)),lower=-delta-upper,pUpper=(1+delta/(2*gap))/2;
 const shiftUnderflow=coupling>0&&upper===0,upperAbovePi=pi===0?coupling>0:pi<0||upper>pi;
 return{delta,coupling,pi,upper,lower,pUpper,upperAbovePi,shiftUnderflow};
}
export function polarPair(delta=1,coupling=.5,R=2){
 if(!finite(delta,-5,5)||!finite(coupling,.1,2)||!finite(R,.5,5))throw new RangeError('Use the declared orthogonal two-site domain');
 const gap=Math.hypot(delta,2*coupling),pA=(1-delta/gap)/2,pB=(1+delta/gap)/2,qA=delta/gap,qB=-delta/gap,dipole=-R*(delta/gap);
 return{delta,coupling,R,gap,energy:-gap/2,pA,pB,qA,qB,dipole};
}
export function morseModel(lambda=5,x=0){
 if(!finite(lambda,.25,12)||!finite(x,-2,12))throw new RangeError('Use lambda0.25–12 and scaled displacement−2–12');
 const displacement=-Math.expm1(-x),potential=lambda*lambda*displacement*displacement,harmonic=lambda*lambda*x*x,levels=[];
 for(let n=0;n+.5<lambda;n++)levels.push({n,energy:lambda*lambda-(lambda-n-.5)**2,binding:(lambda-n-.5)**2,energyAtThresholdByRounding:lambda*lambda-(lambda-n-.5)**2===lambda*lambda});
 return{lambda,x,potential,potentialUnderflow:x!==0&&displacement!==0&&potential===0,harmonic,threshold:lambda*lambda,levels,curvature:2*lambda*lambda,harmonicSpacing:2*lambda};
}
export function lewisCount(valence=6,bonds=2,lonePairs=2,charge=0){
 if(!integer(valence,0,8)||!integer(bonds,0,12)||!integer(lonePairs,0,4)||!integer(charge,-3,3))throw new RangeError('Use integer electron bookkeeping');
 const formalCharge=valence-2*lonePairs-bonds,shellElectrons=2*(lonePairs+bonds);
 return{valence,bonds,lonePairs,charge,formalCharge,shellElectrons,octet:shellElectrons===8,chargeMatch:formalCharge===charge};
}
export const LEWIS_PRESETS=[
 {name:'water',formula:'H₂O',central:'O',valence:6,terminal:'H',terminalValence:1,count:2,charge:0,bond:1,lone:2,terminalLone:0},
 {name:'ammonia',formula:'NH₃',central:'N',valence:5,terminal:'H',terminalValence:1,count:3,charge:0,bond:1,lone:1,terminalLone:0},
 {name:'methane',formula:'CH₄',central:'C',valence:4,terminal:'H',terminalValence:1,count:4,charge:0,bond:1,lone:0,terminalLone:0},
 {name:'ammonium',formula:'NH₄⁺',central:'N',valence:5,terminal:'H',terminalValence:1,count:4,charge:1,bond:1,lone:0,terminalLone:0},
 {name:'boron trifluoride',formula:'BF₃',central:'B',valence:3,terminal:'F',terminalValence:7,count:3,charge:0,bond:1,lone:0,terminalLone:3},
 {name:'carbon dioxide',formula:'CO₂',central:'C',valence:4,terminal:'O',terminalValence:6,count:2,charge:0,bond:2,lone:0,terminalLone:2},
];
export function lewisMolecule(index=0,bond=1,lone=2){
 if(!integer(index,0,LEWIS_PRESETS.length-1)||!integer(bond,0,3)||!integer(lone,0,4))throw new RangeError('Use a listed molecule and integer electron pairs');
 const p=LEWIS_PRESETS[index],budget=p.valence+p.count*p.terminalValence-p.charge,drawn=2*(p.count*bond+lone+p.count*p.terminalLone),central=lewisCount(p.valence,p.count*bond,lone),terminal=lewisCount(p.terminalValence,bond,p.terminalLone),formalCharge=central.formalCharge+p.count*terminal.formalCharge;
 return{...p,index,bond,lone,budget,drawn,central,terminal,formalCharge,budgetMatch:budget===drawn,chargeMatch:formalCharge===p.charge,terminalShellMatch:terminal.shellElectrons===(p.terminal==='H'?2:8)};
}
export function ionCurvePoint(R=2){
 if(!finite(R,.3,19.9))throw new RangeError('Derivative probes use R=0.3–19.9 Bohr');
 const q=stoIon(R),h=.001,left=stoIon(R-h),right=stoIon(R+h),force=-(right.bonding-left.bonding)/(2*h),curvature=(right.bonding-2*q.bonding+left.bonding)/(h*h);
 return{...q,force,curvature,differenceStep:h};
}
export function ionMinimum(){
 let a=1,b=5,g=(Math.sqrt(5)-1)/2,c=b-g*(b-a),d=a+g*(b-a),fc=stoIon(c).bonding,fd=stoIon(d).bonding;
 for(let j=0;j<70;j++){if(fc<fd){b=d;d=c;fd=fc;c=b-g*(b-a);fc=stoIon(c).bonding;}else{a=c;c=d;fc=fd;d=a+g*(b-a);fd=stoIon(d).bonding;}}
 const q=ionCurvePoint((a+b)/2);return{...q,binding:-.5-q.bonding,searchBracket:[a,b]};
}
export function morseGrid(solver,lambda=5,n=320){
 if(typeof solver!=='function'||!finite(lambda,.25,12)||![160,320,640].includes(n))throw new RangeError('Use the declared finite difference resolutions');
 const lower=-3,upper=16,grid=solver(x=>lambda*lambda*(-Math.expm1(-x))**2,[lower,upper],{n,k:Math.min(8,n),mass:.5,hbar:1});
 const exact=morseModel(lambda).levels,comparison=grid.E.map((energy,j)=>({j,energy,exact:exact[j]?.energy??null,error:exact[j]?energy-exact[j].energy:null,belowThreshold:energy<lambda*lambda}));
 return{lambda,n,lower,upper,dx:(upper-lower)/(n+1),comparison,grid};
}
