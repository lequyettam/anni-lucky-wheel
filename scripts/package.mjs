import fs from 'node:fs/promises';
import path from 'node:path';
import {THEMES} from '../dist/js/themes.js';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'release');await fs.mkdir(out,{recursive:true});
const read=file=>fs.readFile(path.join(root,file),'utf8');
function wrap(code,name,preamble=''){
 const exports=[...code.matchAll(/^export (?:async )?(?:class|function|const|let) (\w+)/gm)].map(x=>x[1]);
 const clean=code.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'');
 return `const ${name}=(()=>{${preamble}\n${clean}\nreturn {${exports.join(',')}};})();`;
}
const embeddedScenes={};
for(const theme of THEMES.filter(theme=>theme.scene)){
 const bytes=await fs.readFile(path.join(root,'dist',theme.scene));
 embeddedScenes[theme.id]='data:image/webp;base64,'+bytes.toString('base64');
}
const themeSource=(await read('dist/js/themes.js')).replace('`./assets/themes/${theme.id}.webp`',JSON.stringify(embeddedScenes)+'[theme.id]');
if(themeSource.includes('`./assets/themes/'))throw new Error('Theme art was not embedded');
const bundle=[wrap(themeSource,'Themes'),wrap(await read('dist/js/content.js'),'Content','const {THEMES,getTheme}=Themes;'),wrap(await read('dist/js/domain.js'),'Domain','const {isThemeId}=Themes;const {getContent,validateContent,contentRevision}=Content;'),wrap(await read('dist/js/storage.js'),'Storage','const {createSeed,clone,RuleError}=Domain;'),wrap(await read('dist/js/visuals.js'),'Visuals'),wrap(await read('dist/js/content-editor.js'),'ContentUI','const {THEMES}=Themes;const {BRAND_FIELDS,CONTENT_GROUPS,THEME_FIELDS,defaultContent,getContent,contentRevision,contentVariables,formatContent,contentMessage,contentTheme,LOGO_MAX_BYTES}=Content;const {escapeHTML:e,icon,WheelRenderer,dateTimeLabel}=Visuals;'),`(()=>{const {THEMES,getTheme,getAppearance,themedPrizes}=Themes;const {getContent,contentRevision,contentVariables,formatContent,contentMessage,contentTheme}=Content;const {ContentEditor,brandMarkup}=ContentUI;const {GameService,ProbabilityPolicy,RuleError,basisPoints,clone,token}=Domain;const {LocalRepository}=Storage;const {icon,escapeHTML:e,dateLabel,dateTimeLabel,percentLabel,WheelRenderer,SoundController,confetti}=Visuals;\n${(await read('dist/js/app.js')).replace(/^import .*?;\s*$/gm,'')}\n})();`].join('\n');
const css=await read('dist/styles.css');
const html=(await read('dist/index.html')).replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./js/app.js"></script>',()=>`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
await fs.writeFile(path.join(out,'ANNI-COFFEE-Demo.html'),html);
await fs.writeFile(path.join(out,'bundle-check.js'),bundle);
console.log('Created release/ANNI-COFFEE-Demo.html');
