export const O={step:'any',decimals:4};
export const axis=(title,x,y,o={})=>({title,x,y,axes:'box',gutter:{l:68,r:18},height:300,...o});
export function fit(s,points,pad=.18){const p=points.filter(z=>z&&z.every(Number.isFinite));if(!p.length)return;const xs=p.map(z=>z[0]),ys=p.map(z=>z[1]),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys),dx=Math.max(1,b-a),dy=Math.max(1,d-c);s.setView([a-pad*dx,b+pad*dx],[c-pad*dy,d+pad*dy]);}
export const num=(v,x)=>!Number.isFinite(x)?'\\text{not finite in binary64}':x!==0&&Math.abs(x)<1e-300?(()=>{const[m,e]=x.toExponential(4).split('e');return`${Number(m)}\\times10^{${Number(e)}}`;})():v.sci(x,5);
export const residual=(v,x)=>`$${num(v,x)}$`;
// Tighten only this instance's existing native-handle adapter, before any restore setter can clamp it.
// StateRegistry.parts is its public adapter Map; no runtime or component inventory is changed.
export function guardHandle(stage,handle,bounds){const key=`handle:${stage.rt.stages.indexOf(stage)}:${stage.handles.indexOf(handle)}:0`,adapter=stage.rt.state.parts.get(key);if(!adapter)throw Error('OPT handle adapter is missing');const finite=adapter.valid;adapter.valid=p=>finite(p)&&p[0]>=bounds[0][0]&&p[0]<=bounds[0][1]&&p[1]>=bounds[1][0]&&p[1]<=bounds[1][1];}
