// ---------------------------------------------------------------- Chomp
// A position is the list of column heights h[0..C-1] (non-increasing); the poisoned square is (row 0, column 0).
const chompKey = (h) => h.join(',');
export const chompMoves = (h) => {
  const out = [];
  h.forEach((hj, j) => { for (let i = 0; i < hj; i++) if (i + j > 0) out.push({ i, j, h: h.map((x, k) => (k >= j ? Math.min(x, i) : x)) }); });
  return out;
};
export function chompSolver() {
  const memo = new Map();
  const val = (h) => {   // +1 if the player to move wins, -1 if she loses
    const k = chompKey(h); if (memo.has(k)) return memo.get(k);
    const ms = chompMoves(h); let r = -1;
    for (const m of ms) if (val(m.h) === -1) { r = 1; break; }
    memo.set(k, r); return r;
  };
  return { val, memo };
}
const chompCache = {};
export const chompFor = (R, C) => (chompCache[`${R}x${C}`] = chompCache[`${R}x${C}`] || chompSolver());

// ---------------------------------------------------------------- Hex
export const hexNb = (n) => {
  const nb = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const l = [];
    for (const [dr, dc] of [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < n && cc >= 0 && cc < n) l.push(rr * n + cc); }
    nb.push(l);
  }
  return nb;
};
/** Does the colour ch ('R': top-bottom, 'B': left-right) connect its two sides in the state string st? */
export function hexWon(st, n, ch, nb) {
  const seen = new Uint8Array(n * n), stack = [];
  for (let k = 0; k < n; k++) { const i = ch === 'R' ? k : k * n; if (st[i] === ch) { seen[i] = 1; stack.push(i); } }
  while (stack.length) {
    const i = stack.pop(), r = Math.floor(i / n), c = i % n;
    if (ch === 'R' ? r === n - 1 : c === n - 1) return true;
    for (const j of nb[i]) if (!seen[j] && st[j] === ch) { seen[j] = 1; stack.push(j); }
  }
  return false;
}
const hexCache = {};
export function hexSolver(n) {
  if (hexCache[n]) return hexCache[n];
  const nb = hexNb(n), memo = new Map();
  const mover = (st) => { let r = 0, b = 0; for (const c of st) { if (c === 'R') r++; else if (c === 'B') b++; } return r === b ? 'R' : 'B'; };
  const val = (st) => {   // +1 if the player to move wins (Hex has no draws)
    if (memo.has(st)) return memo.get(st);
    const m = mover(st); let r = -1;
    for (let i = 0; i < st.length && r < 1; i++) if (st[i] === '.') {
      const ns = st.slice(0, i) + m + st.slice(i + 1);
      if (hexWon(ns, n, m, nb) || val(ns) === -1) r = 1;
    }
    memo.set(st, r); return r;
  };
  return (hexCache[n] = { val, mover, nb, memo });
}
// Four-by-four opening lookup; regenerated and independently verified by the accompanying finite search tests.
export const HEX4_WINNING = [3, 6, 9, 12];

export function chompPosition(R,C,history=[]){if(!Number.isInteger(R)||R<2||R>6||!Number.isInteger(C)||C<2||C>8||!Array.isArray(history)||history.length>R*C-1)throw new RangeError('Offered Chomp board/history required');let heights=Array(C).fill(R);for(const move of history){if(!Array.isArray(move)||move.length!==2||!move.every(Number.isInteger))throw new RangeError('Integer Chomp moves required');const [i,j]=move;if(i<0||j<0||j>=C||i>=heights[j]||i+j===0)throw new RangeError('Illegal Chomp history');heights=heights.map((h,k)=>k>=j?Math.min(h,i):h);}const moves=chompMoves(heights),solver=chompFor(R,C),winning=moves.filter(m=>solver.val(m.h)===-1),terminal=moves.length===0;return{R,C,history:history.map(x=>x.slice()),heights,moves,winning,terminal,turn:history.length%2===0?'first':'second',value:solver.val(heights),full:history.length===0};}
export function hexPosition(n,history=[]){if(![2,3,4].includes(n)||!Array.isArray(history)||history.length>n*n||(n===4&&history.length))throw new RangeError('Offered Hex board/history required');const solver=hexSolver(n);let state='.'.repeat(n*n),winner=null;for(let k=0;k<history.length;k++){const i=history[k],m=k%2===0?'R':'B';if(!Number.isInteger(i)||i<0||i>=n*n||state[i]!=='.'||winner)throw new RangeError('Illegal Hex history');state=state.slice(0,i)+m+state.slice(i+1);if(hexWon(state,n,m,solver.nb))winner=m;}const turn=history.length%2===0?'R':'B',moves=winner?[]:Array.from({length:n*n},(_,i)=>i).filter(i=>state[i]==='.'),winning=n===4?HEX4_WINNING.slice():moves.filter(i=>{const s=state.slice(0,i)+turn+state.slice(i+1);return hexWon(s,n,turn,solver.nb)||solver.val(s)===-1;});return{n,history:history.slice(),state,winner,turn,moves,winning,full:history.length===0};}
export function chompOpeningTable(){return[2,3,4,5,6].map(R=>[2,3,4,5,6,7,8].map(C=>{const p=chompPosition(R,C);return{R,C,winning:p.winning.map(m=>[m.i,m.j])};}));}
export function stealingStateValid(s){return !!s&&typeof s==='object'&&Object.keys(s).sort().join(',')==='chomp,hex'&&Array.isArray(s.chomp)&&s.chomp.length<=47&&s.chomp.every(m=>Array.isArray(m)&&m.length===2&&m.every(x=>Number.isInteger(x)&&x>=0&&x<=7))&&Array.isArray(s.hex)&&s.hex.length<=9&&s.hex.every(x=>Number.isInteger(x)&&x>=0&&x<=8);}
