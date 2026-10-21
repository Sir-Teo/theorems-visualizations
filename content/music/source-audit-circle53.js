import{weRenderAudio,WE_C4}from'./source-audit-wolf-equal.js';
export const F53_REFERENCES=Object.freeze([[16,15],[9,8],[6,5],[5,4],[4,3],[45,32],[3,2],[8,5],[5,3],[9,5],[15,8],[25,16]].map(x=>Object.freeze(x)));
export const F53_CHORDS=Object.freeze({major:[[1,1],[5,4],[3,2]],minor:[[1,1],[6,5],[3,2]],major7:[[1,1],[5,4],[3,2],[15,8]]});
const approximate=(n,p,q)=>{const a=Math.log2(p/q),k=Math.round(n*a);return{k,cents:1200*(k/n),error:1200*(k/n-a),ratio:2**(k/n)};};
export function fiftyThreeModel(chord='major'){
 if(typeof chord!=='string'||!Object.hasOwn(F53_CHORDS,chord))throw new RangeError('Offered chord required');
 const rows=F53_REFERENCES.map(([p,q],j)=>({p,q,counterexample:j===11,exact:`${p}/${q}`,in53:approximate(53,p,q),in12:approximate(12,p,q)})),notes=F53_CHORDS[chord].map(([p,q])=>({p,q,exact:`${p}/${q}`,just:WE_C4*p/q,in53:WE_C4*approximate(53,p,q).ratio,in12:WE_C4*approximate(12,p,q).ratio}));
 return{chord,rows,notes,maxCuratedError:Math.max(...rows.slice(0,11).map(x=>Math.abs(x.in53.error))),counterexample:rows[11],commaRatio:[String(3n**53n),String(2n**84n)],commaCents:1200*Math.log1p(Number(3n**53n-2n**84n)/Number(2n**84n))/Math.LN2,nearestBound:600/53};
}
export function fiftyThreeAudio(chord,action){const m=fiftyThreeModel(chord),j=m.notes.map(x=>x.just),s=m.notes.map(x=>x.in53),e=m.notes.map(x=>x.in12);if(!['just','53','12','alternate'].includes(action))throw new RangeError('Unknown chord action');return weRenderAudio(action==='alternate'?[j,s,j,s]:[action==='just'?j:action==='53'?s:e],.8,action==='alternate'?.1:0);}
export const CIRCLE_NAMES=Object.freeze(['C','G','D','A','E','B','F♯','C♯','G♯','D♯','A♯','E♯']);
export function circleModel(tau=0,selected=0){
 if(typeof tau!=='number'||!Number.isFinite(tau)||tau<0||tau>1||!Number.isInteger(selected)||selected<0||selected>11)throw new RangeError('Offered continuous tempering and integer note required');
 const pure=1200*Math.log2(3/2),comma=12*pure-8400,delta=(1-tau)*(pure-700),fifth=700+delta,error=12*delta,point=j=>{const angle=j*Math.PI/6,radius=1+.35*j*delta/comma;return[radius*Math.sin(angle),radius*Math.cos(angle)];},fold=x=>((x%1200)+1200)%1200;
 const nodes=Array.from({length:12},(_,j)=>({j,name:CIRCLE_NAMES[j],point:point(j),cents:fold(j*fifth),hz:WE_C4*2**(fold(j*fifth)/1200)}));
 const triad=j=>{const c=fold(j*fifth);return[c,c+4*fifth-2400,c+fifth].map(x=>WE_C4*2**(x/1200));};
 return{tau,selected,fifth,delta,error,nodes,path:Array.from({length:13},(_,j)=>point(j)),chosen:nodes[selected],triad:triad(selected),walk:Array.from({length:12},(_,j)=>triad(j+1)),closing:[WE_C4,WE_C4*2**(error/1200)],endName:'B♯',closed:tau===1};
}
export function circleHit(tau,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;const m=circleModel(tau);let best=null,distance=.11;for(const n of m.nodes){const d=Math.hypot(x-n.point[0],y-n.point[1]);if(d<distance){distance=d;best=n.j;}}return best;}
export function circleAudio(tau,selected,action){const m=circleModel(tau,selected);if(!['triad','walk','closing'].includes(action))throw new RangeError('Unknown circle action');return weRenderAudio(action==='triad'?[m.triad]:action==='closing'?[m.closing]:m.walk,action==='walk'?.25:.8,action==='walk'?.03:0);}
