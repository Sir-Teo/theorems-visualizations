// Separate local editorial surface; never writes production or another worktree.
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {ROOT} from './lib.mjs';
import {dashboardSnapshot} from './build-coverage-dashboard-data.mjs';
export const dashboardSourcePaths=['scripts/capture-coverage-dashboard.mjs','scripts/coverage-dashboard-model.mjs','scripts/build-coverage-dashboard-data.mjs','scripts/build-coverage-dashboard.mjs','coverage-dashboard/src/content/dashboard/DashboardContent.jsx','coverage-dashboard/src/content/dashboard/coverage.css','coverage-dashboard/src/data.json','docs/coverage/dashboard/inputs.json','docs/coverage/dashboard/model.json'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
export async function validateBundle(dir){
 const manifest=await json(resolve(dir,'data-app-build.json'));
 if(manifest.version!==1||manifest.kind!=='separate-data-v1'||manifest.html?.path!=='index.html'||!/^snapshot\.[a-f0-9]{64}\.json$/.test(manifest.snapshot?.path||''))throw new Error('Invalid dashboard build manifest');
 const files={};for(const entry of [manifest.html,manifest.snapshot]){const bytes=await readFile(resolve(dir,entry.path));if(hash(bytes)!==entry.sha256||bytes.length!==entry.bytes)throw new Error('Dashboard bundle integrity mismatch: '+entry.path);files[entry.path]=bytes;}
 if(manifest.snapshot.sha256!==manifest.sourceSnapshotSha256)throw new Error('Dashboard source snapshot binding mismatch');
 return {manifest,files};
}
export async function checkDashboard({root=ROOT,buildTool}={}){
 const {snapshot,model}=await dashboardSnapshot(root),data=await json(resolve(root,'coverage-dashboard/src/data.json'));
 const {id,buildStatus,...comparable}=data;const {buildStatus:expectedStatus,...expected}=snapshot;
 if(id!=='dashboard:0c031e9a-a571-4f6b-9716-bafa01ecd5ff'||!['creating','updating','complete','paused'].includes(buildStatus)||!isDeepStrictEqual(comparable,expected))throw new Error('Dashboard reviewed snapshot is stale');
 if(!isDeepStrictEqual(model,await json(resolve(root,'docs/coverage/dashboard/model.json'))))throw new Error('Dashboard model is stale');
 const bindingPath=resolve(root,'docs/coverage/dashboard/build-source.json'),out=resolve(root,'labs/atlas/coverage');
 if(buildTool){
  if(!resolve(buildTool).endsWith('/scripts/data-app.mjs'))throw new Error('Use the installed Data app build tool');
  execFileSync(process.execPath,[resolve(buildTool),'build','--project-dir',resolve(root,'coverage-dashboard'),'--separate-data'],{cwd:root,stdio:'pipe'});
  const {manifest,files}=await validateBundle(resolve(root,'coverage-dashboard/dist'));
  if(!isDeepStrictEqual(JSON.parse(files[manifest.snapshot.path]),data))throw new Error('Built snapshot differs from reviewed source');
  const old=await json(resolve(out,'data-app-build.json')).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(old)await validateBundle(out); // Refuse to overwrite a locally changed generated bundle.
  await mkdir(out,{recursive:true});
  for(const [name,bytes] of Object.entries(files))await writeFile(resolve(out,name),bytes);
  await writeFile(resolve(out,'data-app-build.json'),JSON.stringify(manifest,null,2)+'\n');
  if(old&&old.snapshot.path!==manifest.snapshot.path)await unlink(resolve(out,old.snapshot.path));
  const sourceFiles=await Promise.all(dashboardSourcePaths.map(async path=>({path,sha256:hash(await readFile(resolve(root,path)))})));
  await writeFile(bindingPath,JSON.stringify({schemaVersion:1,sourceFiles,htmlSha256:manifest.html.sha256,snapshotSha256:manifest.snapshot.sha256,runtimeSha256:manifest.runtimeSha256},null,2)+'\n');
 }
 const binding=await json(bindingPath),{manifest,files}=await validateBundle(out);
 if(binding.schemaVersion!==1||!isDeepStrictEqual(binding.sourceFiles?.map(f=>f.path),dashboardSourcePaths))throw new Error('Invalid dashboard source binding');
 for(const f of binding.sourceFiles)if(hash(await readFile(resolve(root,f.path)))!==f.sha256)throw new Error('Dashboard authored source changed; rebuild: '+f.path);
 if(binding.htmlSha256!==manifest.html.sha256||binding.snapshotSha256!==manifest.snapshot.sha256||binding.runtimeSha256!==manifest.runtimeSha256||!isDeepStrictEqual(JSON.parse(files[manifest.snapshot.path]),data))throw new Error('Dashboard build/source binding mismatch');
 return {result:'PASS',html:manifest.html.sha256,snapshot:manifest.snapshot.sha256,summary:model.summary};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const a=process.argv.slice(2);if(a.length&&!(a.length===2&&a[0]==='--build-tool'))throw new Error('Use no arguments to check, or --build-tool /absolute/plugin/scripts/data-app.mjs to build');console.log(JSON.stringify(await checkDashboard({buildTool:a[1]}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
