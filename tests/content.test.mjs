import test from 'node:test';
import assert from 'node:assert/strict';
import {GameService,MemoryRepository,createSeed} from '../dist/js/domain.js';
import {LocalRepository} from '../dist/js/storage.js';
import {THEMES} from '../dist/js/themes.js';
import {getContent,defaultContent,contentRevision,contentTheme,contentVariables,formatContent,contentMessage,validateContent,LOGO_MAX_BYTES} from '../dist/js/content.js';
import {ContentEditor,brandMarkup} from '../dist/js/content-editor.js';
const now=new Date('2026-10-27T05:00:00Z');
const game=()=>new GameService(new MemoryRepository(createSeed(now)),{clock:()=>now,random:()=>.5});
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1uoAAAAASUVORK5CYII=';
const withoutContent=state=>{const copy=structuredClone(state);for(const k of ['content','contentRevision','contentPrevious','contentUpdatedAt'])delete copy.settings[k];return copy;};

test('Legacy content falls back to the shipped copy for all eight themes without migration',()=>{
 const seed=createSeed(now),before=structuredClone(seed),content=getContent(seed.settings);
 assert.deepEqual(seed,before);assert.equal(contentRevision(seed.settings),0);
 for(const t of THEMES)assert.deepEqual(contentTheme(t.id,content),t);
 content.brand.name='Changed';assert.equal(defaultContent().brand.name,'ANNI COFFEE');
 assert.equal(getContent({content:{brand:{name:42,logo:'javascript:alert(1)'},themes:{anni:{headline:null}}}}).brand.name,'ANNI COFFEE');
});

test('Saving brand and copy preserves campaign, theme, prizes, accounts, vouchers and redemption history',async()=>{
 const g=game(),u=await g.login('0900000001');await g.activateCode(u.id,'ANNI2026');
 const {voucher}=await g.spin(u.id,'earned');await g.useVoucher(u.id,voucher.code);
 await g.saveAppearance({theme:'lunar-new-year',decorations:true});const before=g.snapshot();
 const c=defaultContent();c.brand.name='CÀ PHÊ AN NHIÊN';c.brand.logo=png;c.themes.halloween.mobileLead='ĐÊM HỘI CÀ PHÊ';c.text.walletTitle='Ví ưu đãi';
 await g.saveContent(c,0);const after=g.snapshot();
 assert.deepEqual(withoutContent(after),withoutContent(before));assert.deepEqual(getContent(after.settings),c);
 assert.deepEqual(after.settings.contentPrevious.content,defaultContent());assert.equal(after.settings.contentRevision,1);
 assert.equal(after.settings.contentUpdatedAt,now.toISOString());
});

test('Previous version and default restoration survive repository reload without losing business data',async()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const repo=new LocalRepository('content',storage),g=new GameService(repo,{clock:()=>now});
 const a=defaultContent();a.brand.name='ANNI CÀ MAU';a.brand.logo=png;await g.saveContent(a,0);
 const b=structuredClone(a);b.text.gameTitle='Vòng quay mùa lễ';await g.saveContent(b,1);
 const fresh=new GameService(new LocalRepository('content',storage),{clock:()=>now});
 const snapshot=fresh.snapshot();assert.deepEqual(snapshot.settings.contentPrevious.content,a);
 await fresh.saveContent(snapshot.settings.contentPrevious.content,2);assert.deepEqual(getContent(fresh.snapshot().settings),a);
 assert.deepEqual(fresh.snapshot().settings.contentPrevious.content,b);
 await fresh.saveContent(defaultContent(),3);assert.deepEqual(getContent(fresh.snapshot().settings),defaultContent());
 assert.deepEqual(withoutContent(fresh.snapshot()),withoutContent(snapshot));
});

