// Browser-only probe. Raster bounds use the live font, alignment and baseline.
// One CSS pixel of tolerance covers subpixel raster phase at the live anchor.
export function installLingGlyphMasks(){
 const cache=new Map();
 window.__lingGlyphBounds=(str,ctx)=>{
  const key=JSON.stringify([str,ctx.font,ctx.textAlign,ctx.textBaseline,ctx.direction]);if(cache.has(key))return cache.get(key);
  const mask=document.createElement('canvas'),width=Math.ceil(ctx.measureText(str).width)+80;if(width>4096)throw Error('Glyph probe width exceeds declared text domain');mask.width=Math.max(80,width);mask.height=128;const c=mask.getContext('2d',{willReadFrequently:true});c.font=ctx.font;c.textAlign=ctx.textAlign;c.textBaseline=ctx.textBaseline;c.direction=ctx.direction;c.fillStyle='#fff';
  const x=ctx.textAlign==='right'||ctx.textAlign==='end'?mask.width-40:ctx.textAlign==='center'?mask.width/2:40,y=ctx.textBaseline==='top'||ctx.textBaseline==='hanging'?24:ctx.textBaseline==='bottom'||ctx.textBaseline==='ideographic'?104:72;c.fillText(str,x,y);const rgba=c.getImageData(0,0,mask.width,mask.height).data;let l=mask.width,r=-1,t=mask.height,b=-1;
  for(let j=0;j<mask.height;j++)for(let i=0;i<mask.width;i++)if(rgba[4*(j*mask.width+i)+3]){l=Math.min(l,i);r=Math.max(r,i);t=Math.min(t,j);b=Math.max(b,j);}
  const box=r<0?null:{l:l-x,r:r+1-x,t:t-y,b:b+1-y};cache.set(key,box);return box;
 };
}
