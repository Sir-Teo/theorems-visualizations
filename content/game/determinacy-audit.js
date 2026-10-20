// Finite, alternating line games; no symmetry quotient and no play after a terminal.
export const DETERMINACY_GAMES = {
  ttt: { label: 'tic-tac-toe', W: 3, H: 3, K: 3, mis: false },
  mis: { label: 'misère tic-tac-toe', W: 3, H: 3, K: 3, mis: true },
  t34: { label: '3 × 4, three in a row', W: 4, H: 3, K: 3, mis: false },
};

export function solveLineGame(g) {
  const { W, H, K } = g, N = W * H, lines = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [];
      for (let t = 0; t < K; t++) {
        const rr = r + dr * t, cc = c + dc * t;
        if (rr < 0 || rr >= H || cc < 0 || cc >= W) break;
        cells.push(rr * W + cc);
      }
      if (cells.length === K) lines.push(cells);
    }
  }
  const mover = st => [...st].filter(c => c === 'X').length === [...st].filter(c => c === 'O').length ? 'X' : 'O';
  const term = st => {
    const last = mover(st) === 'X' ? 'O' : 'X';
    if (lines.some(l => l.every(i => st[i] === last))) return g.mis ? 1 : -1;
    return st.includes('.') ? null : 0;
  };
  const memo = new Map();
  const val = st => {
    if (memo.has(st)) return memo.get(st);
    let result = term(st);
    if (result === null) {
      result = -1;
      for (let i = 0; i < N; i++) if (st[i] === '.') {
        result = Math.max(result, -val(st.slice(0, i) + mover(st) + st.slice(i + 1)));
      }
    }
    if (result === 0) result = 0; // Canonicalize -0 from the alternating-value recurrence.
    memo.set(st, result);
    return result;
  };
  const empty = '.'.repeat(N), rootVal = val(empty), counts = [0, 0, 0];
  for (const result of memo.values()) counts[result + 1]++;
  return { g, N, lines, term, mover, val, empty, counts, rootVal, memo };
}

// Each history entry is the position before one actual move, including computer moves.
export function validLineHistory(G, board, history) {
  if (!Array.isArray(history) || history.length > G.N || typeof board !== 'string') return false;
  const chain = [...history, board];
  if (chain[0] !== G.empty || !chain.every(st => typeof st === 'string' && G.memo.has(st))) return false;
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1], next = chain[i];
    if (G.term(prev) !== null) return false;
    const changed = [...prev].flatMap((c, k) => c === next[k] ? [] : [k]);
    if (changed.length !== 1 || prev[changed[0]] !== '.' || next[changed[0]] !== G.mover(prev)) return false;
  }
  return true;
}
