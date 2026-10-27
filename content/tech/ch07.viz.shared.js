// Chapter-local drawing vocabulary. Coordinates in schematics are explicitly unscaled.
export const fmt=x=>x===null?'undefined':!Number.isFinite(x)?'outside numeric range':x===0?'0':(Math.abs(x)<.001||Math.abs(x)>=1e5?x.toExponential(3):Number(x.toPrecision(5)).toString()).replace(/-/g,'−');
export const pos=(x,positive,compact=false)=>x===0&&positive?(compact?'>0 (tiny)':'positive (below numeric range)'):fmt(x);
export const tick=x=>x===0?'0':(Math.abs(x)<.01||Math.abs(x)>=1e4?x.toExponential(1):Number(x.toPrecision(3)).toString()).replace(/-/g,'−');
export const slider=(v,label,min,max,value,int=false)=>v.slider(label,min,max,value,{step:int?1:'any',int,fmt,sig:6});
export const panel=(v,title,o={})=>v.stage({title,axes:false,aspect:1.06,minWidth:290,x:[0,10],y:[0,10],...o});
export const view=(s,x=[0,10],y=[0,10])=>{s.end();s.setView(x,y);s.begin();};
export const text=(s,t,x,y,color='ink',o={})=>s.text(String(t),x,y,{color,size:12,halo:false,...o});
export const box=(s,x,y,w,h,color,o={})=>s.rect(x,y,x+w,y+h,{fill:color,fillAlpha:1,stroke:false,...o});
export function wrap(s,t,x,y,width=8,{size=12,color='muted',lineHeight=1.45}={}){
 const c=s.ctx;c.save();c.font=s._font({size});const max=Math.abs(s.X(x+width)-s.X(x)),rows=[];let line='';for(const word of String(t).split(/\s+/)){if(line&&c.measureText(line+' '+word).width>max){rows.push(line);line=word;}else line=line?line+' '+word:word;}if(line)rows.push(line);c.restore();rows.forEach((row,i)=>text(s,row,x,y-i*size*lineHeight/s.sy,color,{size,baseline:'top'}));return y-rows.length*size*lineHeight/s.sy;
}
export function note(s,message){view(s);wrap(s,message,1,7.5,8,{size:14});}
export const pipe=(s,points,color='orange',width=6)=>{s.path(points,{color:'muted',width:width+2});s.path(points,{color,width});};
export function valve(s,x,y,open,color='teal'){s.poly([[x-.18,y-.16],[x+.18,y+.16],[x+.18,y-.16],[x-.18,y+.16]],{fill:open?color:'muted',fillAlpha:1,color:open?color:'muted',width:1});if(!open)s.line(x-.16,y-.23,x+.16,y+.23,{color:'ink',width:1.3});}
export function piston(s,x,y,w,h,fraction,color='orange',rod=.65){
 const top=y+h*fraction;box(s,x,y,w,Math.max(0,top-y),color,{fillAlpha:.18});s.path([[x,y+h],[x,y],[x+w,y],[x+w,y+h]],{color:'ink',width:2});s.line(x,top,x+w,top,{color:'ink',width:5});if(rod)s.line(x+w/2,top,x+w/2,top+rod,{color:'muted',width:3});return top;
}
export function fire(s,x,y,w=1.3){s.poly([[x,y],[x+w*.15,y+.65],[x+w*.28,y+.25],[x+w*.5,y+1.1],[x+w*.67,y+.4],[x+w*.9,y+.8],[x+w,y]],{fill:'orange',fillAlpha:.85,stroke:false});s.poly([[x+w*.25,y],[x+w*.5,y+.65],[x+w*.75,y]],{fill:'gold',fillAlpha:1,stroke:false});}
export function bars(s,rows,{unit='',foot=''}={}){
 view(s);const min=Math.min(0,...rows.map(r=>r.value)),max=Math.max(0,...rows.map(r=>r.value)),span=max-min||1,x=v=>1+(v-min)/span*8,dy=Math.min(2.2,6.4/rows.length);
 rows.forEach((r,i)=>{const y=7.5-i*dy;text(s,r.label,1,y+.55,'muted',{size:11});text(s,(r.value===0&&r.positive?'>0 (tiny)':fmt(r.value))+(unit?' '+unit:''),9,y+.55,r.color,{align:'right',size:12});box(s,1,y-.35,8,.6,'faint',{fillAlpha:.45});const a=x(0),b=x(r.value);if(a!==b)box(s,Math.min(a,b),y-.35,Math.abs(b-a),.6,r.color,{fillAlpha:.8});s.line(a,y-.5,a,y+.4,{color:'muted',width:1});});if(foot)wrap(s,foot,1,rows.length<=2?4.15:2.15,8,{size:11});
}
export function chart(s,series,{xr,yr,xlabel='',ylabel='',dots=[],area=null,areaColor='teal'}={}){
 view(s);const valid=series.flatMap(r=>r.points.filter(p=>p&&p.every(Number.isFinite))),xs=valid.map(p=>p[0]),ys=valid.map(p=>p[1]);xr=xr??[Math.min(0,...xs),Math.max(1,...xs)];yr=yr??[Math.min(0,...ys),Math.max(1,...ys)];if(xr[0]===xr[1])xr=[xr[0]-.5,xr[1]+.5];if(yr[0]===yr[1])yr=[yr[0]-.5,yr[1]+.5];const X=x=>2.1+(x-xr[0])/(xr[1]-xr[0])*7,Y=y=>1.6+(y-yr[0])/(yr[1]-yr[0])*6.5;
 for(const q of[0,.5,1]){const x=xr[0]+q*(xr[1]-xr[0]),y=yr[0]+q*(yr[1]-yr[0]);s.line(2.1,Y(y),9.1,Y(y),{color:'grid',width:1});text(s,tick(y),1.85,Y(y),'muted',{align:'right',size:10.5});text(s,tick(x),X(x),1.15,'muted',{align:q===0?'left':q===1?'right':'center',size:10.5});}
 s.path([[2.1,8.1],[2.1,1.6],[9.1,1.6]],{color:'muted',width:1});if(area)s.poly(area.map(([x,y])=>[X(x),Y(y)]),{fill:areaColor,fillAlpha:.16,stroke:false});
 for(const row of series)s.path(row.points.map(p=>p?[X(p[0]),Y(p[1])]:null),{color:row.color??'teal',width:row.width??2.4,dash:row.dash??false});for(const p of dots)if(p.x>=xr[0]&&p.x<=xr[1]&&p.y>=yr[0]&&p.y<=yr[1]){s.dot(X(p.x),Y(p.y),{color:p.color??'gold',r:5});s.dot(X(p.x),Y(p.y),{color:'ink',r:1.5});}text(s,ylabel,2.1,9.1,'muted',{size:11});text(s,xlabel,5.6,.45,'muted',{align:'center',size:11});return{X,Y,xr,yr};
}
export function gear(s,cx,cy,r,teeth,angle,color){
 const points=Array.from({length:teeth*4},(_,j)=>{const a=angle+j*Math.PI*2/(teeth*4),R=r*([1,2].includes(j%4)?1.045:.9);return[cx+R*Math.cos(a),cy+R*Math.sin(a)];});s.poly(points,{fill:color,fillAlpha:.13,color,width:1.5});s.circle(cx,cy,r,{color,width:1,dash:true,alpha:.55});s.dot(cx,cy,{color:'ink',r:4});
}
export const sampled=(n,fn)=>Array.from({length:n+1},(_,i)=>fn(i/n));
