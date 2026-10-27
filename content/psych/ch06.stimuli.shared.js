// Original stimuli. Fixed neutral code values are deliberate experimental
// construction choices, not calibrated luminance. Surrounding labels use theme.
const val=q=>typeof q==='number'?q:q.value;
export function drawStimulus(s,kind,z,o={}){
 const c=s.ctx,W=s.width,H=s.height,C=o.color||((n)=>({ink:'#263247',muted:'#687489',blue:'#3e72cc',orange:'#b86c27',purple:'#8b64bb',gold:'#a47919',grid:'#dde2e8',panel:'#fff'}[n]));
 const neutral='rgb(242,242,242)',black='rgb(29,29,29)',gray='rgb(132,132,132)';
 c.save();c.lineCap='round';c.lineJoin='round';c.font='12px Arial,sans-serif';
 const text=(t,x,y,col=C('muted'),align='center')=>{c.fillStyle=col;c.textAlign=align;c.fillText(t,x,y);};
 const line=(p,col=black,w=2,closed=false,fill=null)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(closed)c.closePath();if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=col;c.lineWidth=w;if(w)c.stroke();};
 const circle=(x,y,r,fill,stroke=null,w=1)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}};
 const moonDisc=(cx,cy,r)=>{circle(cx,cy,r,'rgb(238,224,173)',C('gold'),1);c.save();c.beginPath();c.arc(cx,cy,r-1,0,Math.PI*2);c.clip();c.globalAlpha=.17;for(const[a,b,size]of[[-.35,-.25,.22],[.22,-.42,.16],[.35,.22,.25],[-.15,.4,.14]])circle(cx+a*r,cy+b*r,size*r,'rgb(126,120,100)');c.restore();};
 const field=(x=12,y=12,w=W-24,h=H-24,bg=neutral)=>{c.fillStyle=bg;c.fillRect(x,y,w,h);return{x,y,w,h};};
 const map=(spanX,spanY,pad=24)=>{const scale=Math.min((W-2*pad)/spanX,(H-2*pad)/spanY);return {scale,X:x=>W/2+scale*x,Y:y=>H/2-scale*y};};
 const ruler=(x1,x2,y,label,below=false,col=black)=>{line([[x1,y],[x2,y]],col,1.4);for(const x of[x1,x2])line([[x,y-4],[x,y+4]],col,1.4);if(label)text(label,(x1+x2)/2,y+(below?18:-8),col);};
 if(kind==='figureGround'){
  const m=map(3,2),to=p=>[m.X(val(p[0])),m.Y(val(p[1]))],light=o.invert?black:neutral,dark=o.invert?neutral:black;
  field(m.X(-1.5),m.Y(1),3*m.scale,2*m.scale,light);line(z.polygon.map(to),dark,0,true,dark);
  if(o.reveal){c.setLineDash([3,4]);line(z.leftBorder.map(to),C('blue'),2);line(z.rightBorder.map(to),C('blue'),2);c.setLineDash([]);}
 }else if(kind==='proximity'||kind==='similarity'){
  const m=map(10,10,18);field();for(let i=0;i<z.points.length;i++){const p=z.points[i],code=kind==='similarity'?Math.round(255*val(z.codes[i])):29;circle(m.X(val(p[0])),m.Y(val(p[1])),Math.max(3,Math.min(5,m.scale*.16)),`rgb(${code},${code},${code})`);}
 }else if(kind==='continuation'){
  const m=map(5.4,3.6,14),x0=14,y0=14,w=Math.floor(W-28),h=Math.floor(H-28),image=c.createImageData(w,h);for(let i=0;i<w*h;i++){image.data[4*i]=128;image.data[4*i+1]=128;image.data[4*i+2]=128;image.data[4*i+3]=255;}
  // Add sampled Gaussian-windowed cosine patches to one neutral field, so no
  // opaque square can erase an overlapping neighbour's Gabor.
  const sum=new Float64Array(w*h),sigma=.10,r=Math.ceil(3.5*sigma*m.scale);
  for(const p of z.patches){const px=m.X(val(p.position[0]))-x0,py=m.Y(val(p.position[1]))-y0,co=Math.cos(p.orientation),si=Math.sin(p.orientation);for(let iy=Math.max(0,Math.floor(py-r));iy<Math.min(h,Math.ceil(py+r));iy++)for(let ix=Math.max(0,Math.floor(px-r));ix<Math.min(w,Math.ceil(px+r));ix++){
   const dx=(ix+.5-px)/m.scale,dy=-(iy+.5-py)/m.scale;sum[iy*w+ix]+=108*Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma))*Math.cos(2*Math.PI*5*(dx*co+dy*si));
  }}
  for(let i=0;i<w*h;i++){const q=Math.max(0,Math.min(255,Math.round(128+sum[i])));image.data[4*i]=q;image.data[4*i+1]=q;image.data[4*i+2]=q;}
  // putImageData ignores the device-pixel transform. A temporary raster is
  // instead composited with drawImage in CSS pixels, preserving native DPR.
  const raster=document.createElement('canvas');raster.width=w;raster.height=h;raster.getContext('2d').putImageData(image,0,0);c.drawImage(raster,x0,y0);
  if(o.reveal){c.setLineDash([3,5]);line(z.patches.filter(p=>p.contour).map(p=>[m.X(val(p.position[0])),m.Y(val(p.position[1]))]),C('gold'),1.5);c.setLineDash([]);}
 }else if(kind==='closure'){
  const m=map(3.6,3.6,20);field();for(const p of z.inducers){const cx=m.X(p.x),cy=m.Y(p.y),a=-p.mouthAngle,half=p.mouthWidth/2;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,p.radius*m.scale,a+half,a-half+2*Math.PI);c.closePath();c.fillStyle=black;c.fill();}
  if(o.reveal){c.setLineDash([5,4]);line(z.vertices.map(([x,y])=>[m.X(x),m.Y(y)]),C('blue'),1.5,true);c.setLineDash([]);}
 }else if(kind==='commonFate'){
  const m=map(4.3,3.3,18);field(12,12,W-24,H-24,black);for(const p of z.dots){const x=m.X(p.x),y=m.Y(p.y),col=o.reveal&&p.coherent?C('blue'):neutral;circle(x,y,2,col);if(o.vectors){const norm=Math.hypot(p.vx,p.vy),dx=p.vx/norm*9,dy=-p.vy/norm*9;line([[x,y],[x+dx,y+dy]],col,1);}}
 }else if(kind==='necker'){
  const m=map(3.6,3.6,24),pts=z.vertices.map(p=>[m.X(val(p[0])-.15),m.Y(val(p[1])-.075)]);field();if(o.reveal&&z.frontFace.length){c.save();c.globalAlpha=.13;line(z.frontFace.map(i=>pts[i]),C('blue'),0,true,C('blue'));c.restore();}
  for(const[i,j]of z.edges)line([pts[i],pts[j]],black,2);
  if(o.reveal&&z.frontFace.length)line(z.frontFace.map(i=>pts[i]),C('blue'),3,true);
 }else if(kind==='mullerLyer'){
  const span=Math.max(8.5,val(z.comparisonLength)+3.2),m=map(span,4.6,24),to=p=>[m.X(val(p[0])),m.Y(val(p[1]))];field();for(const p of[z.target,z.comparison])line(p.map(to),black,2.6);for(const p of z.fins)line(p.map(to),black,2.3);if(o.reveal){ruler(m.X(-3),m.X(3),m.Y(1.85),'6 units');const L=val(z.comparisonLength);ruler(m.X(-L/2),m.X(L/2),m.Y(-1.85),L.toPrecision(3)+' units',true);}
 }else if(kind==='ponzo'){
  const m=map(4.5,3.2,24),near=val(z.nearRailGap)/2,far=val(z.farRailGap)/2;field();
  if(z.context!=='none'){
   // The declared gaps are AT the two bar rows. Extend that same line; using
   // the declared gaps at the extended endpoints would change the depth ratio.
   const gapAt=y=>near+(far-near)*(y-z.nearY)/(z.farY-z.nearY),ends=[z.nearY-.35,z.farY+.35];
   for(const s of[-1,1])line(ends.map(y=>[m.X(s*gapAt(y)),m.Y(y)]),gray,2);
   if(z.context==='rails and texture')for(const t of[0,.2,.38,.54,.68,.80,.9,1]){const y=ends[0]+(ends[1]-ends[0])*t,gap=gapAt(y);line([[m.X(-gap),m.Y(y)],[m.X(gap),m.Y(y)]],gray,1);}
  }
  const a=val(z.nearBar)/2,b=val(z.farBar)/2;line([[m.X(-a),m.Y(z.nearY)],[m.X(a),m.Y(z.nearY)]],black,5);line([[m.X(-b),m.Y(z.farY)],[m.X(b),m.Y(z.farY)]],black,5);if(o.reveal){ruler(m.X(-a),m.X(a),m.Y(z.nearY-.4),'2 units');ruler(m.X(-b),m.X(b),m.Y(z.farY+.4),val(z.farBar).toPrecision(3)+' units');}
 }else if(kind==='ebbinghaus'){
  const vertical=W<430,m=map(vertical?3.8:8.0,vertical?7.6:3.8,18),centers=vertical?[[0,1.95],[0,-1.95]]:[[-2,0],[2,0]],radii=[val(z.targetRadius),val(z.comparisonRadius)];field();
  centers.forEach(([cx,cy],i)=>{if(z.context!=='none'){const small=(z.context==='small left')===(i===0),r=val(small?z.smallSurround:z.largeSurround);for(const[x,y]of z.surroundCenters)circle(m.X(cx+x),m.Y(cy+y),r*m.scale,gray);}circle(m.X(cx),m.Y(cy),radii[i]*m.scale,black);if(o.reveal)ruler(m.X(cx-radii[i]),m.X(cx+radii[i]),m.Y(cy),null,false,C('gold'));});
 }else if(kind==='amesRoom'){
  const m=map(3.8,2.9,22),pts=z.corners.map(p=>[m.X(val(p.imageX)),m.Y(val(p.imageY))]),camX=val(z.cameraX),camY=val(z.cameraY),near=[[-1.7-camX,-1.15-camY],[-1.7-camX,1.2-camY],[1.7-camX,-1.15-camY],[1.7-camX,1.2-camY]].map(([x,y])=>[m.X(x),m.Y(y)]);
  c.save();c.beginPath();c.rect(12,12,W-24,H-24);c.clip();field();
  const surface=(quad,fill)=>{line(quad,fill,0,true,fill);line([quad[0],quad[1],quad[2]],fill,0,true,fill);line([quad[0],quad[2],quad[3]],fill,0,true,fill);line(quad,gray,1,true);};
  surface([near[0],near[1],pts[1],pts[0]],'rgb(207,211,215)');surface([near[2],near[3],pts[3],pts[2]],'rgb(220,223,226)');surface([near[0],near[2],pts[2],pts[0]],'rgb(194,199,204)');line([pts[0],pts[2],pts[3],pts[1]],gray,1.4,true,'rgb(235,235,232)');
  for(let i=1;i<5;i++){const t=i/5;line([[pts[0][0]*(1-t)+pts[2][0]*t,pts[0][1]*(1-t)+pts[2][1]*t],[pts[1][0]*(1-t)+pts[3][0]*t,pts[1][1]*(1-t)+pts[3][1]*t]],'rgb(208,208,204)',1);}
  z.figures.forEach(p=>{const x=m.X(val(p.imageX)),base=m.Y(val(p.imageBase)),h=val(p.imageHeight)*m.scale,col=black,legWidth=Math.max(2,h*.09);circle(x,base-h*.895,h*.105,col);line([[x,base-h*.73],[x,base-h*.34]],col,Math.max(3,h*.16));line([[x-h*.19,base-h*.49],[x,base-h*.68],[x+h*.19,base-h*.49]],col,Math.max(2,h*.08));for(const sign of[-1,1])line([[x,base-h*.36],[x+sign*h*.14,base-legWidth/2]],col,legWidth);});c.restore();
 }else if(kind==='moonIllusion'){
  const x=q=>W*.5+q*W*.43,y=q=>H-35-q*(H-65),r=val(z.currentRadius);c.fillStyle=C('panel');c.fillRect(12,12,W-24,H-24);
  if(z.context){c.save();c.globalAlpha=.45;line([[14,y(.12)],[W*.15,y(.17)],[W*.25,y(.1)],[W*.37,y(.22)],[W*.5,y(.12)],[W*.7,y(.15)],[W*.85,y(.09)],[W-14,y(.13)],[W-14,H-20],[14,H-20]],C('muted'),0,true,C('grid'));c.restore();for(const[px,h]of[[.58,18],[.67,24],[.75,15]]){c.fillStyle=C('muted');c.fillRect(W*px,y(.11)-h,9,h);}}
  const p=z.currentPosition;for(const pos of[p,z.referencePosition])moonDisc(x(pos[0]),y(pos[1]),r);if(o.reveal){for(const pos of[p,z.referencePosition])ruler(x(pos[0])-r,x(pos[0])+r,y(pos[1])+r+15,(2*r).toPrecision(3)+' px',false,C('gold'));}
 }else if(kind==='moonComparison'){
  const r=val(z.currentRadius);for(const[x,label]of[[W*.28,'reference'],[W*.72,'current']]){moonDisc(x,H*.45,r);text(label,x,H*.65);if(o.reveal)text((2*r).toPrecision(3)+' CSS px',x,H*.76,C('gold'));}text('Fixed model diameter ratio = 1',W/2,H-24);
 }else if(kind==='monocularScene'){
  field();c.save();c.beginPath();c.rect(12,12,W-24,H-24);c.clip();const scale=Math.min((W-36)/2.6,(H-36)/1.8),X=x=>W/2+scale*x,Y=y=>H/2+(.1-y)*scale,cam=val(z.cameraX),context=o.context||'all';
  if(context==='rails'||context==='all')for(const side of[-1,1])line([1.5,14].map(d=>[X((side*1.8-cam)/d),Y(-1/d)]),gray,1.5);
  if(context==='texture'||context==='all')for(const d of[1.5,2,3,4,6,9,12])line([[-1.8,1.8].map(x=>[X((x-cam)/d),Y(-1/d)])][0],gray,1);
  // Draw the far column first; projection is computed from actual world sizes.
  for(const i of[1,0]){const p=z.objects[i],x=val(p.imageX),base=val(p.imageBase),height=val(p.imageHeight),half=.325/val(p.depth);line([[X(x-half),Y(base)],[X(x+half),Y(base)],[X(x+half),Y(base+height)],[X(x-half),Y(base+height)]],black,1,true,C(i?'orange':'blue'));}
  if(context==='occlusion'||context==='all'){const p=z.occluder,x=val(p.imageX),base=val(p.imageBase),height=val(p.imageHeight),half=val(p.imageHalfWidth);line([[X(x-half),Y(base)],[X(x+half),Y(base)],[X(x+half),Y(base+height)],[X(x-half),Y(base+height)]],black,1,true,gray);}
  c.restore();
 }else if(kind==='stereogram'){
  const n=z.size,pair=o.view!=='left'&&o.view!=='right'&&o.view!=='mask'&&o.view!=='red cyan',gap=12,top=38,bottom=20,cell=Math.max(1,Math.floor(Math.min((W-30-(pair?gap:0))/(n*(pair?2:1)),(H-top-bottom)/n))),side=n*cell,x0=Math.floor((W-side*(pair?2:1)-(pair?gap:0))/2),y0=top;
  const arrays=pair?(o.view==='cross fusion'?[z.right,z.left]:[z.left,z.right]):[o.view==='right'?z.right:o.view==='mask'?z.mask:z.left];
  arrays.forEach((a,j)=>{const x=x0+j*(side+gap);text(pair?(o.view==='cross fusion'?(j?'LEFT EYE':'RIGHT EYE'):(j?'RIGHT EYE':'LEFT EYE')):(o.view||'LEFT EYE').toUpperCase(),x+side/2,22);for(let i=0;i<a.length;i++){if(o.view==='red cyan')c.fillStyle=`rgb(${z.left[i]*255},${z.right[i]*255},${z.right[i]*255})`;else c.fillStyle=a[i]?neutral:black;c.fillRect(x+(i%n)*cell,y0+Math.floor(i/n)*cell,cell,cell);}});
 }
 c.restore();
}
