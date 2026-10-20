// Explicit diagnostic of the isolated GPU experiment; no timing or renderer edits.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from './serve.mjs';
import {mapScenePrototype} from './lib/map-scene-prototype.mjs';

const output=process.argv[2],dataRoot=process.argv[3];
assert.ok(output&&dataRoot,'usage: node scripts/audit-map-scene-area-census.mjs OUTPUT_JSON FROZEN_DATA_DIR');
const hash=x=>createHash('sha256').update(x).digest('hex'),hashes={},frozen=new Map();
for(const name of ['index','planned']){const bytes=await readFile(`${dataRoot}/${name}.json`);frozen.set(name,bytes);hashes[`data/${name}`]=hash(bytes);}
const source=await readFile(new URL('../assets/js/graph.js',import.meta.url),'utf8');
for(const name of ['graph','map-webgl-scene','map-scene-edges','map-scene-model'])hashes[name]=hash(await readFile(new URL(`../assets/js/${name}.js`,import.meta.url)));
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal']});
const results=[];
try{
  for(const width of [1440,3840]){
    const page=await browser.newPage({viewport:{width,height:width===1440?1000:2160},deviceScaleFactor:2,colorScheme:'light'});
    try{
      for(const [name,body]of frozen)await page.route(`**/data/${name}.json`,r=>r.fulfill({body,contentType:'application/json'}));
      await page.route('**/assets/js/graph.js',r=>r.fulfill({body:mapScenePrototype(source),contentType:'application/javascript'}));
      await page.goto(`http://localhost:${server.address().port}/#/map`);
      await page.waitForFunction(()=>window.__mapAudit?.__scene?.status==='ready',null,{timeout:60000});
      await page.evaluate(()=>document.fonts.ready);
      for(const selected of [false,true])results.push(await page.evaluate(selected=>{
        const m=window.__mapAudit,s=m.__scene,e=s.edges,gl=s.gl,target=m.byId.get('ladr-2.30');
        const check=(v,msg)=>{if(!v)throw Error(msg);};
        m.select(null,false);m.hover=null;m.hl=null;m.userMoved=true;m.finishZoom();m.k=.8;m.tx=m.W/2-target.x*m.k;m.ty=m.H/2-target.y*m.k;
        if(selected)m.select(target,false);
        cancelAnimationFrame(m._raf);m._raf=0;s.invalidate();
        const labels=new WeakMap(),calls=[],oldGroup=s.group,oldUnion=e.union,oldScissor=gl.scissor,oldBind=e.bind;
        s.group=function(model,key,...args){const g=oldGroup.call(this,model,key,...args);labels.set(g,key);return g;};
        e.union=function(model,groups,view){
          const scissors=[],binds=[];
          gl.scissor=function(...args){scissors.push(args);return oldScissor.apply(this,args);};
          e.bind=function(model,g,...args){binds.push({g,args});return oldBind.call(this,model,g,...args);};
          let returned;try{returned=oldUnion.call(this,model,groups,view);}finally{gl.scissor=oldScissor;e.bind=oldBind;}
          const pw=Math.round(view.width*view.dpr),ph=Math.round(view.height*view.dpr),mask=this.mask,expected=[],expectedBinds=[],rows=[];
          for(const g of groups){
            const b=g.bounds,pad=g.width*5+2,l=b?Math.max(0,Math.floor((b[0]*view.k+view.tx-pad)*view.dpr)):0,r=b?Math.min(pw,Math.ceil((b[2]*view.k+view.tx+pad)*view.dpr)):pw,t=b?Math.max(0,Math.floor((b[1]*view.k+view.ty-pad)*view.dpr)):0,d=b?Math.min(ph,Math.ceil((b[3]*view.k+view.ty+pad)*view.dpr)):ph;
            let area=0,tiles=0;
            for(let y=Math.floor(t/mask.height)*mask.height;y<d;y+=mask.height)for(let x=Math.floor(l/mask.width)*mask.width;x<r;x+=mask.width){
              const a=Math.max(l,x),z=Math.min(r,x+mask.width),c=Math.max(t,y),q=Math.min(d,y+mask.height);if(z<=a||q<=c)continue;
              expected.push([a-x,mask.height-(q-y),z-a,q-c],[a,ph-q,z-a,q-c]);expectedBinds.push({g,args:[view,x,y,mask.width,mask.height,true]});area+=(z-a)*(q-c);tiles++;
            }
            check(area===Math.max(0,r-l)*Math.max(0,d-t),'tile areas must partition bounded rectangle');
            rows.push({style:labels.get(g),bounds:b,width:g.width,segments:g.count,tiles,clearPixels:area,compositePixels:area,submittedSegmentInstances:g.count*tiles,rectangle:[l,t,r,d]});
          }
          check(JSON.stringify(scissors)===JSON.stringify(expected),'actual GL scissors disagree with source-derived bounds');
          check(binds.length===expectedBinds.length,'unexpected coverage draw count');
          binds.forEach((b,i)=>{const x=expectedBinds[i];check(b.g===x.g&&b.args[0]===x.args[0]&&JSON.stringify(b.args.slice(1))===JSON.stringify(x.args.slice(1)),'coverage bind differs from expected tile');});
          calls.push({viewportPixels:pw*ph,mask:[mask.width,mask.height],scissorCalls:scissors.length,groups:rows});return returned;
        };
        try{check(s.draw()===true,'scene failed to draw');check(gl.getError()===gl.NO_ERROR,'GL error');}finally{s.group=oldGroup;e.union=oldUnion;gl.scissor=oldScissor;e.bind=oldBind;}
        check(calls.length>0,'no edge union recorded');
        const groups=calls.flatMap(c=>c.groups),sum=k=>groups.reduce((a,g)=>a+g[k],0);
        return{selected,width:m.W,height:m.H,dpr:m.dpr,k:m.k,tx:m.tx,ty:m.ty,nodes:m.nodes.length,edges:m.edges.length,nodeIDs:m.nodes.map(n=>n.it.id),edgeIDs:m.edges.map(([a,b])=>[a.it.id,b.it.id]),calls,totals:{activeStyleGroups:groups.length,uniqueGroupSegments:sum('segments'),submittedSegmentInstances:sum('submittedSegmentInstances'),clearPixels:sum('clearPixels'),compositePixels:sum('compositePixels'),tileDraws:sum('tiles')}};
      },selected));
    }finally{await page.close();}
  }
  for(const r of results){r.nodeIDsHash=hash(JSON.stringify(r.nodeIDs));r.edgeIDsHash=hash(JSON.stringify(r.edgeIDs));delete r.nodeIDs;delete r.edgeIDs;}
  assert.equal(new Set(results.map(r=>r.nodeIDsHash)).size,1);assert.equal(new Set(results.map(r=>r.edgeIDsHash)).size,1);
  await writeFile(output,JSON.stringify({complete:true,diagnostic:true,method:'One synchronous isolated GPU scene draw per state; actual GL scissors and coverage bindings compared with source-derived per-style/tile rectangles. Logical operation counts only. Concurrent host/browser work permitted; no durations, FPS, GPU costs, pixel correctness or production acceptance claimed.',browser:browser.version(),hashes,results},null,2)+'\n');
  console.log(JSON.stringify(results.map(({width,selected,nodes,edges,totals})=>({width,selected,nodes,edges,...totals})),null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
