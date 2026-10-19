// Blood-flow-based linear liver model; x = blood-unbound fraction × model intrinsic clearance.
export function hepaticClearance(flow,capacity,model='ws'){return model==='ws'?flow*capacity/(flow+capacity):-flow*Math.expm1(-capacity/flow);}
export function hepaticElasticities(flow,capacity,model='ws'){
 const u=capacity/flow,E=hepaticClearance(flow,capacity,model)/flow;
 if(model==='ws')return {flow:E,capacity:1-E};
 const e=u>700?0:u/Math.expm1(u);return {flow:1-e,capacity:e};
}
export const hepaticAvailability=(flow,capacity,model='ws')=>model==='ws'?flow/(flow+capacity):Math.exp(-capacity/flow);
