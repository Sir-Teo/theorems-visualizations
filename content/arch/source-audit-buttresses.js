// Authored plane statics and finite, massless funicular models. These are not a cathedral assessment.
const finite=(x,lo,hi)=>{if(!Number.isFinite(x)||x<lo||x>hi)throw new RangeError('outside model domain');return x;};
export const MASONRY_WEIGHT=22;
export function pinnacle(H=60,w=1.5,P=260){finite(H,10,120);finite(w,.8,3);finite(P,0,3000);const xi=3.6,height=10.2,top=14,tanSlope=2.8/3.6,vertical=H*tanSlope,topWeight=MASONRY_WEIGHT*w*(top-height),axis=xi+w/2,toe=xi+w;
 const crossing=d=>(vertical*xi+(P+topWeight+MASONRY_WEIGHT*w*d)*axis+H*d)/(vertical+P+topWeight+MASONRY_WEIGHT*w*d);
 // Toe moment is affine in depth. Checking both ends proves the inequality for every cut.
 const need=Math.max(0,2*(H*height-vertical*w)/w-topWeight-MASONRY_WEIGHT*w*height),base=crossing(height),clearance=Math.min(toe-crossing(0),toe-base),curve=Array.from({length:65},(_,j)=>{const d=height*j/64;return[crossing(d),height-d];});
 return{H,w,P,xi,height,top,tanSlope,vertical,topWeight,axis,toe,need,base,clearance,admissible:P>=need-1e-10,curve};}
export function profile(shape='round'){
 if(!['round','equi','lancet','segment'].includes(shape))throw new RangeError('unknown profile');
 const e=shape==='equi'?1:shape==='lancet'?2:0,R=1+e,alpha=shape==='segment'?Math.PI/3:Math.PI/2,rr=shape==='segment'?1/Math.sin(alpha):R,yc=shape==='segment'?-rr*Math.cos(alpha):0,start=shape==='segment'?Math.PI/2+alpha:Math.PI,left=s=>{const a=start-s/rr;return[e+rr*Math.cos(a),yc+rr*Math.sin(a)];};
 // For pointed profiles, the left arc runs from pi to acos(-e/R), i.e. pi/2+asin(e/R).
 const end=e?Math.acos(-e/R):Math.PI/2,arcLength=rr*(start-end),at=s=>s<=arcLength?left(s):(()=>{const p=left(2*arcLength-s);return[-p[0],p[1]];})(),points=Array.from({length:121},(_,j)=>at(2*arcLength*j/120)),spring=points[0],third=at(2*arcLength/3),other=at(4*arcLength/3),extension=[2*spring[0]-third[0],-third[1]],width=third[0]-spring[0];
 return{shape,points,spring,third,other,extension,width,span:2,rise:at(arcLength)[1],arcLength:2*arcLength};}
export function proportion(shape='round',rule='derand',height=1,ratio=.4){finite(height,.2,3);finite(ratio,0,1.5);if(!['derand','quarter','three-tenths'].includes(rule))throw new RangeError('unknown rule');const geometry=profile(shape),width=rule==='derand'?geometry.width/2:rule==='quarter'?.25:.3,beta=.25,alpha=beta*ratio;
 // Dimensionless: span s, V=beta*gamma*s², H=alpha*gamma*s², h=height*s.
 const required=eta=>2*alpha*eta/(beta+Math.sqrt(beta*beta+2*alpha*eta*eta)),need=required(height),crossing=d=>(alpha*d+width*width*d/2)/(beta+width*d),curve=Array.from({length:65},(_,j)=>{const d=height*j/64;return[-1-2*crossing(d),-2*d];}),comparison=Array.from({length:81},(_,j)=>{const h=.05+2.95*j/80;return[h,required(h)];}),baseClearance=width-crossing(height);
 return{shape,rule,height,ratio,geometry,width,need,alpha,beta,curve,comparison,baseClearance,admissible:width>=need-1e-12};}
export const HOOKE_PHRASE='ut pendet continuum flexile sic stabit contiguum rigidum inversum';
export const HOOKE_LETTERS=HOOKE_PHRASE.replace(/[^a-z]/g,'').replace(/v/g,'u').split('').sort().join('');
export function hanging(rise=.7,thickness=.05,bump=0,position=-.4){finite(rise,.2,1.3);finite(thickness,.005,.4);finite(bump,-.2,.2);finite(position,-.85,.85);
 const n=24,xs=Array.from({length:n+1},(_,j)=>-1+2*j/n),weights=Array.from({length:n-1},()=>1),V=weights.length/2,moments=xs.map((x,j)=>V*(x+1)-xs.slice(1,j).reduce((s,z)=>s+x-z,0)),H=moments[n/2]/rise,base=moments.map(m=>m/H),centre=xs.map((x,j)=>base[j]+bump*Math.exp(-(((x-position)/.22)**2))*(1-x*x));
 let minimum=0;for(let i=1;i<n;i++){minimum=Math.max(minimum,-2*centre[i]);for(let j=1;j<n;j++)minimum=Math.max(minimum,2*(centre[i]*moments[j]-centre[j]*moments[i])/(moments[i]+moments[j]));}
 const interval=t=>{let lower=0,upper=Infinity;for(let j=1;j<n;j++){lower=Math.max(lower,(centre[j]-t/2)/moments[j]);upper=Math.min(upper,(centre[j]+t/2)/moments[j]);}return[lower,upper];},bounds=interval(thickness),admissible=bounds[1]>0&&bounds[0]<=bounds[1]+1e-13,opt=interval(minimum+1e-12),k=admissible?Math.max(bounds[0],Math.min(bounds[1],1/H)):(opt[0]+opt[1])/2,line=xs.map((x,j)=>[x,k*moments[j]]),centreline=xs.map((x,j)=>[x,centre[j]]),upper=centreline.map(([x,y])=>[x,y+thickness/2]),lower=centreline.map(([x,y])=>[x,y-thickness/2]);
 return{rise,thickness,bump,position,xs,weights,V,moments,H,base,centre,minimum,bounds,admissible,k,line,centreline,envelope:[...upper,...lower.slice().reverse()],chain:xs.map((x,j)=>[x,-base[j]]),forces:xs.slice(0,-1).map((x,j)=>[1/k,V-j]),sameWeights:true};}
