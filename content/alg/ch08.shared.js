// Exact binary arithmetic for Judson chapter 8; integers encode words most-significant bit first.
export const SOURCE='https://judsonbooks.org/aata-files/aata-20230811-print.pdf';
export const bits=(x,n)=>Array.from({length:n},(_,i)=>(x>>(n-1-i))&1);
export const integer=a=>a.reduce((x,b)=>2*x+b,0);
export const word=(x,n)=>bits(x,n).join('');
export const weight=x=>{let w=0;for(;x;x>>>=1)w+=x&1;return w;};
export const distance=(x,y)=>weight(x^y);
export const all=n=>Array.from({length:2**n},(_,i)=>i);
export const xor=a=>a.reduce((x,y)=>x^y,0);
export const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
export const mv=(H,x)=>integer(H.map(row=>row.reduce((s,a,j)=>s^(a*bits(x,row.length)[j]),0)));
export const mm=(H,G)=>H.map(row=>G[0].map((_,j)=>row.reduce((s,a,k)=>s^(a*G[k][j]),0)));
export const canonical=A=>({H:A.map((r,i)=>[...r,...identity(A.length)[i]]),G:[...identity(A[0].length),...A.map(r=>[...r])]});
export const kernel=H=>all(H[0].length).filter(x=>mv(H,x)===0);
export function span(basis){let a=[0];for(const b of basis)a=[...new Set([...a,...a.map(x=>x^b)])];return a.sort((x,y)=>x-y);}
export function rank(H){const R=H.map(a=>[...a]);let r=0;for(let j=0;j<R[0].length&&r<R.length;j++){const k=R.findIndex((a,i)=>i>=r&&a[j]);if(k<0)continue;[R[k],R[r]]=[R[r],R[k]];for(let i=0;i<R.length;i++)if(i!==r&&R[i][j])R[i]=R[i].map((x,t)=>x^R[r][t]);r++;}return r;}
export const minDistance=C=>C.length<2?null:Math.min(...C.flatMap((x,i)=>C.slice(i+1).map(y=>distance(x,y))));
export const minWeight=C=>C.some(x=>x)?Math.min(...C.filter(Boolean).map(weight)):null;
export const closed=C=>C.length>0&&C.every(x=>C.every(y=>C.includes(x^y)));
export const parity=x=>(x<<1)|(weight(x)%2);
export function likelihood(q,n,d){return q**d*(1-q)**(n-d);}
export function ml(C,r,n,q){const ds=C.map(c=>distance(c,r)),scores=ds.map(d=>likelihood(q,n,d)),impossible=q===0?!ds.includes(0):q===1?!ds.includes(n):false;const target=q<.5?Math.min(...ds):Math.max(...ds);return{scores,impossible,winners:C.filter((c,i)=>impossible||q===.5||ds[i]===target)};}
export const choose=(n,k)=>{let x=1;for(let i=1;i<=k;i++)x=x*(n+1-i)/i;return x;};
export const binomial=(n,q)=>Array.from({length:n+1},(_,k)=>choose(n,k)*q**k*(1-q)**(n-k));
export function rng(seed){let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/2**32;};}
export function channel(n,N,q,seed){const r=rng(seed),counts=Array(n+1).fill(0),samples=[];for(let k=0;k<N;k++){let e=0;for(let j=0;j<n;j++)e=(e<<1)|+(r()<q);counts[weight(e)]++;if(k<32)samples.push(e);}return{counts,samples};}
export const bookA=[[0,1,1],[1,1,0],[1,0,1]];
export const bookH=[[0,1,1,0,0],[1,0,0,1,0],[1,1,0,0,1]];
export function columns(H){return H[0].map((_,j)=>integer(H.map(r=>r[j])));}
export function columnFacts(H){const cols=columns(H);return{cols,zero:cols.map((x,i)=>x===0?i:-1).filter(x=>x>=0),duplicates:cols.flatMap((x,i)=>cols.slice(i+1).map((y,j)=>x===y?[i,i+j+1]:null).filter(Boolean)),detect:cols.every(Boolean),correct:cols.every(Boolean)&&new Set(cols).size===cols.length};}
export function cosets(H){const n=H[0].length,C=kernel(H),groups=[];for(const x of all(n)){if(groups.some(g=>g.words.includes(x)))continue;const words=C.map(c=>c^x).sort((a,b)=>a-b),min=Math.min(...words.map(weight)),leaders=words.filter(w=>weight(w)===min);groups.push({words,leaders,syndrome:mv(H,x)});}return groups.sort((a,b)=>a.syndrome-b.syndrome);}
export function decode(H,r){const group=cosets(H).find(g=>g.syndrome===mv(H,r)),leader=group.leaders[0];return{...group,leader,decoded:r^leader};}
export const pct=(x,d=2)=>(100*x).toFixed(d)+'%';
export const fmt=x=>x===null?'not defined (no distinct pair/nonzero word)':String(x);
export function panel(v,title,{height=300,x=[-1,9],y=[-1,5],...extra}={}){return v.stage({title,x,y,height,axes:false,...extra});}
export function row(s,x,n,y,label='',color='accent',highlight=0){const a=bits(x,n);if(label)s.text(label,-.6,y,{align:'right',size:12});a.forEach((b,j)=>{if((highlight>>(n-1-j))&1)s.rect(j-.38,y-.32,j+.38,y+.32,{fill:'gold',fillAlpha:.18,stroke:false});s.dot(j,y,{color:b?color:'muted',r:6,hollow:!b});});}
export function binaryRows(s,rows,n,{labels=[],colors=[],highlights=[]}={}){s.setView([-3,n+.2],[-1,Math.max(2,rows.length)]);rows.forEach((x,i)=>row(s,x,n,rows.length-1-i,labels[i]??'',colors[i]??'accent',highlights[i]??0));}
export function matrix(s,M,{highlight=-1,highlightRow=-1,color='accent'}={}){const m=M.length,n=M[0].length;s.setView([-.8,n-.2],[-.8,m-.2]);for(let i=0;i<m;i++)for(let j=0;j<n;j++){s.rect(j-.4,m-1-i-.35,j+.4,m-1-i+.35,{fill:j===highlight||i===highlightRow?'gold':M[i][j]?color:'muted',fillAlpha:M[i][j]?.35:.08,stroke:false});s.text(String(M[i][j]),j,m-1-i,{size:14,align:'center'});}}
export function wordCloud(s,C,n,{selected=null,colors=null,labels=true}={}){const cols=Math.min(4,C.length),rows=Math.ceil(C.length/cols);s.setView([-.7,cols-.3],[-.6,rows-.4]);C.forEach((x,i)=>{const xx=i%cols,yy=rows-1-Math.floor(i/cols),color=colors?colors(x):x===selected?'gold':'accent';s.rect(xx-.44,yy-.32,xx+.44,yy+.32,{fill:color,fillAlpha:.15,stroke:x===selected,color:'purple',width:2});if(labels)s.text(word(x,n),xx,yy,{color,size:n>6?11:13,align:'center'});});}
export function bars(s,values,{colors=null,select=-1,xlabel='index',ylabel='value'}={}){const top=Math.max(1e-8,...values);s.setView([-.7,values.length-.3],[-.08*top,1.2*top]);s.setLabels(xlabel,ylabel);values.forEach((x,i)=>{s.rect(i-.32,0,i+.32,x,{fill:i===select?'gold':colors?.[i]??'accent',fillAlpha:.6,stroke:false});});}
export function barPanel(v,title,xlabel='index',ylabel='value',height=290){return v.stage({title,x:[-1,4],y:[-.1,1.2],axes:'box',gutter:true,xlabel,ylabel,height});}
export function AControls(v){return[3,6,5].map((x,i)=>v.slider(`A row ${i+1} (binary value)`,0,7,x,{int:true}));}
export const fromRows=controls=>controls.map(c=>bits(c.value,3));
export function HControls(v){return[12,18,25].map((x,i)=>v.slider(`H row ${i+1} (5 bits)`,0,31,x,{int:true}));}
export const fromHRows=controls=>controls.map(c=>bits(c.value,5));
export function distanceGrid(s,C,n,selected=[-1,-1]){const N=C.length;s.setView([-.7,N-.3],[-.7,N-.3]);for(let i=0;i<N;i++)for(let j=0;j<N;j++){const d=distance(C[i],C[j]);s.rect(j-.45,N-1-i-.45,j+.45,N-1-i+.45,{fill:i===selected[0]&&j===selected[1]?'gold':i===j?'muted':'accent',fillAlpha:.05+.6*d/n,stroke:false});s.text(String(d),j,N-1-i,{size:N>8?9:12,align:'center'});}}
