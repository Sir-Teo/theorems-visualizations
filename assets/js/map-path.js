// Keep the exact visible pieces of a cubic. Clipping before Canvas strokes the
// path avoids generating thousands of offscreen dashes on long atlas edges.
export function traceClippedCubic(ctx, points, width, height, margin = 4) {
  let lastX, lastY;
  const visit = (p, depth) => {
    const xs=[p[0],p[2],p[4],p[6]],ys=[p[1],p[3],p[5],p[7]];
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    if(x1 < -margin || x0 > width+margin || y1 < -margin || y0 > height+margin)return;
    if(depth===12 || (x0>=-margin&&x1<=width+margin&&y0>=-margin&&y1<=height+margin)){
      if(lastX!==p[0]||lastY!==p[1])ctx.moveTo(p[0],p[1]);
      ctx.bezierCurveTo(...p.slice(2));lastX=p[6];lastY=p[7];return;
    }
    const a=[(p[0]+p[2])/2,(p[1]+p[3])/2],b=[(p[2]+p[4])/2,(p[3]+p[5])/2],c=[(p[4]+p[6])/2,(p[5]+p[7])/2];
    const d=[(a[0]+b[0])/2,(a[1]+b[1])/2],e=[(b[0]+c[0])/2,(b[1]+c[1])/2],m=[(d[0]+e[0])/2,(d[1]+e[1])/2];
    visit([p[0],p[1],...a,...d,...m],depth+1);visit([...m,...e,...c,p[6],p[7]],depth+1);
  };
  visit(points,0);
}
