// Exposition-backed finite examples. No original Kuhn1953-paper audit is claimed.
const end = (a, b) => ({ payoff: [a, b] });
const node = (player, info, actions) => ({ player, info, actions: actions.map(([name, to, probability]) => ({ name, to, probability })) });
export const probability = p => Number.isFinite(p) && p >= 0 && p <= 1;
const requireProbability = (...ps) => { if (!ps.every(probability)) throw new Error('Probabilities must lie in the closed unit interval.'); };
const sum = a => a.reduce((s, x) => s + x, 0);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function informationExample(key) {
  if (key === 'pennies') return node(1, 'A', [
    ['H', node(2, 'B', [['H', end(1, -1)], ['T', end(-1, 1)]])],
    ['T', node(2, 'B', [['H', end(-1, 1)], ['T', end(1, -1)]])],
  ]);
  if (key === 'poker') return node(0, null, [
    ['High', node(1, 'A', [['Bet', node(2, 'C', [['Call', end(2, -2)], ['Fold', end(1, -1)]])], ['Check', end(1, -1)]]), .5],
    ['Low', node(1, 'B', [['Bet', node(2, 'C', [['Call', end(-2, 2)], ['Fold', end(1, -1)]])], ['Check', end(-1, 1)]]), .5],
  ]);
  if (key === 'recall') return node(1, 'A', [
    ['L', node(2, 'X', [['l', node(1, 'B', [['a', end(0, 0)], ['b', end(1, 2)]])], ['r', node(1, 'B', [['a', end(1, 2)], ['b', end(0, 0)]])]])],
    ['R', end(2, 1)],
  ]);
  if (key === 'forget') return node(1, 'A', [
    ['L', node(1, 'B', [['a', end(1, 0)], ['b', end(0, 0)]])],
    ['R', node(1, 'B', [['a', end(0, 0)], ['b', end(1, 0)]])],
  ]);
  throw new Error('Unknown authored information example.');
}
export function prepareInformation(root) {
  const nodes = [], leaves = [], information = [], byInfo = new Map(), seen = new Set();
  function walk(t, history, own, depth) {
    if (!t || typeof t !== 'object' || seen.has(t)) throw new Error('A finite tree needs distinct node objects and no cycles.');
    seen.add(t); const id = nodes.length, n = { id, history, own, depth }; nodes.push(n);
    if (t.payoff) {
      if (!Array.isArray(t.payoff) || t.payoff.length !== 2 || !Array.from(t.payoff).every(Number.isFinite)) throw new Error('Two finite terminal payoffs required.');
      n.payoff = t.payoff.slice(); n.terminal = leaves.length; n.x = leaves.length; leaves.push(id); return id;
    }
    if (![0, 1, 2].includes(t.player) || !Array.isArray(t.actions) || !t.actions.length || !Array.from(t.actions).every(a => a && typeof a.name === 'string' && a.name) || new Set(t.actions.map(a => a.name)).size !== t.actions.length) throw new Error('A nonterminal node needs one mover and distinct nonempty actions.');
    Object.assign(n, { player: t.player, info: t.info, actions: [] });
    if (t.player) {
      if (typeof t.info !== 'string' || !t.info) throw new Error('Each decision needs an information-set label.');
      const labels = t.actions.map(a => a.name), existing = byInfo.get(t.info);
      if (existing && (existing.player !== t.player || !same(existing.actions.slice().sort(), labels.slice().sort()))) throw new Error('An information set needs the same mover and available actions.');
      if (!existing) { const I = { key: t.info, player: t.player, actions: labels, nodes: [] }; byInfo.set(t.info, I); information.push(I); }
      byInfo.get(t.info).nodes.push(id);
    } else if (!t.actions.every(a => probability(a.probability)) || Math.abs(sum(t.actions.map(a => a.probability)) - 1) > 1e-12) throw new Error('Chance probabilities must form a distribution.');
    for (const a of t.actions) {
      const next = t.player ? { ...own, [t.player]: [...own[t.player], [t.info, a.name]] } : own;
      n.actions.push({ name: a.name, to: walk(a.to, [...history, a.name], next, depth + 1), ...(t.player ? {} : { probability: a.probability }) });
    }
    n.x = (nodes[n.actions[0].to].x + nodes[n.actions.at(-1).to].x) / 2; return id;
  }
  walk(root, [], { 1: [], 2: [] }, 0);
  return { nodes, leaves, information, depth: Math.max(...nodes.map(n => n.depth)) };
}
export function recallAudit(P, player) {
  const records = P.information.filter(I => I.player === player).flatMap(I => I.nodes.map(id => ({ info: I.key, node: id, history: P.nodes[id].history, own: P.nodes[id].own[player] })));
  const violations = [];
  for (const I of P.information.filter(I => I.player === player)) for (const id of I.nodes.slice(1)) {
    const a = P.nodes[I.nodes[0]], b = P.nodes[id]; if (!same(a.own[player], b.own[player])) violations.push({ info: I.key, nodes: [a.id, b.id], own: [a.own[player], b.own[player]] });
  }
  return { ok: !violations.length, records, violations };
}
export function informationPlans(P, player) {
  let plans = [{}];
  for (const I of P.information.filter(I => I.player === player)) plans = plans.flatMap(s => I.actions.map(a => ({ ...s, [I.key]: a })));
  return plans;
}
export const informationPlanText = s => Object.entries(s).map(([k, a]) => `${k}=${a}`).join(' ') || '(empty plan)';
export function informationOutcome(P, behavior) {
  for (const I of P.information) if (!behavior[I.key] || I.actions.some(a => !probability(behavior[I.key][a])) || Math.abs(sum(I.actions.map(a => behavior[I.key][a])) - 1) > 1e-12) throw new Error('Specify a full probability distribution at every information set.');
  const reach = Array(P.nodes.length).fill(0); reach[0] = 1;
  for (const n of P.nodes) if (n.actions) for (const a of n.actions) reach[a.to] = reach[n.id] * (n.player ? behavior[n.info][a.name] : a.probability);
  const probabilities = P.leaves.map(id => reach[id]), payoff = [0, 1].map(i => sum(P.leaves.map((id, j) => probabilities[j] * P.nodes[id].payoff[i])));
  return { probabilities, payoff, reach };
}
const distribution = (mu, n) => {
  if (!Array.isArray(mu) || mu.length !== n || !Array.from(mu).every(x => Number.isFinite(x) && x >= 0) || Math.abs(sum(mu) - 1) > 1e-12) throw new Error('A dense normalized finite mixture over every pure plan is required.');
  return mu.slice();
};
export function mixedInformationOutcome(P, player, mu, others) {
  const plans = informationPlans(P, player); distribution(mu, plans.length);
  const probabilities = P.leaves.map(() => 0), reach = P.nodes.map(() => 0);
  plans.forEach((s, i) => {
    const b = { ...others }; for (const I of P.information.filter(I => I.player === player)) b[I.key] = Object.fromEntries(I.actions.map(a => [a, +(s[I.key] === a)]));
    const out = informationOutcome(P, b); out.probabilities.forEach((p, j) => { probabilities[j] += mu[i] * p; }); out.reach.forEach((p, j) => { reach[j] += mu[i] * p; });
  });
  return { probabilities, reach, payoff: [0, 1].map(i => sum(P.leaves.map((id, j) => probabilities[j] * P.nodes[id].payoff[i]))) };
}
export function informationRealization(P, player, mu, zeroFirst = .5) {
  requireProbability(zeroFirst); const recall = recallAudit(P, player); if (!recall.ok) throw new Error('The mixed-to-behavior construction requires this player to have perfect recall.');
  const plans = informationPlans(P, player); distribution(mu, plans.length); const behavior = {}, records = [];
  const weight = constraints => sum(plans.map((s, j) => constraints.every(([I, a]) => s[I] === a) ? mu[j] : 0));
  for (const I of P.information.filter(I => I.player === player)) {
    const prefix = P.nodes[I.nodes[0]].own[player], denominator = weight(prefix), numerators = I.actions.map(a => weight([...prefix, [I.key, a]]));
    const probs = denominator > 0 ? numerators.map(x => x / denominator) : I.actions.map((_, j) => I.actions.length === 2 ? (j ? 1 - zeroFirst : zeroFirst) : 1 / I.actions.length);
    behavior[I.key] = Object.fromEntries(I.actions.map((a, j) => [a, probs[j]])); records.push({ info: I.key, prefix, denominator, numerators, probabilities: probs, arbitrary: denominator === 0 });
  }
  return { behavior, records, recall };
}
export function productInformationMixture(P, player, behavior) {
  const plans = informationPlans(P, player);
  return plans.map(s => Object.entries(s).reduce((p, [I, a]) => p * behavior[I][a], 1));
}
export function informationProfile(key, a = .5, b = .5, c = .5) {
  requireProbability(a, b, c); if (!['pennies', 'poker'].includes(key)) throw new Error('Unknown profile example.');
  const P = prepareInformation(informationExample(key)), controls = { A: a, B: b, C: c }, behavior = Object.fromEntries(P.information.map(I => [I.key, Object.fromEntries(I.actions.map((s, j) => [s, j ? 1 - controls[I.key] : controls[I.key]]))])), outcome = informationOutcome(P, behavior);
  const deviations = [1, 2].map(player => informationPlans(P, player).map(plan => {
    const dev = { ...behavior }; for (const I of P.information.filter(I => I.player === player)) dev[I.key] = Object.fromEntries(I.actions.map(s => [s, +(plan[I.key] === s)]));
    return { plan, payoff: informationOutcome(P, dev).payoff[player - 1] };
  }));
  const regrets = deviations.map((ds, i) => Math.max(0, ...ds.map(d => d.payoff - outcome.payoff[i])));
  return { key, P, behavior, outcome, deviations, regrets, recall: [1, 2].map(i => recallAudit(P, i)) };
}
export function informationStick(u, v, w) {
  requireProbability(u, v, w); return [u, (1 - u) * v, (1 - u) * (1 - v) * w, (1 - u) * (1 - v) * (1 - w)];
}
export function informationRecallModel(u = .25, v = 1 / 3, w = .5, q = .5, zero = .5) {
  requireProbability(q, zero); const P = prepareInformation(informationExample('recall')), mu = informationStick(u, v, w), plans = informationPlans(P, 1), converted = informationRealization(P, 1, mu, zero), others = { X: { l: q, r: 1 - q } }, original = mixedInformationOutcome(P, 1, mu, others), realized = informationOutcome(P, { ...others, ...converted.behavior }), product = productInformationMixture(P, 1, converted.behavior);
  return { P, mu, plans, converted, others, original, realized, product, difference: Math.max(...original.probabilities.map((x, j) => Math.abs(x - realized.probabilities[j]))) };
}
export function informationForgetModel(lambda = .5, p = .5, q = .5) {
  requireProbability(lambda, p, q); const P = prepareInformation(informationExample('forget')), mu = [lambda, 0, 0, 1 - lambda], mixed = mixedInformationOutcome(P, 1, mu, {}), behavior = { A: { L: p, R: 1 - p }, B: { a: q, b: 1 - q } }, realized = informationOutcome(P, behavior);
  return { P, mu, plans: informationPlans(P, 1), mixed, behavior, realized, recall: recallAudit(P, 1), determinant: lambda * (1 - lambda), behaviorDeterminant: realized.probabilities[0] * realized.probabilities[3] - realized.probabilities[1] * realized.probabilities[2], difference: Math.max(...mixed.probabilities.map((x, j) => Math.abs(x - realized.probabilities[j]))) };
}
export const informationNumber = x => x === 0 ? '0' : +x.toPrecision(6) + '';
export function drawInformationTree(T, P, reach) {
  T.setView([-.85, P.leaves.length - .15], [-P.depth - .82, .7]);
  // Poker C skips the intervening check leaf; a raised dashed connector avoids including it.
  for (const I of P.information.filter(I => I.nodes.length > 1)) {
    const ns = I.nodes.map(id => P.nodes[id]), a = ns[0], b = ns.at(-1), y = -a.depth;
    const cross = P.nodes.some(n => !I.nodes.includes(n.id) && n.depth === a.depth && n.x > a.x && n.x < b.x);
    T.path(cross ? [[a.x,y],[(a.x+b.x)/2,y+.38],[b.x,y]] : [[a.x,y],[b.x,y]], { color:'gold', width:1.5, dash:true });
  }
  for (const n of P.nodes.filter(n => n.actions)) for (const a of n.actions) {
    const c = P.nodes[a.to]; T.line(n.x,-n.depth,c.x,-c.depth,{color:'muted',width:reach?.[a.to]>0?1.8:1,alpha:reach?.[a.to]>0?.8:.35});
    const t=c.actions?.length ? .5 : .76;
    T.text(a.name,n.x+(c.x-n.x)*t,-n.depth-(c.depth-n.depth)*t,{size:10.5,align:'center',plate:true});
  }
  for (const n of P.nodes) {
    if (n.actions) {
      T.dot(n.x,-n.depth,{r:4,color:n.player===1?'blue':n.player===2?'orange':'muted'});
      T.text(n.player ? `${n.player}·${n.info}` : 'chance',n.x,-n.depth+.22,{align:'center',size:11,weight:600,plate:true});
    } else {
      T.dot(n.x,-n.depth,{r:3,color:'muted'});
      T.text(`z${n.terminal+1}`,n.x,-n.depth-.20,{size:10.5,align:'center'});
      T.text(`(${n.payoff.join(',')})`,n.x,-n.depth-.43,{size:10.5,align:'center',color:'muted'});
    }
  }
}
export function drawInformationProbabilities(T, families) {
  const n=families[0].values.length; T.setView([0,n+.8],[-.18,1.16]);
  for(const p of[0,.5,1]){T.line(.55,p,n+.5,p,{color:'muted',alpha:.25,width:1});T.text(String(p),.32,p,{align:'center',size:10.5,color:'muted'});}
  for(let j=0;j<n;j++){
    for(let k=0;k<families.length;k++){const f=families[k],x=j+1+(families.length===1?-.18:k===0?-.32:.02),w=families.length===1?.36:.28;T.rect(x,0,x+w,f.values[j],{color:f.color,fill:f.color,fillAlpha:.45,width:1});}
    T.text(`z${j+1}`,j+1,-.09,{size:10.5,align:'center'});
  }
}