test('Stale saves and competing edits cannot silently overwrite another editor',async()=>{
 const g=game(),a=defaultContent(),b=defaultContent();a.brand.name='Thương hiệu A';b.brand.name='Thương hiệu B';
 const results=await Promise.allSettled([g.saveContent(a,0),g.saveContent(b,0)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.match(results.find(r=>r.status==='rejected').reason.message,/tab khác/);
 assert.equal(g.snapshot().settings.contentRevision,1);
 await assert.rejects(g.saveContent(defaultContent(),0),/tab khác/);
});

test('Saving campaign settings cannot overwrite content or recovery metadata from stale settings',async()=>{
 const g=game(),stale=g.snapshot().settings,c=defaultContent();c.brand.name='ANNI CÀ MAU';await g.saveContent(c,0);
 await g.saveSettings({...stale,dailyFree:3,content:defaultContent(),contentRevision:0,contentPrevious:null,contentUpdatedAt:null});
 assert.deepEqual(getContent(g.snapshot().settings),c);assert.equal(g.snapshot().settings.contentRevision,1);
 assert.equal(g.snapshot().settings.dailyFree,3);assert.ok(g.snapshot().settings.contentPrevious);
});

test('Invalid edits and unsafe or oversized logo values fail atomically',async()=>{
 const g=game(),before=g.snapshot();
 const mutations=[c=>c.brand.name=' ',c=>c.brand.name='x'.repeat(61),c=>c.text.spinButton='x'.repeat(21),c=>c.text.winMessage='{unsupported}',c=>c.brand.logo='https://example.com/logo.svg',c=>c.brand.logo='data:image/svg+xml;base64,PHN2Zz4=',c=>c.brand.logo='data:image/png;base64,PHNjcmlwdD4=',c=>c.brand.logo='data:image/png;base64,iVBORw0KGgo'+'A'.repeat(LOGO_MAX_BYTES*2),c=>delete c.themes.halloween];
 for(const mutate of mutations){const c=defaultContent();mutate(c);await assert.rejects(g.saveContent(c,0));assert.deepEqual(g.snapshot(),before);}
});

test('Draft edits and per-field/group resets are scoped and do not change the saved settings',()=>{
 const settings=createSeed(now).settings,before=structuredClone(settings),editor=new ContentEditor(settings);
 editor.setField('name','Tên mới');editor.section='theme';editor.themeId='halloween';editor.setField('headline','Halloween mới');
 editor.themeId='christmas';editor.setField('headline','Noel mới');editor.resetField('headline');
 assert.equal(editor.draft.themes.halloween.headline,'Halloween mới');
 editor.themeId='halloween';editor.resetSection();assert.equal(editor.draft.brand.name,'Tên mới');assert.equal(editor.draft.themes.halloween.headline,'HALLOWEEN');
 assert.deepEqual(settings,before);editor.resetAll();assert.equal(editor.dirty,false);
});

test('Brand tokens resolve once and editable text is escaped in rendered identity and previews',()=>{
 const c=defaultContent();c.brand.name='<img src=x onerror=alert(1)> COFFEE';
 assert.match(brandMarkup(c),/&lt;img/);assert.doesNotMatch(brandMarkup(c),/<img src=x/);
 const formatted=formatContent('{brand} · {customer}',contentVariables(c,{customer:'{brand}'}));
 assert.ok(formatted.endsWith(' · {brand}'));
 const editor=new ContentEditor(createSeed(now).settings);editor.draft=c;editor.draft.themes.anni.mobileLead='<script>alert(1)</script>';
 const html=editor.preview(createSeed(now).prizes,createSeed(now).settings);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});

test('No-op saves preserve the previous version; failed storage writes retain the live version',async()=>{
 let fail=false;const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>{if(fail)throw new Error('quota');memory.set(k,v);}};
 const repo=new LocalRepository('full',storage),g=new GameService(repo,{clock:()=>now});
 const c=defaultContent();c.brand.name='Tên mới';await g.saveContent(c,0);const before=g.snapshot();
 await g.saveContent(c,1);assert.deepEqual(g.snapshot(),before);
 fail=true;c.brand.name='Không thể lưu';await assert.rejects(g.saveContent(c,1),/không lưu được/);assert.deepEqual(g.snapshot(),before);
});


test('Logo-only identity saves, reloads and restores without bringing back the default name',async()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const g=new GameService(new LocalRepository('logo-only',storage),{clock:()=>now});
 const c=defaultContent();c.brand.logo=png;c.brand.name='   ';
 await g.saveContent(c,0);
 const reloaded=new GameService(new LocalRepository('logo-only',storage),{clock:()=>now});
 const saved=getContent(reloaded.snapshot().settings);
 assert.equal(saved.brand.name,'');assert.equal(saved.brand.logo,png);
 assert.doesNotMatch(brandMarkup(saved),/brand-words|brand-mark|ANNI/);
 assert.match(brandMarkup(saved),/is-solo/);assert.match(brandMarkup(saved),/alt="Logo thương hiệu"/);
 await reloaded.saveContent(defaultContent(),1);
 await reloaded.saveContent(reloaded.snapshot().settings.contentPrevious.content,2);
 assert.equal(getContent(reloaded.snapshot().settings).brand.name,'');
 assert.equal(getContent(reloaded.snapshot().settings).brand.logo,png);
});

test('Removing the only identity is rejected until a name is entered; legacy fallback stays readable',async()=>{
 const g=game(),c=defaultContent();c.brand.logo=png;c.brand.name='';await g.saveContent(c,0);
 const before=g.snapshot();c.brand.logo='';
 await assert.rejects(g.saveContent(c,1),/Nhập tên thương hiệu hoặc tải logo/);
 assert.deepEqual(g.snapshot(),before);
 c.brand.shortName='ANNI';await assert.rejects(g.saveContent(c,1),/Nhập tên thương hiệu hoặc tải logo/);
 c.brand.name='ANNI COFFEE';await g.saveContent(c,1);
 assert.equal(getContent(g.snapshot().settings).brand.logo,'');
 assert.equal(getContent({content:{brand:{name:'',logo:'broken'}}}).brand.name,'ANNI COFFEE');
 assert.equal(getContent({}).brand.name,'ANNI COFFEE');
});

test('Logo-only content uses neutral greetings or the explicit short name, with safe accessible markup',()=>{
 const c=defaultContent();c.brand.name='';c.brand.logo=png;
 assert.equal(contentVariables(c).brand,'quán');assert.equal(contentTheme('halloween',c).emphasis,'tại quán');
 assert.equal(contentMessage(c,'loginTitle'),'Chào bạn, mời bạn ghé chơi.');
 c.text.loginTitle='Xin chào bạn!';assert.equal(contentMessage(c,'loginTitle'),'Xin chào bạn!');
 c.brand.shortName='ANNI';assert.equal(contentVariables(c).shortBrand,'ANNI');assert.equal(contentVariables(c).brand,'ANNI');
 assert.doesNotMatch(brandMarkup(c),/brand-words/);assert.match(brandMarkup(c),/alt="ANNI"/);
 c.brand.shortName='"<img onerror=x>';assert.doesNotMatch(brandMarkup(c),/alt=""<img/);
 const paired=defaultContent();paired.brand.logo=png;assert.match(brandMarkup(paired),/with-logo/);
 assert.throws(()=>validateContent({...c,brand:{...c.brand,logo:'javascript:alert(1)'}}),/Logo phải/);
});
