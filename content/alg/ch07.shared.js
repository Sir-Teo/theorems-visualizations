// Abstract Algebra (Judson) — Chapter 7: helpers shared by ch07.js and ch07-b.js (plain named exports).
// Letters are numbered A = 0 … Z = 25; all cipher arithmetic is done mod 26 on those numbers.
export * from './ch06.shared.js';

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const m26 = (x) => ((x % 26) + 26) % 26;
export const gcdN = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const invMod = (a, n) => { for (let x = 1; x < n; x++) if ((a * x) % n === 1 % n) return x; return null; };
export const UNITS26 = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

// Norvig, "English Letter Frequency Counts: Mayzner Revisited", Letter Counts table.
// Rounded percentages from his Google Books word-count analysis; corpus-dependent.
// https://www.norvig.com/mayzner.html
export const ENG = [8.04,1.48,3.34,3.82,12.49,2.40,1.87,5.05,7.57,.16,.54,4.07,2.51,7.23,7.64,2.14,.12,6.28,6.51,9.28,2.73,1.05,1.68,.23,1.66,.09];

export const lettersOnly = (t) => String(t).toUpperCase().replace(/[^A-Z]/g, '');
// Apply a letter map f: 0..25 -> 0..25 to a text; spaces and punctuation pass through.
export const mapText = (txt, f) => [...String(txt).toUpperCase()].map((ch) => { const p = ABC.indexOf(ch); return p < 0 ? ch : ABC[f(p)]; }).join('');
export function counts26(txt) { const c = Array(26).fill(0); for (const ch of String(txt).toUpperCase()) { const p = ABC.indexOf(ch); if (p >= 0) c[p]++; } return c; }
export const abcTicks = ABC.split('').map((ch, j) => [j + 0.5, ch]);

// Euclid on (a, b): rows {a, b, q, r} with a = q b + r, until r = 0.
export function euclidRows(a, b) { const rows = []; while (b) { const q = Math.floor(a / b), r = a - q * b; rows.push({ a, b, q, r }); [a, b] = [b, r]; } return rows; }
export function egcdN(a, b) { if (!b) return { g: a, x: 1, y: 0 }; const r = egcdN(b, a % b); return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y }; }
// modular power on safe integers (modulus below 9e7)
export function powmod(b, e, m) { let r = 1 % m, x = b % m; while (e > 0) { if (e & 1) r = (r * x) % m; x = (x * x) % m; e = Math.floor(e / 2); } return r; }
// the multiplications square-and-multiply performs for exponent e
export const smSteps = (e) => { const bits = e.toString(2); return { bits, squarings: bits.length - 1, multiplies: bits.split('').filter((c) => c === '1').length - 1 }; };
export const SMALL_PRIMES = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67];

export const SHIFT_SAMPLES = {
  short: 'WHY DID IT FAIL',
  medium: 'THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER LETTER IN ENGLISH',
  long: 'THE FREQUENCY OF LETTERS IN ENGLISH IS FAR FROM UNIFORM AND THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER SO A CIPHER THAT REPLACES EACH LETTER BY ANOTHER LETTER ALWAYS THE SAME ONE KEEPS THE SHAPE OF THE HISTOGRAM AND ONLY SLIDES IT ALONG THE ALPHABET',
};
export function shiftScores(text,key) {
  const pt=lettersOnly(text),ct=mapText(pt,p=>m26(p+key)),n=counts26(ct),tot=pt.length;
  const f=n.map(c=>tot?100*c/tot:0);
  const score=Array.from({length:26},(_,g)=>ENG.reduce((s,e,j)=>s+e*f[m26(j+g)],0));
  const order=[...score.keys()].sort((a,b)=>score[b]-score[a]);
  return {pt,ct,f,score,best:order[0],second:order[1],ratio:score[order[1]]?score[order[0]]/score[order[1]]:null};
}
export const hillPair = ([a,b,c,d],offset,[p,q]) => [m26(a*p+b*q+offset[0]),m26(c*p+d*q+offset[1])];
export function hillInverse([a,b,c,d]) {
  const di=invMod(m26(a*d-b*c),26);
  return di===null?null:[m26(di*d),m26(-di*b),m26(-di*c),m26(di*a)];
}
/** Candidate textbook exponent even in the deliberately invalid p=q experiment. */
export function rsaExample(p,q,E) {
  const n=p*q,m=(p-1)*(q-1),phi=p===q?p*(p-1):m,g=gcdN(E,m),D=g===1?invMod(E%m,m):null;
  const enc=Array.from({length:n},(_,x)=>powmod(x,E,n)),image=new Set(enc).size;
  const dec=D===null?null:enc.map(y=>powmod(y,D,n));
  return {p,q,n,m,phi,E,g,D,enc,dec,image,fails:dec?dec.filter((x,i)=>x!==i).length:null};
}

export const WORDS = ['THE', 'AND', 'FOR', 'NOT', 'YES', 'BUY', 'PAY', 'SAY', 'ONE', 'TWO', 'SIX', 'TEN', 'CAT', 'DOG', 'SUN', 'MAN', 'BOY', 'DAY', 'WAY', 'NEW', 'OLD', 'BIG', 'RED', 'GET', 'HAS', 'HER', 'HIS', 'HOW', 'ITS', 'MAY', 'OUR', 'OUT', 'SEE', 'USE', 'WHO', 'ALL', 'ANY', 'CAN', 'HAD', 'NOW', 'TOO', 'WAR', 'SEA', 'AIR', 'ASK', 'END', 'EYE', 'FAR', 'FEW', 'GOD', 'KEY', 'LAW', 'LET', 'LOW', 'MAP', 'OIL', 'PUT', 'RUN', 'SET', 'TOP', 'WIN', 'YET'];
export const wordNum = (w) => 676 * ABC.indexOf(w[0]) + 26 * ABC.indexOf(w[1]) + ABC.indexOf(w[2]);
export const numWord = (x) => (x < 17576 ? ABC[Math.floor(x / 676)] + ABC[Math.floor(x / 26) % 26] + ABC[x % 26] : null);

const signatureKey=(p,q,E)=>({n:p*q,E,D:invMod(E,(p-1)*(q-1))});
export const SIGN_KEYS=[signatureKey(131,137,7),signatureKey(139,149,5)];
/** Public-key-only existential forgery of the toy dictionary acceptance rule. */
export function dictionaryForgery(excludedWord) {
  const K=SIGN_KEYS[0];
  for(let s=1;s<K.n;s++){
    const x=powmod(s,K.E,K.n),word=numWord(x);
    if(word!==excludedWord&&WORDS.includes(word))return {s,x,word,trials:s};
  }
  throw Error('No dictionary forgery found');
}
export function signatureDemo(w,sg,attack) {
  const [KA,KB]=SIGN_KEYS,x=wordNum(w),sA=sg?powmod(x,KA.D,KA.n):x,c0=powmod(sA,KB.E,KB.n);
  const eveX=wordNum(w==='PAY'?'NOT':'PAY');
  const forged=sg&&attack==='forge'?dictionaryForgery(w):null;
  const c=forged?powmod(forged.s,KB.E,KB.n):attack==='flip'?(c0+(c0%10===0?1:-1))%KB.n:(attack==='eve'||attack==='forge')?powmod(eveX,KB.E,KB.n):c0;
  const sB=powmod(c,KB.D,KB.n),xB=sg?powmod(sB,KA.E,KA.n):sB,wd=numWord(xB),ok=WORDS.includes(wd);
  return {w,x,sg,sA,c0,c,sB,xB,wd,ok,trials:forged?.trials??0};
}
