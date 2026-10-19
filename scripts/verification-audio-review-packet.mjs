// Preparing this worksheet never records a human listening result.
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadAll, ROOT} from './lib.mjs';
import {isListeningTarget} from './verification-audio-targets.mjs';

const {items} = await loadAll();
const targets = items.filter(isListeningTarget);
if (!targets.length) throw Error('No listening targets found.');
const runtime = createHash('sha256');
for (const dir of ['assets/js', 'assets/css']) {
  for (const file of readdirSync(join(ROOT, dir), {recursive: true}).filter(file => file.endsWith('.js') || file.endsWith('.css')).sort()) {
    runtime.update(`${dir}/${file}`);
    runtime.update(readFileSync(join(ROOT, dir, file)));
  }
}
runtime.update(readFileSync(join(ROOT, 'data/atlas.css')));
const runtimeHash = runtime.digest('hex'), hashes = new Map();
for (const col of new Set(targets.map(item => item.col))) {
  const hash = createHash('sha256').update(runtimeHash);
  for (const file of readdirSync(join(ROOT, 'content', col)).filter(file => file.endsWith('.js')).sort()) {
    hash.update(`content/${col}/${file}`);
    hash.update(readFileSync(join(ROOT, 'content', col, file)));
  }
  for (const file of ['data/index.json', `data/col/${col}.json`]) {
    hash.update(file); hash.update(readFileSync(join(ROOT, file)));
  }
  hashes.set(col, hash.digest('hex'));
}
const manifest = {
  schemaVersion: 1,
  kind: 'subjective-audio-listening',
  meaning: 'Preparation only. Actual human listening findings must be supplied and integrated before the gate can close.',
  selection: 'Same live item predicate as tests/verification-audio.mjs; full named listening inventory, separate from the 5% page sample.',
  items: targets.map(item => ({id: item.id, name: item.name, file: item.file, sourceHash: hashes.get(item.col)})),
};
const data = JSON.stringify(manifest).replaceAll('<', String.fromCharCode(92) + 'u003c');
const html = String.raw`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wave 3–4 audio listening worksheet</title>
<style>
body{margin:0;background:#f6f5f0;color:#222;font:15px system-ui}header{padding:18px;border-bottom:1px solid #bbb}h1{font-size:21px;margin:0 0 8px}p{margin:8px 0}input,textarea,select,button{font:inherit}input,select,button,textarea{padding:7px}button{cursor:pointer}main{display:grid;grid-template-columns:300px 1fr}nav{padding:12px;max-height:85vh;overflow:auto}nav button{display:block;text-align:left;width:100%;margin:5px 0;background:white;border:1px solid #ccc;border-radius:4px}nav button[aria-current=true]{background:#e6edff;border-color:#3961ab}#filter{width:100%;box-sizing:border-box}section{padding:12px}iframe{width:100%;height:650px;resize:vertical;border:1px solid #bbb;background:white}textarea{box-sizing:border-box;width:100%;min-height:85px}small{color:#555}.identity{display:flex;gap:12px;flex-wrap:wrap}#state{min-height:1.4em}#current{font-weight:bold}@media(max-width:750px){main{display:block}nav{max-height:220px}iframe{height:550px}}
</style>
<header><h1>Wave 3–4: subjective audio listening</h1>
<p>Listen to every speaker button on each page and compare the relevant control settings. Check whether the intended pitch, timbre or noise difference is clear; note unwanted clicks, clipping, loudness problems, misleading labels, or replay/stop problems. Some examples intentionally synthesize rough or noisy sounds.</p>
<div class="identity"><label>Human reviewer <input id="reviewer" autocomplete="name"></label><label>Listening setup <input id="equipment" placeholder="Headphones or speakers; device/browser"></label><button id="export">Export findings</button><strong id="progress"></strong></div>
<p><small>This worksheet saves in this browser. Preparation and automated form tests do not count as listening. Changed sources require rechecking. Exported findings require integration before the master-plan gate can close.</small></p></header>
<main><nav aria-label="Audio pages"><label>Filter audio pages <input id="filter" type="search"></label><div id="list"></div></nav>
<section><p><span id="current"></span> · <a id="open" target="_blank" rel="noopener">Open page separately</a></p><iframe id="example" title="Selected audio example"></iframe>
<p><label for="result">Listening assessment </label><select id="result"><option value="pending">Not assessed</option><option value="clear">Clear enough for the intended example</option><option value="issue">Needs correction</option></select></p>
<label for="notes">What you heard, settings compared, and any corrections</label><textarea id="notes"></textarea>
<p><label><input id="listened" type="checkbox"> I personally listened to every speaker button and compared relevant settings</label></p><p id="state" role="status"></p></section></main>
<script id="audio-data" type="application/json">${data}</script>
<script>
const manifest=JSON.parse(document.getElementById('audio-data').textContent),key='atlas-audio-listening-v1',el=id=>document.getElementById(id);
let stored;try{stored=JSON.parse(localStorage.getItem(key)||'null')}catch{}
const saved={reviewer:typeof stored?.reviewer==='string'?stored.reviewer:'',equipment:typeof stored?.equipment==='string'?stored.equipment:'',records:stored?.records&&typeof stored.records==='object'?stored.records:{}};
let selected;
el('reviewer').value=saved.reviewer;el('equipment').value=saved.equipment;
const textPresent=value=>typeof value==='string'&&!!value.trim();
function done(item,r=saved.records[item.id]){return !!(r?.listened&&r.sourceHash===item.sourceHash&&textPresent(r.notes)&&textPresent(r.reviewer)&&textPresent(r.equipment)&&['clear','issue'].includes(r.result))}
function write(){try{localStorage.setItem(key,JSON.stringify(saved))}catch{el('state').textContent='Local storage is unavailable. Export findings before leaving.'}renderList()}
function renderList(){const query=el('filter').value.toLowerCase(),list=el('list');list.replaceChildren();let complete=0;for(const item of manifest.items){const completeItem=done(item);if(completeItem)complete++;if(!(item.id+' '+item.name).toLowerCase().includes(query))continue;const b=document.createElement('button');b.textContent=(completeItem?'✓ ':'')+item.id+' · '+item.name;b.setAttribute('aria-current',String(selected?.id===item.id));b.onclick=()=>select(item);list.append(b)}el('progress').textContent=complete+' / '+manifest.items.length+' listened locally'}
function select(item){selected=item;const r=saved.records[item.id]||{};el('current').textContent=item.id+' · '+item.name;const url=new URL('../../index.html',location.href);url.hash='/t/'+item.id;el('example').src=url.href;el('open').href=url.href;el('notes').value=typeof r.notes==='string'?r.notes:'';el('result').value=['clear','issue'].includes(r.result)?r.result:'pending';el('listened').checked=!!r.listened&&r.sourceHash===item.sourceHash&&r.reviewer===saved.reviewer&&r.equipment===saved.equipment;el('state').textContent=r.listened&&r.sourceHash!==item.sourceHash?'Sources changed after this listening pass. Notes are retained; listen again.':'Record observations for every speaker button before marking this page listened.';renderList()}
function update(){if(!selected)return;if(el('listened').checked&&(!saved.reviewer.trim()||!saved.equipment.trim())){el('listened').checked=false;el('state').textContent='Enter the actual human reviewer and listening setup first.';(!saved.reviewer.trim()?el('reviewer'):el('equipment')).focus();return}saved.records[selected.id]={listened:el('listened').checked,result:el('result').value,notes:el('notes').value,sourceHash:selected.sourceHash,reviewer:saved.reviewer,equipment:saved.equipment,listenedAt:el('listened').checked?new Date().toISOString():null};el('state').textContent=done(selected)?'Listening findings saved locally; export for integration.':'An assessment, listening notes and personal listening confirmation are required.';write()}
for(const id of ['reviewer','equipment'])el(id).oninput=()=>{saved[id]=el(id).value;el('listened').checked=false;el('state').textContent='Reviewer or setup changed. Confirm personal listening before saving a new assessment.';write()};
el('filter').oninput=renderList;el('result').onchange=update;el('notes').oninput=update;el('listened').onchange=update;
el('export').onclick=()=>{if(!saved.reviewer.trim()||!saved.equipment.trim()){el('state').textContent='Enter the actual human reviewer and listening setup before exporting.';(!saved.reviewer.trim()?el('reviewer'):el('equipment')).focus();return}const output={schemaVersion:1,kind:manifest.kind,meaning:'User-entered subjective findings; integration and review are required before assigning listening credit.',exportedAt:new Date().toISOString(),inventory:manifest.items.map(item=>({id:item.id,sourceHash:item.sourceHash})),records:manifest.items.filter(item=>saved.records[item.id]).map(item=>({id:item.id,...saved.records[item.id],sourceCurrent:saved.records[item.id].sourceHash===item.sourceHash,complete:done(item)}))};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)+String.fromCharCode(10)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='atlas-audio-listening-findings.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)};
select(manifest.items[0]);
</script></html>
`;
for (const [file, contents] of [
  ['docs/verification/audio-review-inventory.json', JSON.stringify(manifest, null, 2) + String.fromCharCode(10)],
  ['docs/verification/audio-review.html', html],
]) {
  const path = join(ROOT, file);
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== contents) throw Error(`${file} is stale; regenerate after source/build changes.`);
  } else writeFileSync(path, contents);
}
console.log(`${targets.length} audio pages prepared; subjective human listening remains pending.`);
