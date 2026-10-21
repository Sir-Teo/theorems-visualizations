export const O={step:'any',decimals:4},I={int:true,step:1};
export const MR='https://hades.mech.northwestern.edu/images/2/25/MR-v2.pdf',BUSS='https://mathweb.ucsd.edu/~sbuss/ResearchWeb/ikmethods/iksurvey.pdf',FABRIK='https://andreasaristidou.com/publications/papers/FABRIK.pdf',SIXR='https://people.eecs.berkeley.edu/~jfc/papers/94/MCtra94.pdf';
export const MRREF='Lynch–Park, Modern Robotics, Dec.2019 updated first-edition preprint';
export function plane(v,title,R=3.2){return v.stage({title,x:[-R,R],y:[-R,R],equal:true,gutter:true,axes:'box',height:330,xlabel:'x (m)',ylabel:'y (m)'});}
export function arm(s,points,color='accent',alpha=1){s.path(points,{color,width:3,alpha});for(const p of points)s.dot(...p,{color,r:4,alpha});}
export function errors(v,title='Computed position error'){return v.stage({title,x:[-1,26],y:[1e-16,10],ylog:true,gutter:true,axes:'box',height:300,xlabel:'iteration',ylabel:'error (m)'});}
export function errorSeries(s,rows,color='accent') {const values=rows.map(r=>r.errorNorm),n=Math.max(1,values.length-1),hi=Math.max(1e-12,...values)*30;s.setView([-1,n+1],[1e-16,hi]);s.path(values.map((x,i)=>[i,Math.max(1e-14,x)]),{color,width:2});s.dot(values.length-1,Math.max(1e-14,values.at(-1)),{color,r:4});}
export const deg=x=>x*180/Math.PI;
export const norm=a=>Math.hypot(...a);
export const reachScope=String.raw`Unrestricted planar joints, positive link lengths in metres and position targets only. All reachability decisions use binary64 coordinates and computed distances; displayed residuals expose rounding near a boundary. The equal-link origin has a continuum of folded configurations. Joint limits, collision avoidance and tool orientation are absent.`;
export const numericScope=String.raw`Angles are in radians, lengths in metres. Calculations use binary64. A singular value is discarded when it is at most $10^{-12}$ times the largest; this is a declared numerical rank cutoff. Near singularities, forward accuracy depends on conditioning, so actual velocity/position residuals remain visible. Error charts show values below $10^{-14}\,\mathrm m$ at that plotting floor; readouts retain the computed error. No global convergence guarantee is made.`;
