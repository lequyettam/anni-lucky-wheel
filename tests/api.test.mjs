import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiRepository,ApiGameService,ApiStaffService} from '../dist/js/api.js';
const state={version:1,customer:{id:'customer-one'},actor:null,balance:{free:1,earned:0}};
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(k,v)=>data.set(k,v),removeItem:key=>data.delete(key)};};
test('HTTP adapter sends same-origin cookie and CSRF, never a writable state snapshot',async()=>{
 const calls=[],repo=new ApiRepository('/api',async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({state,csrfToken:'test-csrf',result:true})};});
 await repo.refresh();await repo.request('spin',{source:'free',requestId:'request-123456789'});
 assert.equal(calls[1].options.credentials,'same-origin');assert.equal(calls[1].options.headers['X-CSRF-TOKEN'],'test-csrf');assert.equal(JSON.parse(calls[1].options.body).state,undefined);
 assert.throws(()=>new ApiRepository('https://external.example/api'),/cùng tên miền/);
});
test('a lost spin response reuses the persisted request across adapter reloads',async()=>{
 const ids=[],storage=memory();let failed=true;
 const repo={read:()=>state,request:async(action,data)=>{ids.push(data.requestId);if(failed){failed=false;throw new Error('network');}return {spin:{id:'same-spin'}};}};
 await assert.rejects(new ApiGameService(repo,storage).spin('ignored','free'));
 assert.deepEqual(await new ApiGameService(repo,storage).spin('ignored','free'),{spin:{id:'same-spin'}});assert.equal(ids[0],ids[1]);
 await new ApiGameService(repo,storage).spin('ignored','free');assert.notEqual(ids[1],ids[2]);
});
test('a pending request cannot silently change source or activation code',async()=>{
 const repo={read:()=>state,request:async()=>{throw new Error('network');}},game=new ApiGameService(repo,memory());
 await assert.rejects(game.spin('ignored','free'));await assert.rejects(game.spin('ignored','earned'),/yêu cầu trước/);
 await assert.rejects(game.activateCode('ignored','FIRST'));await assert.rejects(game.activateCode('ignored','SECOND'),/yêu cầu trước/);
});
test('business rejection clears request while 500 keeps it for reconciliation',async()=>{
 const ids=[],storage=memory();let status=422;const repo={read:()=>state,request:async(_,data)=>{ids.push(data.requestId);throw Object.assign(new Error('error'),{status});}};
 const game=new ApiGameService(repo,storage);await assert.rejects(game.spin('ignored','free'));status=500;await assert.rejects(game.spin('ignored','free'));await assert.rejects(game.spin('ignored','free'));
 assert.notEqual(ids[0],ids[1]);assert.equal(ids[1],ids[2]);
});
test('registration retry retains a private random enrollment key and saves recovery',async()=>{
 const storage=memory(),requests=[];let first=true;const repo={read:()=>state,request:async(_,data)=>{requests.push(data);if(first){first=false;throw new Error('network');}return {user:state.customer,recoveryCode:'ANNI-RECOVERY-TEST'};}};
 await assert.rejects(new ApiGameService(repo,storage).login('0900000001'));
 await new ApiGameService(repo,storage).login('0900000001');assert.equal(requests[0].enrollmentKey,requests[1].enrollmentKey);assert.equal(requests[1].enrollmentKey.length,64);
 assert.equal(storage.getItem('anni-pending-recovery-customer-one'),'ANNI-RECOVERY-TEST');assert.equal(storage.getItem('anni-api-enrollment'),null);
});
test('remote staff permissions are projected from server and cannot bootstrap publicly',()=>{
 const service=new ApiStaffService({read:()=>({...state,actor:{permissions:['vouchers.view']}})});
 assert.throws(()=>service.require('vouchers.redeem'));assert.throws(()=>service.bootstrap(),/máy chủ/);assert.equal(service.needsSetup(),false);
});

test('server installation resources start paused, contain no credentials or usable stock',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {validateContent}=await import('../dist/js/content.js');
 const defaults=JSON.parse(await readFile(new URL('../server/resources/game/defaults.json',import.meta.url),'utf8'));
 assert.equal(defaults.settings.active,false);assert.equal(defaults.settings.codeHint,'');
 assert.equal(defaults.prizes.reduce((sum,p)=>sum+(p.stock??0),0),0);
 assert.equal(defaults.codes,undefined);assert.equal(defaults.users,undefined);assert.equal(defaults.staff,undefined);
 validateContent(defaults.settings.content);
});
