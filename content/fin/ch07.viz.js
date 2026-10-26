import * as H from './ch07.shared.js';

const Q = H.Q;
const positive = x => Q.sign(x) > 0 ? x : Q.ZERO;
const optionQ = (kind, S, K) => positive(kind === 'call' ? Q.sub(S, K) : Q.sub(K, S));
function ceilPositive(x) {
  const n = Q.approximate(x);
  if (Q.sign(Q.sub(n, x)) >= 0) return n;
  const bits = new DataView(new ArrayBuffer(8)); bits.setFloat64(0, n);
  bits.setBigUint64(0, bits.getBigUint64(0) + 1n);
  return bits.getFloat64(0);
}
const value = x => typeof x === 'number' ? x : x.value;
const format = x => (x === 0 ? '0' : Math.abs(x) < .001 || Math.abs(x) >= 1e5 ? x.toExponential(3) : Number(x.toPrecision(5)).toString()).replace(/-/g, '−');
// Compare the literal displayed decimal with the original rational quantity.
// Parsing it back through Number would hide rounding in subnormal labels.
function decimalExact(text) {
  const [mantissa, power = '0'] = text.replace(/−/g, '-').toLowerCase().split('e');
  const sign = mantissa.startsWith('-') ? -1n : 1n;
  const [whole, fraction = ''] = mantissa.replace(/^[+-]/, '').split('.');
  const digits = sign * BigInt(whole + fraction), exponent = Number(power) - fraction.length;
  return exponent >= 0 ? Q.rational(digits * 10n ** BigInt(exponent)) : Q.rational(digits, 10n ** BigInt(-exponent));
}
export function amount(x, compact = false) {
  if (typeof x === 'number') x = H.quantity(x);
  if (x.belowRange || x.aboveRange) return '≈' + (x.sign < 0 ? '−' : '') + '10^' + format(x.logMagnitude / Math.LN10) + (compact ? '' : ' (beyond plot precision)');
  const text = format(x.value);
  const rounded = Q.sign(Q.sub(x.exact, decimalExact(text))) !== 0;
  return (rounded ? '≈' : '') + text;
}
const label = (s, text, x, y, color = 'ink', options = {}) => s.text(text, x, y, {size: 11.5, color, ...options});
const panel = (v, title, options = {}) => v.stage({title, x: [0, 10], y: [0, 6], axes: false, height: 350, minWidth: 290, gutter: {l: 20, r: 20, t: 28, b: 24}, ...options});
const graph = (v, title, xlabel, ylabel) => panel(v, title, {axes: 'box', xlabel, ylabel, gutter: {l: 58, r: 24, t: 38, b: 50}});
const view = (s, x, y) => { s.end(); s.setView(x, y); s.begin(); };
const line = (s, points, color = 'blue', options = {}) => s.path(points, {color, width: 2.4, ...options});
// Preserve actual payoff corners and selected points between regular samples.
// Without these anchors, a polyline can visibly cut across a narrow butterfly.
const sample = (a, b, fn, anchors = [], count = 81) => [...new Set([
  ...Array.from({length: count}, (_, i) => a + (b - a) * i / (count - 1)),
  ...anchors.filter(x => Number.isFinite(x) && x >= a && x <= b),
])].sort((x, y) => x - y).map(x => [x, fn(x)]);
const zero = s => s.line(s.bounds.x[0], 0, s.bounds.x[1], 0, {color: 'muted', width: 1, dash: [3, 4]});
const point = (s, x, y, color = 'gold') => { s.line(x, s.bounds.y[0], x, y, {color, width: 1, alpha: .5, dash: [3, 4]}); s.dot(x, y, {color, r: 5, hollow: true}); };
const slider = (v, text, min, max, initial) => v.slider(text, min, max, initial, {step: 'any', sig: 6, fmt: format});
const memo = fn => { let key, result; return parameters => { const next = JSON.stringify(parameters); if (next !== key) { result = fn(parameters); key = next; } return result; }; };
function fit(s, xs, ys) {
  const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), span = Math.max(1, hi - lo);
  view(s, [Math.min(...xs) - 12, Math.max(...xs) + 12], [lo - .13 * span, hi + .16 * span]);
}
function ledger(s, rows) {
  const largest = rows.reduce((current, row) => {
    const x = row[1].exact, magnitude = Q.sign(x) < 0 ? Q.neg(x) : x;
    return Q.sign(Q.sub(magnitude, current)) > 0 ? magnitude : current;
  }, Q.ZERO);
  const extentExact = Q.sign(largest) ? largest : Q.ONE;
  view(s, [-1.1, 1.1], [-.3, rows.length + .2]);
  rows.forEach(([text, quantity, color = 'blue'], index) => {
    const y = rows.length - index - .6, x = Q.approximate(Q.mul(.8, Q.div(quantity.exact, extentExact)));
    label(s, text, -1.02, y + .25);
    s.line(0, y - .1, 0, y + .1, {color: 'muted', width: 1});
    s.rect(Math.min(0, x), y - .04, Math.max(0, x), y + .07, {fill: color, fillAlpha: .8, stroke: false});
    if (quantity.sign === 0) s.dot(0, y, {color, r: 2});
    label(s, amount(quantity, true), 1.02, y - .24, color, {align: 'right'});
  });
}
function facts(s, rows) {
  view(s, [-1.1, 1.1], [-.3, rows.length + .2]);
  rows.forEach(([text, quantity, color = 'blue'], index) => {
    const y = rows.length - index - .6;
    label(s, text, -1.02, y + .2, 'muted', {size: 11});
    label(s, typeof quantity === 'string' ? quantity : amount(quantity, true), 1.02, y - .23, color, {align: 'right', size: 13});
  });
}
const intrinsic = (kind, S, K) => Math.max(0, kind === 'call' ? S - K : K - S);

