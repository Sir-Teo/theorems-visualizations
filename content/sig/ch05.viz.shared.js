import{axes,O,I}from'./ch05.shared.js';
export{O,I};
export const menu=(v,label,rows,value)=>v.select(label,rows.map(([value,label])=>({value,label})),value);
export const panel=(v,title,xlabel)=>v.stage(axes(title,[-1,1],[-1,1],{xlabel,height:300}));
export const grid=(a,b,n=480)=>Array.from({length:n+1},(_,j)=>a+(b-a)*j/n);
export const curve=(f,a,b,color='accent',n=480)=>({points:grid(a,b,n).map(x=>[x,f(x)]),color});
export const complexCurves=(f,a,b)=>[curve(x=>f(x)[0],a,b),curve(x=>f(x)[1],a,b,'orange')];
// Every native point is included in the padded view, including stem endpoints.
export function draw(s,series,{stems=[],dots=[]}={}){const points=series.flatMap(q=>q.points).concat(stems.flatMap(p=>[[p[0],0],[p[0],p[1]]]),dots.map(p=>p.slice(0,2)));if(!points.length)points.push([-1,0],[1,0]);let xmin=Infinity,xmax=-Infinity,ymin=0,ymax=0;for(const[x,y]of points){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Nonfinite Fourier chart');xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}const dx=Math.max(.1,xmax-xmin),dy=Math.max(.1,ymax-ymin);s.setView([xmin-.09*dx,xmax+.09*dx],[ymin-.15*dy,ymax+.15*dy]);s.hline(0,{color:'grid'});for(const q of series)s.path(q.points,{color:q.color,width:2});for(const[x,y,color='gold']of stems){s.line(x,0,x,y,{color,width:1.5});s.dot(x,y,{color,r:3.5});}for(const[x,y,color='gold']of dots)s.dot(x,y,{color,r:4});}
export function legend(v){v.legend([['accent','real / primary'],['orange','imaginary / comparison'],['gold','selected value or mass']]);}
