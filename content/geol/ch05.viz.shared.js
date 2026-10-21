export const GRAV='https://ocw.mit.edu/courses/12-201-essentials-of-geophysics-fall-2004/7fa24d336366b74c52adb48ae6c8cf6f_ch2.pdf';
export const FLEX='https://ocw.mit.edu/courses/12-201-essentials-of-geophysics-fall-2004/0b35f48623dfd0c7ab89ab038a7ab343_ch5.pdf';
export const REBOUND='https://academic.oup.com/gji/article/179/3/1516/777379';
export const fmt=(x,d=3)=>Math.abs(x)>0&&Math.abs(x)<1e-4?x.toExponential(2):Number(x).toFixed(d);
export const continuous={step:'any',fmt:x=>fmt(x)};
export const chart=(v,title,xlabel='distance (km)',ylabel='height (km)',extra={})=>v.stage({x:[-1,1],y:[-1,1],axes:'box',gutter:true,height:350,title,xlabel,ylabel,...extra});
export const samples=(a,b,f,n=241)=>Array.from({length:n},(_,i)=>{const x=a+(b-a)*i/(n-1);return[x,f(x)];});
export function fit(s,arrays,xpad=.08,ypad=.2){const points=arrays.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys),dx=Math.max(.1,b-a),dy=Math.max(.01,d-c);s.setView([a-xpad*dx,b+xpad*dx],[c-ypad*dy,d+ypad*dy]);}
export const line=(s,p,color='accent',style={})=>s.path(p,{color,width:2,...style});
export const slider=(v,label,min,max,value)=>v.slider(label,min,max,value,continuous);
