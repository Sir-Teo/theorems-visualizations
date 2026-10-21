// Authored finite 12-TET models. MIDI pitches retain register; pitch classes do not.
export const mod=x=>((x%12)+12)%12;
export const names=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
export const major=[0,2,4,5,7,9,11], romans=['I','ii','iii','IV','V','vi','vii°'];
export const qualities={major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8],dominant7:[0,4,7,10],major7:[0,4,7,11],minor7:[0,3,7,10],halfDim7:[0,3,6,10],dim7:[0,3,6,9]};
export const pcs=a=>[...new Set(a.map(mod))].sort((a,b)=>a-b);
export const chord=(r,q='major')=>qualities[q].map(x=>mod(x+r));
export const triad=(r,m=0)=>({r:mod(r),m});
export const tones=t=>chord(t.r,t.m?'minor':'major');
export const label=t=>`${names[t.r]}${t.m?' minor':' major'}`;
export function plr(t,op){if(op==='P')return triad(t.r,1-t.m);if(op==='L')return triad(t.r+(t.m?-4:4),1-t.m);if(op==='R')return triad(t.r+(t.m?3:-3),1-t.m);throw Error('Unknown PLR operation');}
export function ti(t,n,invert=false){return triad(invert?n-t.r-7:t.r+n,invert?1-t.m:t.m);}
export function cycle(t,ops,count){const a=[t];for(let i=0;i<count;i++)a.push(plr(a.at(-1),ops[i%ops.length]));return a;}
export function permutations(a){if(a.length<2)return[a.slice()];return a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[x,...p]));}
export const delta=(a,b)=>mod(b-a+6)-6;
export function assignment(a,b,metric='L1'){let best=null;for(const p of permutations(b)){const moves=a.map((x,i)=>delta(x,p[i])),abs=moves.map(Math.abs),cost=metric==='L2'?Math.hypot(...moves):metric==='Linf'?Math.max(...abs):abs.reduce((s,x)=>s+x,0);if(!best||cost<best.cost-1e-10)best={target:p,moves,cost};}return best;}
export function gaps(a){const b=a.map(mod).sort((x,y)=>x-y);return b.map((x,i)=>i===b.length-1?b[0]+12-x:b[i+1]-x);}
export function diatonic(k){return major.map(x=>mod(x+k));}
export function degreeChord(k,d){return[0,2,4].map(i=>mod(k+major[(d+i)%7]));}
export const same=(a,b)=>pcs(a).join(',')===pcs(b).join(',');
export function pivots(a,b){return romans.flatMap((r,i)=>romans.flatMap((s,j)=>same(degreeChord(a,i),degreeChord(b,j))?[{i,j,notes:degreeChord(a,i)}]:[]));}
export function parallels(a,b){const found=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const x=mod(a[j]-a[i]),y=mod(b[j]-b[i]),u=b[i]-a[i],v=b[j]-a[j];if((x===0||x===7)&&x===y&&u*v>0)found.push([i,j,x]);}return found;}
export function stripPoint(m,d){const theta=2*Math.PI*m/6,w=(d-6)/12,r=1+w*Math.cos(theta/2);const X=r*Math.cos(theta),Y=r*Math.sin(theta),Z=w*Math.sin(theta/2);return[X,.42*Y+.85*Z];}
export function gapPoint(g){return[(g[1]-g[0])/12,(2*g[2]-g[0]-g[1])/(12*Math.sqrt(3))];}
export function audio(events,duration=.6){const sr=44100,n=Math.round(sr*duration),gap=2205,out=new Float32Array(events.length*n+(events.length-1)*gap);events.forEach((notes,e)=>{for(let j=0;j<n;j++){let x=0;for(const p of notes){const f=440*2**((p-69)/12);for(let h=1;h<=4;h++)x+=Math.sin(2*Math.PI*f*h*j/sr)/h;}const env=Math.min(1,j/441,(n-1-j)/441);out[e*(n+gap)+j]=.1*env*x/(notes.length*(25/12));}});return out;}
export function listen(v,get){v.soundButton('Listen',sd=>{sd.stop();sd.samples(audio(get()),44100,{gain:1,normalize:false});});v.button('Stop',()=>v.sound().stop());}
export function rootControl(v,value=0){return v.slider('root pitch class',0,11,value,{int:true,fmt:x=>names[x]});}
export function clockStage(v,title='pitch classes'){return v.stage({x:[-1.45,1.45],y:[-1.45,1.45],equal:true,axes:false,height:330,minWidth:230,title});}
export const point=(p,r=1)=>[r*Math.sin(Math.PI*p/6),r*Math.cos(Math.PI*p/6)];
export function clock(s,a=[],b=[]){s.circle(0,0,1,{color:'grid'});for(let p=0;p<12;p++){s.dot(...point(p),{r:2,color:'faint',ring:false});s.text(names[p],...point(p,1.22),{align:'center',baseline:'middle',size:11,color:'muted'});}if(a.length>1)s.path([...a,a[0]].map(p=>point(p,.88)),{color:'accent',width:2.5});a.forEach(p=>s.dot(...point(p,.88),{r:5,color:'accent',ring:false}));if(b.length>1)s.path([...b,b[0]].map(p=>point(p,.65)),{color:'orange',width:2});b.forEach(p=>s.dot(...point(p,.65),{r:4,color:'orange',ring:false}));}
export function lanes(v,title='registered pitches and voice motion'){return v.stage({x:[-.28,1.28],y:[42,90],axes:false,height:330,minWidth:230,title});}
export function voicePlot(s,a,b){for(let p=48;p<=84;p+=12){s.line(-.1,p,1.1,p,{color:'grid'});s.text(`${names[mod(p)]}${Math.floor(p/12)-1}`,-.16,p,{size:10,align:'center',baseline:'middle',color:'muted'});}a.forEach((x,i)=>{const y=b[i],c=['accent','orange','green','purple'][i%4];s.line(0,x,1,y,{color:c,width:2});s.dot(0,x,{r:4,color:c,ring:false});s.dot(1,y,{r:4,color:c,ring:false});});}
export function bars(v,title,max=15){return v.stage({x:[-.7,11.7],y:[-1,max+2],axes:false,height:300,minWidth:230,title});}
export function drawBars(s,values,selected=-1){s.line(-.45,0,11.45,0,{color:'muted',width:1});values.forEach((x,i)=>{const c=i===selected?'gold':'accent';s.rect(i-.25,0,i+.25,x,{color:c,fill:c,fillAlpha:.5});s.text(`${i}`,i,-.5,{size:10,align:'center',baseline:'middle',color:'muted'});s.text(x.toFixed(1),i,x+.5,{size:9,align:'center',baseline:'middle',color:c});});}
export const textList=a=>a.map(x=>names[mod(x)]).join('–');
export const OMT='https://viva.pressbooks.pub/openmusictheory/chapter/';
export const geometry='https://www.brainmusic.org/EducationalActivities/Tymoczko_chords2006.pdf';
// Rotate voice pairs while keeping the selected source member genuinely lowest.
export function dominantResolution(inversion=0){let a=[43,59,62,65],b=[48,60,60,64];for(let i=0;i<inversion;i++){const x=a.shift(),y=b.shift(),octaves=Math.floor((Math.max(...a)-x)/12)+1;a.push(x+12*octaves);b.push(y+12*octaves);}return[a,b];}
export function tritoneProgression(substitute=false){return[[50,60,65,69],substitute?[49,59,65,68]:[43,59,65,74],[48,60,64,71]];}
export function cadenceVoicing(ending,third=false){const a=ending==='IV–I'?[53,57,60,69]:ending==='I–V'?[48,55,64,72]:[43,55,62,71],b=ending==='I–V'?[43,55,62,71]:ending==='V–vi'?[45,57,64,72]:[48,55,64,ending==='V–I'&&third?76:72];return[a,b];}
