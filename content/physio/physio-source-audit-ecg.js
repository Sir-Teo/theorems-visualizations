// Chosen Gaussian vector loop. Coordinates: x right, y up; clinical angles increase downwards.
export const ECG_WAVES = [
  { n: 'P', mu: .045, sd: .02, amp: .15, ang: 60 },
  { n: 'Q', mu: .07, sd: .007, amp: .13, ang: 150 },
  { n: 'R', mu: .088, sd: .011, amp: 1, ang: 60 },
  { n: 'S', mu: .108, sd: .01, amp: .3, ang: -135 },
  { n: 'T', mu: .3, sd: .05, amp: .32, ang: 45 },
];
export const ECG_LEADS = [{ n: 'I', ang: 0, color: 'accent' }, { n: 'II', ang: 60, color: 'green' }, { n: 'III', ang: 120, color: 'orange' }];
export const leadAxis = angle => [Math.cos(angle*Math.PI/180),-Math.sin(angle*Math.PI/180)];
export const projectLead = (H, angle) => {const u=leadAxis(angle);return H[0]*u[0]+H[1]*u[1];};
export function heartVector(t, rotation, which) {
  const H=[0,0];for(const w of ECG_WAVES){if(which&&!which.includes(w.n))continue;const u=leadAxis(w.ang+rotation),g=w.amp*Math.exp(-.5*((t-w.mu)/w.sd)**2);H[0]+=g*u[0];H[1]+=g*u[1];}return H;
}
