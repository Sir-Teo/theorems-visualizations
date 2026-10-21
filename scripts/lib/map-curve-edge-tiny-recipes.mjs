// Explicit-only edge pixel recipes. No browser, server or network side effects.
export const CURVE_EDGE_ROOT_FLAG = 'ROOT_AUTHORISED_CURVE_EDGE_PIXELS_2026_10_20';
export function curveEdgeRecipes() {
 const cases=[];
 for(const cap of ['butt','round']) for(const dash of [false,true]) for(const dpr of [1,2]) for(const tiles of ['single','multiple'])
  cases.push({id:`healthy-${cap}-${dash?'dash':'solid'}-dpr${dpr}-${tiles}`,kind:'healthy',cap,dash,dpr,tiles,geometry:'mixed',k:.8,tx:.375,ty:-.125});
 for(const kind of ['full-curve','empty','tail','live-replay','released-abort','metadata-denial','scratch-denial','original-priority']) for(const dpr of [1,2])
  cases.push({id:`${kind}-dpr${dpr}`,kind,cap:'round',dash:true,dpr,tiles:'single',geometry:['tail','live-replay','released-abort'].includes(kind)?'tail':kind==='empty'?'empty':kind==='full-curve'?'full':'mixed',k:.8,tx:.375,ty:-.125});
 return cases;
}
export function curveEdgePaths(kind) {
 if(kind==='empty')return [[[9000,10],[9002,10],[9008,10],[9010,10]]];
 if(kind==='full')return [[[15,10],[25,70],[80,0],[110,80]]];
 const paths=[[[10,40],[30,40],[90,40],[118,40]],[[60,5],[60,25],[60,70],[60,90]]];
 if(kind==='tail')return paths;
 return [...paths,[[8,10],[90,-20],[20,110],[120,80]],[[9000,10],[9002,10],[9008,10],[9010,10]]];
}
export function curveEdgeOccurrences(spec) {
 return spec.geometry==='tail'?{repeatPath:0,repeat:32768,appendPath:1}:null;
}
export function curveEdgeStyleBounds(paths,spec) {
 if(spec.kind==='empty')return null; // Intentional empty output while exercising a full mask tile.
 let xmin=Infinity,ymin=Infinity,xmax=-Infinity,ymax=-Infinity;
 for(const path of paths)for(const [x,y] of path){xmin=Math.min(xmin,x);ymin=Math.min(ymin,y);xmax=Math.max(xmax,x);ymax=Math.max(ymax,y);}
 return [xmin,ymin,xmax,ymax];
}
