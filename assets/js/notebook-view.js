import {JOURNAL, MAX_FILE, MAX_RAW, listNotes, readSaved, importNotes, backupText, rawRecoveryText, prepareCopy, recoveryEntries, commitCopy, readJournal, undoCopy} from './notebook-model.js';

const $ = id => document.getElementById(id);
const editions = JSON.parse($('notebook-editions').textContent);
let storage = null, imported = [], sources = [], source = null, targets = [], plan = null, backedUp = false;
const writeCapable = !!(navigator.locks?.request && globalThis.crypto?.randomUUID);
const status = message => { $('status').textContent = message; };
function guard(fn) { return async (...args) => { try { await fn(...args); } catch (e) { status(e?.message || 'Recovery failed. Keep your original files.'); } }; }
function download(text, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], {type})), link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function invalidate() {
  plan = null; backedUp = false; $('confirm').checked = false; $('commit').disabled = true; $('preview-details').hidden = true;
}
function choose() {
  invalidate(); source = sources[Number($('source').value)] || null;
  if ($('source').value === '') source = null;
  const saved = source && readSaved(source.raw, source.revision);
  $('source-raw').textContent = source ? source.raw.slice(0, MAX_RAW) : 'Choose a source first.';
  $('draft').value = saved?.notes || '';
  const oversized = source && source.raw.length > MAX_RAW;
  $('source-info').textContent = source ? `${source.id} · ${source.revision}. ${oversized ? 'This source is too large to copy here. The preview stops at 200,000 characters. Export keeps the complete saved string in a JSON recovery file for separate inspection.' : saved ? 'Original data stays intact.' : 'Unreadable saved data. Export the original bytes; you may write a recovery draft explicitly.'}` : '';
  $('export-source').disabled = !source;
  targets = source && !oversized ? editions.filter(x => x.id === source.id && x.state !== 'withdrawn' && source.key !== `atlas.exploration.v1.${x.id}.${x.revision}`) : [];
  $('target').replaceChildren(new Option('Choose an edition', ''), ...targets.map((t,i) => new Option(`${t.id} · ${t.revision} · ${t.state}`, String(i))));
  $('preview').disabled = true;
  if (source && !targets.length) status(oversized ? 'This source exceeds the copy limit. Export the complete recovery file for separate inspection.' : 'This source can be exported. No other available edition of this exploration can receive it. Withdrawn editions cannot receive a copy.');
}
function recovery() {
  const container = $('recovery-list'); container.replaceChildren();
  if (!storage) { container.textContent = 'Browser storage is unavailable. Imported files can still be inspected and exported.'; return; }
  const keys = [];
  for (let i=0;i<storage.length;i++) { const key=storage.key(i); if (key?.startsWith(JOURNAL)) keys.push(key); }
  for (const key of keys.sort()) {
    const raw = storage.getItem(key); if (raw === null) continue;
    const row = document.createElement('article'), title = document.createElement('h3'), message = document.createElement('p'), actions = document.createElement('div');
    actions.className='notebook-actions';
    const exportButton = document.createElement('button'); exportButton.type='button'; exportButton.textContent='Export this recovery';
    actions.append(exportButton);
    try {
      const record = readJournal(raw), current = storage.getItem(record.targetKey), matches = current === record.after;
      title.textContent = `${record.id} · ${record.revision}`;
      message.textContent = matches ? 'Destination matches this copy. Undo can restore its previous value.' : current === record.before ? 'Destination matches its value before this copy. The copy was undone or did not complete.' : 'Destination differs from this copy. Undo is unavailable; export recovery to inspect it.';
      exportButton.onclick = guard(() => download(backupText(recoveryEntries(record)), 'atlas-note-recovery.json'));
      const undo = document.createElement('button'); undo.type='button'; undo.textContent='Undo this copy'; undo.disabled=!matches || !writeCapable;
      // Every destructive restoration has an explicit local checkbox, even after a reload.
      const label=document.createElement('label'), check=document.createElement('input'); label.className='notebook-check'; check.type='checkbox';
      label.append(check, document.createTextNode('I saved a recovery file and closed other lesson tabs before undo.')); row.append(title,message,label);
      undo.disabled = true;
      check.onchange=()=>{undo.disabled=!(check.checked&&matches&&writeCapable);};
      undo.onclick=guard(async()=>{
        await navigator.locks.request('atlas-note-manager',()=>undoCopy(storage,key,raw));
        refresh(); status('Previous destination restored. Original source and recovery history remain intact.');
      }); actions.append(undo);
    } catch {
      title.textContent='Unreadable recovery record'; message.textContent='No undo will be attempted. Export the untouched recovery bytes for inspection.';
      exportButton.onclick=()=>download(rawRecoveryText(raw),'atlas-unreadable-recovery.json'); row.append(title,message);
    }
    row.append(actions); container.append(row);
  }
  if (!keys.length) container.textContent='No copy has been attempted in this browser.';
}
function refresh() {
  invalidate();
  let local=[];
  try { storage=window.localStorage; local=listNotes(storage); }
  catch { storage=null; status('Browser storage is unavailable. You can inspect and export imported files; copying is disabled.'); }
  sources=[...local,...imported];
  $('source').replaceChildren(new Option('Choose notes',''),...sources.map((s,i)=>new Option(`${s.id} · ${s.revision} · ${s.label}`,String(i))));
  choose(); recovery();
}
$('refresh').onclick=guard(()=>{refresh();if(storage)status('Saved notes refreshed. Prepare a new preview before copying.');});
$('source').onchange=choose;
$('target').onchange=()=>{invalidate();$('preview').disabled=!source||$('target').value===''||!storage||!writeCapable;};
$('draft').oninput=invalidate;
$('export-source').onclick=guard(()=>{
  if (!source) throw new Error('Choose a source.');
  try { download(backupText([source]),'atlas-original-notes.json'); }
  catch { download(rawRecoveryText(source.raw,source),'atlas-original-saved-data.json');status('Complete original string downloaded in a JSON recovery envelope for separate inspection. It exceeds the structured importer’s limits; no saved notes changed.'); }
});
$('import').onchange=guard(async()=>{
  const file=$('import').files[0];if(!file)return;
  try {
    if(file.size>MAX_FILE)throw new Error('File exceeds 1 MiB. Nothing was imported or changed.');
    const rows=importNotes(await file.text());
    if(imported.length+rows.length>100)throw new Error('This session already has too many imports. Reload after exporting any draft.');
    imported.push(...rows);refresh();status(`Imported ${rows.length} entries for inspection. No saved notes changed.`);
  } finally { $('import').value=''; }
});
$('preview').onclick=guard(()=>{
  invalidate();
  if(!storage||!writeCapable)throw new Error('Copying requires browser storage, secure random identities and Web Locks. Export remains available.');
  const target=targets[Number($('target').value)];if($('target').value===''||!target)throw new Error('Choose an edition.');
  plan=prepareCopy(storage,source,target,$('draft').value);
  $('before').textContent=plan.before===null?'No saved notes at this destination.':readSaved(plan.before,plan.revision).notes;
  $('after').textContent=$('draft').value||'(Empty notes)';
  $('preview-info').textContent=`${plan.id} · ${plan.revision}. ${plan.before===null?'This edition’s default selections will be used.':'Existing destination selections and extra saved fields are preserved.'} Download the source, before and proposed values before copying.`;
  $('preview-details').hidden=false;status('Preview ready. Saved notes have not changed.');
});
$('backup').onclick=guard(()=>{if(!plan)throw new Error('Prepare a preview.');download(backupText(recoveryEntries(plan)),'atlas-note-recovery.json');backedUp=true;$('commit').disabled=!$('confirm').checked;});
$('confirm').onchange=()=>{$('commit').disabled=!(plan&&backedUp&&$('confirm').checked);};
$('commit').onclick=guard(async()=>{
  if(!plan||!backedUp||!$('confirm').checked)throw new Error('Preview and save a recovery file first.');
  const chosen=plan;$('commit').disabled=true;
  try { await navigator.locks.request('atlas-note-manager',()=>commitCopy(storage,chosen,crypto.randomUUID())); refresh();status('Notes copied. Source preserved. Recovery history can undo this copy while the destination remains unchanged.'); }
  catch(e) { invalidate();recovery();throw e; }
});
window.addEventListener('storage',event=>{if(event.key===null||event.key?.startsWith('atlas.exploration.v1.')||event.key?.startsWith(JOURNAL)){invalidate();status('Saved data changed in another tab. Refresh before preparing another copy or undo.');recovery();}});
$('notebook-app').hidden=false;
refresh();
if(storage)status(writeCapable?'Choose saved notes or import a file. Nothing is copied automatically.':'Copying and undo need a secure browser with Web Locks. Inspection and export remain available.');
