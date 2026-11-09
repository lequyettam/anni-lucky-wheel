import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createSeed} from '../dist/js/domain.js';
import {BRAND_FIELDS,CONTENT_GROUPS,THEME_FIELDS,defaultContent,validateContent} from '../dist/js/content.js';
import {THEMES} from '../dist/js/themes.js';

// Build-time metadata only. Never reads or writes the deployed database.
const directory=fileURLToPath(new URL('../server/resources/game/',import.meta.url));
const seed=createSeed(new Date('2026-01-01T00:00:00Z'));
const content=defaultContent();
content.text.rulesRecovery='Đổi điện thoại? Dùng số điện thoại và mã khôi phục được cấp khi tạo ví. Hãy lưu mã ở nơi riêng tư.';
validateContent(content);
const defaults={
  settings:{...seed.settings,active:false,codeHint:'',content,contentRevision:0},
  prizes:seed.prizes.map(prize=>({...prize,stock:prize.kind==='lose'?null:0}))
};
const schema={brand:BRAND_FIELDS,text:CONTENT_GROUPS.flatMap(group=>group.fields),theme:THEME_FIELDS,themeIds:THEMES.map(theme=>theme.id)};
await fs.mkdir(directory,{recursive:true});
for(const [name,value] of Object.entries({'defaults.json':defaults,'content-schema.json':schema})){
  await fs.writeFile(directory+'/'+name,JSON.stringify(value,null,2)+'\n');
}
