import fs from'node:fs';
import{installTechProbe,captureTech}from'./wave6-tech-browser.shared.mjs';
export const installTechNative=installTechProbe;
export async function captureTechNative(page){
 const q=await captureTech(page);
 const paint=await page.evaluate(()=>{
  const rt=window.__tech7Runtime,samples=[],issues=[],unresolved=[];
  const palette=color=>rt.api.rgb(color).slice(0,3),mix=(fg,a,bg,b)=>{const alpha=a+b*(1-a);return[...fg.map((v,i)=>Math.round((v*a+bg[i]*b*(1-a))/alpha)),Math.round(alpha*255)];};
  for(const[index,s]of rt.stages.entries()){
   const rgba=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data,d=s.canvas.width/s.W,W=s.canvas.width,H=s.canvas.height,start=samples.length;let lineSamples=0;
   const at=(x,y)=>{x=Math.floor(x*d);y=Math.floor(y*d);if(x<0||y<0||x>=W||y>=H)return null;const k=(y*W+x)*4;return Array.from(rgba.slice(k,k+4));};
   const find=(label,points,expected,kind,minimumAlpha=0)=>{for(const[x,y]of points)for(const dx of[0,-.6,.6])for(const dy of[0,-.6,.6]){const actual=at(x+dx,y+dy);if(actual&&actual[3]>=minimumAlpha&&expected.every((v,i)=>Math.abs(actual[i]-v)<=(i===3?1:3))){samples.push({stage:index,kind,label,point:[x+dx,y+dy],expected,minimumAlpha,rgba:actual});return true;}}return false;};
   const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
   const XY=p=>[s.X(p[0]),s.Y(p[1])];
   if(s.__techBars){const rows=s.__techBars.rows,min=Math.min(0,...rows.map(r=>r.value)),max=Math.max(0,...rows.map(r=>r.value)),span=max-min||1,X=v=>1+(v-min)/span*8,dy=Math.min(2.2,6.4/rows.length);for(const[rowIndex,item]of rows.entries()){
     const y=7.5-rowIndex*dy,a=X(0),b=X(item.value),px=Math.abs(s.X(b)-s.X(a));if(item.value!==0&&px>=5){const expected=mix(palette(item.color),.8,palette('faint'),.45),ok=find('bar '+item.label,[XY([(a+b)/2,y-.05])],expected,'bar interior');if(!ok)issues.push({type:'bar RGB mismatch',stage:index,label:item.label,expected,width:px});}else if(item.value!==0||item.positive)unresolved.push({stage:index,label:item.label,pixels:px,reason:'No reliable interior pixel at this value; numeric label carries the result.'});
    }}
   for(const primitive of s.__techPrimitives){const a=primitive.args,method=primitive.method;let st={};
    if(method==='dot'){
     st=a[2]||{};const r=st.r??4;if(r<3)continue;const x=s.X(a[0]),y=s.Y(a[1]),pts=[[0,0],[.55,0],[-.55,0],[0,.55],[0,-.55],[.4,.4],[-.4,-.4]].map(([u,v])=>[x+r*u,y+r*v]);find('dot '+(st.color||'ink'),pts,[...palette(st.color||'ink'),255],'opaque marker');
    }else if(method==='rect'){
     st=a[4]||{};if(!st.fill)continue;const x=(a[0]+a[2])/2,y=(a[1]+a[3])/2,w=Math.abs(s.X(a[0])-s.X(a[2])),h=Math.abs(s.Y(a[1])-s.Y(a[3]));if(w<4||h<4)continue;const color=st.fill===true?st.color||'accent':st.fill,alpha=st.fillAlpha??.18;find('rectangle '+color,[XY([x,y]),XY([a[0]+.3*(a[2]-a[0]),y]),XY([a[0]+.7*(a[2]-a[0]),y])],[...palette(color),Math.round(alpha*255)],'uncomposited rectangle');
    }else if(method==='circle'){
     st=a[3]||{};if(!st.fill)continue;const color=st.fill===true?st.color||'accent':st.fill,alpha=st.fillAlpha??.18;find('circle '+color,[[0,0],[.3,.2],[-.3,.2],[.2,-.3]].map(([x,y])=>XY([a[0]+a[2]*x,a[1]+a[2]*y])),[...palette(color),Math.round(alpha*255)],'circle interior');
    }else if(method==='path'||method==='poly'||method==='line'||method==='arrow'){
     const points=method==='path'||method==='poly'?a[0]:[[a[0],a[1]],[a[2],a[3]]];st=a[method==='path'||method==='poly'?1:4]||{};if(st.stroke===false||(st.width??1.5)<1||(st.alpha??1)<1)continue;const candidates=[];for(let j=0;j+1<points.length;j++){const p=points[j],r=points[j+1];if(!p||!r||!p.every(Number.isFinite)||!r.every(Number.isFinite))continue;const A=XY(p),B=XY(r);if(Math.hypot(B[0]-A[0],B[1]-A[1])<2)continue;if(j%(Math.max(1,Math.floor(points.length/16)))===0||j===points.length-2)for(const t of[.08,.2,.35,.5,.65,.8,.92])candidates.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]);}if(candidates.length&&find('stroke '+(st.color||'ink'),candidates,(st.width??1.5)<2?palette(st.color||'ink'):[...palette(st.color||'ink'),255],(st.width??1.5)<2?'antialiased stroke RGB':'visible opaque stroke',(st.width??1.5)<2?96:0))lineSamples++;
    }
   }
   if(s.__techChart?.area?.length>2){const {area,areaColor='teal',xr,yr}=s.__techChart,x=area.map(p=>p[0]),y=area.map(p=>p[1]),bx=[Math.min(...x),Math.max(...x)],by=[Math.min(...y),Math.max(...y)],candidate=[];for(const u of[.31,.43,.57,.69])for(const v of[.29,.41,.59,.71]){const p=[bx[0]+u*(bx[1]-bx[0]),by[0]+v*(by[1]-by[0])];if(inside(p,area))candidate.push(XY([2.1+7*(p[0]-xr[0])/(xr[1]-xr[0]),1.6+6.5*(p[1]-yr[0])/(yr[1]-yr[0])]));}if(candidate.length)find('chart area '+areaColor,candidate,[...palette(areaColor),Math.round(.16*255)],'area interior');}
   if(samples.length===start){for(const g of s.__techGlyphs){const points=[];for(let x=Math.ceil(g.left);x<g.right;x++)for(let y=Math.ceil(g.top);y<g.bottom;y++)points.push([x,y]);let found=false;for(const color of['ink','muted','teal','orange','blue','red','gold'])if(find('text '+g.text,points,palette(color),'glyph RGB',128)){found=true;break;}if(found)break;}}
   if(samples.length===start)issues.push({type:'no actual RGB sample',stage:index});
   const c=s.__techChart;if(c){let length=0;for(const row of c.series)for(let j=0;j+1<row.points.length;j++){const a=row.points[j],b=row.points[j+1];if(a&&b)length+=Math.hypot((b[0]-a[0])/(c.xr[1]-c.xr[0])*7*s.sx,(b[1]-a[1])/(c.yr[1]-c.yr[0])*6.5*s.sy);}if(length>10&&lineSamples===0)issues.push({type:'no visible chart-series RGB sample',stage:index,length});}
  }
  return{paintSamples:samples,paintIssues:issues,unresolvedInteriors:unresolved};
 });
 return{...q,...paint,issues:[...q.issues,...paint.paintIssues]};
}
export async function techScreenshot(page,file){
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});const bounds=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});await page.screenshot({path:file,clip:bounds,fullPage:true});
 const regions=await page.locator('#viz').evaluate(host=>{const b=host.getBoundingClientRect();return Object.fromEntries(['.viz-stages','.viz-legend','.viz-controls','.viz-readout'].map(selector=>{const r=host.querySelector(selector)?.getBoundingClientRect();return[selector,r?{x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}:null];}));});fs.writeFileSync(file.replace('.png','.regions.json'),JSON.stringify(regions,null,2)+'\n');
}
