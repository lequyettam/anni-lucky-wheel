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
const bundle=[wrap(await read('dist/js/release-copy.js'),'ReleaseCopy'),wrap(await read('dist/js/access-policy.js'),'Access'),wrap(themeSource,'Themes'),wrap(await read('dist/js/content.js'),'Content','const {upgradePresentationText}=ReleaseCopy;const {THEMES,getTheme}=Themes;'),wrap(await read('dist/js/domain.js'),'Domain','const {PRIZE_TERMS}=ReleaseCopy;const {requirePermission}=Access;const {isThemeId}=Themes;const {getContent,validateContent,contentRevision}=Content;'),wrap(await read('dist/js/staff.js'),'Staff','const {clone,token,digest,createSeed}=Domain;const {ACCESS_MODULES,STAFF_ROLES,ALL_PERMISSIONS,presetPermissions,editPermission,sessionActor,requirePermission}=Access;'),wrap(await read('dist/js/storage.js'),'Storage','const {createSeed,clone,RuleError}=Domain;'),wrap(await read('dist/js/visuals.js'),'Visuals'),wrap(await read('dist/js/staff-ui.js'),'StaffUI','const {ACCESS_MODULES,STAFF_ROLES,presetPermissions,staffPermissions,editPermission,can}=Access;const {escapeHTML:e,icon,dateTimeLabel}=Visuals;'),wrap(await read('dist/js/content-editor.js'),'ContentUI','const {THEMES}=Themes;const {BRAND_FIELDS,CONTENT_GROUPS,THEME_FIELDS,defaultContent,getContent,contentRevision,contentVariables,formatContent,contentMessage,contentTheme,LOGO_MAX_BYTES,LOGO_VARIANTS,brandLogo}=Content;const {escapeHTML:e,icon,WheelRenderer,dateTimeLabel}=Visuals;'),`(()=>{const {displayPrizeTerms}=ReleaseCopy;const {StaffService}=Staff;const {ACCESS_MODULES,STAFF_ROLES,can,staffHome,routePermission,editPermission,ACTION_PERMISSIONS,FORM_PERMISSIONS}=Access;const {staffGate,staffEditForm,permissionFields,staffManager,staffAccount}=StaffUI;const {THEMES,getTheme,getAppearance,themedPrizes}=Themes;const {getContent,contentRevision,contentVariables,formatContent,contentMessage,contentTheme,brandLogo,LOGO_VARIANTS}=Content;const {ContentEditor,brandMarkup}=ContentUI;const {GameService,ProbabilityPolicy,RuleError,basisPoints,clone,token}=Domain;const {LocalRepository}=Storage;const {icon,escapeHTML:e,dateLabel,dateTimeLabel,percentLabel,WheelRenderer,SoundController,confetti}=Visuals;\n${(await read('dist/js/app.js')).replace(/^import .*?;\s*$/gm,'')}\n})();`].join('\n');
const css=await read('dist/styles.css');
const html=(await read('dist/index.html')).replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./js/app.js"></script>',()=>`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
await fs.writeFile(path.join(out,'ANNI-COFFEE.html'),html);
await fs.writeFile(path.join(out,'bundle-check.js'),bundle);
console.log('Created release/ANNI-COFFEE.html');