export function lesson1(v) {
  const kind = v.select('option right', ['call', 'put'], 'call');
  const side = v.select('position', ['long', 'short'], 'long');
  const convention = v.select('profit convention', ['terminal financed', 'nominal premium'], 'terminal financed');
  const strike = slider(v, 'strike / money per share', 0, 200, 100);
  const premium = slider(v, 'premium paid today / money', 0, 40, 8);
  const terminal = slider(v, 'terminal stock price / money', 0, 300, 120);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875);
  const A = panel(v, 'The right, its premium and the chosen terminal result');
  const B = graph(v, 'Payoff and profit are different cash flows', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{money per option}$`);
  const calculate = memo(H.payoff); let z;
  v.render(() => {
    discount.el.hidden = convention.value === 'nominal premium';
    z = calculate({kind: kind.value, side: side.value, strike: strike.value, premium: premium.value, terminal: terminal.value, discount: discount.value, convention: convention.value});
    ledger(A, [['option payoff', z.signedPayoff, 'blue'], ['premium cost today', z.signedPremiumCost, 'orange'], ['premium in profit convention', z.signedEffectivePremium, 'muted'], ['profit at chosen stock price', z.profit, 'purple']]);
    const direction = side.value === 'long' ? 1 : -1;
    const anchors = [strike.value, terminal.value, z.zeroProfitSet.lower?.value];
    const pay = sample(0, 300, x => Q.approximate(Q.mul(direction, optionQ(kind.value, x, strike.value))), anchors);
    const profit = sample(0, 300, x => Q.approximate(Q.sub(Q.mul(direction, optionQ(kind.value, x, strike.value)), z.signedEffectivePremium.exact)), anchors);
    fit(B, [0, 300], [...pay, ...profit].map(p => p[1])); zero(B);
    line(B, pay, 'blue'); line(B, profit, 'purple', {dash: [5, 4]});
    B.line(strike.value, B.bounds.y[0], strike.value, B.bounds.y[1], {color: 'orange', alpha: .45, dash: [3, 4], width: 1});
    point(B, terminal.value, value(z.profit));
    if (z.zeroProfitSet.kind === 'single price' && value(z.zeroProfitSet.lower) <= 300) B.dot(value(z.zeroProfitSet.lower), 0, {color: 'green', r: 4, hollow: true});
  });
  v.legend([['blue', 'signed option payoff'], ['purple', 'profit after the stated premium cost'], ['orange', 'strike / premium'], ['green', 'unique break-even when in view'], ['gold', 'chosen terminal outcome']]);
  v.readout(() => {
    const zeros = z.zeroProfitSet;
    const zeroText = zeros.kind === 'empty' ? 'No nonnegative stock price gives zero profit.' : zeros.kind === 'single price' ? 'Break-even stock price=' + amount(zeros.lower) + '.' + (value(zeros.lower) > 300 ? ' It lies outside the displayed stock-price interval.' : '') : zeros.kind === 'closed interval' ? 'Zero profit holds throughout 0 ≤ ST ≤ ' + amount(zeros.upper) + '.' : 'Zero profit holds throughout ST ≥ ' + amount(zeros.lower) + '.';
    return '**' + side.value + ' ' + kind.value + ': payoff=' + amount(z.signedPayoff) + '; profit=' + amount(z.profit) + '.** ' + zeroText + '\n\n' + (convention.value === 'terminal financed' ? 'The premium is financed to maturity at cost premium/B, with B=' + format(discount.value) + '.' : 'This nominal convention subtracts the original premium without financing it.') + ' Prices and premiums are authored inputs. The finite plot is not a maximum-loss bound for a short call. Small labels retain their sign beyond plot resolution.';
  });
}

export function lesson2(v) {
  const spot = slider(v, 'stock price today / money', 1, 200, 100), strike = slider(v, 'common strike / money', 0, 200, 100);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), timeValue = slider(v, 'authored time-value component / money', 0, 40, 10);
  const offset = slider(v, 'call quote offset / money', -40, 40, 0), terminal = slider(v, 'terminal stock price / money', 0, 300, 120);
  const A = panel(v, 'At maturity · two portfolios, the same total');
  const B = graph(v, 'Matching payoffs for every terminal price', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{terminal portfolio payoff}$`);
  const C = panel(v, 'Today · the price restriction and its exact gap');
  const calculate = memo(H.parity); let z;
  v.render(() => {
    z = calculate({spot: spot.value, strike: strike.value, discount: discount.value, timeValue: timeValue.value, callOffset: offset.value, terminal: terminal.value});
    view(A, [-.5, 10.5], [-.4, 6.5]);
    const call = H.quantity(optionQ('call', terminal.value, strike.value)), put = H.quantity(optionQ('put', terminal.value, strike.value)), total = Math.max(terminal.value, strike.value), totalHeight = total ? 3.8 : 0;
    for (const [x, first, second, color, name] of [[2.4, strike.value, call, 'blue', 'CALL + BOND'], [7.6, terminal.value, put, 'orange', 'PUT + STOCK']]) {
      const base = name.startsWith('CALL') ? 'muted' : 'teal';
      const firstHeight = 3.8 * (first / (total || 1));
      A.rect(x - .9, .8, x + .9, .8 + firstHeight, {color: base, fill: base, fillAlpha: .45});
      A.rect(x - .9, .8 + firstHeight, x + .9, .8 + totalHeight, {color, fill: color, fillAlpha: .55});
      if (!total) A.line(x - .9, .8, x + .9, .8, {color: 'purple', width: 2});
      label(A, name, x, 5.9, color, {align: 'center', size: 11});
      label(A, 'total ' + amount(z.callBondTerminal, true), x, 5.25, 'purple', {align: 'center', size: 13});
      label(A, name.startsWith('CALL') ? 'K=' + format(first) : 'ST=' + format(first), x, .25, base, {align: 'center'});
      label(A, (name.startsWith('CALL') ? 'call=' : 'put=') + amount(second, true), x, -.15, color, {align: 'center'});
    }
    const curve = sample(0, 300, x => Math.max(x, strike.value), [strike.value, terminal.value]);
    fit(B, [0, 300], curve.map(p => p[1])); zero(B);
    line(B, curve, 'purple', {width: 3}); line(B, curve, 'teal', {dash: [5, 5], width: 1.5}); point(B, terminal.value, value(z.callBondTerminal));
    ledger(C, [['quoted call C', z.quotedCall, 'blue'], ['strike bond BK', z.strikeBondPrice, 'muted'], ['put P', z.consistentPut, 'orange'], ['stock S0', H.quantity(spot.value), 'teal'], ['C + BK − P − S0', z.parityGap, z.parityGap.sign ? 'red' : 'green']]);
  });
  v.legend([['blue', 'call'], ['orange', 'put'], ['teal', 'stock / dashed put+stock payoff'], ['muted', 'strike cash / bond'], ['purple', 'solid call+bond payoff / equal total'], ['red', 'nonzero parity discrepancy'], ['gold', 'chosen terminal state']]);
  v.readout(() => '**Parity gap=' + amount(z.parityGap) + '.** ' + z.trade + '. Initial cash received=' + amount(z.arbitrageInitialReceipt) + '; terminal net payoff=' + amount(z.arbitrageTerminalPayoff) + '.\n\nCall + strike cash and put + stock both pay max(ST,K), including the kink and zero strike. Quotes share the same maturity, strike, European exercise and settlement; no dividends or trading restrictions are included. The authored time-value component makes parity-compatible comparison prices. A zero parity gap alone does not certify every other option-price bound.');
}

