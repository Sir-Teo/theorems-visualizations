// Isolated Canvas/DOM experiment, loaded only by the explicit test rewrite.
export const COMPOSITOR_PIXEL_CAP=16_000_000,COMPOSITOR_EDGE_CAP=8192;
export function compositorAllocation(W,H,dpr){
 if(!Number.isFinite(W)||!Number.isFinite(H)||!Number.isFinite(dpr)||W<=0||H<=0||dpr<=0)return null;
 const underWidth=Math.ceil(W*dpr),underHeight=Math.ceil(H*dpr),under=underWidth*underHeight;
 for(let pad=256;pad>=0;pad-=16){const width=W+2*pad,height=H+2*pad,pixelWidth=Math.ceil(width*dpr),pixelHeight=Math.ceil(height*dpr),pixels=under+pixelWidth*pixelHeight;
  if(pixels<=COMPOSITOR_PIXEL_CAP&&Math.max(underWidth,underHeight,pixelWidth,pixelHeight)<=COMPOSITOR_EDGE_CAP)return{pad,width,height,pixelWidth,pixelHeight,underWidth,underHeight,pixels};
 }
 return null;
}
export class CanvasMapCompositor{
 constructor(map){this.m=map;this.cache=null;this.underlay=null;this.geometry=null;this.dead=false;this.stats={builds:0,hits:0,geometryPaints:0,underlayPaints:0,labelPaints:0,transformWrites:0,fullFrameCopies:0,fallbacks:0,pixels:0,peakPixels:0};this.savedZ=map.canvas.style.zIndex;}
 invalidate(){this.cache=null;}
 release(){for(const k of['underlay','geometry'])if(this[k]){this[k].width=this[k].height=0;this[k].remove();this[k]=null;}this.cache=null;this.stats.pixels=0;this.m.canvas.style.zIndex=this.savedZ;}
 destroy(){this.release();this.dead=true;}
 fallback(reason){this.stats.fallbacks++;this.stats.reason=reason;this.release();return false;}
 draw(){
  const m=this.m;if(this.dead)return false;
  if(!(m.zooming||m.dragging)||m.sel||m.hover||m.hl)return this.fallback('stationary/focus/highlight');
  const a=compositorAllocation(m.W,m.H,m.dpr);if(!a)return this.fallback('resource limit');
  // Existing offscreen rasters cannot remain as uncounted additional storage.
  m.mapRaster=m.focusRaster=null;
  const lod=m.k<.13?0:m.k<.35?1:m.k<1.15?2:3,key=[m.W,m.H,m.dpr,m.show.defs,m.show.planned,[...m.show.fields].join(','),document.documentElement.dataset.theme,lod].join('|');
  const old=this.cache,ratio=old?m.k/old.k:1,left=old?m.tx-old.tx*ratio-old.pad*ratio:0,top=old?m.ty-old.ty*ratio-old.pad*ratio:0;
  const covered=old&&left<=0&&top<=0&&left+old.width*ratio>=m.W&&top+old.height*ratio>=m.H;
  const rebuild=!old||old.key!==key||ratio<.9||ratio>1.1||!covered;
  if(!this.underlay){this.underlay=document.createElement('canvas');this.geometry=document.createElement('canvas');for(const [i,c]of[this.underlay,this.geometry].entries()){c.setAttribute('aria-hidden','true');c.dataset.canvasCompositor=String(i);c.style.cssText=`position:absolute;inset:auto;left:0;top:0;pointer-events:none;z-index:${i};transform-origin:0 0`;m.canvas.before(c);}this.geometry.style.willChange='transform';m.canvas.style.zIndex='2';}
  const {underlay,geometry}=this;
  if(underlay.width!==a.underWidth)underlay.width=a.underWidth;if(underlay.height!==a.underHeight)underlay.height=a.underHeight;
  underlay.style.width=m.W+'px';underlay.style.height=m.H+'px';
  const saved={ctx:m.ctx,W:m.W,H:m.H,tx:m.tx,ty:m.ty};
  try{
   if(rebuild){
    if(geometry.width!==a.pixelWidth)geometry.width=a.pixelWidth;if(geometry.height!==a.pixelHeight)geometry.height=a.pixelHeight;
    geometry.style.width=a.width+'px';geometry.style.height=a.height+'px';
    m.ctx=geometry.getContext('2d');m.ctx.lineCap=saved.ctx.lineCap;m.W=a.width;m.H=a.height;m.tx+=a.pad;m.ty+=a.pad;m._paintCompositorPart('geometry');this.stats.geometryPaints++;
    Object.assign(m,saved);this.cache={...a,key,k:m.k,tx:m.tx,ty:m.ty,lod};this.stats.builds++;
   }else this.stats.hits++;
   m.ctx=underlay.getContext('2d');m._paintCompositorPart('underlay');this.stats.underlayPaints++;
   Object.assign(m,saved);m._paintCompositorPart('labels');this.stats.labelPaints++;
  }catch(error){Object.assign(m,saved);this.stats.error=error.message;return this.fallback('paint exception');}finally{Object.assign(m,saved);}
  const cache=this.cache,scale=m.k/cache.k,x=Math.round((m.tx-cache.tx*scale)*m.dpr)/m.dpr-cache.pad*scale,y=Math.round((m.ty-cache.ty*scale)*m.dpr)/m.dpr-cache.pad*scale;
  geometry.style.transform=`translate(${x}px,${y}px) scale(${scale})`;this.stats.transformWrites++;this.stats.pixels=underlay.width*underlay.height+geometry.width*geometry.height;this.stats.peakPixels=Math.max(this.stats.peakPixels,this.stats.pixels);this.stats.reason=null;
  if(this.stats.pixels>COMPOSITOR_PIXEL_CAP)throw Error('Compositor pixel budget exceeded');return true;
 }
}
