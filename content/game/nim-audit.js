// Finite normal-play row games. Every move strictly reduces the token count.
import { idx } from './ch04.shared.js';
const mex = (arr) => { const s = new Set(arr); let m = 0; while (s.has(m)) m++; return m; };
export const GAMES = {
  nim: { label: 'Nim heap', moves: (n) => idx(n).map((k) => [k]), },
  sub123: { label: 'subtract 1, 2 or 3', moves: (n) => [1, 2, 3].filter((s) => s <= n).map((s) => [n - s]) },
  sub25: { label: 'subtract 2 or 5', moves: (n) => [2, 5].filter((s) => s <= n).map((s) => [n - s]) },
  kayles: { label: 'Kayles row', moves: (n) => { const o = []; for (let i = 0; i <= (n - 1) / 2; i++) if (n >= 1) o.push([i, n - 1 - i]); for (let i = 0; i <= (n - 2) / 2; i++) if (n >= 2) o.push([i, n - 2 - i]); return o; } },
};
export function grundyTable(key, N) {
  const g = [];
  for (let n = 0; n <= N; n++) g.push(mex(GAMES[key].moves(n).map((m) => m.reduce((x, k) => x ^ g[k], 0))));
  return g;
}
/** Brute-force outcome of a sum of rows: is the position a loss for the player to move (normal play)? Memo on sorted rows. */
export function sumSolver(key) {
  const memo = new Map();
  const lost = (rows) => {
    const k = rows.join(',');
    if (memo.has(k)) return memo.get(k);
    let res = true;
    outer: for (let a = 0; a < rows.length; a++) {
      if (a > 0 && rows[a] === rows[a - 1]) continue;
      for (const mv of GAMES[key].moves(rows[a])) {
        const nr = rows.slice(0, a).concat(rows.slice(a + 1), mv.filter((x) => x > 0)).sort((x, y) => x - y);
        if (lost(nr)) { res = false; break outer; }
      }
    }
    memo.set(k, res); return res;
  };
  return { lost, memo };
}

export const nimSum = heaps => heaps.reduce((a,b)=>a^b,0);
export function nimReply(heaps) {
  if (!Array.isArray(heaps) || heaps.length<2 || heaps.length>4 || !heaps.every(n=>Number.isInteger(n)&&n>=0&&n<=7)) throw new RangeError('Nim heaps outside the finite widget domain');
  const next=heaps.slice(),s=nimSum(next);
  if (next.every(n=>n===0)) return next;
  const i=s===0?next.indexOf(Math.max(...next)):next.findIndex(n=>(n^s)<n);
  next[i]=s===0?next[i]-1:next[i]^s;
  return next;
}
export function validNimState(d) {
  return !!d && Array.isArray(d.heaps) && d.heaps.length>=2 && d.heaps.length<=4 && d.heaps.every(n=>Number.isInteger(n)&&n>=0&&n<=7) && Number.isInteger(d.seed) && d.seed>=1 && d.seed<=4294967295 && [null,'human','computer'].includes(d.outcome) && (d.heaps.every(n=>n===0)===(d.outcome!==null));
}
