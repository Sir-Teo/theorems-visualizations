// SOLID6: stated beam/section teaching models in consistent mm, N, MPa units.
// Beam-load inputs1/2/8 are kN and metres; moments4/10/11 are kN m.
// Algebraic quantities retain exact original-input factors until final rounding.
import * as Rational from './ch06.exact.shared.js';
export const Q=Rational;
const {add,sub,mul,div,neg,sign,exact,approximate,ZERO}=Q;
const cmp=(a,b)=>sign(sub(a,b));
const abs=a=>sign(a)<0?neg(a):exact(a);
const min=(a,b)=>cmp(a,b)<=0?exact(a):exact(b);
const max=(a,b)=>cmp(a,b)>=0?exact(a):exact(b);
const sq=a=>mul(a,a),cube=a=>mul(sq(a),a);
const sum=xs=>xs.reduce(add,ZERO);
const object=p=>{if(p===undefined)return{};if(!p||typeof p!=='object'||Array.isArray(p))throw Error('parameter object required');return p;};
const range=(p,k,d,lo,hi)=>{const x=p[k]===undefined?d:p[k];if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw Error(k+' outside declared domain');return x;};
const choice=(p,k,d,values)=>{const x=p[k]===undefined?d:p[k];if(!values.includes(x))throw Error(k+' outside declared choices');return x;};
export function quantity(x){const e=exact(x),s=sign(e),value=approximate(e);return{value,sign:s,logMagnitude:Q.logAbs(e),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),exact:e};}
const fields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,quantity(v)]));
export const lin=(n,a,b)=>Array.from({length:n},(_,j)=>j===0?a:j===n-1?b:a+(b-a)*j/(n-1));

function beamCore(input){
 const p=object(input),parameters={span:range(p,'span',6,1,12),pointLoad:range(p,'pointLoad',30,0,100),uniformLoad:range(p,'uniformLoad',5,0,20),loadFraction:range(p,'loadFraction',.4,0,1)};
 const L=exact(parameters.span),P=exact(parameters.pointLoad),q=exact(parameters.uniformLoad),a=mul(L,parameters.loadFraction),RA=add(mul(P,sub(1,parameters.loadFraction)),div(mul(q,L),2)),RB=add(mul(P,parameters.loadFraction),div(mul(q,L),2));
 return{parameters,L,P,q,a,RA,RB};
}
function beamAtExact(c,x,side='right'){
 const supportLeft=cmp(x,0)>0||(cmp(x,0)===0&&side==='right'),supportRight=cmp(x,c.L)===0&&side==='right',point=cmp(x,c.a)>0||(cmp(x,c.a)===0&&side==='right');
 const V=sub(sub(add(supportLeft?c.RA:0,supportRight?c.RB:0),mul(c.q,x)),point?c.P:0),M=sub(sub(mul(c.RA,x),div(mul(c.q,sq(x)),2)),mul(c.P,max(sub(x,c.a),0)));
 return{V,M,x};
}
export function beamAt(input={},fraction=.5,side='right'){
 const c=beamCore(input),u=range({fraction},'fraction',.5,0,1);choice({side},'side','right',['left','right']);const z=beamAtExact(c,mul(c.L,u),side);
 return{...fields({position:z.x,shear:z.V,moment:z.M}),side};
}
export function beamState(input={}){
 const p=object(input),c=beamCore(p),u=range(p,'cutFraction',.5,0,1),side=choice(p,'side','right',['left','right']),x=mul(c.L,u),z=beamAtExact(c,x,side),left=beamAtExact(c,x,'left'),right=beamAtExact(c,x,'right'),candidates=[ZERO,c.a,c.L];
 if(sign(c.q)>0)for(const root of[div(c.RA,c.q),div(sub(c.RA,c.P),c.q)])if(cmp(root,0)>=0&&cmp(root,c.L)<=0)candidates.push(root);
 candidates.sort(cmp);let peak=beamAtExact(c,candidates[0]);for(const x of candidates.slice(1)){const t=beamAtExact(c,x);if(cmp(t.M,peak.M)>0)peak=t;}
 return{parameters:{...c.parameters,cutFraction:u,side},...fields({leftReaction:c.RA,rightReaction:c.RB,loadPosition:c.a,position:x,shear:z.V,moment:z.M,leftShear:left.V,rightShear:right.V,peakPosition:peak.x,peakMoment:peak.M,forceResidual:sub(add(c.RA,c.RB),add(c.P,mul(c.q,c.L))),momentResidual:sub(mul(c.RB,c.L),add(mul(c.P,c.a),div(mul(c.q,sq(c.L)),2))),endMoment:beamAtExact(c,c.L).M})};
}
export function intervalBalance(input={}){
 const p=object(input),c=beamCore(p),a=range(p,'startFraction',.2,.05,.95),b=range(p,'endFraction',.8,.05,.95),x=mul(c.L,a),y=mul(c.L,b),left=beamAtExact(c,x),right=beamAtExact(c,y),indicator=z=>cmp(z,c.a)>=0?1:0,atom=indicator(y)-indicator(x),uniform=mul(c.q,sub(y,x)),concentrated=mul(c.P,atom),deltaV=sub(right.V,left.V),deltaM=sub(right.M,left.M),areaV=sub(sub(mul(c.RA,sub(y,x)),div(mul(c.q,sub(sq(y),sq(x))),2)),mul(c.P,sub(max(sub(y,c.a),0),max(sub(x,c.a),0))));
 return{parameters:{...c.parameters,startFraction:a,endFraction:b},atomMultiplicity:atom,...fields({start:x,end:y,uniformLoadArea:uniform,pointLoadArea:concentrated,totalLoadArea:add(uniform,concentrated),startShear:left.V,endShear:right.V,shearChange:deltaV,startMoment:left.M,endMoment:right.M,momentChange:deltaM,shearArea:areaV,shearResidual:add(deltaV,add(uniform,concentrated)),momentResidual:sub(deltaM,areaV)})};
}

