// Reproduce against the actual downloaded CIE CSVs and metadata, never an inferred curve.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {resolve} from 'node:path';
import {CIE_PHOTOPIC,CIE_SCOTOPIC} from '../content/psych/source-data-cie-luminous.js';
const dir=process.argv[2];if(!dir)throw new Error('Pass directory containing original CIE_sle_{photopic,scotopic}.csv and *_metadata.json');
for(const[name,data,sha]of[['photopic',CIE_PHOTOPIC,'ee5d5d17922ae645d4af52cacf6a50bdb9385749f9d2181ca312eb2b08febac2'],['scotopic',CIE_SCOTOPIC,'6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759']]){
 const raw=readFileSync(resolve(dir,`CIE_sle_${name}.csv`)),metadata=JSON.parse(readFileSync(resolve(dir,`CIE_sle_${name}.csv_metadata.json`),'utf8'));
 assert.equal(createHash('sha256').update(raw).digest('hex'),sha);const rows=raw.toString().trim().split(/\r?\n/).map(r=>r.split(',').map(Number));assert.deepEqual(data,rows);
 assert.match(JSON.stringify(metadata),/creativecommons.org\/licenses\/by-sa\/4.0/);assert.match(JSON.stringify(metadata),new RegExp(sha));
 console.log(`PASS complete original ${name}: SHA256 verified, all ${rows.length} wavelength/value pairs exact, metadata source hash and CC BY-SA 4.0 verified`);
}
