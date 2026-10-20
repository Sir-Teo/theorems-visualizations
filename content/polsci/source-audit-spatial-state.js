// Validate the raw saved value before the runtime's drag constraint can clamp or snap it.
export function strictSpatialHandle(handle,valid,label){const set=handle.set;handle.set=(x,y)=>{if(!valid([x,y]))throw new RangeError(`Invalid saved ${label} coordinates`);return set(x,y);};return handle;}
export const spatialPoint=(p,R)=>p.length===2&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=R&&Number.isInteger(8*x));
export const spatialGridPoint=(p,G)=>p.length===2&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=3&&Number.isInteger((x+3)*(G-1)/6));
