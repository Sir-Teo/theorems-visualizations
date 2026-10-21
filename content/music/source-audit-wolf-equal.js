// Isolated authored exact-ratio models for music7.4/7.9; no historical or
// perceptual classification is inferred from a cents error or an audio buffer.
export const WE_C4=261.6256,WE_SR=44100,WE_HARMONICS=8;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
function rational(p,q){p=BigInt(p);q=BigInt(q);if(p<=0n||q<=0n)throw new RangeError('Positive ratio required');const d=gcd(p,q);p/=d;q/=d;const value=Number(p)/Number(q);return{ratio:[Number(p),Number(q)],exact:`${p}/${q}`,value,cents:1200*Math.log1p(Number(p-q)/Number(q))/Math.LN2};}
function folded(p,q){while(p<q)p*=2n;while(p>=2n*q)q*=2n;return rational(p,q);}
const integer=(x,lo,hi)=>{if(!Number.isInteger(x)||x<lo||x>hi)throw new RangeError('Integer control outside offered range');};
const chain=['E♭','B♭','F','C','G','D','A','E','B','F♯','C♯','G♯'],semi=[3,10,5,0,7,2,9,4,11,6,1,8];
export const WE_PURE_FIFTH=rational(3n,2n),WE_COMMA=rational(531441n,524288n),WE_WOLF=rational(262144n,177147n);
export function wolfPoint(j){integer(j,0,11);const a=(j-3)*Math.PI/6;return[Math.sin(a),Math.cos(a)];}
/** A click must be near the interior of a visible segment; empty center,
 * outside points and endpoints do not choose an invisible angular sector. */
export function wolfEdgeHit(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;let best=null,distance=.10;for(let j=0;j<12;j++){const a=wolfPoint(j),b=wolfPoint((j+1)%12),dx=b[0]-a[0],dy=b[1]-a[1],t=((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy);if(t<.12||t>.88)continue;const d=Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);if(d<distance){distance=d;best=j;}}return best;}
export function wolfModel(cut=11,selected=11){integer(cut,0,11);integer(selected,0,11);const start=(cut+1)%12,anchor=(3-start+12)%12;
 const nodes=chain.map((name,j)=>{const exponent=(j-start+12)%12-anchor,p=exponent>=0?3n**BigInt(exponent):2n**BigInt(-exponent),q=exponent>=0?2n**BigInt(exponent):3n**BigInt(-exponent),r=folded(p,q);return{j,name,semitone:semi[j],exponent,...r,hz:WE_C4*r.value,point:wolfPoint(j)};});
 const fifths=nodes.map((p,j)=>{const next=nodes[(j+1)%12],r=folded(BigInt(next.ratio[0])*BigInt(p.ratio[1]),BigInt(next.ratio[1])*BigInt(p.ratio[0]));return{j,from:p.name,to:next.name,wolf:j===cut,selected:j===selected,...r,frequencies:[p.hz,p.hz*r.value]};});
 const thirds=nodes.map((p,j)=>{const target=nodes[(j+4)%12],r=folded(BigInt(target.ratio[0])*BigInt(p.ratio[1]),BigInt(target.ratio[1])*BigInt(p.ratio[0])),error=rational(BigInt(r.ratio[0])*4n,BigInt(r.ratio[1])*5n);return{j,name:p.name,semitone:p.semitone,crosses:(cut-j+12)%12<4,...r,error:error.cents,errorRatio:error.exact};}).sort((a,b)=>a.semitone-b.semitone);
 return{cut,selected,nodes,fifths,thirds,chosen:fifths[selected],wolf:fifths[cut],comma:WE_COMMA,regular:WE_PURE_FIFTH,closing:WE_WOLF};
}
export const WE_REFERENCES=[
 ['m2',16,15,1,'minor second'],['M2',9,8,2,'major second'],['m3',6,5,3,'minor third'],['M3',5,4,4,'major third'],['P4',4,3,5,'fourth'],['TT',45,32,6,'tritone reference'],['P5',3,2,7,'fifth'],['m6',8,5,8,'minor sixth'],['M6',5,3,9,'major sixth'],['m7',9,5,10,'minor seventh 9/5'],['H7',7,4,10,'harmonic seventh 7/4'],['M7',15,8,11,'major seventh'],
].map(([id,p,q,n,name])=>({id,p,q,n,name,...rational(BigInt(p),BigInt(q))}));
const chordRatios={major:[[1,1],[5,4],[3,2]],minor:[[1,1],[6,5],[3,2]],harmonic7:[[1,1],[5,4],[3,2],[7,4]]},chordSemitones={major:[0,4,7],minor:[0,3,7],harmonic7:[0,4,7,10]};
export function equalFret(n){integer(n,0,12);return{n,ratio:2**(n/12),cents:100*n,remaining:2**(-n/12),position:n===0?0:n===12?.5:-Math.expm1(-n*Math.LN2/12)};}
export function equalModel(reference='M3',chord='major'){
 if(typeof reference!=='string'||!WE_REFERENCES.some(x=>x.id===reference))throw new RangeError('Unknown rational reference');if(typeof chord!=='string'||!Object.hasOwn(chordRatios,chord))throw new RangeError('Unknown authored chord');
 const rows=WE_REFERENCES.map(r=>{const f=equalFret(r.n),position=(r.p-r.q)/r.p;return{...r,etCents:f.cents,error:f.cents-r.cents,justPosition:position,etPosition:f.position,distanceMm:650*Math.abs(f.position-position)};}),row=rows.find(r=>r.id===reference),ratios=chordRatios[chord].map(([p,q])=>rational(BigInt(p),BigInt(q))),semitones=chordSemitones[chord],just=ratios.map(r=>WE_C4*r.value),equal=semitones.map(n=>WE_C4*2**(n/12)),coincidences=[];
 for(let i=0;i<ratios.length;i++)for(let j=i+1;j<ratios.length;j++)for(let h=1;h<=WE_HARMONICS;h++)for(let k=1;k<=WE_HARMONICS;k++)if(BigInt(ratios[i].ratio[0])*BigInt(h)*BigInt(ratios[j].ratio[1])===BigInt(ratios[j].ratio[0])*BigInt(k)*BigInt(ratios[i].ratio[1]))coincidences.push({i,j,h,k,justSeparation:Math.abs(h*just[i]-k*just[j]),equalSeparation:Math.abs(h*equal[i]-k*equal[j])});
 return{reference,chord,row,rows,frets:Array.from({length:13},(_,n)=>equalFret(n)),ratios,semitones,just,equal,coincidences,harmonics:WE_HARMONICS};
}
function denseArray(a,min,max){if(!Array.isArray(a)||a.length<min||a.length>max)throw new RangeError('Dense array within the offered size required');for(let j=0;j<a.length;j++)if(!Object.hasOwn(a,j))throw new RangeError('Sparse or inherited event indices are not supported');return a;}
/** Authored H8 signal. .12 bounds the sum before the separate runtime output;
 * all eight partials lie strictly below Nyquist. No subjective quality claim. */
