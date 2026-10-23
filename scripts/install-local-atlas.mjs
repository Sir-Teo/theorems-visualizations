// Package a finished bundle with a stable, double-clickable local launcher.
import {readFile,writeFile,mkdir,chmod,lstat} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {ROOT} from './lib.mjs';
import {inventory} from './build-domain-navigation.mjs';
try {
  const args=process.argv.slice(2);if(args.length!==4||args[0]!=='--bundle'||args[2]!=='--home')throw Error('Use --bundle BUILT_DIRECTORY --home NEW_HOME_DIRECTORY');
  const bundle=resolve(args[1]),home=resolve(args[3]),rel=relative(home,bundle);
  if(!rel||rel.startsWith('..')||rel.includes('\\')||!/^[-a-zA-Z0-9_/]+$/.test(rel))throw Error('Bundle must be a named descendant of the local home');
  const report=JSON.parse(await readFile(join(bundle,'local-program-build.json'),'utf8'));if(report.mode!=='local-only')throw Error('Use a checked local programme build');
  await mkdir(home,{recursive:true});
  for(const file of ['Start Atlas.command','serve.mjs','README.txt'])if(await lstat(join(home,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))throw Error('Existing installation file; keep it or choose a new home: '+file);
  const files=await inventory(bundle);await writeFile(join(bundle,'local-integrity.json'),JSON.stringify({schemaVersion:1,binding:report.binding,files},null,2)+'\n',{flag:'wx'});
  await writeFile(join(home,'serve.mjs'),await readFile(join(ROOT,'scripts/serve-local-atlas.mjs')),{flag:'wx'});
  const launcher=`#!/bin/zsh\nset -e\nATLAS_LAUNCH_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"\nATLAS_NODE="$(command -v node || true)"\nif [[ -z "$ATLAS_NODE" && -x /opt/homebrew/bin/node ]]; then ATLAS_NODE=/opt/homebrew/bin/node; fi\nif [[ -z "$ATLAS_NODE" ]]; then print 'Node.js is required to open the local atlas.'; exit 1; fi\nexec "$ATLAS_NODE" "$ATLAS_LAUNCH_DIR/serve.mjs" --root "$ATLAS_LAUNCH_DIR/${rel}" --port 55187 --open\n`;
  await writeFile(join(home,'Start Atlas.command'),launcher,{flag:'wx'});await chmod(join(home,'Start Atlas.command'),0o755);
  await writeFile(join(home,'README.txt'),`LOCAL ATLAS\n\nDouble-click Start Atlas.command. Keep its Terminal window open while using the atlas. Stop it with Control-C. The atlas listens only on your computer at http://127.0.0.1:55187/start/. If that port is occupied, do not stop another app; run serve.mjs with another --port.\n\nBundle: ${rel}\nThe complete local site is retained here, outside temporary directories. It works offline except when you intentionally follow an external source link. No public deployment or account is needed.\n\nExisting notes stay with their original browser origin. Use the atlas notebook export/import workflow to move them deliberately; this package does not migrate or erase them. New study and practice notes are downloaded explicitly and are not automatically saved.\n\nThe bundle has 30 starting routes, 30 deeper routes, 24 pilot lessons, four additional bilingual studies, three journeys, source discovery and the accepted legacy library. English and Spanish study editions do not mean the entire library has been translated.\n\nlocal-integrity.json records every packaged file hash. Keep the source checkout and verification record for future updates. Never overwrite an earlier immutable edition.\n`,{flag:'wx'});
  console.log(JSON.stringify({home,bundle,launcher:join(home,'Start Atlas.command'),files:Object.keys(files).length,binding:report.binding},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
