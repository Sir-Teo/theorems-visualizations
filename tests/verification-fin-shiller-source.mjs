import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {D_SHILLER} from '../content/fin/ch05.shared.js';
const file=process.argv[2];if(!file)throw new Error('Supply the author’s original ie_data.xls; Python needs xlrd.');
const python=process.env.ATLAS_SHILLER_PYTHON||'python3';
const script=String.raw`import xlrd,json,sys
s=xlrd.open_workbook(sys.argv[1]).sheet_by_name('Data')
years={}
for i in range(8,s.nrows):
 r=s.row_values(i)
 if not isinstance(r[0],(int,float)): continue
 year=int(r[0]); month=round((r[0]-year)*100)
 if 1871<=year<=2022:
  assert 1<=month<=12
  years.setdefault(year,[]).append([month,r[1],r[2],r[4]])
result=[]
for year in range(1871,2023):
 rows=years[year]
 assert sorted(r[0] for r in rows)==list(range(1,13))
 result.append([year,*[sum(r[j] for r in rows)/12 for j in [1,2,3]]])
print(json.dumps(result))`;
const r=spawnSync(python,['-c',script,file],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
const source=JSON.parse(r.stdout);assert.equal(source.length,152);
for(let i=0;i<152;i++){assert.equal(D_SHILLER[i][0],source[i][0]);[2,3,2].forEach((precision,j)=>assert.ok(Math.abs(D_SHILLER[i][j+1]-source[i][j+1])<=.50001*10**(-precision),`${source[i][0]} column ${j+1}: embedded annual mean differs beyond its declared rounding`));}
console.log('PASS 1,824 original monthly rows, complete month calendars, all152 annual means and456 embedded P/dividend-rate/CPI scalars at their2/3/2-decimal precision; shared data unchanged.');
console.log(JSON.stringify({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
