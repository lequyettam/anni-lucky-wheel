import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Keep source modules readable; version all browser imports in the published copy.
const root=path.resolve(import.meta.dirname,'..');
const source=path.join(root,'dist'),output=path.join(root,'release/pages');
const modules=(await fs.readdir(path.join(source,'js'))).filter(name=>name.endsWith('.js')).sort();
const files=['styles.css',...modules.map(name=>'js/'+name)];
const contents=new Map(await Promise.all(files.map(async file=>[file,await fs.readFile(path.join(source,file),'utf8')])));
const hash=createHash('sha256');
for(const [file,content] of contents)hash.update(file+'\0'+content+'\0');
const version=hash.digest('hex').slice(0,12);

await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.cp(source,output,{recursive:true});
for(const file of files.filter(file=>file.endsWith('.js'))){
  const code=contents.get(file).replace(/^(import\s+[^\n]+?\s+from\s+['"])(\.\/[^'"?]+\.js)(['"];)/gm,`$1$2?v=${version}$3`);
  await fs.writeFile(path.join(output,file),code);
}
let html=await fs.readFile(path.join(source,'index.html'),'utf8');
for(const asset of ['styles.css','js/app.js']){
  if(!html.includes(`"./${asset}"`))throw new Error(`Missing entry asset: ${asset}`);
  html=html.replace(`"./${asset}"`,`"./${asset}?v=${version}"`);
}
await fs.writeFile(path.join(output,'index.html'),html);
console.log(`Prepared release/pages with asset version ${version}`);
