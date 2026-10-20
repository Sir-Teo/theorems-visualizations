// Geometric lines and a bounded complete binary-colouring search; not a game-value solver.
export const CUBE_BOARDS=Object.freeze([2,3,4,5].flatMap(n=>[1,2,3,4].filter(d=>n**d<=256).map(d=>Object.freeze({value:`${n}^${d}`,label:`${n}^${d}`}))));
export const CUBE_BUDGETS=Object.freeze([1000,300000]);
export function cubeSize(board){if(!CUBE_BOARDS.some(x=>x.value===board))throw new RangeError('Offered cube required');const[n,d]=board.split('^').map(Number);return{n,d,N:n**d};}
export function cubeCoords(i,n,d){return Array.from({length:d},(_,j)=>Math.floor(i/n**j)%n);}
const cache=new Map();
export function cubeLines(board){const{n,d}=cubeSize(board),lines=[],seen=new Set();
 function visit(spec){if(spec.length<d){for(let j=0;j<n+2;j++)visit([...spec,j]);return;}if(spec.every(j=>j<n))return;
  const cells=Array.from({length:n},(_,t)=>spec.reduce((s,j,k)=>s+(j<n?j:j===n?t:n-1-t)*n**k,0)),key=cells.slice().sort((a,b)=>a-b).join(',');if(!seen.has(key)){seen.add(key);lines.push(cells);}}
 visit([]);return lines;
}
export function cubeSearch(board='3^3',budget=300000){const{n,d,N}=cubeSize(board);if(!CUBE_BUDGETS.includes(budget))throw new RangeError('Offered node budget required');const key=`${board}:${budget}`;if(cache.has(key))return structuredClone(cache.get(key));
 const lines=cubeLines(board),byLast=Array.from({length:N},()=>[]);for(const line of lines)byLast[Math.max(...line)].push(line);
 const colours=Array(N).fill(-1);let nodes=0,depth=0,partial=colours.slice();
 function search(i){if(nodes===budget)return'unknown';nodes++;if(i>depth){depth=i;partial=colours.slice();}if(i===N)return'found';
  // Every colouring has a colour-swapped counterpart, so fixing cell zero to blue loses no existence witness.
  for(const c of i===0?[0]:[0,1]){colours[i]=c;if(byLast[i].every(l=>!l.every(j=>colours[j]===c))){const result=search(i+1);if(result!=='none')return result;}}
  colours[i]=-1;return'none';}
 const result=search(0),shown=result==='found'?colours.slice():partial,counts=[shown.filter(c=>c===0).length,shown.filter(c=>c===1).length],compatible=result==='found'&&Math.abs(counts[0]-counts[1])<=1;
 const data={board,n,d,N,budget,result,nodes,depth,shown,counts,compatible,lines,lineCount:lines.length,formula:((n+2)**d-n**d)/2};cache.set(key,data);return structuredClone(data);
}
export function cubePlace(i,n,d){const a=cubeCoords(i,n,d);return[a[0]+(a[2]??0)*(n+.8),(a[1]??0)+(a[3]??0)*(n+.8)];}
export function cubeModel(board='3^3',budget=300000,pick=0){const a=cubeSearch(board,budget);if(!Number.isInteger(pick)||pick<0||pick>=a.N)throw new RangeError('Actual cube cell required');const width=a.d>=3?a.n*(a.n+.8)-.8:a.n,height=a.d>=4?a.n*(a.n+.8)-.8:a.d>=2?a.n:1;
 return{...a,pick,width,height,positions:Array.from({length:a.N},(_,i)=>cubePlace(i,a.n,a.d)),through:a.lines.filter(l=>l.includes(pick)),table:CUBE_BOARDS.map(x=>{const p=cubeSearch(x.value,budget);return{board:p.board,result:p.result,nodes:p.nodes};})};
}
export function cubeHit(model,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;for(let i=0;i<model.N;i++){const[a,b]=model.positions[i];if(x>=a+.06&&x<=a+.94&&y>=b+.06&&y<=b+.94)return i;}return null;}
export function cubeSelectionValid(s){if(!s||typeof s!=='object'||Object.keys(s).length!==2||!CUBE_BOARDS.some(x=>x.value===s.board))return false;return Number.isInteger(s.pick)&&s.pick>=0&&s.pick<cubeSize(s.board).N;}