function section(B,h,tw,tf){
 B=exact(B);h=exact(h);tw=exact(tw);tf=exact(tf);const H=div(h,2),c=sub(H,tf),pieces=cmp(tw,B)===0?[[ZERO,H,B]]:[[ZERO,c,tw],[c,H,B]],area=mul(2,sum(pieces.map(([a,b,w])=>mul(w,sub(b,a))))),I=mul(div(2,3),sum(pieces.map(([a,b,w])=>mul(w,sub(cube(b),cube(a)))))),Z=mul(2,sum(pieces.map(([a,b,w])=>mul(w,div(sub(sq(b),sq(a)),2)))));
 return{B,h,tw,tf,H,c,pieces,area,I,S:div(I,H),Z};
}
function chosenSection(input){
 const p=object(input),kind=choice(p,'section','rectangle',['rectangle','I-section']),parameters={section:kind,width:range(p,'width',150,40,200),height:range(p,'height',300,80,400),webFraction:range(p,'webFraction',.1,.05,.8),flangeFraction:range(p,'flangeFraction',.1,.05,.3)};
 const g=section(parameters.width,parameters.height,kind==='rectangle'?parameters.width:mul(parameters.width,parameters.webFraction),kind==='rectangle'?0:mul(parameters.height,parameters.flangeFraction));return{parameters,g};
}
const geometryFields=g=>fields({width:g.B,height:g.h,webWidth:g.tw,flangeThickness:g.tf,halfHeight:g.H,webHalfHeight:g.c,area:g.area,inertia:g.I,sectionModulus:g.S,plasticModulus:g.Z});
function integrateWidth(g,lo,hi,power){return sum(g.pieces.map(([a,b,w])=>{a=max(a,lo);b=min(b,hi);if(cmp(a,b)>=0)return ZERO;return mul(w,div(sub(power===1?sq(b):cube(b),power===1?sq(a):cube(a)),power+1));}));}
export function flexure(input={}){
 const p=object(input),parameters={width:range(p,'width',100,20,300),height:range(p,'height',200,20,400),modulus:range(p,'modulus',210,1,250),moment:range(p,'moment',50,-100,100),eta:range(p,'eta',.5,-1,1)},I=div(mul(parameters.width,cube(parameters.height)),12),M=mul(parameters.moment,1e6),E=mul(parameters.modulus,1000),H=div(parameters.height,2),y=mul(H,parameters.eta),sigma=neg(div(mul(M,y),I)),curvature=div(M,mul(E,I)),top=neg(div(mul(M,H),I));
 return{parameters,...fields({inertia:I,sectionModulus:div(I,H),height:y,stress:sigma,strain:div(sigma,E),curvature,topStress:top,bottomStress:neg(top),axialResultant:0,momentResultant:M,momentResidual:sub(mul(mul(E,curvature),I),M)})};
}
export function areaAssembly(input={}){
 const p=object(input),defaults=[{x:-30,y:-100,width:80,height:20},{x:20,y:0,width:120,height:30},{x:0,y:100,width:60,height:20}],rects=p.rects===undefined?defaults:p.rects;
 if(!Array.isArray(rects)||rects.length!==3||![0,1,2].every(i=>Object.hasOwn(rects,i)))throw Error('three dense rectangle records required');
 const limits=[[-160,-80],[-20,20],[80,160]],parts=rects.map((r,j)=>{r=object(r);for(const k of['x','y','width','height'])if(!Object.hasOwn(r,k))throw Error('complete rectangle record required');const x=range(r,'x',0,-120,120),y=range(r,'y',0,...limits[j]),b=range(r,'width',80,20,160),h=range(r,'height',20,10,40);return{x,y,b,h,A:mul(b,h),ownX:div(mul(b,cube(h)),12),ownY:div(mul(h,cube(b)),12)};}),A=sum(parts.map(r=>r.A)),cx=div(sum(parts.map(r=>mul(r.A,r.x))),A),cy=div(sum(parts.map(r=>mul(r.A,r.y))),A),axis=range(p,'axisHeight',0,-220,220),Ix=sum(parts.map(r=>add(r.ownX,mul(r.A,sq(sub(r.y,cy)))))),Iy=sum(parts.map(r=>add(r.ownY,mul(r.A,sq(sub(r.x,cx)))))),Ixy=sum(parts.map(r=>mul(r.A,mul(sub(r.x,cx),sub(r.y,cy))))),parallel=mul(A,sq(sub(axis,cy))),Iaxis=add(Ix,parallel),rows=parts.map(r=>({x:r.x,y:r.y,width:r.b,height:r.h,...fields({area:r.A,ownTerm:r.ownX,parallelTerm:mul(r.A,sq(sub(r.y,axis))),axisContribution:add(r.ownX,mul(r.A,sq(sub(r.y,axis))))})}));
 return{parameters:{rects:parts.map(r=>({x:r.x,y:r.y,width:r.b,height:r.h})),axisHeight:axis},parts:rows,...fields({area:A,centroidX:cx,centroidY:cy,inertiaX:Ix,inertiaY:Iy,productInertia:Ixy,axisInertia:Iaxis,axisShiftTerm:parallel,decompositionResidual:sub(Iaxis,sum(rows.map(r=>r.axisContribution.exact)))})};
}
export function sectionEfficiency(input={}){
 const p=object(input),parameters={side:range(p,'side',70,20,100),heightRatio:range(p,'heightRatio',3,1,5),redistribution:range(p,'redistribution',.5,0,.9),moment:range(p,'moment',20,-100,100)},a=exact(parameters.side),A=sq(a),h=mul(a,parameters.heightRatio),phi=add(div(1,4),mul(div(3,4),parameters.redistribution)),B=div(mul(phi,A),div(h,4)),tw=div(mul(sub(1,phi),A),mul(div(3,4),h)),g=section(B,h,tw,div(h,8)),square=section(a,a,a,0),tall=section(div(A,h),h,div(A,h),0),M=mul(parameters.moment,1e6);
 return{parameters,chosen:geometryFields(g),square:geometryFields(square),tall:geometryFields(tall),...fields({areaResidual:sub(g.area,A),sectionModulusRatio:div(g.S,square.S),tallRatio:div(tall.S,square.S),chosenExtremeStress:div(abs(M),g.S),squareExtremeStress:div(abs(M),square.S),tallExtremeStress:div(abs(M),tall.S)})};
}

