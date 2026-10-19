// Direct transcription: Whitcomb1952 NACA RM L52H08, TablesII–III,
// printed pp17–19. Inches. Only the cylindrical-body combinations are used.
export const WHITCOMB_BASIC_RADIUS=1.875;
const uX=[22.5,23.5,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,31.5,32,32.5,33,33.5,34,43];
const dX=[22.5,24,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,31.5,32,32.5,33,33.5,34.5,43];
const iX=[22.5,24,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,31.5,32,32.5,33,33.5,34,43];
const sX=[22.5,23.125,24.125,25.125,26.125,27.125,28.125,29.125,30.125,31.125,32.125,33.125,34.125,35.125,36.125,37.125,38.125,38.375,43];
const pairs=(x,r)=>x.map((v,i)=>[v,r[i]]);
export const WHITCOMB_BODIES={
  unswept:{name:'unswept wing',
    equivalent:pairs(uX,[1.875,1.875,1.892,1.939,2.012,2.087,2.155,2.182,2.185,2.174,2.145,2.113,2.086,2.054,2.019,1.992,1.968,1.934,1.911,1.894,1.882,1.875,1.875]),
    indented:pairs(iX,[1.875,1.875,1.857,1.807,1.720,1.622,1.521,1.476,1.470,1.487,1.533,1.580,1.642,1.664,1.710,1.743,1.773,1.812,1.837,1.856,1.868,1.875,1.875]),remaining:.4},
  delta:{name:'delta wing',
    equivalent:pairs(dX,[1.875,1.875,1.882,1.894,1.911,1.934,1.968,1.992,2.019,2.054,2.086,2.113,2.145,2.174,2.185,2.182,2.155,2.087,2.012,1.939,1.892,1.875,1.875]),
    indented:pairs(iX,[1.875,1.875,1.868,1.856,1.837,1.812,1.773,1.743,1.710,1.664,1.642,1.580,1.533,1.487,1.470,1.476,1.521,1.622,1.720,1.807,1.857,1.875,1.875]),remaining:.4},
  swept:{name:'45° swept wing',
    equivalent:pairs(sX,[1.875,1.875,1.907,1.957,2.024,2.080,2.117,2.143,2.135,2.107,2.083,2.071,2.045,2.001,1.946,1.899,1.876,1.875,1.875]),
    indented:pairs(sX,[1.875,1.875,1.842,1.787,1.710,1.641,1.592,1.560,1.572,1.611,1.640,1.656,1.688,1.740,1.802,1.850,1.874,1.875,1.875]),remaining:0},
};
export function bodyRadius(points,x){
  if(x<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(x<=points[i][0]){
    const [x0,r0]=points[i-1],[x1,r1]=points[i];return r0+(r1-r0)*(x-x0)/(x1-x0);
  }
  return points.at(-1)[1];
}
// Exact integral of πr² for the explicitly chosen linear-radius interpolation.
export function bodyVolume(points){
  let sum=0;
  for(let i=1;i<points.length;i++){
    const[x0,r0]=points[i-1],[x1,r1]=points[i];sum+=Math.PI*(x1-x0)*(r0*r0+r0*r1+r1*r1)/3;
  }
  return sum;
}
export function whitcombStation(key,x){
  const b=WHITCOMB_BODIES[key],re=bodyRadius(b.equivalent,x),ri=bodyRadius(b.indented,x),r0=WHITCOMB_BASIC_RADIUS;
  return{key,x,equivalentRadius:re,indentedRadius:ri,basicArea:Math.PI*r0*r0,
    equivalentArea:Math.PI*re*re,indentedArea:Math.PI*ri*ri,remaining:b.remaining,
    removedBodyVolume:Math.PI*r0*r0*(43-22.5)-bodyVolume(b.indented)};
}