export function lesson3(v) {
  const kind = v.select('option being quoted', ['call', 'put'], 'call'), reference = v.select('quote reference bound', ['lower', 'upper'], 'lower');
  const spot = slider(v, 'stock price today / money', 1, 200, 100), strike = slider(v, 'strike / money', 0, 200, 100);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), offset = slider(v, 'quote offset from reference / money', -40, 40, -5), terminal = slider(v, 'terminal stock price / money', 0, 300, 120);
  const A = panel(v, 'Necessary price bounds · selected quote');
  const B = graph(v, 'The actual witness payoff in every terminal state', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{witness terminal money}$`);
  const C = panel(v, 'Witness positions and the cash they produce');
  const calculate = memo(H.bounds); let z;
  v.render(() => {
    z = calculate({kind: kind.value, spot: spot.value, strike: strike.value, discount: discount.value, reference: reference.value, quoteOffset: offset.value, terminal: terminal.value});
    const low = value(z.lowerBound), high = value(z.upperBound), quote = value(z.quotedPrice), smallest = Math.min(0, low, quote), largest = Math.max(1, high, quote), span = largest - smallest, project = x => .8 + 8.4 * (x - smallest) / span;
    view(A, [-.5, 10.5], [-.3, 6.3]);
    label(A, kind.value.toUpperCase() + ' PRICE / MONEY', 5, 5.75, 'blue', {align: 'center'});
    A.line(.8, 3.1, 9.2, 3.1, {color: 'muted', width: 1});
    A.rect(project(low), 2.7, project(high), 3.5, {color: 'green', fill: 'green', fillAlpha: .2});
    for (const x of [low, high]) A.line(project(x), 2.5, project(x), 3.7, {color: 'green', width: 2});
    A.line(project(quote), 3.5, project(quote), 4.5, {color: z.violation.startsWith('within') ? 'gold' : 'red', width: 1, dash: [3, 3]});
    A.dot(project(quote), 4.5, {color: z.violation.startsWith('within') ? 'gold' : 'red', r: 6, hollow: true});
    label(A, 'quote ' + amount(z.quotedPrice, true), 5, 5.1, z.violation.startsWith('within') ? 'gold' : 'red', {align: 'center'});
    label(A, 'lower ' + amount(z.lowerBound, true), .5, 1.65, 'green');
    label(A, 'upper ' + amount(z.upperBound, true), 9.5, 1.05, 'green', {align: 'right'});
    label(A, z.violation, 5, .25, z.violation.startsWith('within') ? 'muted' : 'red', {align: 'center'});
    const u = z.holdingUnits, curve = sample(0, 300, x => Q.approximate(Q.add(Q.add(Q.mul(u.option, optionQ(kind.value, x, strike.value)), Q.mul(u.stock, x)), Q.mul(u.strikeBond, strike.value))), [strike.value, terminal.value]);
    fit(B, [0, 300], curve.map(p => p[1])); zero(B); line(B, curve, 'purple'); point(B, terminal.value, value(z.witnessTerminalPayoff));
    view(C, [-.5, 10.5], [-.3, 6.3]);
    for (const [i, text, units, color] of [[0, kind.value, u.option, 'blue'], [1, 'stock', u.stock, 'teal'], [2, 'strike bond', u.strikeBond, 'muted']]) {
      const x = 1.5 + 3.5 * i;
      C.rect(x - 1.25, 3.4, x + 1.25, 5.65, {color, fill: color, fillAlpha: .06});
      label(C, text, x, 5.05, color, {align: 'center', size: 10.5});
      label(C, units > 0 ? 'BUY 1' : units < 0 ? 'SELL 1' : 'NONE', x, 4.15, color, {align: 'center', size: 12});
    }
    label(C, 'cash received now', 5, 2.6, 'muted', {align: 'center'});
    label(C, amount(z.witnessInitialReceipt, true) + ' money', 5, 1.9, 'green', {align: 'center', size: 14});
    label(C, 'terminal payoff at chosen ST', 5, 1, 'muted', {align: 'center'});
    label(C, amount(z.witnessTerminalPayoff, true) + ' money', 5, .25, 'purple', {align: 'center', size: 13});
  });
  v.legend([['green', 'necessary price band / witness initial receipt'], ['red', 'violating quote'], ['purple', 'statewise nonnegative witness payoff'], ['blue', 'quoted option'], ['teal', 'stock position'], ['muted', 'strike bond / scaffolding'], ['gold', 'chosen terminal state or in-band quote']]);
  v.readout(() => '**' + z.violation + '.** ' + z.trade + '. The actual portfolio receives ' + amount(z.witnessInitialReceipt) + ' money now and pays ' + amount(z.witnessTerminalPayoff) + ' at the chosen terminal price.\n\nLower=' + amount(z.lowerBound) + '; quote=' + amount(z.quotedPrice) + '; upper=' + amount(z.upperBound) + '. All witness payoffs are nonnegative for every nonnegative ST. If no bound is violated, the displayed witness is the zero position; satisfying these bounds does not determine a unique option price. B is the supplied positive discount factor, with no dividends and unrestricted matching trades.');
}

export function lesson4(v) {
  const spot = slider(v, 'stock price before dividend / money', 1, 200, 100), strike = slider(v, 'call strike / money', 0, 200, 80);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), dividend = slider(v, 'imminent cash dividend / fraction of stock price', 0, 1, 0);
  const A = panel(v, 'A chosen deterministic exercise comparison');
  const B = graph(v, 'Exercise and continuation · selected cash dividend fixed', String.raw`$S_0\ (\text{money})$`, String.raw`$\text{current value / money}$`);
  const C = panel(v, 'Financing the strike and receiving the dividend');
  const calculate = memo(H.earlyCall); let z;
  v.render(() => {
    z = calculate({spot: spot.value, strike: strike.value, discount: discount.value, dividendFraction: dividend.value});
    view(A, [-.5, 10.5], [-.3, 6.3]);
    label(A, 'ONE CALL RIGHT', 5, 5.85, 'blue', {align: 'center', size: 12});
    A.dot(5, 5.25, {color: 'blue', r: 5});
    A.arrow(4.75, 5, 2.4, 4.1, {color: 'orange', width: 2, head: 6});
    A.arrow(5.25, 5, 7.6, 4.1, {color: 'purple', width: 2, head: 6});
    for (const [x, name, cash, color] of [[2.35, 'EXERCISE NOW', z.exercisePayoff, 'orange'], [7.65, 'CONTINUE', z.deterministicContinuation, 'purple']]) {
      A.rect(x - 2.05, 2.3, x + 2.05, 4.1, {color, fill: color, fillAlpha: .08});
      label(A, name, x, 3.55, color, {align: 'center', size: 10.5});
      label(A, amount(cash, true), x, 2.8, color, {align: 'center', size: 14});
    }
    label(A, z.deterministicChoice.toUpperCase(), 5, 1.5, z.deterministicChoice === 'continue' ? 'green' : z.deterministicChoice === 'tie' ? 'muted' : 'orange', {align: 'center', size: 13});
    label(A, 'selected American value ' + amount(z.deterministicAmericanValue, true), 5, .8, 'blue', {align: 'center'});
    label(A, z.noDividendNonnegativeRateAssumptions ? 'No dividend and B ≤ 1' : 'The no-dividend theorem assumptions are off', 5, .1, 'muted', {align: 'center', size: 10});
    const start = Math.max(1, ceilPositive(z.dividend.exact));
    const anchors = [spot.value, strike.value, Q.approximate(Q.add(z.dividend.exact, z.strikeBondPrice.exact))];
    const exercise = sample(start, 200, x => Q.approximate(positive(Q.sub(x, strike.value))), anchors);
    const continuation = sample(start, 200, x => Q.sign(Q.sub(x, z.dividend.exact)) < 0 ? NaN : Q.approximate(positive(Q.sub(Q.sub(x, z.dividend.exact), z.strikeBondPrice.exact))), anchors).filter(p => Number.isFinite(p[1]));
    fit(B, [start, 200], [...exercise, ...continuation].map(p => p[1])); zero(B);
    line(B, exercise, 'orange'); line(B, continuation, 'purple', {dash: [5, 4]});
    point(B, spot.value, value(z.deterministicAmericanValue));
    ledger(C, [['exercise value now', z.exercisePayoff, 'orange'], ['deterministic continuation', z.deterministicContinuation, 'purple'], ['K − BK: financing benefit', z.strikeFinancingBenefit, 'teal'], ['imminent cash dividend', z.dividend, 'red'], ['continuation minus exercise', z.continuationAdvantage, z.continuationAdvantage.sign >= 0 ? 'green' : 'red']]);
  });
  v.legend([['orange', 'immediate exercise value'], ['purple', 'deterministic continuation value'], ['teal', 'benefit of postponing strike payment'], ['red', 'dividend / negative continuation advantage'], ['blue', 'selected American value'], ['green', 'positive continuation advantage'], ['gold', 'selected economy']]);
  v.readout(() => '**' + z.deterministicChoice + ' in the selected deterministic economy.** Exercise=' + amount(z.exercisePayoff) + '; continuation=' + amount(z.deterministicContinuation) + '; advantage=' + amount(z.continuationAdvantage) + '.\n\nWith no dividends and B ≤ 1, the call lower bound max(S0−BK,0) weakly dominates immediate exercise. Strict superiority follows for an in-the-money call with K>0 and B<1; equality cases remain possible. The chosen imminent cash dividend is D=' + amount(z.dividend) + '. The plot holds that cash amount fixed while varying admissible stock prices. Its deterministic asset pays (S0−D)/B at maturity; these are explicit illustrative economies.');
}

export function lesson5(v) {
  const mode = slider(v, 'constructed Q-law mode / terminal money', 45, 155, 100), strike = slider(v, 'middle strike / money', 40, 160, 100);
  const left = slider(v, 'left strike spacing / money', 1, 30, 15), right = slider(v, 'right strike spacing / money', 1, 30, 25);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), reference = v.select('middle quote reference', ['fair', 'chord'], 'chord');
  const offset = slider(v, 'middle quote offset / money', -40, 40, 1), terminal = slider(v, 'terminal stock price / money', 0, 240, 100);
  const A = graph(v, 'A convex strike curve and the selected quote', String.raw`$K\ (\text{money})$`, String.raw`$C(K)\ (\text{money})$`);
  const B = graph(v, 'Weighted butterfly · nonnegative terminal payoff', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{butterfly payoff / money}$`);
  const C = panel(v, 'The actual three-leg cost and any initial receipt');
  const calculate = memo(H.strikeConvexity); let z;
  v.render(() => {
    z = calculate({mode: mode.value, strike: strike.value, leftWidth: left.value, rightWidth: right.value, discount: discount.value, reference: reference.value, quoteOffset: offset.value, terminal: terminal.value});
    const L = H.law(mode.value), prices = sample(0, 200, x => Q.approximate(Q.mul(discount.value, L.call(x))), [40, mode.value, 160, value(z.lowStrike), strike.value, value(z.highStrike)]);
    fit(A, [0, 200], [...prices.map(p => p[1]), value(z.quotedMiddlePrice)]); zero(A);
    line(A, prices, 'blue');
    A.line(value(z.lowStrike), value(z.leftPrice), value(z.highStrike), value(z.rightPrice), {color: 'orange', width: 2, dash: [5, 4]});
    A.dot(value(z.lowStrike), value(z.leftPrice), {color: 'orange', r: 4}); A.dot(value(z.highStrike), value(z.rightPrice), {color: 'orange', r: 4});
    A.dot(strike.value, value(z.fairMiddlePrice), {color: 'blue', r: 4, hollow: true});
    A.dot(strike.value, value(z.quotedMiddlePrice), {color: z.butterflyCost.sign < 0 ? 'red' : 'gold', r: 6, hollow: true});
    const future = sample(0, 240, x => Q.approximate(Q.sub(Q.add(Q.mul(z.leftWeight.exact, optionQ('call', x, z.lowStrike.exact)), Q.mul(z.rightWeight.exact, optionQ('call', x, z.highStrike.exact))), optionQ('call', x, strike.value))), [value(z.lowStrike), strike.value, value(z.highStrike), terminal.value]);
    fit(B, [0, 240], future.map(p => p[1])); zero(B); line(B, future, 'purple'); point(B, terminal.value, value(z.butterflyPayoff));
    ledger(C, [['weighted low-strike call', H.quantity(Q.mul(z.leftWeight.exact, z.leftPrice.exact)), 'blue'], ['weighted high-strike call', H.quantity(Q.mul(z.rightWeight.exact, z.rightPrice.exact)), 'teal'], ['middle call sold', H.quantity(Q.neg(z.quotedMiddlePrice.exact)), 'orange'], ['total butterfly cost', z.butterflyCost, 'purple'], ['strict negative-cost receipt', z.strictNegativeCostReceipt, 'green']]);
  });
  v.legend([['blue', 'consistent constructed-law call prices'], ['orange', 'wing-price chord / middle call sold'], ['teal', 'high-strike wing cost'], ['purple', 'weighted butterfly payoff and cost'], ['red', 'quote above the convex chord'], ['green', 'initial cash received from negative cost'], ['gold', 'selected terminal state / quote without this violation']]);
  v.readout(() => '**' + z.verdict + '.** Buy ' + amount(z.leftWeight) + ' calls at K=' + amount(z.lowStrike) + ' and ' + amount(z.rightWeight) + ' calls at K=' + amount(z.highStrike) + '; sell one call at K=' + format(strike.value) + '.\n\nCost=' + amount(z.butterflyCost) + '; terminal payoff at the selected ST=' + amount(z.butterflyPayoff) + '. The weighted strikes average exactly to the middle strike, so the butterfly is nonnegative for every ST. The blue curve prices an authored triangular Q-law on [40,160]; the separate middle quote is the input under test. This triplet checks a local convexity restriction.');
}