export function weRenderAudio(events,duration,gap=0){denseArray(events,1,12);for(const fs of events){denseArray(fs,1,4);for(const f of fs)if(!Number.isFinite(f)||f<=0||WE_HARMONICS*f>=WE_SR/2)throw new RangeError('Finite positive H8 sub-Nyquist frequencies required');}if(!Number.isFinite(duration)||duration<.05||duration>2||!Number.isFinite(gap)||gap<0||gap>.12)throw new RangeError('Offered duration/gap domain required');
 const frames=Math.round(duration*WE_SR),silence=Math.round(gap*WE_SR),ramp=441,amplitudeSum=761/280,samples=new Float32Array(events.length*frames+(events.length-1)*silence);
 events.forEach((fs,e)=>{for(let j=0;j<frames;j++){let s=0;for(const f of fs)for(let h=1;h<=WE_HARMONICS;h++)s+=Math.sin(2*Math.PI*h*f*j/WE_SR)/h;const envelope=Math.min(1,j/ramp,(frames-1-j)/ramp);samples[e*(frames+silence)+j]=.12*envelope*s/(amplitudeSum*fs.length);}});
 return{samples,sampleRate:WE_SR,frequencies:events,frames,silence,ramp,harmonics:WE_HARMONICS,amplitudeSum};
}
export function wolfAudio(cut,selected,action){const m=wolfModel(cut,selected);if(action==='edge')return weRenderAudio([m.chosen.frequencies],1.2);if(action==='wolf')return weRenderAudio([m.wolf.frequencies],1.2);if(action==='cycle')return weRenderAudio(Array.from({length:12},(_,k)=>m.fifths[(cut+1+k)%12].frequencies),.35,.05);throw new RangeError('Unknown wolf audio action');}
export function equalAudio(reference,chord,action){const m=equalModel(reference,chord);if(action==='just')return weRenderAudio([m.just],1.5);if(action==='equal')return weRenderAudio([m.equal],1.5);if(action==='alternate')return weRenderAudio([m.just,m.equal,m.just,m.equal],.85,.12);throw new RangeError('Unknown equal-temperament audio action');}
