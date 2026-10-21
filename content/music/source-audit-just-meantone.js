// Authored finite models for music7.5/7.7; source ratios precede displayed cents.
export const JM_C4=261.6256,JM_SR=44100;
const cent=r=>1200*Math.log2(r),fold=c=>((c%1200)+1200)%1200;
export const JM_FIFTH=cent(3/2),JM_COMMA=cent(81/80),JM_M3=cent(5/4),JM_m3=cent(6/5);
export const JM_ET_ALPHA=(JM_FIFTH-700)/JM_COMMA;
const noteNames=['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'];
const scaleNames=['C','D','E','F','G','A','B'],semitones=[0,2,4,5,7,9,11];
const coords=[[0,0],[2,0],[0,1],[-1,0],[1,0],[-1,1],[1,1]];
const triads={I:[0,2,4],IV:[3,5,0],V:[4,6,1]};
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
function reduced(a,b){const g=gcd(a,b);return[a/g,b/g];}
function ratioRecord(p,q){const r=reduced(p,q),value=r[0]/r[1];return{ratio:r,exact:r.join('/'),value,cents:cent(value)};}
export function jiRatio(i,j){if(!Number.isInteger(i)||i< -1||i>2||!Number.isInteger(j)||j<0||j>1)throw new RangeError('Visible lattice domain is i=-1..2,j=0..1');let p=1,q=1;if(i<0){p*=2**-i;q*=3**-i;}else{p*=3**i;q*=2**i;}p*=5**j;q*=4**j;while(p<q)p*=2;while(p>=2*q)q*=2;return ratioRecord(p,q);}
export function jiModel(family='scale',node='0,0'){
 if(typeof family!=='string'||!['scale','I','IV','V'].includes(family))throw new RangeError('Unknown lit collection');
 const nodes=[];for(let j=0;j<=1;j++)for(let i=-1;i<=2;i++){const index=coords.findIndex(([x,y])=>x===i&&y===j);nodes.push({id:`${i},${j}`,i,j,name:index>=0?scaleNames[index]:'extra',...jiRatio(i,j)});}if(typeof node!=='string'||!nodes.some(x=>x.id===node))throw new RangeError('Unknown visible node');
 const scale=coords.map(([i,j],k)=>({name:scaleNames[k],i,j,semitone:semitones[k],...jiRatio(i,j)}));
 const lit=family==='scale'?scale.map(x=>x.name):triads[family].map(k=>scaleNames[k]);
 const table=[...scale,{name:'C ↑',semitone:12,...ratioRecord(2,1)}].map(x=>({...x,offset:x.cents-100*x.semitone,hz:JM_C4*x.value}));
 const gaps=table.slice(0,-1).map((x,k)=>ratioRecord(table[k+1].ratio[0]*x.ratio[1],table[k+1].ratio[1]*x.ratio[0]));
 let chord=null;if(family!=='scale'){const ix=triads[family],root=scale[ix[0]],rootSemi=root.semitone;chord=ix.map(k=>{const x=scale[k],up=x.value<root.value?2:1,semitone=x.semitone+(x.semitone<rootSemi?12:0);return{name:x.name,...ratioRecord(up*x.ratio[0],x.ratio[1]),hz:JM_C4*up*x.value,etHz:JM_C4*2**(semitone/12),semitone};});}
 const selected=nodes.find(x=>x.id===node);return{family,node,nodes,scale,table,gaps,lit,chord,selected:{...selected,hz:JM_C4*selected.value}};
}
export function meantoneModel(alpha=.25,key=0){
 if(!Number.isFinite(alpha)||alpha<0||alpha>.34)throw new RangeError('alpha in[0,0.34] required');if(!Number.isInteger(key)||key<0||key>11)throw new RangeError('Integer key0..11 required');
 const kind=alpha===0?'pythagorean':alpha===.25?'quarter':alpha===1/3?'third':alpha===JM_ET_ALPHA?'equal':'general';
 const fifth=kind==='equal'?700:kind==='quarter'?300*Math.log2(5):kind==='third'?(2400-JM_m3)/3:JM_FIFTH-alpha*JM_COMMA;
 const delta=kind==='equal'?0:kind==='quarter'?cent(128/125):8400-12*fifth,closing=fifth+delta;
 const major=kind==='quarter'?JM_M3:kind==='equal'?400:4*fifth-2400,minor=kind==='third'?JM_m3:kind==='equal'?300:2400-3*fifth;
 const chain=['E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯'],index=[3,10,5,0,7,2,9,4,11,6,1,8],pcs=Array(12),positions=Array(12);chain.forEach((name,j)=>{const r=index[j];pcs[r]=kind==='equal'?100*r:fold((j-3)*fifth);positions[r]=j;});
 const thirds=pcs.map((p,r)=>{const crosses=positions[r]>=8,cents=major+(crosses?delta:0);return{key:r,name:noteNames[r],crosses,cents,error:cents-JM_M3,pure:kind==='quarter'&&!crosses};});
 const rootHz=JM_C4*2**(pcs[key]/1200),third=thirds[key],fifthSize=positions[key]===11?closing:fifth;
 return{alpha,key,kind,fifth,closing,delta,major,minor,pcs,thirds,rootHz,keyName:noteNames[key],errors:[fifth-JM_FIFTH,major-JM_M3,minor-JM_m3,closing-JM_FIFTH],triad:[rootHz,rootHz*2**(third.cents/1200),rootHz*2**(fifthSize/1200)],triadCents:[0,third.cents,fifthSize],chain,positions};
}
// A declared six-harmonic, 1/h spectrum; .12 is an analytic pre-output peak
// bound after averaging notes and harmonics. No perceived-level claim follows.
function denseArray(a,max){return Array.isArray(a)&&a.length>0&&a.length<=max&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);}
export function jmRenderAudio(frequencies,duration,gap=0){
 if(!denseArray(frequencies,16)||frequencies.some(fs=>!denseArray(fs,3)||fs.some(f=>!Number.isFinite(f)||f<=0||6*f>=JM_SR/2)))throw new RangeError('Finite sub-Nyquist six-harmonic events required');
 if(!Number.isFinite(duration)||duration<=.02||duration>2||!Number.isFinite(gap)||gap<0||gap>.12)throw new RangeError('Positive event duration and nonnegative gap required');
 const frames=Math.round(duration*JM_SR),silence=Math.round(gap*JM_SR),ramp=441,H=49/20,samples=new Float32Array(frequencies.length*frames+(frequencies.length-1)*silence);
 frequencies.forEach((fs,k)=>{for(let j=0;j<frames;j++){const env=Math.min(1,j/ramp,(frames-1-j)/ramp);let sum=0;for(const f of fs)for(let h=1;h<=6;h++)sum+=Math.sin(2*Math.PI*h*f*j/JM_SR)/h;samples[k*(frames+silence)+j]=.12*env*sum/(H*fs.length);}});
 return{samples,sampleRate:JM_SR,frequencies,frames,silence,ramp,harmonics:6,harmonicSum:H};
}
export function jiAudio(family,node,action){const a=jiModel(family,node);if(!['just','et','alternate','node'].includes(action))throw new RangeError('Unknown audio action');if(action==='node')return jmRenderAudio([[a.selected.hz]],.8);
 const just=a.chord?[a.chord.map(x=>x.hz)]:a.table.map(x=>[x.hz]),et=a.chord?[a.chord.map(x=>x.etHz)]:a.table.map(x=>[JM_C4*2**(x.semitone/12)]);
 const events=action==='just'?just:action==='et'?et:a.chord?[...just,...et,...just,...et]:[...just,...et];return jmRenderAudio(events,a.chord?(action==='alternate'?.9:1.6):.32,a.chord?.12:.05);}
export function meantoneAudio(alpha,key,action){const a=meantoneModel(alpha,key);if(action==='triad')return jmRenderAudio([a.triad],1.6);if(action==='closing'){const b=JM_C4*2**(a.pcs[8]/1200);return jmRenderAudio([[b,b*2**(a.closing/1200)]],1.6);}if(action==='compare')return jmRenderAudio([[JM_C4,JM_C4*2**(a.fifth/1200)],[JM_C4,JM_C4*1.5]],1.2,.12);throw new RangeError('Unknown audio action');}
