// Offline reproduction against the two official French CSV members. Never downloads data.
// node scripts/verify-fin-efficiency-data.mjs DAILY.csv INDUSTRY.csv
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { daily, data, DAILY_YEAR_START } from '../content/fin/ch05.shared.js';
import { dailyCalendar } from '../content/fin/source-audit-daily-calendar.js';
const [dailyFile, industryFile] = process.argv.slice(2);
if (!dailyFile || !industryFile) throw new Error('Supply daily and 10-industry source CSV paths');
const sha = x => createHash('sha256').update(x).digest('hex');
function rows(file, digits, first, last) {
  const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''), out = [];
  assert.match(source, /202608/);
  for (const line of source.split(/\r?\n/)) {
    const cells = line.split(',').map(x => x.trim());
    if (!new RegExp(`^\\d{${digits}}$`).test(cells[0])) continue;
    const date = +cells[0];
    if (date >= first && date <= last) out.push([date, cells.slice(1).map(Number)]);
    if (date === last) break; // First (value-weighted monthly) industry section only.
  }
  return { rows: out, csvSha256: sha(source) };
}
const d = rows(dailyFile, 8, 19630701, 20260831), m = rows(industryFile, 6, 196307, 202608), D = daily(), M = data(), C = dailyCalendar(), starts = [];
assert.equal(d.rows.length, 15897); assert.equal(m.rows.length, 758);
d.rows.forEach(([date, values], i) => {
  assert.equal(date, C.dates[i]);
  assert.equal(Math.round((values[0] + values[3]) * 100), Math.round(D.r[i] * 10000), `daily row ${date}`);
  if (!i || Math.floor(date / 10000) !== Math.floor(d.rows[i - 1][0] / 10000)) starts.push(i);
});
m.rows.forEach(([date, values], i) => {
  assert.equal(date, (1963 + Math.floor((i + 6) / 12)) * 100 + (i + 6) % 12 + 1);
  values.forEach((x, j) => assert.equal(Math.round(x * 100), Math.round(M.ind[j][i] * 10000), `industry ${date}/${j}`));
});
assert.deepEqual(starts, DAILY_YEAR_START);
console.log(JSON.stringify({ status: 'pass', dailyValues: 15897, industryValues: 7580, calendarDates: C.dates.length, yearStarts: starts.length, calendarSha256: sha(Array.from(C.dates).join(',')), dailyCsvSha256: d.csvSha256, industryCsvSha256: m.csvSha256 }, null, 2));
