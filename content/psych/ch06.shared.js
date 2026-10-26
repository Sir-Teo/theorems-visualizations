// Own geometric constructions and declared statistical models, not a model of
// every observer's perception. Exact finite values retain original binary64 inputs.
import * as Q from './ch06.exact.shared.js';
export {Q};
const {add,sub,mul,div,sign}=Q;
export function quantity(x){
 const exact=Q.exact(x),value=Q.approximate(exact),s=sign(exact);
 return {exact,value,sign:s,logMagnitude:Q.logAbs(exact),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};
}
const pack=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v===null?null:quantity(v)]));
function bounded(x,a,b,name){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw RangeError(name+' outside declared range');return Q.exact(x);}
function integer(x,a,b,name){bounded(x,a,b,name);if(!Number.isInteger(x))throw RangeError(name+' must be an integer');return x;}
function choice(value,values,name){if(!values.includes(value))throw RangeError('Unknown '+name);return value;}
const abs=a=>sign(a)<0?Q.neg(a):a;
const maxAbs=(a,b)=>Q.sign(Q.sub(abs(a),abs(b)))>=0?abs(a):abs(b);
// atan2 is approximate; its arguments and the sign classification are exact.
// Scale first, so tiny deficits are not lost by subtracting rounded angles.
function angle(cross,dot){
 const cs=sign(cross),ds=sign(dot);if(!cs&&ds>=0)return {radians:0,degrees:0,arcminutes:0,sign:0,logMagnitude:-Infinity,belowRange:false,approximate:true,arguments:pack({cross,dot})};
 const unit=maxAbs(cross,dot),a=Q.approximate(div(cross,unit)),b=Q.approximate(div(dot,unit)),radians=Math.atan2(a,b),s=cs||1;
 const small=ds>0&&Math.abs(radians)<1e-8,ratio=small?div(cross,dot):null;
 const logMagnitude=small?Q.logAbs(cross)-Q.logAbs(dot):Math.log(Math.abs(radians));
 const scaled=factor=>small?Q.approximate(mul(ratio,factor)):radians*factor;
 return {radians,degrees:scaled(180/Math.PI),arcminutes:scaled(10800/Math.PI),sign:s,logMagnitude,belowRange:cs!==0&&radians===0,approximate:true,arguments:pack({cross,dot})};
}
export function stereoGeometry({halfEyeSeparation=.3,fixationDistance=6,pointX=.5,pointDepth=4}={}){
 const b=bounded(halfEyeSeparation,.2,.6,'half eye separation'),F=bounded(fixationDistance,4,10,'fixation distance'),x=bounded(pointX,-1.5,1.5,'point horizontal position'),z=bounded(pointDepth,.5,15,'point depth');
 const left=angle(sub(mul(add(x,b),F),mul(b,z)),add(mul(z,F),mul(b,add(x,b))));
 const right=angle(add(mul(sub(x,b),F),mul(b,z)),sub(mul(z,F),mul(b,sub(x,b))));
 const A=mul(mul(2,b),z),D=sub(add(mul(x,x),mul(z,z)),mul(b,b)),A0=mul(mul(2,b),F),D0=sub(mul(F,F),mul(b,b));
 const cross=sub(mul(A,D0),mul(A0,D)),dot=add(mul(D,D0),mul(A,A0)),disparity=angle(cross,dot);
 const center=div(D0,mul(2,F)),radius=div(add(mul(F,F),mul(b,b)),mul(2,F));
 return {left,right,disparity,...pack({pointX:x,pointDepth:z,fixationDistance:F,halfEyeSeparation:b,horopterCenterDepth:center,horopterRadius:radius,horopterDeficit:sub(sub(mul(radius,radius),mul(x,x)),mul(sub(z,center),sub(z,center)))}),classification:sign(cross)>0?'crossed':sign(cross)<0?'uncrossed':'zero disparity',angleCoordinatesApproximate:true};
}
export function pinhole({worldX=1,worldHeight=1,depth=4,cameraX=0,focalLength=1}={}){
 const X=bounded(worldX,-4,4,'object horizontal position'),S=bounded(worldHeight,.1,4,'world height'),Z=bounded(depth,.5,15,'depth'),C=bounded(cameraX,-1,1,'camera position'),f=bounded(focalLength,.5,2,'focal length');
 return pack({imageX:div(mul(f,sub(X,C)),Z),imageHeight:div(mul(f,S),Z),cameraDerivative:Q.neg(div(f,Z)),worldX:X,worldHeight:S,depth:Z});
}
export function sizeDistance({worldSize=1,distance=4,retinalRatio=.2}={}){
 const S=bounded(worldSize,.5,2,'world size'),D=bounded(distance,1,10,'scaling distance'),r=bounded(retinalRatio,.05,.5,'fixed image diameter/focal length');
 return {...pack({worldSize:S,scalingDistance:D,realObjectImageRatio:div(S,D),fixedImageRatio:r,fixedAngleScaledSize:mul(D,r),compensatedRealObjectSize:mul(div(S,D),D)}),realObjectAngularDiameter:angle(mul(4,mul(S,D)),sub(mul(4,mul(D,D)),mul(S,S))),fixedAngularDiameter:angle(mul(4,r),sub(4,mul(r,r))),illustration:true};
}
export function cueCombination({visual=52,haptic=58,visualSD=1,hapticSD=2,correlation=0,chosenVisualWeight=.5,rule='independent MLE'}={}){
 const v=bounded(visual,40,70,'visual estimate'),h=bounded(haptic,40,70,'haptic estimate'),sv=bounded(visualSD,.25,10,'visual SD'),sh=bounded(hapticSD,.25,10,'haptic SD'),rho=bounded(correlation,-.8,.8,'correlation'),chosen=bounded(chosenVisualWeight,0,1,'chosen visual weight');choice(rule,['independent MLE','correlated minimum variance','chosen weight'],'weight rule');
 const V=mul(sv,sv),H=mul(sh,sh),cov=mul(rho,mul(sv,sh)),den=sub(add(V,H),mul(2,cov)),independent=div(H,add(V,H)),optimal=div(sub(H,cov),den),w=rule==='independent MLE'?independent:rule==='correlated minimum variance'?optimal:chosen,other=sub(1,w);
 const variance=add(add(mul(mul(w,w),V),mul(mul(other,other),H)),mul(mul(2,mul(w,other)),cov)),minimum=div(sub(mul(V,H),mul(cov,cov)),den),mean=add(mul(w,v),mul(other,h));
 return {...pack({visual:v,haptic:h,visualVariance:V,hapticVariance:H,covariance:cov,visualWeight:w,hapticWeight:other,independentVisualWeight:independent,optimalVisualWeight:optimal,combinedMean:mean,actualVariance:variance,independenceVariance:div(mul(V,H),add(V,H)),optimalVariance:minimum,variancePenalty:sub(variance,minimum),weightSum:add(w,other)}),rule,independentAssumption:sign(rho)===0,weightOutsideUnitInterval:sign(w)<0||sign(sub(w,1))>0,betterThanVisual:sign(sub(variance,V))<0,betterThanHaptic:sign(sub(variance,H))<0,illustration:true};
}
// A deterministic texture realization. No cryptographic or exact iid claim.
export function textureBit(seed,index){let z=(seed+Math.imul(index,0x9e3779b9))>>>0;z=Math.imul(z^(z>>>16),0x85ebca6b);z=Math.imul(z^(z>>>13),0xc2b2ae35);return((z^(z>>>16))>>>31)&1;}
export function stereogram({seed=37,disparity=3,shape='square',size=36}={}){
 integer(seed,0,999,'texture seed');integer(disparity,-5,5,'crossed disparity');integer(size,24,48,'texture grid size');choice(shape,['square','circle','triangle'],'depth shape');
 const maskAt=(x,y)=>{const dx=2*x-(size-1),dy=2*y-(size-1),r=Math.floor(size/3);return shape==='square'?Math.abs(dx)<=r&&Math.abs(dy)<=r:shape==='circle'?dx*dx+dy*dy<=r*r:dy>=-r&&dy<=r&&2*Math.abs(dx)<=r-dy;};
 const mask=Array.from({length:size*size},(_,i)=>maskAt(i%size,Math.floor(i/size))),left=mask.map((_,i)=>textureBit(seed,i)),right=[],sourceIndices=[],freshIndices=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,sx=x+disparity,foreground=sx>=0&&sx<size&&maskAt(sx,y),source=foreground?y*size+sx:!maskAt(x,y)?i:null;
  right.push(source===null?textureBit(seed,1000000+i):left[source]);sourceIndices.push(source);if(source===null)freshIndices.push(i);
 }
 const used=sourceIndices.filter(i=>i!==null),unique=new Set(used);if(unique.size!==used.length)throw Error('Duplicate source ownership inside one eye image');
 return {size,seed,disparity,shape,left,right,mask,sourceIndices,freshIndices,foregroundCount:mask.filter(Boolean).length,leftOnes:left.reduce((s,v)=>s+v,0),rightOnes:right.reduce((s,v)=>s+v,0),sourceOwnershipUnique:true,illustration:true};
}

