import fs from 'node:fs/promises';
import path from 'node:path';
import './prepare-pages.mjs';
import './generate-server-resources.mjs';
const root=path.resolve(import.meta.dirname,'..');
const source=path.join(root,'release/pages'),publicDir=path.join(root,'server/public');
for(const item of ['js','assets','styles.css'])await fs.cp(path.join(source,item),path.join(publicDir,item),{recursive:true});
let html=await fs.readFile(path.join(source,'index.html'),'utf8');
html=html.replace('<head>','<head>\n<meta name="anni-api" content="/api">');
// The template is trusted static HTML; Blade still handles the app route and CSRF/session boot.
await fs.writeFile(path.join(root,'server/resources/views/app.blade.php'),html);
console.log('Prepared Laravel frontend in server/public and server/resources/views/app.blade.php');
