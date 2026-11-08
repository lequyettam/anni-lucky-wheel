import test from 'node:test';
import assert from 'node:assert/strict';
import {GameService} from './support.mjs';
import {GameService as RestrictedGameService,MemoryRepository,createSeed,ProbabilityPolicy} from '../dist/js/domain.js';
import {LocalRepository} from '../dist/js/storage.js';
import {parseRewardCodes,validateRewardCodePools,prizeRevision,formatCodeMessage,MAX_REWARD_CODES} from '../dist/js/reward-codes.js';
import {rewardCodeMarkup} from '../dist/js/reward-code-ui.js';
const now=new Date('2026-11-08T05:00:00Z');
const codes=['AU79j090','SI9806','Q0O808','SA92U0','GA9H00'];
const note='Vui lòng sử dụng mã Voucher #mã tại quầy hoặc app mua hàng';
async function setup(list=codes){
  const repo=new MemoryRepository(createSeed(now)),game=new GameService(repo,{clock:()=>now,random:()=>.5});
  const prizes=game.snapshot().prizes;prizes.forEach(p=>p.weight=0);prizes[0].weight=200;
  Object.assign(prizes[1],{name:'Tặng 1 phần Cà phê',weight:9800,stock:list.length,codeMode:'imported',voucherCodes:[...list],codeMessage:note});
  await game.savePrizes(prizes,prizeRevision(game.snapshot()));
  const user=await game.login('0900000001');return {repo,game,user};
}
test('Imports comma/newline/CSV lists without changing code spelling or leading zeroes',()=>{
  assert.deepEqual(parseRewardCodes('\uFEFF"AU79j090", SI9806\r\nQ0O808; "SA92U0"\tGA9H00'),codes);
  assert.deepEqual(parseRewardCodes('000007,Ab-c_9.x'),['000007','Ab-c_9.x']);
  assert.deepEqual(parseRewardCodes(' \n,;'),[]);
});
test('Rejects duplicate, malformed and oversized pools without silently dropping codes',()=>{
  for(const input of ['AbC,abc','A B','<script>','😀','a'.repeat(65),[42]])assert.throws(()=>parseRewardCodes(input));
  assert.throws(()=>parseRewardCodes(Array.from({length:MAX_REWARD_CODES+1},(_,i)=>'C'+i)),/tối đa/);
});
test('Pool count, losing segment and cross-prize duplicates must validate atomically',async()=>{
  const {game}=await setup(),before=game.snapshot();
  for(const change of [p=>p[1].stock++,p=>Object.assign(p[2],{codeMode:'imported',voucherCodes:['au79J090'],stock:1,codeMessage:''}),p=>Object.assign(p[0],{codeMode:'imported',voucherCodes:[],stock:0,codeMessage:''}),p=>p[1].codeMessage='a'.repeat(501)]){
    const prizes=structuredClone(before.prizes);change(prizes);
    await assert.rejects(game.savePrizes(prizes,prizeRevision(before)));assert.deepEqual(game.snapshot(),before);
  }
});
test('Five codes award exactly five distinct vouchers, then redistribute exhausted probability',async()=>{
  const {game,user}=await setup(),users=[user];
  for(let i=2;i<=6;i++)users.push(await game.login('090000000'+i));
  const results=await Promise.all(users.map(u=>game.spin(u.id,'free'))),vouchers=results.filter(r=>r.voucher).map(r=>r.voucher);
  assert.equal(vouchers.length,5);assert.deepEqual(vouchers.map(v=>v.externalCode).sort(),[...codes].sort());
  assert.equal(new Set(vouchers.map(v=>v.code)).size,5);
  const state=game.snapshot();assert.equal(state.prizes[1].stock,0);assert.deepEqual(state.prizes[1].voucherCodes,[]);
  assert.equal(ProbabilityPolicy.weights(state.prizes)[0].effective,10000);assert.equal(ProbabilityPolicy.weights(state.prizes)[1].effective,0);
  assert.equal(results.filter(r=>r.spin.prize.kind==='lose').length,1);
});
test('Retries keep the assigned code and snapshots never include the unused code pool',async()=>{
  const {game,user}=await setup();
  const a=await game.spin(user.id,'free','same-request'),before=game.snapshot(),b=await game.spin(user.id,'free','same-request');
  assert.deepEqual(b.voucher,a.voucher);assert.deepEqual(game.snapshot(),before);
  assert.equal(a.voucher.externalCode,'AU79j090');assert.equal(a.voucher.externalMessage,note.replace('#mã','AU79j090'));
  assert.equal(a.voucher.prize.voucherCodes,undefined);assert.equal(a.spin.prize.voucherCodes,undefined);
  for(const code of codes.slice(1))assert.ok(!JSON.stringify(a).includes(code));
});
test('Stale drafts cannot replenish allocated codes or restore stock after a spin',async()=>{
  const {game,user}=await setup(),old=game.snapshot();await game.spin(user.id,'free');const after=game.snapshot();
  await assert.rejects(game.savePrizes(old.prizes,prizeRevision(old)),/đã thay đổi/);
  await assert.rejects(game.savePrizes(old.prizes),/đã thay đổi/);assert.deepEqual(game.snapshot(),after);
});
test('Editing text and replenishing new codes leaves issued voucher instructions unchanged',async()=>{
  const {game,user}=await setup();const {voucher}=await game.spin(user.id,'free');
  const state=game.snapshot();state.prizes[1].voucherCodes.push('NEW-Abc');state.prizes[1].stock++;state.prizes[1].codeMessage='Đổi tại quầy: {code}';
  await game.savePrizes(state.prizes,prizeRevision(state));
  assert.deepEqual(game.snapshot().vouchers[0],voucher);assert.equal(game.snapshot().prizes[1].stock,5);
  assert.equal(formatCodeMessage('Mã #mã / {code}','AbC'),'Mã AbC / AbC');assert.equal(formatCodeMessage('','AbC'),'');
});
test('Issued, redeemed and expired codes cannot be reimported even after removing their prize',async()=>{
  for(const action of ['issued','used','expired']){
    const {game,user}=await setup(['Used-01']);const {voucher}=await game.spin(user.id,'free');
    if(action==='used')await game.useVoucher(user.id,voucher.externalCode);
    if(action==='expired')game.clock=()=>new Date(+now+8*86400000);
    let state=game.snapshot();state.prizes=state.prizes.filter(p=>p.id!=='off10');state.prizes[0].weight=10000;
    await game.savePrizes(state.prizes,prizeRevision(state));state=game.snapshot();
    Object.assign(state.prizes[1],{codeMode:'imported',voucherCodes:['used-01'],stock:1,codeMessage:''});const before=game.snapshot();
    await assert.rejects(game.savePrizes(state.prizes,prizeRevision(state)),/đã được cấp/);assert.deepEqual(game.snapshot(),before);
  }
});
test('Imported codes and generated tracking codes redeem the same voucher exactly once',async()=>{
  const {game,user}=await setup();const {voucher}=await game.spin(user.id,'free');
  const outcomes=await Promise.allSettled([game.useVoucher(user.id,' au79J090 '),game.redeem(voucher.code)]);
  assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(game.snapshot().redemptions.length,1);
  await assert.rejects(game.redeem(voucher.externalCode),/đã được sử dụng/);
  assert.equal(game.snapshot().prizes[1].stock,4);
});
test('Wrong customer and staff without edit/redeem rights cannot use imported codes',async()=>{
  const {game,user,repo}=await setup(),{voucher}=await game.spin(user.id,'free'),other=await game.login('0900000002'),before=game.snapshot();
  await assert.rejects(game.useVoucher(other.id,voucher.externalCode),/ví của mình/);
  const restricted=new RestrictedGameService(repo,{clock:()=>now});
  await assert.rejects(restricted.redeem(voucher.externalCode),/Phiên nhân viên/);
  await assert.rejects(restricted.savePrizes(before.prizes,prizeRevision(before)),/Phiên nhân viên/);assert.deepEqual(game.snapshot(),before);
});
test('Imported codes cannot collide with an existing internal tracking code',async()=>{
  const {game,user}=await setup(),{voucher}=await game.spin(user.id,'free');const state=game.snapshot();
  state.prizes[1].voucherCodes.push(voucher.code.toLowerCase());state.prizes[1].stock++;
  await assert.rejects(game.savePrizes(state.prizes,prizeRevision(state)),/trùng mã/);
});
test('Allocation failure rolls back credits, inventory and award records',async()=>{
  const {game,user,repo}=await setup();await game.activateCode(user.id,'ANNI2026');
  await repo.transaction(s=>{s.prizes[1].stock=99;});const before=game.snapshot();
  await assert.rejects(game.spin(user.id,'earned'),/Số quà/);assert.deepEqual(game.snapshot(),before);
});
test('Allocation and one-time redemption survive browser repository reload',async()=>{
  const {game,user}=await setup(),memory=new Map([['codes',JSON.stringify(game.snapshot())]]),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  const first=new GameService(new LocalRepository('codes',storage),{clock:()=>now,random:()=>.5});const {voucher}=await first.spin(user.id,'free');
  const second=new GameService(new LocalRepository('codes',storage),{clock:()=>now});await second.redeem(voucher.externalCode);
  assert.equal(second.snapshot().prizes[1].voucherCodes.length,4);await assert.rejects(first.useVoucher(user.id,voucher.code),/đã được sử dụng/);
});
test('Optional instructions and markup remain safe plain text',()=>{
  assert.equal(rewardCodeMarkup({code:'AC-OLD'}),'');
  const html=rewardCodeMarkup({externalCode:'A123',externalMessage:'<img src=x onerror=alert(1)>'});
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));
  assert.ok(!rewardCodeMarkup({externalCode:'A123',externalMessage:''}).includes('<p>'));
  assert.doesNotThrow(()=>validateRewardCodePools(createSeed(now).prizes));
});
