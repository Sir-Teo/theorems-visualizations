// The accepted pinned HTTP/raw boundary is reused without any serving change.
export{currentLightBoundary,createCurrentLightServer}from'./map-current-light-boundary.mjs';
export const CURVE_CURRENT_FLAG='--root-authorized-curve-current-light-state';
export function currentLightMode(args){if(args.length===0)return'PREPARE';if(args.length===1&&args[0]===CURVE_CURRENT_FLAG)return'EXECUTE';throw Error('curve current: only the exact separately authorized curve current light flag is recognized');}
