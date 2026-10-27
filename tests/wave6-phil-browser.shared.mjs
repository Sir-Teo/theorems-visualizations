// Owned browser instrumentation. Product files remain byte-exact while each guarded run is active.
import {installLingGlyphMasks} from './wave6-ling-glyph.shared.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

export async function installPhilProbe(page){
 await page.addInitScript(installLingGlyphMasks);
 await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const t=new URL(location.href).searchParams.get('qaTheme');if(t)localStorage.setItem('theme',t);});
 await page.route('**/content/phil/ch06.viz.js',async route=>{
  let source=fs.readFileSync(new URL('../content/phil/ch06.viz.js',import.meta.url),'utf8');
  source="function nativeProbe(name,...args){window.__phil6ModelName=name;window.__phil6ModelError=null;window.__phil6Model=null;try{const z=H[name](...args);window.__phil6Model=z;return z;}catch(e){window.__phil6ModelError=e.message;throw e;}}\n"+source;
  source=source.replace(/(z|cached)=H\.(\w+)\(/g,(_,target,name)=>`${target}=nativeProbe('${name}',`);
  source=source.replace('if(!points.some(p=>p&&p.every(Number.isFinite)))', 's.__philCurve={points,current};if(!points.some(p=>p&&p.every(Number.isFinite)))');
  await route.fulfill({contentType:'text/javascript',body:source});
 });
 await page.route('**/assets/js/viz/core.js',async route=>{
  let source=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
  const marker='try { vizFn(instance.api); }';assert.ok(source.includes(marker));
  source=source.replace(marker,`window.__phil6Runtime=instance;
   for(const kind of ['stage','stage3d']){const old=instance.api[kind];instance.api[kind]=(...args)=>{
    const s=old(...args),begin=s.begin.bind(s);s.__kind=kind;
    const reset=()=>{s.__paths=[];s.__polys=[];s.__lines=[];s.__arrows=[];s.__dots=[];s.__rects=[];s.__meshes=[];s.__glyphs=[];s.__paintedAxes=null;};reset();
    s.begin=(...a)=>{reset();return begin(...a);};
    if(kind==='stage'){const axes=s.axes.bind(s);s.axes=(...a)=>{s.__paintedAxes={bounds:s.bounds,yticks:s.o.yticks};return axes(...a);};}
    const fillText=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(str,x,y,...rest)=>{const c=s.ctx,ink=window.__lingGlyphBounds(String(str),c),T=c.getTransform(),d=s.canvas.width/s.W;if(!ink)return fillText(str,x,y,...rest);const box=[[x+ink.l,y+ink.t],[x+ink.r,y+ink.t],[x+ink.l,y+ink.b],[x+ink.r,y+ink.b]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]);s.__glyphs.push({text:String(str),l:Math.min(...box.map(p=>p[0])),r:Math.max(...box.map(p=>p[0])),t:Math.min(...box.map(p=>p[1])),b:Math.max(...box.map(p=>p[1])),dataClip:!!s._clipped,g:s._m?{...s._m}:null});return fillText(str,x,y,...rest);};
    for(const [method,key]of [['path','__paths'],['poly','__polys'],['line','__lines'],['arrow','__arrows'],['dot','__dots']]){const fn=s[method].bind(s);s[method]=(...a)=>{let points,style;if(method==='path'||method==='poly'){points=a[0];style=a[1]||{};}else if(kind==='stage3d'){points=method==='dot'?[a[0]]:[a[0],a[1]];style=a[method==='dot'?1:2]||{};}else{points=method==='dot'?[[a[0],a[1]]]:[[a[0],a[1]],[a[2],a[3]]];style=a[method==='dot'?2:4]||{};}s[key].push({points,style,pixels:points.map(p=>p?(kind==='stage3d'?s.project(p):[s.X(p[0]),s.Y(p[1])]):null)});return fn(...a);};}
    if(kind==='stage'){const rect=s.rect.bind(s);s.rect=(...a)=>{s.__rects.push({points:[[a[0],a[1]],[a[2],a[3]]],style:a[4]||{}});return rect(...a);};}
    else{const surface=s.surface.bind(s);s.surface=(F,u,w,st={})=>{const mesh={points:[],style:st};s.__meshes.push(mesh);return surface((a,b)=>{const p=F(a,b);mesh.points.push(p);return p;},u,w,st);};}
    return s;
   };}
   ${marker}`);
  await route.fulfill({contentType:'text/javascript',body:source});
 });
}

