// Bounded enumeration with explicit completion state, for the reviewed list-colouring displays.
export function analyseLists(A,L,{countCap=999,workCap=300000}={}){
 const n=A.length,col=Array(n).fill(-1);let count=0,work=0,witness=null,reason='complete';
 function visit(left){
  if(count>=countCap){reason='count-cap';return;}
  if(++work>workCap){reason='work-limit';return;}
  if(!left.length){count++;witness??=col.slice();return;}
  let v=-1,allowed=[],rest;
  for(const u of left){const colours=[];for(let c=0;c<30;c++)if((L[u]>>>c)&1){let good=true;for(let w=0;w<n;w++)if(((A[u]>>>w)&1)&&col[w]===c){good=false;break;}if(good)colours.push(c);}if(v<0||colours.length<allowed.length){v=u;allowed=colours;}if(!colours.length)return;}
  rest=left.filter(u=>u!==v);for(const c of allowed){col[v]=c;visit(rest);if(reason!=='complete')break;}col[v]=-1;
 }
 visit(Array.from({length:n},(_,i)=>i));
 return{count,colouring:witness,status:reason,complete:reason==='complete',work,found:witness!==null};
}
export function paletteObstruction(k,X){const palette=2*k-1,lists=[];for(let m=0;m<2**palette;m++)if(m.toString(2).replaceAll('0','').length===k)lists.push(m);return{palette,lists,top:lists.filter(m=>!(m&X)).length,bottom:lists.filter(m=>!(m&~X)).length};}
export const definitionLists={k33:[3,5,6,3,5,6],k24:[3,12,5,9,6,10],c4:[3,3,3,3],c5:[3,3,3,3,3]};