const sinc=t=>Math.abs(t)<1e-3?1-t*t/6+t**4/120-t**6/5040:Math.sin(t)/t;
const cosc=t=>Math.abs(t)<1e-3?.5-t*t/24+t**4/720-t**6/40320:2*(Math.sin(t/2)/t)**2;
export function planeSections(input={}){
 const p=object(input),parameters={curvature:range(p,'curvature',.6,-1,1),length:range(p,'length',1,.2,2),height:range(p,'height',.12,.02,.2),positionFraction:range(p,'positionFraction',.7,0,1),eta:range(p,'eta',.5,-1,1)},k=exact(parameters.curvature),L=exact(parameters.length),s=mul(L,parameters.positionFraction),y=mul(div(parameters.height,2),parameters.eta),angle=mul(k,s),theta=approximate(angle),strain=neg(mul(k,y)),stretch=add(1,strain),cx=mul(s,sinc(theta)),cy=mul(mul(k,sq(s)),cosc(theta)),px=sub(cx,mul(y,Math.sin(theta))),py=add(cy,mul(y,Math.cos(theta)));
 return{parameters,...fields({position:s,fibreOffset:y,angle,endAngle:mul(k,L),strain,stretch,lengthChange:mul(L,strain),fibreLength:mul(L,stretch),outerStrainMagnitude:mul(abs(k),div(parameters.height,2))}),radius:sign(k)?quantity(div(1,abs(k))):null,center:[approximate(cx),approximate(cy)],point:[approximate(px),approximate(py)],normal:[-Math.sin(theta),Math.cos(theta)],geometryApproximate:true};
}
export function beamShear(input={}){
 const p=object(input),{parameters:sp,g}=chosenSection(p),V=mul(range(p,'shear',40,-100,100),1000),eta=range(p,'eta',.3,-1,1),side=choice(p,'interfaceSide','web',['web','flange']),y=mul(g.H,eta),u=abs(y),atInterface=cmp(g.tw,g.B)!==0&&cmp(u,g.c)===0,web=cmp(u,g.c)<0||(atInterface&&side==='web'),width=cmp(g.tw,g.B)===0?g.B:web?g.tw:g.B,first=integrateWidth(g,u,g.H,1),flow=div(mul(V,first),g.I),tau=div(flow,width),Q0=integrateWidth(g,0,g.H,1),intQ=mul(2,sum(g.pieces.map(([a,b,w])=>{const above=integrateWidth(g,b,g.H,1);return sub(mul(add(above,div(mul(w,sq(b)),2)),sub(b,a)),div(mul(w,sub(cube(b),cube(a))),6));}))),resultant=div(mul(V,intQ),g.I);
 return{parameters:{...sp,shear:approximate(div(V,1000)),eta,interfaceSide:side},geometry:geometryFields(g),atInterface,region:cmp(g.tw,g.B)===0?'rectangle':web?'web':'flange',...fields({height:y,firstMoment:first,widthAtCut:width,shearFlow:flow,stress:tau,meanStress:div(V,g.area),centroidStress:div(mul(V,Q0),mul(g.I,g.tw)),geometricPeakFactor:div(mul(Q0,g.area),mul(g.I,g.tw)),interfaceEta:div(g.c,g.H),webInterfaceStress:div(mul(V,integrateWidth(g,g.c,g.H,1)),mul(g.I,g.tw)),flangeInterfaceStress:div(mul(V,integrateWidth(g,g.c,g.H,1)),mul(g.I,g.B)),shearResultant:resultant,resultantResidual:sub(resultant,V)})};
}
export function jointShearFlow(input={}){
 const p=object(input),parameters={span:range(p,'span',6,1,10),uniformLoad:range(p,'uniformLoad',5,0,10),stationFraction:range(p,'stationFraction',.15,0,1),pitch:range(p,'pitch',100,10,300),capacity:range(p,'capacity',5,.1,50),rows:choice(p,'rows',1,[1,2])},g=section(150,300,10,20),x=mul(parameters.span,parameters.stationFraction),V=mul(mul(parameters.uniformLoad,1000),sub(div(parameters.span,2),x)),Vmax=div(mul(mul(parameters.uniformLoad,1000),parameters.span),2),first=mul(mul(g.B,g.tf),sub(g.H,div(g.tf,2))),flow=div(mul(V,first),g.I),peak=div(mul(Vmax,first),g.I),capacity=mul(parameters.capacity,1000),localDemand=div(mul(abs(flow),parameters.pitch),parameters.rows),bound=div(mul(peak,parameters.pitch),parameters.rows),allowed=q=>sign(q)?quantity(div(mul(parameters.rows,capacity),abs(q))):null;
 return{parameters,geometry:geometryFields(g),...fields({position:x,shear:V,jointFirstMoment:first,shearFlow:flow,peakFlow:peak,localConnectorProxy:localDemand,peakConnectorBound:bound,capacity,localMargin:sub(capacity,localDemand),peakMargin:sub(capacity,bound)}),localAllowedPitch:allowed(flow),globalAllowedPitch:allowed(peak),withinPeakBound:cmp(bound,capacity)<=0};
}
function channelCore(input){
 const p=object(input),parameters={flangeWidth:range(p,'flangeWidth',100,60,200),webHeight:range(p,'webHeight',200,100,400),thickness:range(p,'thickness',3,1,5),shear:range(p,'shear',30,-100,100),loadOffsetFraction:range(p,'loadOffsetFraction',.25,-1,2),loadPosition:choice(p,'loadPosition','free',['free','centroid','shear centre'])},b=exact(parameters.flangeWidth),h=exact(parameters.webHeight),t=exact(parameters.thickness),V=mul(parameters.shear,1000),I=mul(mul(t,sq(h)),add(div(h,12),div(b,2))),centroid=div(sq(b),add(h,mul(2,b))),xs=neg(div(mul(3,sq(b)),add(h,mul(6,b)))),e=parameters.loadPosition==='centroid'?centroid:parameters.loadPosition==='shear centre'?xs:mul(b,parameters.loadOffsetFraction);
 return{parameters,b,h,t,V,I,centroid,xs,e};
}
export function channelShearCenter(input={}){
 const c=channelCore(input),{b,h,t,V,I,centroid,xs,e}=c,Ftop=neg(div(mul(mul(mul(V,t),h),sq(b)),mul(4,I))),torque=neg(mul(h,Ftop)),loadTorque=neg(mul(xs,V)),vertical=div(mul(mul(V,t),add(mul(b,sq(h)),div(cube(h),6))),mul(2,I));
 return{parameters:c.parameters,...fields({inertia:I,centroid,shearCentre:xs,loadCoordinate:e,flangeResultantTop:Ftop,flangeResultantBottom:neg(Ftop),verticalResultant:vertical,flowTorqueCCW:torque,shearCentreLoadTorqueCCW:loadTorque,forceResidual:sub(vertical,V),torqueResidual:sub(torque,loadTorque),twistingMomentCCW:neg(mul(V,sub(e,xs))),thinness:div(t,min(b,h))}),zeroLoad:sign(V)===0};
}
export function channelFlowAt(input={},segment='web',fraction=.5){
 const c=channelCore(input),f=range({fraction},'fraction',.5,0,1);choice({segment},'segment','web',['web','top','bottom']);let x,y,q,direction;
 if(segment==='web'){x=ZERO;y=mul(c.h,sub(f,.5));q=div(mul(mul(c.V,c.t),add(mul(c.b,c.h),sub(div(sq(c.h),4),sq(y)))),mul(2,c.I));direction=[0,-1];}
 else{x=mul(c.b,f);y=mul(div(c.h,2),segment==='top'?1:-1);q=div(mul(mul(mul(c.V,c.t),c.h),sub(c.b,x)),mul(2,c.I));direction=segment==='top'?[-1,0]:[1,0];}
 return{segment,fraction:f,...fields({horizontal:x,vertical:y,flow:q,stress:div(q,c.t)}),direction};
}