export async function capturePhil(page){
 await page.locator('#viz').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>window.__phil6Runtime?.visible);
 await page.evaluate(async()=>{await document.fonts.ready;window.dispatchEvent(new Event('vizpause'));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.__phil6Runtime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));});
 return page.evaluate(()=>{
  const rt=window.__phil6Runtime,issues=[];if(rt.dead||(window.__vizErrors||[]).length)issues.push({type:'production draw failure',errors:window.__vizErrors});if((window.__texErrors||[]).length)issues.push({type:'strict TeX',errors:window.__texErrors});
  const pack=x=>{if(Array.isArray(x))return x.map(pack);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>k!=='exact').map(([k,v])=>[k,pack(v)]));return x;};
  const stages=rt.stages.map((s,j)=>{
   for(const g of s.__glyphs){if(g.l< -1||g.r>s.W+1||g.t< -1||g.b>s.H+1)issues.push({type:'canvas ink',stage:j,g,W:s.W,H:s.H});if(g.dataClip&&g.g&&(g.l<g.g.l-1||g.r>s.W-g.g.r+1||g.t<g.g.t-1||g.b>s.H-g.g.b+1))issues.push({type:'data glyph clipped',stage:j,g,W:s.W,H:s.H});}
   for(let a=0;a<s.__glyphs.length;a++)for(let b=a+1;b<s.__glyphs.length;b++){const A=s.__glyphs[a],B=s.__glyphs[b],w=Math.min(A.r,B.r)-Math.max(A.l,B.l),h=Math.min(A.b,B.b)-Math.max(A.t,B.t);if(w>2&&h>2)issues.push({type:'glyph overlap',stage:j,texts:[A.text,B.text],intersection:[w,h]});}
   for(const el of s.overlay.querySelectorAll('.tex-label')){if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();if(b.width&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({type:'overlay box',stage:j,text:el.textContent});const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1))issues.push({type:'overlay ink',stage:j,text:node.textContent});}}
   const geometries=[...s.__paths,...s.__polys,...s.__lines,...s.__arrows,...s.__dots,...s.__meshes,...s.__rects];
   for(const geometry of geometries)for(const p of geometry.points){if(!p)continue;if(!p.every(Number.isFinite)){issues.push({type:'nonfinite geometry',stage:j,p});continue;}const pixel=s.__kind==='stage3d'?s.project(p):[s.X(p[0]),s.Y(p[1])];if(pixel[0]< -1||pixel[0]>s.W+1||pixel[1]< -1||pixel[1]>s.H+1)issues.push({type:'canvas geometry',stage:j,p,pixel,canvas:[s.W,s.H]});}
   if(s.__kind==='stage'){
    if(s.o.axes&&JSON.stringify(s.__paintedAxes?.bounds)!==JSON.stringify(s.bounds))issues.push({type:'axis/data view mismatch',stage:j,painted:s.__paintedAxes?.bounds,final:s.bounds});
    for(const path of s.__paths)for(let k=0;k<path.points.length;k++){const p=path.points[k],at=path.pixels[k];if(p&&at&&(Math.abs(at[0]-s.X(p[0]))>1e-7||Math.abs(at[1]-s.Y(p[1]))>1e-7))issues.push({type:'paint transform drift',stage:j});}
    const g=s.o.gutter?s._m:{l:0,r:0,t:0,b:0};
    for(const dot of s.__dots){const p=dot.points[0],x=s.X(p[0]),y=s.Y(p[1]),r=(dot.style.r??4)+1;if(x-r<g.l-1||x+r>s.W-g.r+1||y-r<g.t-1||y+r>s.H-g.b+1)issues.push({type:'marker ink',stage:j,p,r});}
    for(const a of s.__arrows){const P=a.points.map(p=>[s.X(p[0]),s.Y(p[1])]),dx=P[1][0]-P[0][0],dy=P[1][1]-P[0][1],L=Math.hypot(dx,dy);if(L<.5)continue;const u=dx/L,v=dy/L,h=Math.min(a.style.head??9,L*.45),pad=(a.style.width??2)/2,points=[...P,[P[1][0]-u*h-v*h*.45,P[1][1]-v*h+u*h*.45],[P[1][0]-u*h+v*h*.45,P[1][1]-v*h-u*h*.45]];for(const[x,y]of points)if(x-pad<g.l-1||x+pad>s.W-g.r+1||y-pad<g.t-1||y+pad>s.H-g.b+1)issues.push({type:'arrow ink',stage:j,points});}
   }
   return pack({curve:s.__philCurve,frame:s.__philFrame,range:s.o.range,camera:[s.yaw,s.pitch,s.zoom],kind:s.__kind,W:s.W,H:s.H,sx:s.sx,sy:s.sy,bounds:s.bounds,yticks:s.o.yticks,paintedAxes:s.__paintedAxes,paths:s.__paths,polys:s.__polys,lines:s.__lines,arrows:s.__arrows,dots:s.__dots,rects:window.__phil6ModelName==='population'?s.__rects.slice(0,12):s.__rects,rectSummary:s.__rects.reduce((a,r)=>{const k=String(r.style.fill);if(!a[k])a[k]={count:0,area:0};a[k].count++;a[k].area+=Math.abs((r.points[1][0]-r.points[0][0])*(r.points[1][1]-r.points[0][1]));return a;},{}),meshes:s.__meshes,glyphs:s.__glyphs,focusGrid:s.__philFocusGrid,countGrid:s.__philCountGrid,ledger:s.__phil6Ledger});
  });
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.stage-title,.refs-inline,.ctl-label,.ctl-value,.viz-legend')){if(getComputedStyle(el).display==='none'||!el.getClientRects().length)continue;const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({type:'rich ink',text:node.textContent,bounds:[r.left,r.top,r.right,r.bottom],container:[left,b.top,right,b.bottom]});}}
  for(const el of document.querySelectorAll('.katex-display')){const b=el.getBoundingClientRect(),inner=el.querySelector('.katex-html')?.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||inner&&(inner.left<b.left-1||inner.right>b.right+1))issues.push({type:'inner math',text:el.textContent});}
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page overflow'});
  const state=rt.state.capture(),controls=[...document.querySelectorAll('#viz input[type=range]')].map(e=>({label:e.getAttribute('aria-label'),value:Number(e.value)}));
  const palette=Object.fromEntries(['teal','blue','orange','purple','red','gold','muted','ink','faint','panel'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--c-'+k).trim()]));
  const pixels=rt.stages.map((s,j)=>{const rgba=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;let ink=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]>20)ink++;if(ink<20)issues.push({type:'blank canvas pixels',stage:j,ink});return{width:s.canvas.width,height:s.canvas.height,paintedPixels:ink};});
  const paintSamples=[];
  for(const[sIndex,s]of rt.stages.entries()){
   const seen=new Set(),d=s.canvas.width/s.W;
   const rgb=c=>{const t=document.createElement('canvas').getContext('2d');t.fillStyle=rt.api.color(c);t.fillRect(0,0,1,1);return Array.from(t.getImageData(0,0,1,1).data).slice(0,3);};
   const boxes=s.__rects.map(r=>({l:Math.min(...r.points.map(p=>s.X(p[0]))),r:Math.max(...r.points.map(p=>s.X(p[0]))),t:Math.min(...r.points.map(p=>s.Y(p[1]))),b:Math.max(...r.points.map(p=>s.Y(p[1]))),style:r.style}));
   const clear=(x,y)=>!boxes.some(b=>b.style.stroke!==false&&(b.style.color!=null||b.style.width!=null||!b.style.fill)&&x>b.l-2&&x<b.r+2&&y>b.t-2&&y<b.b+2&&Math.min(Math.abs(x-b.l),Math.abs(x-b.r),Math.abs(y-b.t),Math.abs(y-b.b))<(b.style.width??2)/2+1.5)&&!s.__glyphs.some(g=>x>g.l-2&&x<g.r+2&&y>g.t-2&&y<g.b+2)&&!s.__dots.some(g=>Math.hypot(x-s.X(g.points[0][0]),y-s.Y(g.points[0][1]))<(g.style.r??4)+2)&&![...s.__lines,...s.__arrows,...s.__paths].some(g=>{for(let i=1;i<g.points.length;i++){const a=g.points[i-1],b=g.points[i];if(!a||!b)continue;const ax=s.X(a[0]),ay=s.Y(a[1]),bx=s.X(b[0]),by=s.Y(b[1]),dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<(g.style.width??2)/2+1.5)return true;}return false;});
   for(const[i,b]of boxes.entries()){
    const color=b.style.fill;if(!color||(b.style.fillAlpha??.15)!==1||seen.has(color)||b.r-b.l<1.1||b.b-b.t<1.1)continue;
    for(const[fx,fy]of[[.5,.5],[.7,.3],[.3,.7]]){
     const px=Math.floor((b.l+(b.r-b.l)*fx)*d),py=Math.floor((b.t+(b.b-b.t)*fy)*d),x=(px+.5)/d,y=(py+.5)/d;
     if(x-b.l<.6||b.r-x<.6||y-b.t<.6||b.b-y<.6||!clear(x,y)||boxes.slice(i+1).some(a=>a.style.fill&&a.style.fill!==color&&x>a.l-.5&&x<a.r+.5&&y>a.t-.5&&y<a.b+.5))continue;
     paintSamples.push({label:'stage '+sIndex+' '+color+' interior',point:[x,y],box:b,rgba:Array.from(s.ctx.getImageData(px,py,1,1).data),expected:rgb(color)});seen.add(color);break;
    }
   }
   for(const[i,g]of s.__dots.entries()){
    const color=g.style.color||'ink',r=g.style.r??4;if(g.style.hollow||r<4||(g.style.alpha??1)!==1||seen.has('dot:'+color))continue;
    for(const[fx,fy]of[[0,0],[.6,0],[-.6,0],[0,.6],[0,-.6]]){
     const px=Math.floor((s.X(g.points[0][0])+fx*r)*d),py=Math.floor((s.Y(g.points[0][1])+fy*r)*d),x=(px+.5)/d,y=(py+.5)/d;
     if(s.__glyphs.some(a=>x>a.l-1&&x<a.r+1&&y>a.t-1&&y<a.b+1)||s.__dots.slice(i+1).some(a=>Math.hypot(x-s.X(a.points[0][0]),y-s.Y(a.points[0][1]))<(a.style.r??4)+1))continue;
     paintSamples.push({label:'stage '+sIndex+' '+color+' marker interior',point:[x,y],rgba:Array.from(s.ctx.getImageData(px,py,1,1).data),expected:rgb(color)});seen.add('dot:'+color);break;
    }
   }
  }
  return{issues,state,controls,stages,palette,pixels,paintSamples,modelName:window.__phil6ModelName,model:pack(window.__phil6Model),modelError:window.__phil6ModelError,readout:document.querySelector('.viz-readout')?.innerText,theme:document.documentElement.dataset.theme,drawErrors:[...document.querySelectorAll('.viz-error')].map(e=>e.innerText)};
 });
}

export async function phil6Screenshot(page,file){
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});
 const bounds=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});
 await page.screenshot({path:file,clip:bounds,fullPage:true});
 const regions=await page.locator('#viz').evaluate(host=>{const b=host.getBoundingClientRect();return Object.fromEntries(['.viz-stages','.viz-legend','.viz-controls','.viz-readout'].map(selector=>{const r=host.querySelector(selector)?.getBoundingClientRect();return[selector,r?{x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}:null];}));});
 fs.writeFileSync(file.replace('.png','.regions.json'),JSON.stringify(regions,null,2)+'\n');
}