// Remaining chapter stimuli are authored constructions, never fitted responses.
const xy=(x,y)=>[quantity(x),quantity(y)];
export function figureGround({width=.8,asymmetry=0}={}){
 const w=bounded(width,.4,1.5,'central width'),a=bounded(asymmetry,-.25,.25,'asymmetry');
 const ys=[-1,-.8,-.6,-.4,-.3,-.2,-.1,0,.08,.16,.24,.32,.45,.6,.75,.9,1].map(Q.exact);
 const profile=[.85,.8,.65,.5,.47,.4,.46,.42,.44,.4,.24,.42,.52,.6,.61,.66,.7].map(Q.exact);
 const h=ys.slice(1).map((y,i)=>sub(y,ys[i])),d=h.map((v,i)=>div(sub(profile[i+1],profile[i]),v)),slopes=ys.map((_,i)=>{
  if(!i||i===ys.length-1||sign(d[i-1])*sign(d[i])<=0)return Q.ZERO;
  const w1=add(mul(2,h[i]),h[i-1]),w2=add(h[i],mul(2,h[i-1]));return div(add(w1,w2),add(div(w1,d[i-1]),div(w2,d[i])));
 });
 // A dense, monotone piecewise-cubic construction, rendered as precisely this
 // polygon. Its area is therefore the displayed polygon's area, not a spline
 // approximation silently substituted for an area calculation.
 const samples=[];for(let i=0;i<h.length;i++)for(let j=0;j<8;j++){
  const t=div(j,8),t2=mul(t,t),t3=mul(t2,t),y=add(ys[i],mul(t,h[i]));
  const p=add(add(mul(add(sub(mul(2,t3),mul(3,t2)),1),profile[i]),mul(add(sub(t3,mul(2,t2)),t),mul(h[i],slopes[i]))),add(mul(add(Q.neg(mul(2,t3)),mul(3,t2)),profile[i+1]),mul(sub(t3,t2),mul(h[i],slopes[i+1]))));samples.push([y,p]);
 }samples.push([ys.at(-1),profile.at(-1)]);
 const left=samples.map(([y,p])=>[sub(mul(a,y),mul(w,p)),y]),right=samples.map(([y,p])=>[add(mul(a,y),mul(w,p)),y]),polygon=[...left,...right.toReversed()];
 let twice=Q.ZERO;for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length];twice=add(twice,sub(mul(p[0],q[1]),mul(p[1],q[0])));}
 const area=div(abs(twice),2),total=Q.exact(6);
 return {polygon:polygon.map(p=>xy(...p)),leftBorder:left.map(p=>xy(...p)),rightBorder:right.map(p=>xy(...p)),...pack({centralArea:area,outerArea:sub(total,area),totalArea:total,centralFraction:div(area,total),outerFraction:sub(1,div(area,total))}),illustration:true};
}
export function proximity({horizontalGap=1,verticalGap=1.7}={}){
 const gx=bounded(horizontalGap,.6,1.8,'horizontal gap'),gy=bounded(verticalGap,.6,1.8,'vertical gap'),points=[];
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)points.push(xy(mul(sub(x,2.5),gx),mul(sub(y,2.5),gy)));
 const relation=sign(sub(gx,gy));return {points,...pack({horizontalGap:gx,verticalGap:gy,gapRatio:div(gx,gy),gapDifference:sub(gx,gy)}),nearestDirection:relation<0?'horizontal':relation>0?'vertical':'tie',illustration:true};
}
export function similarity({horizontalGap=1,verticalGap=1,contrast=.8,pattern='rows'}={}){
 choice(pattern,['rows','columns','checkerboard'],'appearance pattern');const c=bounded(contrast,0,1,'appearance separation'),base=proximity({horizontalGap,verticalGap}),lo=sub(.5,mul(.3,c)),hi=add(.5,mul(.3,c));
 return {...base,pattern,codes:base.points.map((_,i)=>{const x=i%6,y=Math.floor(i/6);return (pattern==='rows'?y:pattern==='columns'?x:x+y)%2?quantity(hi):quantity(lo);}),...pack({lowCode:lo,highCode:hi,codeDifference:sub(hi,lo)}),marksIdentical:sign(c)===0};
}
export function textureUnit(seed,index){let z=(seed+Math.imul(index,0x9e3779b9))>>>0;z=Math.imul(z^(z>>>16),0x85ebca6b);z=Math.imul(z^(z>>>13),0xc2b2ae35);return((z^(z>>>16))>>>0)/4294967296;}
export function continuation({seed=17,jitter=12,clutter=36}={}){
 integer(seed,0,999,'contour seed');bounded(jitter,0,70,'orientation jitter');integer(clutter,0,60,'clutter count');
 const contour=Array.from({length:12},(_,i)=>{const x=add(-2,div(mul(4,i),11)),y=mul(.3,sub(mul(x,x),2)),slope=mul(.6,x),tangent=Math.atan(Q.approximate(slope)),offset=(2*textureUnit(seed,i)-1)*jitter*Math.PI/180;return {position:xy(x,y),tangent,orientation:tangent+offset,offset,contour:true};});
 const background=Array.from({length:clutter},(_,i)=>({position:xy(-2.4+4.8*textureUnit(seed,100+3*i),-1.6+3.2*textureUnit(seed,101+3*i)),tangent:null,orientation:Math.PI*textureUnit(seed,102+3*i),offset:null,contour:false}));
 return {seed,jitter,patches:[...contour,...background],contourCount:12,clutterCount:clutter,meanAbsoluteJitter:contour.reduce((s,p)=>s+Math.abs(p.offset),0)/12,approximateAngles:true,illustration:true};
}
export function gaborSample({x=0,y=0,orientation=0,frequency=3,sigma=.12}={}){
 bounded(x,-10,10,'sample x');bounded(y,-10,10,'sample y');bounded(orientation,-10,10,'orientation');bounded(frequency,.5,8,'frequency');bounded(sigma,.05,.5,'Gaussian SD');
 return Math.exp(-(x*x+y*y)/(2*sigma*sigma))*Math.cos(2*Math.PI*frequency*(x*Math.cos(orientation)+y*Math.sin(orientation)));
}
export function closure({rotation=0,radius=.36}={}){
 bounded(rotation,-180,180,'inducer rotation');bounded(radius,.15,.5,'inducer radius');
 const vertices=[[0,1.3],[-1.3*Math.sqrt(3)/2,-.65],[1.3*Math.sqrt(3)/2,-.65]];
 return {vertices,inducers:vertices.map(([x,y])=>({x,y,radius,mouthAngle:Math.atan2(-y,-x)+rotation*Math.PI/180,mouthWidth:Math.PI/3})),centerCode:242,backgroundCode:242,drawsCentralTriangle:false,approximateGeometry:true,illustration:true};
}
export function commonFate({seed=23,coherence=.8,speed=.35,direction=25,phase=1.5}={}){
 integer(seed,0,999,'motion seed');const coh=bounded(coherence,0,1,'coherence');bounded(speed,.1,.6,'speed');bounded(direction,-180,180,'direction');bounded(phase,0,8,'phase');
 const original=Array.from({length:192},(_,i)=>{const x=(i%16+textureUnit(seed,3*i))/16*4-2,y=(Math.floor(i/16)+textureUnit(seed,3*i+1))/12*3-1.5;return {index:i,x,y,eligible:x*x+y*y<.85*.85,key:textureUnit(seed,3*i+2)};});
 const eligible=original.filter(p=>p.eligible).sort((a,b)=>a.key-b.key||a.index-b.index),k=mul(coh,eligible.length),count=Number(k.n/k.d),selected=new Set(eligible.slice(0,count).map(p=>p.index));
 const wrap=(x,lo,span)=>lo+((x-lo)%span+span)%span;
 const dots=original.map(p=>{const coherent=selected.has(p.index),theta=coherent?direction*Math.PI/180:2*Math.PI*textureUnit(seed,1000+p.index),vx=speed*Math.cos(theta),vy=speed*Math.sin(theta);return {index:p.index,startX:p.x,startY:p.y,x:wrap(p.x+phase*vx,-2,4),y:wrap(p.y+phase*vy,-1.5,3),vx,vy,coherent,eligible:p.eligible};});
 return {seed,phase,dots,eligibleCount:eligible.length,coherentCount:count,...pack({requestedCoherence:coh,actualMaskCoherence:eligible.length?div(count,eligible.length):0}),approximateMotion:true,illustration:true};
}
export function necker({front='lower left'}={}){
 choice(front,['lower left','upper right','flat'],'front interpretation');
 const first=[[-1,-1],[.65,-1],[.65,.65],[-1,.65]],vertices=[...first,...first.map(([x,y])=>[add(x,.65),add(y,.5)])].map(p=>xy(...p));
 return {vertices,edges:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],frontFace:front==='flat'?[]:front==='lower left'?[0,1,2,3]:[4,5,6,7],front,illustration:true};
}
export function mullerLyer({comparison=6,finLength=.9,finAngle=40,context=true}={}){
 const length=bounded(comparison,3,9,'comparison shaft');bounded(finLength,.3,1.5,'fin length');bounded(finAngle,20,75,'fin angle');if(typeof context!=='boolean')throw TypeError('context must be boolean');
 const theta=finAngle*Math.PI/180,dx=finLength*Math.cos(theta),dy=finLength*Math.sin(theta),fins=[];
 for(const[y,L,hand]of[[1,6,-1],[-1,comparison,1]])for(const[end,direction]of[[-L/2,1],[L/2,-1]])for(const s of[-1,1])fins.push([[end,y],[end+direction*hand*dx,y+s*dy]]);
 return {target:[xy(-3,1),xy(3,1)],comparison:[xy(Q.neg(div(length,2)),-1),xy(div(length,2),-1)],fins:context?fins:[],...pack({targetLength:6,comparisonLength:length,matchError:sub(length,6),relativeError:div(sub(length,6),6)}),context,approximateFins:true,illustration:true};
}
export function ponzo({comparison=2,convergence=.55,context='rails'}={}){
 const length=bounded(comparison,1,3,'upper bar length'),c=bounded(convergence,0,.7,'rail convergence');choice(context,['none','rails','rails and texture'],'rail context');
 const near=Q.exact(3.6),far=mul(near,sub(1,c)),depth=div(near,far);
 return {...pack({nearRailGap:near,farRailGap:far,nearBar:2,farBar:length,inferredFarToNearDepth:depth,conditionalWorldSizeRatio:mul(div(length,2),depth),matchError:sub(length,2),relativeError:div(sub(length,2),2)}),nearY:-.65,farY:.65,context,parallelLimit:sign(c)===0,illustration:true};
}
export function ebbinghaus({radius=.35,comparisonRatio=1,smallSurround=.16,largeSurround=.45,ringDistance=1.2,context='small left'}={}){
 const r=bounded(radius,.25,.45,'target radius'),ratio=bounded(comparisonRatio,.7,1.3,'comparison size ratio'),s=bounded(smallSurround,.12,.2,'small surround radius'),l=bounded(largeSurround,.35,.5,'large surround radius'),d=bounded(ringDistance,1.15,1.5,'surround center distance');choice(context,['small left','large left','none'],'surround context');
 const rr=mul(r,ratio),maxCenter=sign(sub(r,rr))>=0?r:rr;
 return {...pack({targetRadius:r,comparisonRadius:rr,radiusRatio:ratio,areaRatio:mul(ratio,ratio),matchError:sub(rr,r),relativeError:sub(ratio,1),smallSurround:s,largeSurround:l,ringDistance:d,minimumCenterGap:sub(sub(d,maxCenter),l),minimumSurroundGap:sub(d,mul(2,l))}),surroundCenters:Array.from({length:6},(_,i)=>[ringDistance*Math.cos(i*Math.PI/3),ringDistance*Math.sin(i*Math.PI/3)]),context,approximateSurroundPositions:true,illustration:true};
}
export function amesRoom({leftDepth=4,rightDepth=8,cameraX=0,cameraY=0,figureHeight=2.4}={}){
 const L=bounded(leftDepth,3,9,'left depth'),R=bounded(rightDepth,3,9,'right depth'),C=bounded(cameraX,-1,1,'camera shift'),CY=bounded(cameraY,-.6,.6,'camera height'),S=bounded(figureHeight,1.2,3,'figure height');
 const corners=[];for(const[u,z]of[[-1.1,L],[1.1,R]])for(const v of[-.6,.9]){const X=mul(u,z),Y=mul(v,z);corners.push({...pack({worldX:X,worldY:Y,depth:z,imageX:div(sub(X,C),z),imageY:div(sub(Y,CY),z)})});}
 const figures=[[-.75,L],[.75,R]].map(([u,z])=>({...pack({worldX:mul(u,z),depth:z,worldHeight:S,imageX:sub(u,div(C,z)),imageBase:sub(-.6,div(CY,z)),imageHeight:div(S,z)})}));
 return {corners,figures,...pack({leftDepth:L,rightDepth:R,cameraX:C,cameraY:CY,figureHeight:S,imageHeightLeftToRight:div(R,L),backWallTopWidth:sub(sub(1.1,div(C,R)),sub(-1.1,div(C,L)))}),rectangularBackProjection:sign(CY)===0||sign(sub(L,R))===0,surfaceConstruction:'Authored back-wall corners; connecting surfaces are explicit triangles, not a historical room reconstruction.',illustration:true};
}
export function moonIllusion({elevation=10,angularDiameter=.5,context=true}={}){
 bounded(elevation,0,90,'elevation');const d=bounded(angularDiameter,.4,.6,'model angular diameter');if(typeof context!=='boolean')throw TypeError('context must be boolean');
 const radius=mul(30,d),theta=elevation*Math.PI/180;
 return {...pack({angularDiameter:d,currentRadius:radius,referenceRadius:radius,diameterRatio:1}),currentPosition:[.82*Math.cos(theta),.15+.72*Math.sin(theta)],referencePosition:[-.7,.87],elevation,context,schematicSky:true,illustration:true};
}
export function monocularScene({nearDepth=3,farDepth=8,cameraX=0,sizeRule='equal world height'}={}){
 const N=bounded(nearDepth,2,6,'near depth'),F=bounded(farDepth,6,12,'far depth'),C=bounded(cameraX,-1,1,'camera shift');choice(sizeRule,['equal world height','equal image height'],'object size rule');
 const sizes=[Q.exact(2),sizeRule==='equal image height'?div(mul(2,F),N):Q.exact(2)],objects=[[-.8,N],[.8,F]].map(([x,z],i)=>pack({worldX:x,worldHeight:sizes[i],depth:z,imageX:div(sub(x,C),z),imageBase:Q.neg(div(1,z)),imageHeight:div(sizes[i],z),referenceImageX:div(x,z),parallaxShift:Q.neg(div(C,z)),cameraDerivative:Q.neg(div(1,z))}));
 return {objects,occluder:pack({worldX:0,depth:1.5,worldHeight:1.2,worldHalfWidth:.18,imageX:Q.neg(div(C,1.5)),imageBase:Q.neg(div(1,1.5)),imageHeight:div(1.2,1.5),imageHalfWidth:div(.18,1.5)}),...pack({nearDepth:N,farDepth:F,cameraX:C,imageHeightRatio:div(objects[0].imageHeight.exact,objects[1].imageHeight.exact),worldHeightRatio:div(sizes[0],sizes[1])}),sizeRule,illustration:true};
}
