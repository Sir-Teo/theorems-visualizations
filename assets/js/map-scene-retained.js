// A second isolated experiment. The committed persistent scene is its reference.
import {WebGLMapScene} from './map-webgl-scene.js';
import {sceneProgram} from './map-scene-gl.js';
import {resolveColor} from './viz/core.js';
const vertex=`#version 300 es
precision highp float;uniform vec2 resolution;uniform vec4 box;out vec2 uv;
void main(){vec2 q=vec2(gl_VertexID&1,gl_VertexID>>1);uv=vec2(q.x,1.-q.y);gl_Position=vec4((box.xy+q*box.zw)/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const fragment=`#version 300 es
precision highp float;uniform sampler2D image;in vec2 uv;out vec4 pixel;void main(){pixel=texture(image,uv);}`;

// Same MAX-coverage union and source-over group order, with an explicit output
// rectangle. Only the output/clip region changes; world geometry is retained.
function unionRegion(renderer,model,groups,view,target,clip=target){
 const gl=renderer.gl,mask=renderer.ensureMask(Math.round(view.width*view.dpr),Math.round(view.height*view.dpr)),p=renderer.composite;
 for(const group of groups){if(!group.count)continue;const b=group.bounds,margin=group.width*5+2,left=Math.max(clip.x,b?Math.floor((b[0]*view.k+view.tx-margin)*view.dpr):clip.x),right=Math.min(clip.x+clip.width,b?Math.ceil((b[2]*view.k+view.tx+margin)*view.dpr):clip.x+clip.width),top=Math.max(clip.y,b?Math.floor((b[1]*view.k+view.ty-margin)*view.dpr):clip.y),bottom=Math.min(clip.y+clip.height,b?Math.ceil((b[3]*view.k+view.ty+margin)*view.dpr):clip.y+clip.height);
  for(let y=Math.floor(top/mask.height)*mask.height;y<bottom;y+=mask.height)for(let x=Math.floor(left/mask.width)*mask.width;x<right;x+=mask.width){const l=Math.max(x,left),r=Math.min(x+mask.width,right),t=Math.max(y,top),d=Math.min(y+mask.height,bottom);if(r<=l||d<=t)continue;
   gl.bindFramebuffer(gl.FRAMEBUFFER,mask.framebuffer);gl.viewport(0,0,mask.width,mask.height);gl.enable(gl.SCISSOR_TEST);gl.scissor(l-x,mask.height-(d-y),r-l,d-t);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.blendEquation(gl.MAX);gl.blendFunc(gl.ONE,gl.ONE);renderer.bind(model,group,view,x,y,mask.width,mask.height,true);
   gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);gl.viewport(0,0,target.width,target.height);gl.scissor(l-target.x,target.height-(d-target.y),r-l,d-t);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(renderer.quadVAO);gl.useProgram(p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,mask.texture);gl.uniform1i(renderer.location(p,'coverage'),0);gl.uniform2i(renderer.location(p,'origin'),x-target.x,target.height-(y-target.y)-mask.height);gl.uniform2f(renderer.location(p,'resolution'),target.width/view.dpr,target.height/view.dpr);gl.uniform4f(renderer.location(p,'box'),(l-target.x)/view.dpr,(t-target.y)/view.dpr,(r-l)/view.dpr,(d-t)/view.dpr);gl.uniform4fv(renderer.location(p,'color'),group.color);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
 }
 gl.disable(gl.SCISSOR_TEST);gl.activeTexture(gl.TEXTURE0);
}
export function retainedMissingRegions(width,height,box){
 const left=Math.max(0,Math.min(width,Math.round(box[0]))),right=Math.max(left,Math.min(width,Math.round(box[0]+box[2]))),top=Math.max(0,Math.min(height,Math.round(box[1]))),bottom=Math.max(top,Math.min(height,Math.round(box[1]+box[3])));
 if(right<=left||bottom<=top)return[{x:0,y:0,width,height}];
 return[{x:0,y:0,width,height:top},{x:0,y:bottom,width,height:height-bottom},{x:0,y:top,width:left,height:bottom-top},{x:right,y:top,width:width-right,height:bottom-top}].filter(r=>r.width&&r.height);
}

export class RetainedMapScene {
 constructor(map,options){this.map=map;this.base=new WebGLMapScene(map,options);this.cache=null;this.hits=0;this.builds=0;this.allocations=0;this.reusedAllocations=0;this.uncoveredPixels=0;this.failedBuilds=0;
  const base=this.base,original=base.controls;let grayKey=null,hadFocus=false;base.controls=(focus,closure)=>{const m=this.map,key=[m.show.defs,m.show.planned,[...m.show.fields].join(','),resolveColor('ink')].join('|'),keep=[];if(focus&&hadFocus&&key===grayKey)for(const [id,group]of base.groups)if(id.endsWith(':gray')&&!group.model.released){keep.push([id,group]);base.groups.delete(id);}try{return original.call(base,focus,closure);}finally{for(const [id,group]of keep)base.groups.set(id,group);grayKey=key;hadFocus=!!focus;}};
 }
 get ready(){return this.base.ready;}get status(){return this.base.status;}get active(){return this.base.active;}get gl(){return this.base.gl;}get budget(){return this.base.budget;}get canvas(){return this.base.canvas;}get pending(){return this.base.pending;}get worker(){return this.base.worker;}geometry(...args){return this.base.geometry(...args);}
 attach(){const base=this.base,gl=base.gl;if(this.owner===base.edges)return;if(this.owner)this.drop();this.owner=base.edges;if(!this.owner)return;this.program=sceneProgram(gl,vertex,fragment);this.vao=gl.createVertexArray();this.locations=Object.fromEntries(['resolution','box','image'].map(key=>[key,gl.getUniformLocation(this.program,key)]));
  this.originalUnion=this.owner.union;const experiment=this,originalView=base.painter.view;this.owner.union=function(model,groups,view){const focus=experiment.map.hover||experiment.map.sel,first=experiment.pass++===0;if(!focus||first)return experiment.edges(model,groups,view,focus?'gray':'color');return experiment.originalUnion.call(this,model,groups,view);};
  // The original scene scales 32px title words during motion. Keep native word
  // size/phase here so an edge-cache approximation cannot compound that error.
  base.painter.view=function(width,height,dpr,moving){return originalView.call(this,width,height,dpr,experiment.exactText?false:moving);};
  const reserve=base.budget.reserve;base.budget.reserve=function(...args){
   // Visibility indices and coverage can allocate after the cache is built.
   // Protect tiers at every allocation, so those passes evict RGBA reuse first.
   const entries=experiment.map.k*experiment.map.dpr<=4?['edges:0.5','edges:4','bundles:0.5'].map(key=>this.entries.get(base.models.get(key))).filter(Boolean):[],evictable=entries.map(entry=>entry.evictable);
   for(const entry of entries)entry.evictable=false;
   try{return reserve.apply(this,args);}finally{entries.forEach((entry,i)=>{entry.evictable=evictable[i];});}
  };
 }
 drop(){if(this.cache){this.base.budget?.release(this.cache);this.cache=null;}}
 // The .35/1.15 thresholds change live labels, rather than these edge sets.
 key(kind){const m=this.map;return[kind,m.W,m.H,m.dpr,m.show.defs,m.show.planned,[...m.show.fields].join(','),kind==='color'?!!m.hl:false,document.documentElement.dataset.theme,resolveColor('ink'),this.base.cap].join('|');}
 allocate(view,key){
  const base=this.base,gl=base.gl,budget=base.budget;let permanent=0;for(const [owner,value]of budget.entries)if(!value.evictable&&owner!==base.edges.mask&&owner!==this.cache)permanent+=value.bytes;
  // A fit/focus transition crosses the initial edge tiers. Cache capacity must
  // leave both resident, plus the small bundled tier, rather than spend their
  // bytes on RGBA storage and force cold Canvas frames on the next transition.
  const protectedEntries=['edges:0.5','edges:4','bundles:0.5'].map(key=>budget.entries.get(base.models.get(key))).filter(Boolean),evictable=protectedEntries.map(entry=>entry.evictable);
  for(const entry of protectedEntries)if(entry.evictable)permanent+=entry.bytes;
  const pw=Math.round(view.width*view.dpr),ph=Math.round(view.height*view.dpr),mw=Math.min(4096,pw,8_000_000),mh=Math.min(4096,ph,Math.floor(8_000_000/mw)),maskBytes=mw*mh,available=budget.limit-permanent-maskBytes-2_000_000,maxPixels=Math.floor(available/4);
  if(maxPixels<16_384)throw new RangeError('No bounded edge-cache capacity');let width=pw,height=ph,pad=48;
  while(pad>0&&(Math.ceil((view.width+2*pad)*view.dpr)*Math.ceil((view.height+2*pad)*view.dpr)>maxPixels||Math.max((view.width+2*pad)*view.dpr,(view.height+2*pad)*view.dpr)>4096))pad-=8;
  if(pw*ph<=maxPixels&&Math.max(pw,ph)<=4096){width=Math.ceil((view.width+2*pad)*view.dpr);height=Math.ceil((view.height+2*pad)*view.dpr);}
  else{const ratio=pw/ph;width=Math.min(4096,pw,Math.floor(Math.sqrt(maxPixels*ratio)));height=Math.min(4096,ph,Math.floor(maxPixels/width));}
  const placement={key,x:Math.floor((pw-width)/2),y:Math.floor((ph-height)/2),k:view.k,tx:view.tx,ty:view.ty,dpr:view.dpr};
  if(this.cache&&!this.cache.released&&this.cache.width===width&&this.cache.height===height){Object.assign(this.cache,placement);const entry=budget.entries.get(this.cache);if(entry)entry.evictable=false;this.reusedAllocations++;return this.cache;}
  this.drop();const cache={...placement,width,height,framebuffer:null,texture:null,released:false};
  for(const entry of protectedEntries)entry.evictable=false;try{budget.reserve(cache,width*height*4,()=>{gl.deleteTexture(cache.texture);gl.deleteFramebuffer(cache.framebuffer);cache.released=true;});}finally{protectedEntries.forEach((entry,i)=>{entry.evictable=evictable[i];});}
  try{cache.texture=base.edges.texture(width,height,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindTexture(gl.TEXTURE_2D,cache.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);cache.framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,cache.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,cache.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Edge-cache framebuffer unavailable');this.cache=cache;this.allocations++;return cache;}catch(error){budget.release(cache);throw error;}
 }
 edges(model,groups,view,kind){
  const base=this.base,gl=base.gl,key=this.key(kind),moving=this.map.zooming||this.map.dragging;let cache=this.cache;const ratio=cache?view.k/cache.k:1;
  const exact=cache&&cache.k===view.k&&cache.tx===view.tx&&cache.ty===view.ty;
  if(!cache||cache.released||cache.key!==key||(!moving&&!exact)||ratio<.75||ratio>1.4){
   const started=performance.now();
   try{cache=this.allocate(view,key);this.edgeCosts.allocationMS+=performance.now()-started;gl.bindFramebuffer(gl.FRAMEBUFFER,cache.framebuffer);gl.viewport(0,0,cache.width,cache.height);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);unionRegion(base.edges,model,groups,view,cache);this.builds++;const entry=base.budget.entries.get(cache);if(entry)entry.evictable=true;this.edgeCosts.buildMS+=performance.now()-started;}
   catch(error){this.edgeCosts.buildMS+=performance.now()-started;this.failedBuilds++;this.drop();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,Math.round(view.width*view.dpr),Math.round(view.height*view.dpr));const uncached=performance.now();this.originalUnion.call(base.edges,model,groups,view);this.edgeCosts.uncachedMS+=performance.now()-uncached;return;}
  }else{this.hits++;base.budget.touch(cache);}
  const blitStarted=performance.now();
  const scale=view.k/cache.k,box=[(cache.x/cache.dpr-cache.tx)*scale+view.tx,(cache.y/cache.dpr-cache.ty)*scale+view.ty,cache.width/cache.dpr*scale,cache.height/cache.dpr*scale],pw=Math.round(view.width*view.dpr),ph=Math.round(view.height*view.dpr),missing=retainedMissingRegions(pw,ph,box.map(v=>v*view.dpr));
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,pw,ph);const left=Math.max(0,Math.min(pw,Math.round(box[0]*view.dpr))),right=Math.max(left,Math.min(pw,Math.round((box[0]+box[2])*view.dpr))),top=Math.max(0,Math.min(ph,Math.round(box[1]*view.dpr))),bottom=Math.max(top,Math.min(ph,Math.round((box[1]+box[3])*view.dpr)));gl.enable(gl.SCISSOR_TEST);gl.scissor(left,ph-bottom,right-left,bottom-top);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(this.vao);gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,cache.texture);gl.uniform1i(this.locations.image,0);gl.uniform2f(this.locations.resolution,view.width,view.height);gl.uniform4fv(this.locations.box,box);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disable(gl.SCISSOR_TEST);
  this.edgeCosts.blitMS+=performance.now()-blitStarted;
  const missingStarted=performance.now(),target={x:0,y:0,width:pw,height:ph,framebuffer:null};this.uncoveredPixels=missing.reduce((n,r)=>n+r.width*r.height,0);for(const clip of missing)unionRegion(base.edges,model,groups,view,target,clip);this.edgeCosts.missingRegionMS+=performance.now()-missingStarted;
 }
 draw(){this.pass=0;this.uncoveredPixels=0;this.edgeCosts={buildMS:0,allocationMS:0,blitMS:0,missingRegionMS:0,uncachedMS:0};this.attach();this.exactText=true;try{return this.base.draw();}finally{this.exactText=false;}}
 resources(){const original=this.base.resources(),bytes=this.cache&&!this.cache.released?this.base.budget.entries.get(this.cache)?.bytes||0:0;return{...original,components:{...original.components,retainedEdgeRGBA:bytes},componentSum:original.componentSum+bytes,edgeCache:{bytes,hits:this.hits,builds:this.builds,allocations:this.allocations,reusedAllocations:this.reusedAllocations,failedBuilds:this.failedBuilds,uncoveredPixels:this.uncoveredPixels,costs:this.edgeCosts,rect:this.cache&&!this.cache.released?[this.cache.x,this.cache.y,this.cache.width,this.cache.height]:null}};}
 destroy(options){this.drop();if(this.program)this.gl?.deleteProgram(this.program);if(this.vao)this.gl?.deleteVertexArray(this.vao);this.base.destroy(options);}
}
