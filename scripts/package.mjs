import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'release');await fs.mkdir(out,{recursive:true});
const read=file=>fs.readFile(path.join(root,file),'utf8');
function wrap(code,name,preamble=''){
 const exports=[...code.matchAll(/^export (?:async )?(?:class|function|const|let) (\w+)/gm)].map(x=>x[1]);
 const clean=code.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'');
 return `const ${name}=(()=>{${preamble}\n${clean}\nreturn {${exports.join(',')}};})();`;
}
const bundle=[wrap(await read('dist/js/themes.js'),'Themes'),wrap(await read('dist/js/domain.js'),'Domain','const {isThemeId}=Themes;'),wrap(await read('dist/js/storage.js'),'Storage','const {createSeed,clone,RuleError}=Domain;'),wrap(await read('dist/js/visuals.js'),'Visuals'),`(()=>{const {THEMES,getTheme,getAppearance,themedPrizes}=Themes;const {GameService,ProbabilityPolicy,RuleError,basisPoints,clone,token}=Domain;const {LocalRepository}=Storage;const {icon,escapeHTML:e,dateLabel,dateTimeLabel,percentLabel,WheelRenderer,SoundController,confetti}=Visuals;\n${(await read('dist/js/app.js')).replace(/^import .*?;\s*$/gm,'')}\n})();`].join('\n');
const css=await read('dist/styles.css');
const html=(await read('dist/index.html')).replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./js/app.js"></script>',()=>`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
await fs.writeFile(path.join(out,'ANNI-COFFEE-Demo.html'),html);
await fs.writeFile(path.join(out,'bundle-check.js'),bundle);
console.log('Created release/ANNI-COFFEE-Demo.html');