export function lesson6(v) {
  const recipe = v.select('recipe to load', Object.keys(H.PRESETS), 'bull call spread');
  const active = v.select('leg to edit', [1, 2, 3], 1);
  const stock = slider(v, 'stock units', -2, 2, 0), spot = slider(v, 'stock price paid today / money', 1, 200, 100);
  const terminal = slider(v, 'terminal stock price / money', 0, 300, 120), discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875);
  const controls = H.PRESETS['bull call spread'].legs.map((leg, i) => ({
    kind: v.select('leg ' + (i + 1) + ' option right', ['call', 'put'], leg.kind),
    strike: slider(v, 'leg ' + (i + 1) + ' strike / money', 0, 200, leg.strike),
    units: slider(v, 'leg ' + (i + 1) + ' signed units', -2, 2, leg.units),
    premium: slider(v, 'leg ' + (i + 1) + ' premium paid today / money', 0, 40, leg.premium),
  }));
  v.button('Load recipe', () => {
    const preset = H.PRESETS[recipe.value]; stock.set(preset.stockUnits); active.set(1);
    controls.forEach((leg, i) => { for (const key of ['kind', 'strike', 'units', 'premium']) leg[key].set(preset.legs[i][key]); });
  });
  const A = graph(v, 'The signed payoff of every component', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{component payoff / money}$`);
  const B = graph(v, 'The sum and its terminal-financed profit', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{portfolio money}$`);
  const C = panel(v, 'Position cost, terminal funding and selected result');
  const calculate = memo(H.strategies); let z;
  v.render(() => {
    controls.forEach((leg, i) => { for (const field of Object.values(leg)) field.el.hidden = active.value !== i + 1; });
    const legs = controls.map(leg => ({kind: leg.kind.value, strike: leg.strike.value, units: leg.units.value, premium: leg.premium.value}));
    z = calculate({stockUnits: stock.value, spot: spot.value, terminal: terminal.value, discount: discount.value, legs});
    const colors = ['blue', 'orange', 'green'];
    const anchors = [...legs.map(leg => leg.strike), terminal.value];
    const pieces = legs.map(leg => sample(0, 300, x => Q.approximate(Q.mul(leg.units, optionQ(leg.kind, x, leg.strike))), anchors));
    const stockCurve = sample(0, 300, x => Q.approximate(Q.mul(stock.value, x)), anchors);
    fit(A, [0, 300], [...stockCurve, ...pieces.flat()].map(p => p[1])); zero(A);
    pieces.forEach((curve, i) => line(A, curve, colors[i], {width: active.value === i + 1 ? 3 : 1.6})); line(A, stockCurve, 'teal', {dash: [4, 4], width: 1.8});
    const totalAt = x => legs.reduce((sum, leg) => Q.add(sum, Q.mul(leg.units, optionQ(leg.kind, x, leg.strike))), Q.mul(stock.value, x));
    const total = sample(0, 300, x => Q.approximate(totalAt(x)), anchors), profit = sample(0, 300, x => Q.approximate(Q.sub(totalAt(x), z.terminalFinancedCost.exact)), anchors);
    fit(B, [0, 300], [...total, ...profit].map(p => p[1])); zero(B); line(B, total, 'purple'); line(B, profit, 'pink', {dash: [5, 4]}); point(B, terminal.value, value(z.terminalFinancedProfit));
    ledger(C, [['total position cost today', z.totalInitialCost, 'orange'], ['terminal-financed cost', z.terminalFinancedCost, 'muted'], ['portfolio payoff', z.totalPayoff, 'purple'], ['terminal-financed profit', z.terminalFinancedProfit, 'pink'], ['component-sum residual', z.sumResidual, 'green']]);
  });
  v.legend([['blue', 'option leg 1'], ['orange', 'option leg 2 / initial cost'], ['green', 'option leg 3 / exact sum check'], ['teal', 'stock component'], ['purple', 'combined payoff'], ['pink', 'terminal-financed profit'], ['muted', 'funding cost'], ['gold', 'chosen terminal result']]);
  v.readout(() => '**Portfolio payoff=' + amount(z.totalPayoff) + '; terminal-financed profit=' + amount(z.terminalFinancedProfit) + '.**\n\n' + z.parameters.legs.map((leg, i) => 'Leg ' + (i + 1) + ': ' + format(leg.units) + ' ' + leg.kind + ', strike ' + format(leg.strike) + ', premium ' + format(leg.premium) + '.').join(' ') + ' Stock units=' + format(stock.value) + '.\n\nChoose a recipe and press Load recipe, then edit any leg; all three legs remain in the saved position while one editor is visible. Premiums are authored costs. The right-tail payoff slope is ' + amount(z.rightTailSlope) + ' and the left-tail slope is ' + amount(z.leftTailSlope) + '; a finite plot does not establish a global loss limit.');
}

