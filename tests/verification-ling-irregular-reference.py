"""Independent integer CSV selection/prefix counts and 60-digit square roots."""
import csv,decimal,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
with (root/'docs/verification/ling-irregular-source.csv').open() as f:rows=list(csv.DictReader(f))
selected=sorted([dict(w=r['verb'],count=int(r['count']),old=int(r['old']),middle=int(r['middle']),modern=int(r['modern'])) for r in rows if r['old']=='1'],key=lambda r:(-r['count'],r['w']))
assert len(rows)==249 and len(selected)==177
assert [sum(r[e] for r in selected) for e in ['old','middle','modern']]==[177,145,98]
lookup={r['w']:r for r in selected};decimal.getcontext().prec=60
pick=['be','go','think','give','break','fight','sleep','dig','weep','shrink']
scale=[[w,lookup[w]['count'],str((decimal.Decimal(lookup[w]['count'])/decimal.Decimal(lookup['shrink']['count'])).sqrt())] for w in pick]
prefixes={e:[sum(r[e] for r in selected[:n]) for n in range(1,178)] for e in ['old','middle','modern']}
(root/'docs/verification/ling-irregular-reference.json').write_text(json.dumps(dict(order=[r['w'] for r in selected],counts=[r['count'] for r in selected],prefixes=prefixes,scale=scale),indent=1)+'\n')
print('Independent oracle:249 original rows →177 retained Old-English irregulars;531 cutoff counts;10 sixty-digit scaling values')
