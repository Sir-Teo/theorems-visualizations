// Local to ALGO 5.18: bounded FKS construction and the concrete affine family's exact expectation.
export const PERFECT_HASH_PRIME = 1000003;
export const PERFECT_HASH_BUDGET = 51;
export const PERFECT_HASH_MODES = ['random', 'first-collisions', 'bucket-collisions'];
export function affineHashAudit(a, b, p, m, x) { return ((a * x + b) % p) % m; }
export function affineCollisionAudit(p, m) {
  if (!Number.isSafeInteger(p) || !Number.isSafeInteger(m) || m < 1 || m >= p || p > PERFECT_HASH_PRIME) throw new RangeError('Expected bounded prime modulus and fewer slots');
  const q = Math.floor(p / m), r = p % m;
  // Residue classes after the final mod m contain q or q+1 of the p residues.
  const numerator = r * q * (q + 1) + (m - r) * q * (q - 1);
  return { numerator, denominator: p * (p - 1), probability: numerator / (p * (p - 1)) };
}
export function expectedPerfectSpaceAudit(n, p = PERFECT_HASH_PRIME) {
  const c = affineCollisionAudit(p, n);
  return n + n * (n - 1) * c.probability;
}
// Rejection avoids the floor(r*span) bias when the supplied RNG has uniform 32-bit outputs.
function uniformInteger(rng, span) {
  const size = 4294967296, limit = size - size % span;
  for (;;) { const r = rng(); if (!(r >= 0 && r < 1)) throw new RangeError('RNG outside [0,1)'); const u = Math.floor(r * size); if (u < limit) return u % span; }
}
export function drawAffineAudit(rng,p=PERFECT_HASH_PRIME) { return [1+uniformInteger(rng,p-1),uniformInteger(rng,p)]; }
export function buildPerfectHashAudit(keys, rng, { p = PERFECT_HASH_PRIME, mode = 'random', firstBudget = PERFECT_HASH_BUDGET, bucketBudget = PERFECT_HASH_BUDGET } = {}) {
  if (!Array.isArray(keys) || !keys.length || keys.length > 16 || Array.from({length:keys.length},(_,i)=>!Object.hasOwn(keys,i)||!Number.isSafeInteger(keys[i])||keys[i]<0||keys[i]>=p).some(Boolean) || new Set(keys).size !== keys.length || !PERFECT_HASH_MODES.includes(mode) || !Number.isInteger(firstBudget) || firstBudget < 1 || firstBudget > 1000 || !Number.isInteger(bucketBudget) || bucketBudget < 1 || bucketBudget > 1000 || keys.length ** 2 >= p) throw new RangeError('Invalid bounded perfect-hash input');
  const n = keys.length, draw = (m, first) => mode === 'first-collisions' && first ? [n,0] : mode === 'bucket-collisions' ? [first ? 1 : m,0] : drawAffineAudit(rng,p);
  let first = null, rows = [], space = 0, firstDraws = 0, firstAccepted = false;
  while (firstDraws < firstBudget) {
    firstDraws++; const [a,b] = draw(n,true); first={a,b};rows=Array.from({length:n},()=>({keys:[],slots:[],draws:0,status:'blocked',a:null,b:null}));
    for(const key of keys)rows[affineHashAudit(a,b,p,n,key)].keys.push(key);
    space=rows.reduce((sum,row)=>sum+row.keys.length**2,0);
    if(space<4*n){firstAccepted=true;break;}
  }
  if(!firstAccepted)return {p,n,first,rows,space,firstDraws,firstAccepted:false,perfect:false,status:'first-level exhausted'};
  for(const row of rows){
    const m=row.keys.length**2;if(!m){row.status='empty';continue;}
    while(row.draws<bucketBudget){
      row.draws++;const[a,b]=draw(m,false);row.a=a;row.b=b;row.slots=Array(m).fill(null);let collision=false;
      for(const key of row.keys){const slot=affineHashAudit(a,b,p,m,key);if(row.slots[slot]!==null)collision=true;else row.slots[slot]=key;}
      if(!collision){row.status='ready';break;}
    }
    if(row.status!=='ready')row.status='exhausted';
  }
  const perfect=rows.every(row=>row.status==='ready'||row.status==='empty');
  return {p,n,first,rows,space,firstDraws,firstAccepted:true,perfect,status:perfect?'perfect':'bucket-level exhausted'};
}
export function perfectLookupAudit(build,key){
  if(!build.perfect)return null;
  const j=affineHashAudit(build.first.a,build.first.b,build.p,build.n,key),row=build.rows[j];
  if(!row.slots.length)return {bucket:j,slot:null,found:false};
  const slot=affineHashAudit(row.a,row.b,build.p,row.slots.length,key);
  return {bucket:j,slot,found:row.slots[slot]===key};
}
