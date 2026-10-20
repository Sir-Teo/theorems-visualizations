// Sethares (1994), JASA96:10–18, Eqs1–3: product-amplitude roughness.
// Finite spectra, bounded pattern search and synthesis choices below are authored.
export const AB_C4=261.6256,AB_SR=44100;
export const AB_SPECTRA=Object.freeze(Object.fromEntries(['h8','odd','all'].map(name=>[name,Object.freeze(Array.from({length:name==='h8'?8:11},(_,j)=>j+1).filter(h=>name!=='odd'||h%2).map(h=>Object.freeze([h,1/h])))])));
const finite=x=>typeof x==='number'&&Number.isFinite(x),dense=(x,n)=>Array.isArray(x)&&x.length===n&&Array.from({length:n},(_,i)=>Object.hasOwn(x,i)).every(Boolean),clip=(x,a,b)=>Math.max(a,Math.min(b,x));
export function spectralScore(frequencies,name='h8'){
 if(!Object.hasOwn(AB_SPECTRA,name)||!dense(frequencies,frequencies?.length)||frequencies.length<1||frequencies.length>3||!frequencies.every(f=>finite(f)&&f>0&&f*AB_SPECTRA[name].at(-1)[0]<AB_SR/2))throw new RangeError('Offered sub-Nyquist tone frequencies and spectrum required');
 const partials=frequencies.flatMap(f=>AB_SPECTRA[name].map(([h,a])=>[h*f,a]));let D=0;
 for(let i=0;i<partials.length;i++)for(let j=i+1;j<partials.length;j++){const[f,a]=partials[i],[g,b]=partials[j],x=.24*Math.abs(g-f)/(.021*Math.min(f,g)+19);D+=a*b*(Math.exp(-3.5*x)-Math.exp(-5.75*x));}return D;
}
export function spectralAudio(events,name='h8',duration=.8,gap=0){
 if(!Object.hasOwn(AB_SPECTRA,name)||!dense(events,events?.length)||events.length<1||events.length>25||!finite(duration)||duration<.05||duration>2||!finite(gap)||gap<0||gap>.12)throw new RangeError('Offered spectrum, bounded dense events and duration required');
 for(const fs of events)spectralScore(fs,name);const spec=AB_SPECTRA[name],normalizer=spec.reduce((s,[,a])=>s+a,0),frames=Math.round(duration*AB_SR),silence=Math.round(gap*AB_SR),samples=new Float32Array(frames*events.length+silence*(events.length-1));
 events.forEach((fs,e)=>{for(let j=0;j<frames;j++){let x=0;for(const[h,a]of spec)for(const f of fs)x+=a*Math.sin(j*(2*Math.PI/AB_SR)*f*h);const env=j<441?j/441:j>=frames-441?(frames-1-j)/441:1;samples[e*(frames+silence)+j]=.12*env*x/(fs.length*normalizer);}});
 return{samples,sampleRate:AB_SR,frequencies:events.map(fs=>fs.slice()),spectrum:name,partials:spec.map(p=>p.slice()),frames,silence,duration,gap};
}
const c=r=>1200*Math.log2(r),F=c(1.5)-700,T=c(1.25)-400,M=c(1.2)-300;
export const ADAPTIVE_CHORDS=Object.freeze([
 {name:'C',notes:[0,4,7],root:0,pure:[0,T,F]},
 {name:'Am',notes:[0,4,9],root:9,pure:[M,F,0]},
 {name:'Dm',notes:[2,5,9],root:2,pure:[0,M,F]},
 {name:'G',notes:[2,7,11],root:7,pure:[F,0,T]},
].map(x=>Object.freeze({...x,notes:Object.freeze(x.notes),pure:Object.freeze(x.pure)})));
export const ADAPTIVE_PROBE=1/1024;
const directions=n=>n===1?[[-1],[1]]:[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
function pattern(f,seed,lo,hi){let x=seed.map(q=>clip(q,lo,hi)),value=f(x),steps=0,complete=true;const dirs=directions(x.length);for(let h=8;h>=ADAPTIVE_PROBE;h/=2){while(true){if(++steps>400){complete=false;break;}let next=x,best=value;for(const d of dirs){const y=x.map((q,j)=>clip(q+h*d[j],lo,hi)),v=f(y);if(v<best-1e-13){next=y;best=v;}}if(next===x)break;x=next;value=best;}if(!complete)break;}return{x,value,steps,complete};}
export function adaptiveModel(mode='follow',lambda=.0001,passes=3){
 if(!['follow','anchor'].includes(mode)||!finite(lambda)||lambda<0||lambda>.004||!Number.isInteger(passes)||passes<1||passes>6)throw new RangeError('Offered rule, finite pull and integer pass count required');
 const rows=[];let prev=new Map();for(let k=0;k<=4*passes;k++){
  const chord=ADAPTIVE_CHORDS[k%4],d=chord.notes.map(s=>mode==='anchor'||k===0?(s===chord.root?0:null):(prev.has(s)?prev.get(s):null)),free=d.flatMap((q,j)=>q===null?[j]:[]),pinned=d.flatMap((q,j)=>q===null?[]:[j]),center=pinned.reduce((s,j)=>s+d[j],0)/pinned.length,lo=center-35,hi=center+35;
  const frequencies=dd=>chord.notes.map((s,j)=>AB_C4*2**((100*s+dd[j])/1200)),objective=x=>{const dd=d.slice();free.forEach((j,i)=>dd[j]=x[i]);return spectralScore(frequencies(dd),'h8')+lambda*x.reduce((s,q)=>s+q*q,0);},rootGuess=pinned.reduce((s,j)=>s+d[j]-chord.pure[j],0)/pinned.length;
  const seeds=[free.map(()=>center),free.map(()=>clip(0,lo,hi)),free.map(j=>clip(rootGuess+chord.pure[j],lo,hi))],trials=seeds.map(seed=>pattern(objective,seed,lo,hi));let best=trials[0];for(const r of trials.slice(1))if(r.value<best.value)best=r;
  const initial=objective(seeds[0]);free.forEach((j,i)=>d[j]=best.x[i]);const fs=frequencies(d),score=spectralScore(fs,'h8'),equal=chord.notes.map(s=>AB_C4*2**(100*s/1200)),probeImprovement=Math.max(0,...directions(free.length).map(dir=>best.value-objective(best.x.map((q,j)=>clip(q+ADAPTIVE_PROBE*dir[j],lo,hi))))),cycle=Math.floor(k/4),pureRoot=c([1,5/3,10/9,40/27][k%4])-100*[0,9,2,7][k%4]+cycle*c(80/81);
  rows.push({k,name:chord.name,notes:[...chord.notes],root:chord.root,d,free,pinned,center,lo,hi,frequencies:fs,equal,score,equalScore:spectralScore(equal,'h8'),objective:best.value,initial,complete:best.complete,iterations:trials.reduce((s,x)=>s+x.steps,0),probeImprovement,pureRoot});prev=new Map(chord.notes.map((s,j)=>[s,d[j]]));
 }
 return{mode,lambda,passes,rows,score:rows.reduce((s,r)=>s+r.score,0),equalScore:rows.reduce((s,r)=>s+r.equalScore,0),finalC:rows.at(-1).d[0],idealFinal:c(80/81)*passes,maxProbeImprovement:Math.max(...rows.map(r=>r.probeImprovement)),complete:rows.every(r=>r.complete),bounds:{x:[-1,4*passes+1],y:[Math.min(-8,...rows.flatMap(r=>r.d),...(mode==='follow'?rows.map(r=>r.pureRoot):[]))-8,Math.max(8,...rows.flatMap(r=>r.d))+8]}};
}
export function adaptiveAudio(model,action){if(!['adaptive','equal','closing'].includes(action))throw new RangeError('Offered adaptive action required');const fs=action==='closing'?[[model.rows[0].frequencies[0]],[model.rows.at(-1).frequencies[0]]]:model.rows.map(r=>action==='equal'?r.equal:r.frequencies);return spectralAudio(fs,'h8',action==='closing'?.8:.25,action==='closing'?.1:.03);}
export const BP_RATIOS=Object.freeze([[1,1],[27,25],[25,21],[9,7],[7,5],[75,49],[5,3],[9,5],[49,25],[15,7],[7,3],[63,25],[25,9],[3,1]].map(x=>Object.freeze(x)));
export const BP_TRITAVE=c(3),BP_STEP=BP_TRITAVE/13;
const curves=new Map();function bpCurve(name){if(!curves.has(name)){const curve=Object.freeze(Array.from({length:1301},(_,j)=>{const cents=j===1300?BP_TRITAVE:BP_TRITAVE*j/1300;return Object.freeze([cents,spectralScore([AB_C4,AB_C4*2**(cents/1200)],name)]);})),minima=curve.filter(([,y],j)=>(j===0||y<=curve[j-1][1])&&(j===1300||y<=curve[j+1][1])&&(j===0||j===1300||y<curve[j-1][1]||y<curve[j+1][1]));curves.set(name,{curve,minima:Object.freeze(minima),max:Math.max(...curve.map(p=>p[1]))});}return curves.get(name);}
export function bpModel(name='odd',selected=6){if(!['odd','all'].includes(name)||!Number.isInteger(selected)||selected<0||selected>13)throw new RangeError('Offered spectrum and integer BP step required');const rows=BP_RATIOS.map(([p,q],k)=>({k,p,q,exact:`${p}/${q}`,just:c(p/q),equal:k===13?BP_TRITAVE:k*BP_STEP,error:k===0||k===13?0:k*BP_STEP-c(p/q),justHz:AB_C4*p/q,equalHz:AB_C4*3**(k/13)}));return{name,selected,rows,chosen:rows[selected],...bpCurve(name),ymax:Math.max(bpCurve('odd').max,bpCurve('all').max),maxError:Math.max(...rows.map(r=>Math.abs(r.error))),prime5:13*Math.log(5)/Math.log(3),prime7:13*Math.log(7)/Math.log(3),octaveCoincidences:AB_SPECTRA[name].flatMap(([h])=>AB_SPECTRA[name].flatMap(([g])=>h===2*g?[[h,g]]:[]))};}
export function bpAudio(model,action){if(!['just','equal','wide-just','wide-equal','major','scale'].includes(action))throw new RangeError('Offered BP action required');const fs=action==='scale'?model.rows.map(r=>[r.equalHz]):[action==='just'?[AB_C4,model.chosen.justHz]:action==='equal'?[AB_C4,model.chosen.equalHz]:action==='wide-just'?[AB_C4,AB_C4*5/3,AB_C4*7/3]:action==='wide-equal'?[AB_C4,AB_C4*3**(6/13),AB_C4*3**(10/13)]:[AB_C4,AB_C4*5/4,AB_C4*3/2]];return spectralAudio(fs,model.name,action==='scale'?.25:.8,action==='scale'?.03:0);}