export function lesson7(v) {
  const mode = slider(v, 'constructed Q-law mode / terminal money', 45, 155, 100), strike = slider(v, 'selected strike / money', 0, 240, 100);
  const discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), bandwidth = slider(v, 'symmetric strike bandwidth h / money', 0, 30, 5);
  const A = graph(v, 'Constructed call prices across strike', String.raw`$K\ (\text{money})$`, String.raw`$C(K)\ (\text{money})$`);
  const B = graph(v, 'Analytic density and finite-window recovery', String.raw`$K\ (\text{money})$`, String.raw`$\text{density}\ (\text{money}^{-1})$`);
  const C = panel(v, 'Keep the units and finite-window error explicit');
  const calculate = memo(H.densityRecovery); let z;
  v.render(() => {
    z = calculate({mode: mode.value, strike: strike.value, discount: discount.value, bandwidth: bandwidth.value});
    const L = H.law(mode.value), prices = sample(0, 240, x => Q.approximate(Q.mul(discount.value, L.call(x))), [40, mode.value, 160, strike.value]);
    fit(A, [0, 240], prices.map(p => p[1])); zero(A); line(A, prices, 'blue'); point(A, strike.value, value(z.callPrice));
    view(B, [-40, 280], [-.0015, .0205]);
    if (bandwidth.value > 0) {
      B.rect(strike.value - bandwidth.value, 0, strike.value + bandwidth.value, .0188, {fill: 'orange', fillAlpha: .08, stroke: false});
      for (const x of [strike.value - bandwidth.value, strike.value + bandwidth.value]) B.line(x, 0, x, .0188, {color: 'orange', width: 1, dash: [3, 4]});
    }
    zero(B); line(B, sample(-30, 270, x => Q.approximate(L.density(x)), [40, mode.value, 160, strike.value]), 'purple');
    B.dot(strike.value, value(z.density), {color: 'purple', r: 5, hollow: true});
    if (z.recoveredDensity) B.dot(strike.value, value(z.recoveredDensity), {color: 'orange', r: 4});
    facts(C, [['implied stock price / money', z.stockPrice, 'teal'], ['butterfly cost / money', z.butterflyCost, 'blue'], ['B h² / money²', z.discountedBandwidthSquare, 'muted'], ['analytic density / money⁻¹', z.density, 'purple'], ['window recovery / money⁻¹', z.recoveredDensity || 'undefined at h=0', 'orange'], ['recovery − density / money⁻¹', z.recoveryError || 'undefined at h=0', 'pink']]);
  });
  v.legend([['blue', 'call price / finite butterfly cost'], ['purple', 'analytic triangular Q density'], ['orange', 'finite-window recovery and averaging interval'], ['pink', 'recovery error'], ['teal', 'stock price implied by the same pricing law'], ['muted', 'normalization and units'], ['gold', 'selected strike on the price curve']]);
  v.readout(() => '**C″(K)=B fQ(K) in this chosen continuous-density model.** Analytic density=' + amount(z.density) + '; ' + (z.recoveredDensity ? 'finite-window recovery=' + amount(z.recoveredDensity) + '; error=' + amount(z.recoveryError) + '.' : 'the finite-difference diagnostic is undefined at h=0.') + '\n\nThe normalized butterfly is a triangular-kernel average over [K−h,K+h], so it need not equal the point density at finite h. The triangular law has support [40,160], mode ' + format(mode.value) + ' and total mass one. Its implied stock price is ' + amount(z.stockPrice) + '=B EQ[ST]. The payoff formula extends algebraically to real strike coordinates for centered windows. These are constructed Q prices and probabilities; no observed option surface or real-world forecast is fitted.');
}

