// Presents the existing cache object. No extra Canvas/image/bitmap or custom renderer.
export class CompleteRasterDOM{
 constructor(map){this.m=map;this.layer=null;this.clip=null;this.cache=null;this.saved=null;this.stats={presents:0,mounts:0,extraBackingPixels:0};}
 unmount(){if(this.layer){this.layer.remove();this.layer.style.cssText=this.saved;this.layer.removeAttribute('aria-hidden');this.layer.removeAttribute('data-complete-raster-dom');}this.clip?.remove();this.clip=this.layer=this.cache=null;this.saved=null;}
 present(cache,x,y,scale){
  const m=this.m,c=cache.canvas;
  if(this.layer!==c){this.unmount();this.saved=c.style.cssText;this.clip=document.createElement('div');this.clip.dataset.completeRasterClip='';this.clip.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0';c.setAttribute('aria-hidden','true');c.dataset.completeRasterDom='';c.style.cssText='position:absolute;inset:auto;left:0;top:0;pointer-events:none;transform-origin:0 0';this.clip.append(c);m.canvas.before(this.clip);this.layer=c;this.cache=cache;this.stats.mounts++;m.ctx.setTransform(1,0,0,1,0,0);m.ctx.clearRect(0,0,m.canvas.width,m.canvas.height);}
  c.style.width=cache.width+'px';c.style.height=cache.height+'px';c.style.transform=`translate(${x}px,${y}px) scale(${scale})`;this.stats.presents++;
 }
}
