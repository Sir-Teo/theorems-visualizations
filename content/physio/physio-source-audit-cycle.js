// Ideal-diode valve states and durations from the chapter's sampled model beat.
export function valveStates(beat,index){return {mitral:beat.Qm[index]>1e-6?'open':'shut',aortic:beat.Q[index]>1e-6?'open':'shut'};}
export function cycleDurations(beat){return {atrial:beat.tMVC,contraction:beat.tAVO-beat.tMVC,ejection:beat.tAVC-beat.tAVO,relaxation:beat.tMVO-beat.tAVC,filling:beat.T-beat.tMVO};}
