// Authored finite images and a geometric mask; no calibrated luminance/percept predictions.
const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const need=ok=>{if(!ok)throw new RangeError('Outside the declared illustration domain');};
const clamp=(x,n)=>Math.max(0,Math.min(n-1,x));
export function finiteGaussian(sigma){
 need(finite(sigma,.1,64));const radius=Math.ceil(3.5*sigma),k=Array.from({length:2*radius+1},(_,i)=>Math.exp(-(((i-radius)/sigma)**2)/2)),sum=k.reduce((s,x)=>s+x,0);return{radius,weights:k.map(x=>x/sum)};
}
export function finiteBlur(image,nx,ny,sigma){
 need(Number.isInteger(nx)&&nx>0&&nx<=240&&Number.isInteger(ny)&&ny>0&&ny<=144&&image.length===nx*ny&&image.every(x=>finite(x,0,1)));
 const{radius,weights}=finiteGaussian(sigma),tmp=new Float64Array(nx*ny),out=new Float64Array(nx*ny);
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let s=0;for(let j=-radius;j<=radius;j++)s+=weights[j+radius]*image[y*nx+clamp(x+j,nx)];tmp[y*nx+x]=s;}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let s=0;for(let j=-radius;j<=radius;j++)s+=weights[j+radius]*tmp[clamp(y+j,ny)*nx+x];out[y*nx+x]=s;}return out;
}
export function finiteDog(image,nx,ny,sigma){const c=finiteBlur(image,nx,ny,sigma),s=finiteBlur(image,nx,ny,4*sigma);return Float64Array.from(c,(v,i)=>v-s[i]);}
const period=2.5,lambda=1.7,omega=2*Math.PI/lambda;
export function gridForward(u,v,amplitude){const y=v+amplitude*Math.sin(omega*u);return[u+amplitude*Math.sin(omega*y),y];}
export function gridInverse(x,y,amplitude){const u=x-amplitude*Math.sin(omega*y);return[u,y-amplitude*Math.sin(omega*u)];}
const distance=x=>Math.abs(((x%period+period)%period)-period/2);
export function gridInput(x,y,width,amplitude){const[u,v]=gridInverse(x,y,amplitude);return distance(u)<width/2||distance(v)<width/2?1:.04;}
export function imageIndex(x,y,nx,ny,spacing){return clamp(Math.floor(y/spacing),ny)*nx+clamp(Math.floor(x/spacing),nx);}
const average=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function hermann(width=.5,amplitude=0,scale=.1){
 need(finite(width,.2,1)&&finite(amplitude,0,.5)&&finite(scale,.05,.4));
 const nx=100,ny=100,spacing=.1,input=Float64Array.from({length:nx*ny},(_,i)=>gridInput((i%nx+.5)*spacing,(Math.floor(i/nx)+.5)*spacing,width,amplitude)),response=finiteDog(input,nx,ny,scale/spacing),crossings=[3.75,6.25].flatMap(u=>[3.75,6.25].map(v=>gridForward(u,v,amplitude))),middles=[3.75,6.25].map(u=>gridForward(u,5,amplitude)),sample=p=>response[imageIndex(...p,nx,ny,spacing)],atCross=crossings.map(sample),atMid=middles.map(sample);
 return{width,amplitude,scale,nx,ny,spacing,input,response,crossings,middles,atCross,atMid,meanCross:average(atCross),meanMid:average(atMid),difference:average(atCross)-average(atMid),range:[Math.min(...response),Math.max(...response)]};
}
export const WHITE_BOXES={white:[[3,.9,4,2.9],[6,3.1,7,5.1]],ctrl:[[3,1.4,4,2.4],[6,3.6,7,4.6]]};
const inside=(x,y,r)=>x>=r[0]&&x<r[2]&&y>=r[1]&&y<r[3];
export function whiteInput(x,y,pattern,level){return WHITE_BOXES[pattern].some(r=>inside(x,y,r))?level:pattern==='white'?(Math.floor(x)%2===0?.04:1):x<5?1:.04;}
export function whitePattern(pattern='white',level=.5,scale=.12,matchA=.5,matchB=.5){
 need(['white','ctrl'].includes(pattern)&&finite(level,.25,.75)&&finite(scale,.05,.4)&&finite(matchA,0,1)&&finite(matchB,0,1));
 const nx=120,ny=72,spacing=1/12,boxes=WHITE_BOXES[pattern].map(r=>r.slice()),input=Float64Array.from({length:nx*ny},(_,i)=>whiteInput((i%nx+.5)*spacing,(Math.floor(i/nx)+.5)*spacing,pattern,level)),response=finiteDog(input,nx,ny,scale/spacing),samples=boxes.map(r=>{const cx=(r[0]+r[2])/2,cy=(r[1]+r[3])/2,points=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=(i+.5)*spacing,y=(j+.5)*spacing;if(Math.abs(x-cx)<.3&&Math.abs(y-cy)<.3)points.push(j*nx+i);}return points;}),means=samples.map(indices=>average(indices.map(i=>response[i])));
 return{pattern,level,scale,matchA,matchB,nx,ny,spacing,boxes,input,response,samples,means,difference:means[1]-means[0],matchDifference:matchB-matchA,range:[Math.min(...response),Math.max(...response)]};
}
export const MASK={x:15.5,y:-1.5,rx:2.75,ry:3.75};
export function maskContains(x,y,eye='R'){return((x-(eye==='R'?MASK.x:-MASK.x))/MASK.rx)**2+((y-MASK.y)/MASK.ry)**2<=1;}
export function maskBackground(x,y,pattern,eye='R'){
 x*=eye==='R'?1:-1;
 if(pattern==='plain')return[205,205,195];if(pattern==='stripes')return Math.floor((x+100)/1.6)%2===0?[215,215,205]:[90,100,130];if(pattern==='line')return Math.abs(y-MASK.y)<.45?[30,30,40]:[215,215,205];return[60+20*Math.sin(x/6),150+40*Math.sin(y/5),90+20*Math.cos(x/9)];
}
export function blindMask(eye='R',pattern='stripes',temporal=15.5,y=-1.5,radius=1.5){
 need(['R','L'].includes(eye)&&['plain','stripes','line','color'].includes(pattern)&&finite(temporal,0,22)&&finite(y,-9,9)&&finite(radius,.4,6));
 const nx=240,ny=144,spacing=.25,x=(eye==='R'?1:-1)*temporal,input=new Uint8Array(nx*ny),erased=new Uint8Array(nx*ny);let dotSamples=0,maskedSamples=0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const xx=-30+(i+.5)*spacing,yy=-18+(j+.5)*spacing,k=j*nx+i;if((xx-x)**2+(yy-y)**2<=radius*radius){input[k]=1;dotSamples++;if(maskContains(xx,yy,eye)){erased[k]=1;maskedSamples++;}}}
 const ellipse=Array.from({length:129},(_,i)=>{const t=2*Math.PI*i/128;return[(eye==='R'?MASK.x:-MASK.x)+MASK.rx*Math.cos(t),MASK.y+MASK.ry*Math.sin(t)];});
 return{eye,pattern,temporal,x,y,radius,nx,ny,spacing,input,erased,dotSamples,maskedSamples,remainingSamples:dotSamples-maskedSamples,ellipse};
}
