import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { data } from '../content/fin/ch05.shared.js';
import { speculationHistorical, monthOrdinal, ordinalMonth } from '../content/fin/source-audit-speculation.js';
const [factorFile, industryFile] = process.argv.slice(2);
if (!factorFile || !industryFile) throw new Error('Supply the original monthly factors CSV and 10-industry CSV.');
function firstMonthly(file) { const text = readFileSync(file, 'utf8'), rows = new Map(); let started = false;
 for (const line of text.split(/\r?\n/)) { if (/^\s*\d{6},/.test(line)) { const [date, ...values] = line.trim().split(','); rows.set(+date, values.map(Number)); started = true; } else if (started) break; }
 assert.match(text.slice(0, 100), /202608/); assert.ok(rows.size > 1000); return { rows, sha: createHash('sha256').update(readFileSync(file)).digest('hex') };
}
const factors = firstMonthly(factorFile), industries = firstMonthly(industryFile), d = data(), h = speculationHistorical(d), wealth = [[1], [1], [1]], dates = [199212];
let count = 0;
for (let month = monthOrdinal(199301); month <= monthOrdinal(200512); month++) {
 const date = ordinalMonth(month), f = factors.rows.get(date), p = industries.rows.get(date), index = month - monthOrdinal(196307); assert.ok(f && p);
 for (const [x, y] of [[d.mkt[index], f[0] / 100], [d.rf[index], f[3] / 100], [d.ind[4][index], p[4] / 100], [d.ind[5][index], p[5] / 100]]) { assert.ok(Math.abs(x - y) < 1e-12); count++; }
 [p[4] / 100, p[5] / 100, (f[0] + f[3]) / 100].forEach((r, j) => wealth[j].push(wealth[j].at(-1) * (1 + r))); dates.push(date);
}
assert.deepEqual(h.dates, dates); const peak = wealth[0].indexOf(Math.max(...wealth[0])); assert.equal(dates[peak], 200003); assert.equal(h.peak, peak);
for (let j = 0; j < 3; j++) { wealth[j].forEach((x, i) => assert.ok(Math.abs(x - h.wealth[j][i]) <= 1e-12 * Math.max(1, Math.abs(x))));
 for (let i = peak - 60; i <= peak + 36; i++) { const point = h.series[j].points[i - peak + 60]; assert.equal(point[0], monthOrdinal(dates[i]) / 12); assert.ok(Math.abs(point[1] - 100 * wealth[j][i] / wealth[j][peak]) < 1e-10); }
}
console.log('PASS:', count, 'original monthly scalar values (1993-01–2005-12), all471 compounded wealth points,157 actual month labels and291 plotted normalized points; peak2000-03, window1995-03–2003-03.');
console.log(JSON.stringify({ factorsCSV: factors.sha, industryCSV: industries.sha, rise60: h.rise60, change30: h.change30 }));