function compositeCore(input){
 const p=object(input),parameters={width:range(p,'width',100,50,200),lowerHeight:range(p,'lowerHeight',150,50,300),upperHeight:range(p,'upperHeight',10,5,50),modulus:range(p,'modulus',10,5,50),modulusRatio:range(p,'modulusRatio',20,1,20),moment:range(p,'moment',20,-100,100)},b=exact(parameters.width),h1=exact(parameters.lowerHeight),h2=exact(parameters.upperHeight),E1=mul(parameters.modulus,1000),E2=mul(E1,parameters.modulusRatio),A1=mul(b,h1),A2=mul(b,h2),y1=div(h1,2),y2=add(h1,div(h2,2)),yN=div(add(mul(mul(E1,A1),y1),mul(mul(E2,A2),y2)),add(mul(E1,A1),mul(E2,A2))),I1=div(mul(b,cube(h1)),12),I2=div(mul(b,cube(h2)),12),D1=mul(E1,add(I1,mul(A1,sq(sub(y1,yN))))),D2=mul(E2,add(I2,mul(A2,sq(sub(y2,yN))))),D=add(D1,D2),M=mul(parameters.moment,1e6),k=div(M,D);
 return{parameters,b,h1,h2,E1,E2,A1,A2,y1,y2,yN,I1,I2,D1,D2,D,M,k};
}
export function compositeStressAt(input={},layer='lower',fraction=.5){
 const c=compositeCore(input),f=range({fraction},'fraction',.5,0,1);choice({layer},'layer','lower',['lower','upper']);const y=layer==='lower'?mul(c.h1,f):add(c.h1,mul(c.h2,f)),strain=mul(c.k,sub(c.yN,y)),E=layer==='lower'?c.E1:c.E2;
 return{layer,fraction:f,...fields({height:y,strain,stress:mul(E,strain)})};
}
export function compositeSection(input={}){
 const p=object(input),c=compositeCore(p),fraction=range(p,'sampleFraction',.5,0,1),side=choice(p,'interfaceSide','lower',['lower','upper']),H=add(c.h1,c.h2),y=mul(H,fraction),atInterface=cmp(y,c.h1)===0,layer=cmp(y,c.h1)<0||(atInterface&&side==='lower')?'lower':'upper',strain=mul(c.k,sub(c.yN,y)),interfaceStrain=mul(c.k,sub(c.yN,c.h1)),N1=mul(mul(c.E1,c.k),mul(c.A1,sub(c.yN,c.y1))),N2=mul(mul(c.E2,c.k),mul(c.A2,sub(c.yN,c.y2))),resultant=add(mul(c.k,c.D1),mul(c.k,c.D2));
 return{parameters:{...c.parameters,sampleFraction:fraction,interfaceSide:side},layer,atInterface,...fields({neutralHeight:c.yN,geometricCentroid:div(H,2),neutralShift:sub(c.yN,div(H,2)),bendingStiffness:c.D,transformedInertia:div(c.D,c.E1),transformedUpperWidth:mul(c.b,c.parameters.modulusRatio),curvature:c.k,height:y,strain,stress:mul(layer==='lower'?c.E1:c.E2,strain),interfaceStrain,lowerInterfaceStress:mul(c.E1,interfaceStrain),upperInterfaceStress:mul(c.E2,interfaceStrain),lowerAxialForce:N1,upperAxialForce:N2,axialResultant:add(N1,N2),momentResultant:resultant,momentResidual:sub(resultant,c.M)})};
}
function angleGeometry(input){
 const p=object(input),parameters={width:range(p,'width',100,60,200),height:range(p,'height',150,60,250),thickness:range(p,'thickness',10,5,20)},B=exact(parameters.width),h=exact(parameters.height),t=exact(parameters.thickness),rects=[{x:div(t,2),y:div(h,2),b:t,h},{x:div(add(B,t),2),y:div(t,2),b:sub(B,t),h:t}];
 for(const r of rects)r.A=mul(r.b,r.h);const A=sum(rects.map(r=>r.A)),cx=div(sum(rects.map(r=>mul(r.A,r.x))),A),cy=div(sum(rects.map(r=>mul(r.A,r.y))),A),Ix=sum(rects.map(r=>add(div(mul(r.b,cube(r.h)),12),mul(r.A,sq(sub(r.y,cy)))))),Iy=sum(rects.map(r=>add(div(mul(r.h,cube(r.b)),12),mul(r.A,sq(sub(r.x,cx)))))),Ixy=sum(rects.map(r=>mul(r.A,mul(sub(r.x,cx),sub(r.y,cy))))),D=sub(mul(Ix,Iy),sq(Ixy));if(sign(D)<=0)throw Error('positive area-inertia determinant required');
 return{parameters,B,h,t,rects,A,cx,cy,Ix,Iy,Ixy,D};
}
export function unsymmetricBending(input={}){
 const p=object(input),g=angleGeometry(p),parameters={...g.parameters,momentY:range(p,'momentY',0,-5,5),momentZ:range(p,'momentZ',2,-5,5),modulus:range(p,'modulus',210,20,250),span:range(p,'span',1,.2,2)},My=mul(parameters.momentY,1e6),Mz=mul(parameters.momentZ,1e6),E=mul(parameters.modulus,1000),L=mul(parameters.span,1000),a=div(add(mul(g.Ix,My),mul(g.Ixy,Mz)),g.D),b=neg(div(add(mul(g.Ixy,My),mul(g.Iy,Mz)),g.D)),ky=neg(div(b,E)),kz=neg(div(a,E)),factor=div(sq(L),2),N=sum(g.rects.map(r=>mul(r.A,add(mul(a,sub(r.x,g.cx)),mul(b,sub(r.y,g.cy)))))),actualMy=add(mul(a,g.Iy),mul(b,g.Ixy)),actualMz=neg(add(mul(a,g.Ixy),mul(b,g.Ix))),vertices=[[0,0],[g.B,0],[g.B,g.t],[g.t,g.t],[g.t,g.h],[0,g.h]].map(([x,y])=>({...fields({horizontal:x,vertical:y,stress:add(mul(a,sub(x,g.cx)),mul(b,sub(y,g.cy)))})})),peak=vertices.reduce((best,v)=>cmp(abs(v.stress.exact),abs(best.stress.exact))>0?v:best,vertices[0]),normalScale=max(abs(a),abs(b)),normal=sign(normalScale)?[approximate(div(a,normalScale)),approximate(div(b,normalScale))]:null;
 const length=normal?Math.hypot(...normal):0,unit=normal?normal.map(x=>x/length):null,principalAngle=.5*Math.atan2(2*approximate(g.Ixy),approximate(sub(g.Iy,g.Ix)));
 return{parameters,vertices,neutralNormal:unit,neutralDirection:unit?[-unit[1],unit[0]]:null,principalAngle,geometryApproximate:true,...fields({area:g.A,centroidHorizontal:g.cx,centroidVertical:g.cy,inertiaHorizontal:g.Ix,inertiaVertical:g.Iy,productInertia:g.Ixy,determinant:g.D,stressCoefficientHorizontal:a,stressCoefficientVertical:b,curvatureVertical:ky,curvatureHorizontal:kz,tipVertical:mul(factor,ky),tipHorizontal:mul(factor,kz),uncoupledTipVertical:div(mul(factor,Mz),mul(E,g.Ix)),uncoupledTipHorizontal:neg(div(mul(factor,My),mul(E,g.Iy))),peakStressMagnitude:abs(peak.stress.exact),peakHorizontal:peak.horizontal.exact,peakVertical:peak.vertical.exact,axialResultant:N,momentYResultant:actualMy,momentZResultant:actualMz,momentYResidual:sub(actualMy,My),momentZResidual:sub(actualMz,Mz)})};
}
function plasticCore(input){
 const p=object(input),{parameters:sp,g}=chosenSection(p),parameters={...sp,modulus:range(p,'modulus',210,20,250),yieldStress:range(p,'yieldStress',250,50,500),curvatureRatio:range(p,'curvatureRatio',2,0,8),direction:choice(p,'direction','positive',['positive','negative']),state:choice(p,'state','finite',['finite','plastic limit'])},Y=exact(parameters.yieldStress),E=mul(parameters.modulus,1000),chi=exact(parameters.curvatureRatio),sgn=parameters.direction==='positive'?1:-1,limit=parameters.state==='plastic limit',c=limit?ZERO:sign(chi)?min(g.H,div(g.H,chi)):g.H,elasticIntegral=integrateWidth(g,0,c,2),plasticIntegral=integrateWidth(g,c,g.H,1),Mmag=limit?mul(Y,g.Z):mul(mul(2,Y),add(mul(div(chi,g.H),elasticIntegral),plasticIntegral)),My=mul(Y,g.S),Mp=mul(Y,g.Z),coreArea=mul(2,sum(g.pieces.map(([a,b,w])=>{b=min(b,c);return cmp(a,b)<0?mul(w,sub(b,a)):ZERO;})));
 return{parameters,g,Y,E,chi,sgn,limit,c,Mmag,My,Mp,coreArea};
}
export function plasticStressAt(input={},eta=.5){
 const c=plasticCore(input),u=range({eta},'eta',.5,-1,1),y=mul(c.g.H,u),magnitude=c.limit?(u===0?ZERO:c.Y):mul(c.Y,min(mul(c.chi,abs(u)),1)),stress=mul(-c.sgn*sign(u),magnitude);
 return{eta:u,...fields({height:y,stress})};
}
export function plasticBending(input={}){
 const c=plasticCore(input),phase=c.limit?'plastic limit':sign(c.chi)===0?'unloaded':cmp(c.chi,1)<0?'elastic':cmp(c.chi,1)===0?'first yield':'partly yielded',M=mul(c.sgn,c.Mmag),top=mul(-c.sgn,c.limit?c.Y:mul(c.Y,min(c.chi,1)));
 return{parameters:c.parameters,phase,geometry:geometryFields(c.g),curvature:c.limit?null:quantity(div(mul(mul(c.sgn,c.chi),c.Y),mul(c.E,c.g.H))),...fields({yieldMoment:c.My,plasticMoment:c.Mp,moment:M,signedPlasticMoment:mul(c.sgn,c.Mp),shapeFactor:div(c.Mp,c.My),momentToYield:div(c.Mmag,c.My),momentToPlastic:div(c.Mmag,c.Mp),plasticDeficit:sub(c.Mp,c.Mmag),coreHalfHeight:c.c,elasticAreaFraction:div(c.coreArea,c.g.area),yieldedAreaFraction:sub(1,div(c.coreArea,c.g.area)),topStress:top,bottomStress:neg(top),axialResultant:0})};
}
