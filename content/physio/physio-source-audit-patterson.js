export const reservoirPressure = heightCmWater => heightCmWater * .7356;
// Invert the chosen model's monotone output curve; do not infer historical measurements.
export function restoreOutput(beatAtPressure, target, lo = 2, hi = 26) {
  const low=beatAtPressure(lo),high=beatAtPressure(hi);
  if(target<low.CO||target>high.CO)return null;
  for(let k=0;k<26;k++){const mid=(lo+hi)/2;if(beatAtPressure(mid).CO<target)lo=mid;else hi=mid;}
  const Pv=(lo+hi)/2,beat=beatAtPressure(Pv);return {Pv,EDV:beat.EDV,CO:beat.CO};
}
