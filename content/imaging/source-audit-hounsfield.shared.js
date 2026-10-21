// Synthetic modern-HU head; each later ellipse paints over earlier material.
export const HOUNSFIELD_HEAD_AUDIT = [[40,.95,.78,0,0,0],[900,.9,.73,0,0,0],[10,.84,.67,0,0,0],[40,.82,.65,0,0,0],[26,.62,.46,0,0,0],[10,.14,.32,-.16,.08,-12],[10,.14,.32,.16,.08,12],[65,.12,.1,.38,-.2,20],[10,.05,.05,0,-.22,0]];
export function paintedHuAudit(x,y,paint=HOUNSFIELD_HEAD_AUDIT) {
  let value=-1000;
  for(const [h,a,b,cx,cy,rot] of paint) {
    const r=rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r),X=x-cx,Y=y-cy;
    if(((X*c+Y*s)/a)**2+((-X*s+Y*c)/b)**2<=1)value=h;
  }
  return value;
}
// Exact line integral of the painter model: split at every ellipse crossing,
// then integrate the last painted material on each open interval.
export function paintedProjectionAudit(theta,offset,paint=HOUNSFIELD_HEAD_AUDIT) {
  const c=Math.cos(theta),s=Math.sin(theta),cuts=[];
  for(const [,a,b,cx,cy,rot] of paint) {
    const r=rot*Math.PI/180,cr=Math.cos(r),sr=Math.sin(r),x=offset*c-cx,y=offset*s-cy,X=x*cr+y*sr,Y=-x*sr+y*cr,dx=-s*cr+c*sr,dy=s*sr+c*cr;
    const A=(dx/a)**2+(dy/b)**2,B=2*(X*dx/(a*a)+Y*dy/(b*b)),C=(X/a)**2+(Y/b)**2-1,d=B*B-4*A*C;
    // Tangencies must also split an interval: its midpoint must not mistake
    // a single boundary contact for a finite segment of the tangential tissue.
    if(d>=0){cuts.push((-B-Math.sqrt(d))/(2*A),(-B+Math.sqrt(d))/(2*A));}
  }
  cuts.sort((a,b)=>a-b);let total=0;
  for(let i=1;i<cuts.length;i++) {
    const a=cuts[i-1],b=cuts[i],t=(a+b)/2;
    total+=(b-a)*(1+paintedHuAudit(offset*c-t*s,offset*s+t*c,paint)/1000);
  }
  return total;
}
export const paintedSinogramAudit = sc => Float64Array.from({length:sc.nA*sc.nd},(_,i)=>paintedProjectionAudit(sc.th[Math.floor(i/sc.nd)],sc.sOf(i%sc.nd)));
export function headClotIncrementAudit(theta,offset) {
  const noClot=HOUNSFIELD_HEAD_AUDIT.filter(q=>q[0]!==65);
  return paintedProjectionAudit(theta,offset)-paintedProjectionAudit(theta,offset,noClot);
}
