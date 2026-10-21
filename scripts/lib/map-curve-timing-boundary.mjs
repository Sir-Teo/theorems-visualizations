export{currentLightBoundary,createCurrentLightServer}from'./map-current-light-boundary.mjs';
export const TIMING_FLAG='--root-authorized-curve-timing-screen',QUIET_FLAG='--quiet-window-attested';
export function currentLightMode(args){if(args.length===0)return'PREPARE';if(args.length===2&&args[0]===TIMING_FLAG&&args[1]===QUIET_FLAG)return'EXECUTE';throw Error('curve timing: exact root flag plus quiet attestation required; default is PREPARE');}
