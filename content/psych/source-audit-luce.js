/** Finite positive choice families. Luce2008 author's account §§1/2.1–2.4.
 * Empty menus are outside the theorem and have no probability distribution.
 * The grouped rule is authored; it is not a fitted psychological law.
 */
const validWeights = w => Array.isArray(w) && w.length===4 && w.every(x=>Number.isFinite(x)&&x>0);
const validMask = m => Number.isInteger(m)&&m>=0&&m<16;
const ids = m => [0,1,2,3].filter(i=>m&(1<<i));
function normalize(w,indices) {
  const max=Math.max(...indices.map(i=>w[i])),total=indices.reduce((s,i)=>s+w[i]/max,0),p=[0,0,0,0];
  indices.forEach(i=>{p[i]=(w[i]/max)/total;});return p;
}

export function luceMenu(weights,mask,groupCopies=false) {
  if(!validWeights(weights)||!validMask(mask))throw new RangeError('Four positive finite weights and a four-option menu required');
  if(!mask)return null;
  const offered=ids(mask);
  if(!groupCopies)return normalize(weights,offered);
  const groups=[[0],[1,2],[3]].map(g=>g.filter(i=>mask&(1<<i))).filter(g=>g.length),strengths=groups.map(g=>Math.max(...g.map(i=>weights[i]))),max=Math.max(...strengths),total=strengths.reduce((s,x)=>s+x/max,0),p=[0,0,0,0];
  groups.forEach((g,k)=>{const within=normalize(weights,g),share=(strengths[k]/max)/total;g.forEach(i=>{p[i]=share*within[i];});});return p;
}

/** All15 nonempty menus and all54 unordered-pair/nested-menu comparisons.
 * Includes S=T comparisons. Numeric residuals describe floating-point results;
 * the exact construction/proof, not a tolerance, establishes Luce's axiom.
 */
export function luceAudit(weights,groupCopies=false) {
  if(!validWeights(weights))throw new RangeError('Four positive finite weights required');
  const menus=Array.from({length:15},(_,i)=>({mask:i+1,p:luceMenu(weights,i+1,groupCopies)})),comparisons=[];
  for(let small=1;small<16;small++)for(let large=small;large<16;large++)if((small&large)===small){
    const S=menus[small-1].p,T=menus[large-1].p;
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if((small&(1<<i))&&(small&(1<<j)))comparisons.push({small,large,i,j,smallOdds:S[i]/S[j],largeOdds:T[i]/T[j],residual:S[i]*T[j]-S[j]*T[i]});
  }
  const witness=comparisons.reduce((best,x)=>Math.abs(x.residual)>Math.abs(best.residual)?x:best,comparisons[0]),full=menus[14].p;
  const reconstructionMax=Math.max(...menus.flatMap(({mask,p})=>{const inferred=luceMenu(full,mask);return p.map((x,i)=>Math.abs(x-inferred[i]));}));
  return{menus,comparisons,witness,maxResidual:Math.abs(witness.residual),reconstructionMax};
}

export function luceState(strengths,mask,model,copy) {
  if(!validWeights(strengths)||!validMask(mask)||!['luce','copies'].includes(model))throw new RangeError('Valid finite choice scenario required');
  const weights=[...strengths];if(copy)weights[2]=weights[1];
  const grouped=model==='copies'&&copy,p=luceMenu(weights,mask,grouped),pair=luceMenu(weights,3,grouped),withoutMask=mask&~4,without=luceMenu(weights,withoutMask,grouped),audit=luceAudit(weights,grouped);
  return{weights,mask,model,copy:!!copy,grouped,p,pair,withoutMask,without,audit,normalized:luceMenu(weights,15),odds:p&&(mask&3)===3?p[0]/p[1]:null,pairOdds:weights[0]/weights[1]};
}
