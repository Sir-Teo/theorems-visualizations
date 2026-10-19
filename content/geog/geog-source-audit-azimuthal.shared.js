// Spherical stereographic circle equation, unit sphere and tangent-plane radius2.
export function stereoCircle(c,rho,bearing=0){
  const z=Math.cos(c),q=Math.cos(rho),d=z+q,s=Math.sin(c),u=s*Math.sin(bearing),v=s*Math.cos(bearing);
  // Numerical recognition of the exact through-antipode condition, not containment.
  if(Math.abs(d)<1e-10)return{line:true,normal:[u,v],offset:q-z};
  return{line:false,x:2*u/d,y:2*v/d,R:2*Math.sin(rho)/Math.abs(d),enclosesAntipode:c+rho>Math.PI};
}
export function orthographicSlice(c,halfWidth=5*Math.PI/180){const a=Math.max(0,c-halfWidth),b=Math.min(Math.PI/2,c+halfWidth);return{a,b,length:b-a,shadow:Math.sin(b)-Math.sin(a)};}
export const azimuthalScale=(kind,c)=>{if(kind==='gnomonic')return{h:1/Math.cos(c)**2,k:1/Math.cos(c)};if(kind==='stereographic')return{h:1/Math.cos(c/2)**2,k:1/Math.cos(c/2)**2};if(kind==='orthographic')return{h:Math.cos(c),k:1};return{h:1,k:c===0?1:c/Math.sin(c)};};