export function lesson8(v) {
  const mode = slider(v, 'pricing Q-law mode / terminal money', 45, 155, 100), physical = slider(v, 'physical-law mode / terminal money', 45, 155, 80);
  const strike = slider(v, 'insurance floor K / money', 0, 240, 90), discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), terminal = slider(v, 'terminal stock price / money', 0, 240, 100);
  const A = graph(v, 'Stock plus put creates a terminal payoff floor', String.raw`$S_T\ (\text{money})$`, String.raw`$\text{terminal payoff / money}$`);
  const B = graph(v, 'Physical probabilities · bars plus a separate floor atom', String.raw`$\text{terminal payoff / money}$`, String.raw`$\text{probability mass}$`);
  const C = panel(v, 'The insurance cost and the financed profit floor');
  const calculate = memo(H.protectivePut); let z;
  v.render(() => {
    z = calculate({mode: mode.value, physicalMode: physical.value, strike: strike.value, discount: discount.value, terminal: terminal.value});
    const anchors = [strike.value, terminal.value];
    const underlying = sample(0, 240, x => x, anchors), put = sample(0, 240, x => Q.approximate(optionQ('put', x, strike.value)), anchors), protectedPayoff = sample(0, 240, x => Math.max(x, strike.value), anchors);
    fit(A, [0, 240], [...underlying, ...put, ...protectedPayoff].map(p => p[1])); zero(A);
    line(A, protectedPayoff, 'purple', {width: 3}); line(A, put, 'orange', {width: 1.8}); line(A, underlying, 'teal', {dash: [4, 4], width: 1.6}); point(A, terminal.value, value(z.protectedPayoff));
    const limit = Math.max(160, strike.value); view(B, [-12, limit + 12], [-.06, 1.15]); zero(B);
    for (const bin of z.bins) {
      const lo = value(bin.low), hi = value(bin.high), width = hi - lo;
      B.rect(lo + .06 * width, 0, lo + .46 * width, value(bin.plainMass), {color: 'teal', fill: 'teal', fillAlpha: .35});
      B.rect(lo + .54 * width, 0, hi - .06 * width, value(bin.insuredContinuousMass), {color: 'orange', fill: 'orange', fillAlpha: .45});
    }
    B.line(strike.value, 0, strike.value, value(z.physicalFloorAtom), {color: 'purple', width: 2.5});
    B.dot(strike.value, value(z.physicalFloorAtom), {color: 'purple', r: 5, hollow: true});
    ledger(C, [['stock cost today', z.stockPrice, 'teal'], ['put premium today', z.putPremium, 'orange'], ['total cost today', z.totalInitialCost, 'muted'], ['terminal-financed cost', z.terminalFinancedCost, 'muted'], ['guaranteed profit floor', z.floorProfit, 'pink']]);
  });
  v.legend([['teal', 'uninsured stock payoff / physical bin masses'], ['orange', 'put payoff / insured continuous bin masses'], ['purple', 'protected payoff / probability atom at K'], ['muted', 'paid and financed costs'], ['pink', 'profit floor after funding'], ['gold', 'chosen terminal payoff']]);
  v.readout(() => '**Protected payoff=' + amount(z.protectedPayoff) + '=max(ST,K).** The financed profit floor is ' + amount(z.floorProfit) + ' money; the selected profit is ' + amount(z.protectedProfit) + '.\n\nThe put costs ' + amount(z.putPremium) + ' today under the constructed Q-law. Under the separately chosen physical law, probability ' + amount(z.physicalFloorAtom) + ' is concentrated exactly at K. The continuous insured bins have total mass ' + amount(z.insuredContinuousMass) + '; adding the separate floor atom gives ' + amount(z.insuredTotalProbability) + '. These analytically integrated scenario probabilities are distinct from an observed or simulated sample.');
}

export function lesson9(v) {
  const mode = slider(v, 'asset pricing Q-law mode / terminal money', 45, 155, 100), physical = slider(v, 'physical asset-law mode / terminal money', 45, 155, 80);
  const face = slider(v, 'promised maturity debt F / money', 0, 240, 100), discount = slider(v, 'bond price B / terminal money unit', .25, 1.5, .875), terminal = slider(v, 'selected terminal assets V / money', 0, 240, 100);
  const A = panel(v, 'At maturity · assets split into debt and equity');
  const B = graph(v, 'Current values from one consistent pricing law', String.raw`$F\ (\text{promised money})$`, String.raw`$\text{current claim value / money}$`);
  const C = graph(v, 'Model default probabilities under Q and physical P', String.raw`$F\ (\text{promised money})$`, String.raw`$\text{probability of }V<F$`);
  const calculate = memo(H.claims); let z;
  v.render(() => {
    z = calculate({mode: mode.value, physicalMode: physical.value, face: face.value, discount: discount.value, terminalAssets: terminal.value});
    view(A, [-.5, 10.5], [-.3, 6.3]);
    const extent = Math.max(1, terminal.value, face.value), unit = 3.6 / extent, debt = value(z.debtPayoff), equity = value(z.equityPayoff);
    A.rect(1, .8, 3.3, .8 + terminal.value * unit, {color: 'teal', fill: 'teal', fillAlpha: .4});
    A.rect(6.7, .8, 9, .8 + debt * unit, {color: 'orange', fill: 'orange', fillAlpha: .45});
    A.rect(6.7, .8 + debt * unit, 9, .8 + terminal.value * unit, {color: 'blue', fill: 'blue', fillAlpha: .5});
    A.line(3.3, .8 + terminal.value * unit, 6.7, .8 + terminal.value * unit, {color: 'muted', width: 1, dash: [3, 4]});
    if (z.defaultLoss.sign > 0) A.rect(6.7, .8 + terminal.value * unit, 9, .8 + face.value * unit, {color: 'red', fillAlpha: 0, dash: [3, 3]});
    label(A, 'ASSETS', 2.15, 5.8, 'teal', {align: 'center'}); label(A, 'DEBT + EQUITY', 7.85, 5.8, 'purple', {align: 'center', size: 11});
    label(A, 'V=' + format(terminal.value), 2.15, 5.2, 'teal', {align: 'center', size: 13});
    label(A, 'debt ' + amount(z.debtPayoff, true), 7.85, .2, 'orange', {align: 'center'});
    label(A, 'equity ' + amount(z.equityPayoff, true), 7.85, -.15, 'blue', {align: 'center'});
    label(A, 'unpaid promise ' + amount(z.defaultLoss, true), 5, 4.75, z.defaultLoss.sign ? 'red' : 'muted', {align: 'center', size: 10.5});
    const L = H.law(mode.value), P = H.law(physical.value);
    const anchors = [40, mode.value, physical.value, 160, face.value];
    const debtCurve = sample(0, 240, x => Q.approximate(Q.mul(discount.value, Q.sub(x, L.put(x)))), anchors), equityCurve = sample(0, 240, x => Q.approximate(Q.mul(discount.value, L.call(x))), anchors);
    fit(B, [0, 240], [...debtCurve, ...equityCurve].map(p => p[1])); zero(B);
    line(B, debtCurve, 'orange'); line(B, equityCurve, 'blue');
    B.line(0, value(z.assetValue), 240, value(z.assetValue), {color: 'muted', dash: [4, 4], width: 1.4});
    B.dot(face.value, value(z.debtValue), {color: 'orange', r: 5, hollow: true}); B.dot(face.value, value(z.equityValue), {color: 'blue', r: 5, hollow: true});
    view(C, [-12, 252], [-.06, 1.14]);
    line(C, sample(0, 240, x => Q.approximate(L.cdf(x)), anchors), 'purple'); line(C, sample(0, 240, x => Q.approximate(P.cdf(x)), anchors), 'teal', {dash: [5, 4]});
    C.dot(face.value, value(z.riskNeutralDefault), {color: 'purple', r: 5, hollow: true}); C.dot(face.value, value(z.physicalDefault), {color: 'teal', r: 3.5});
  });
  v.legend([['teal', 'terminal assets / physical P default probability'], ['orange', 'debt payoff and current value'], ['blue', 'equity payoff and current value'], ['purple', 'risk-neutral Q default probability'], ['red', 'unpaid debt promise'], ['muted', 'unchanged total asset value']]);
  v.readout(() => '**Equity value=' + amount(z.equityValue) + '; debt value=' + amount(z.debtValue) + '; total=' + amount(z.assetValue) + '.** Value-additivity residual=' + amount(z.valueResidual) + '; terminal split residual=' + amount(z.payoffResidual) + '.\n\nThe promised debt payment F differs from its current market value. Under the declared terminal asset laws, model Q default probability=' + amount(z.riskNeutralDefault) + ' and physical P default probability=' + amount(z.physicalDefault) + '. Both claim prices use the same B and Q-law. These terminal claim identities illustrate the Merton mechanism without fitting continuous-time dynamics or inferring a real-world default frequency.');
}
