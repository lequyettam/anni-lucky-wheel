import {GameService} from './support.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import { MemoryRepository, ProbabilityPolicy, createSeed, validatePrizes, normalizePhone, basisPoints, sha256, vnDay} from '../dist/js/domain.js';
import {LocalRepository} from '../dist/js/storage.js';
const now = new Date('2026-10-26T05:00:00Z');
async function setup(random=()=>.5,edit=()=>{}){const seed=createSeed(now);edit(seed);const repo=new MemoryRepository(seed);const game=new GameService(repo,{clock:()=>now,random});const user=await game.login('0900000001');return {repo,game,user};}

test('Vietnamese phone normalization shares one identity and rejects malformed input',()=>{
  assert.equal(normalizePhone('+84 900 000 001'),'0900000001');assert.equal(normalizePhone('84900000001'),'0900000001');assert.throws(()=>normalizePhone('090123'));assert.throws(()=>normalizePhone('0212345678'));
});
test('Percentage precision and exact total are enforced',()=>{assert.equal(basisPoints('1.13'),113);assert.throws(()=>basisPoints('1.001'));for(const weight of [3999,4001]){const p=createSeed(now).prizes;p[0].weight=weight;assert.throws(()=>validatePrizes(p),/100%/);}validatePrizes(createSeed(now).prizes);});
test('Exhaustion adds equal percentage points to >1% ORIGINAL weights, including no-win',()=>{
 const p=createSeed(now).prizes;p[4].stock=0;const w=ProbabilityPolicy.weights(p);assert.equal(w[4].effective,0);assert.equal(w[5].effective,100);assert.equal(w[0].effective,4225);assert.equal(w[1].effective,2725);assert.equal(w.reduce((s,p)=>s+p.effective,0),10000);
});
test('Redistribution recomputes from originals after multiple sellouts',()=>{const p=createSeed(now).prizes;p[4].stock=0;p[1].stock=0;const w=ProbabilityPolicy.weights(p);assert.equal(w[0].effective,4000+3400/3);assert.equal(w[5].effective,100);assert.ok(Math.abs(w.reduce((s,p)=>s+p.effective,0)-10000)<1e-7);});
test('Zero-weight gifts stay disabled even when redistribution occurs',()=>{const p=createSeed(now).prizes;p[2].weight=0;p[0].weight+=1500;p[1].stock=0;assert.equal(ProbabilityPolicy.weights(p)[2].effective,0);});
test('No eligible redistribution target pauses without inflating a rare reward',()=>{const p=createSeed(now).prizes;p.forEach(x=>{x.weight=0;x.stock=0;});p[0].weight=100;p[1].weight=9900;assert.throws(()=>ProbabilityPolicy.weights(p),/lớn hơn 1%/);});
test('Uniform mode gives equal chance only to enabled available outcomes',()=>{const p=createSeed(now).prizes;p[1].stock=0;p[2].weight=0;const w=ProbabilityPolicy.weights(p,'uniform');assert.equal(w[1].effective,0);assert.equal(w[2].effective,0);assert.equal(w[5].effective,2500);});
test('Random boundaries choose the correct interval and never a zero-weight outcome',()=>{const p=createSeed(now).prizes;assert.equal(ProbabilityPolicy.pick(p,'weighted',()=>0).id,'luck');assert.equal(ProbabilityPolicy.pick(p,'weighted',()=>.4).id,'off10');assert.equal(ProbabilityPolicy.pick(p,'weighted',()=>.999999).id,'grand');assert.throws(()=>ProbabilityPolicy.pick(p,'weighted',()=>1));});
test('Free daily limit rejects second request; retry idempotency preserves one award',async()=>{const {game,user}=await setup();const a=await game.spin(user.id,'free','same');const b=await game.spin(user.id,'free','same');assert.equal(a.spin.id,b.spin.id);assert.equal(game.snapshot().vouchers.length,1);assert.equal(game.snapshot().prizes[1].stock,99);await assert.rejects(game.spin(user.id,'free','different'),/hết lượt/);});
test('Daily counter resets at Vietnam midnight, independently of host timezone',async()=>{const {game,user}=await setup();await game.spin(user.id,'free');game.clock=()=>new Date('2026-10-26T17:00:00Z');assert.equal(game.balance(user.id).free,1);assert.notEqual(vnDay('2026-10-26T16:59:59Z'),vnDay('2026-10-26T17:00:00Z'));});
test('Code activation separates global limit, per-phone limit and granted turns',async()=>{const {game,user}=await setup();const c=await game.activateCode(user.id,'anni2026');assert.equal(c.remaining,2);await assert.rejects(game.activateCode(user.id,'ANNI2026'),/hết số lần/);assert.equal(game.balance(user.id).earned,2);await game.spin(user.id,'earned');assert.equal(game.balance(user.id).earned,1);});
test('Concurrent activation cannot exceed global code quota',async()=>{const {game,user}=await setup(()=>.5,s=>s.codes[0].maxUses=1);const u2=await game.login('0900000002');const results=await Promise.allSettled([game.activateCode(user.id,'ANNI2026'),game.activateCode(u2.id,'ANNI2026')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(game.snapshot().credits.length,1);});
test('Per-day code quota resets in Vietnam time',async()=>{const {game,user}=await setup(()=>.5,s=>s.codes[0].period='day');await game.activateCode(user.id,'ANNI2026');game.clock=()=>new Date('2026-10-26T17:00:00Z');await game.activateCode(user.id,'ANNI2026');assert.equal(game.snapshot().codes[0].uses.length,2);});
test('Expired and disabled codes do not grant credits',async()=>{for(const change of [c=>c.ends='2026-10-25T00:00:00Z',c=>c.active=false]){const {game,user}=await setup(()=>.5,s=>change(s.codes[0]));await assert.rejects(game.activateCode(user.id,'ANNI2026'));assert.equal(game.snapshot().credits.length,0);}});
test('Expired earned turns cannot be consumed even if code still valid',async()=>{const {game,user}=await setup();await game.activateCode(user.id,'ANNI2026');game.clock=()=>new Date(+now+8*86400000);assert.equal(game.balance(user.id).earned,0);await assert.rejects(game.spin(user.id,'earned'));});
test('Last reward is awarded once with simultaneous spins; inventory never goes negative',async()=>{const {game,user}=await setup(()=>.5,s=>{s.prizes.forEach(p=>p.weight=0);s.prizes[0].weight=200;s.prizes[1].weight=9800;s.prizes[1].stock=1;});const u2=await game.login('0900000002');const results=await Promise.all([game.spin(user.id,'free'),game.spin(u2.id,'free')]);assert.equal(results.filter(r=>r.voucher).length,1);assert.equal(game.snapshot().prizes[1].stock,0);});
test('Invalid distribution does not consume a turn or write an award',async()=>{const {game,user}=await setup(()=>.5,s=>{s.prizes.forEach(p=>{p.weight=0;p.stock=0;});s.prizes[0].weight=100;s.prizes[1].weight=9900;});await assert.rejects(game.spin(user.id,'free'));assert.equal(game.balance(user.id).free,1);assert.equal(game.snapshot().spins.length,0);});
test('Recovery is required after first award, verified, and never stored in plaintext',async()=>{const {game,user}=await setup();const r=await game.spin(user.id,'free');assert.ok(r.recoveryCode);assert.ok(!JSON.stringify(game.snapshot()).includes(r.recoveryCode));await assert.rejects(game.login(user.phone));await assert.rejects(game.login(user.phone,'wrong'));assert.equal((await game.login(user.phone,r.recoveryCode)).id,user.id);});
test('Changing prizes preserves terms of existing vouchers',async()=>{const {game,user}=await setup();const r=await game.spin(user.id,'free');const p=game.snapshot().prizes;p[1].name='Đã đổi nội dung';p[1].terms='Điều kiện mới';await game.savePrizes(p);assert.equal(game.snapshot().vouchers[0].prize.terms,r.voucher.prize.terms);});
test('Concurrent redemption succeeds once and records the employee',async()=>{const {game,user}=await setup();const r=await game.spin(user.id,'free');const outcomes=await Promise.allSettled([game.redeem(r.voucher.code),game.redeem(r.voucher.code)]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(game.snapshot().redemptions.length,1);});
test('Expired voucher cannot be redeemed',async()=>{const {game,user}=await setup();const r=await game.spin(user.id,'free');game.clock=()=>new Date(+now+8*86400000);await assert.rejects(game.redeem(r.voucher.code),/hết hạn/);});
test('Paused campaign rejects spins without consuming turns',async()=>{const {game,user}=await setup(()=>.5,s=>s.settings.active=false);await assert.rejects(game.spin(user.id,'free'),/chưa mở/);assert.equal(game.balance(user.id).free,1);});
test('Hash fallback matches standard SHA-256 for empty, Unicode, and multiblock messages',()=>{for(const value of ['', 'abc', 'Mã khôi phục ANNI COFFEE', 'a'.repeat(1000)])assert.equal(sha256(new TextEncoder().encode(value)),createHash('sha256').update(value).digest('hex'));});

test('Customer uses own voucher once with an audit receipt and no additional stock deduction',async()=>{
  const {game,user}=await setup();
  await game.saveName(user.id,'Khách thử nghiệm');
  const {voucher}=await game.spin(user.id,'free');
  const stock=game.snapshot().prizes[1].stock;
  const used=await game.useVoucher(user.id,' '+voucher.code.toLowerCase()+' ');
  assert.equal(used.redeemedAt,now.toISOString());
  assert.equal(used.redeemedByType,'customer');
  assert.equal(used.redeemedById,user.id);
  assert.equal(used.redeemedBy,'Khách thử nghiệm');
  assert.deepEqual(game.snapshot().redemptions,[{voucherId:voucher.id,at:now.toISOString(),actorType:'customer',actorId:user.id,actorName:'Khách thử nghiệm',employee:null,branch:voucher.branch}]);
  const after=game.snapshot();
  game.clock=()=>new Date(+now+60000);
  await assert.rejects(game.useVoucher(user.id,voucher.code),/đã được sử dụng/);
  await assert.rejects(game.redeem(voucher.code),/đã được sử dụng/);
  assert.deepEqual(game.snapshot(),after);
  assert.equal(game.snapshot().prizes[1].stock,stock);
});

test('Customer cannot use another wallet or use a voucher without a valid user',async()=>{
  const {game,user}=await setup();
  const {voucher}=await game.spin(user.id,'free');
  const other=await game.login('0900000002'),before=game.snapshot();
  await assert.rejects(game.useVoucher(other.id,voucher.code),/ví của mình/);
  for(const missing of [null,undefined,'unknown'])await assert.rejects(game.useVoucher(missing,voucher.code),/đăng nhập/);
  await assert.rejects(game.useVoucher(user.id,'AC-NOTFOUND'),/Không tìm thấy/);
  assert.deepEqual(game.snapshot(),before);
});

test('Both redemption paths reject vouchers exactly at expiry without a write',async()=>{
  const {game,user}=await setup();
  const {voucher}=await game.spin(user.id,'free');
  game.clock=()=>new Date(voucher.expiresAt);
  const before=game.snapshot();
  await assert.rejects(game.useVoucher(user.id,voucher.code),/hết hạn/);
  await assert.rejects(game.redeem(voucher.code),/hết hạn/);
  assert.deepEqual(game.snapshot(),before);
});

test('Staff redemption blocks later customer use and preserves the employee receipt',async()=>{
  const {game,user}=await setup();
  const {voucher}=await game.spin(user.id,'free');
  const used=await game.redeem(voucher.code);
  assert.equal(used.redeemedByType,'staff');
  assert.equal(used.redeemedBy,'Thu ngân A');
  assert.equal(game.snapshot().redemptions[0].employee,'Thu ngân A');
  const before=game.snapshot();
  await assert.rejects(game.useVoucher(user.id,voucher.code),/đã được sử dụng/);
  assert.deepEqual(game.snapshot(),before);
});

test('Racing customer and staff confirmations produce exactly one receipt in either order',async()=>{
  for(const first of ['customer','staff']){
    const {game,user}=await setup();
    const {voucher}=await game.spin(user.id,'free');
    const customer=()=>game.useVoucher(user.id,voucher.code),staff=()=>game.redeem(voucher.code);
    const calls=first==='customer'?[customer,staff,customer]:[staff,customer,staff];
    const results=await Promise.allSettled(calls.map(fn=>fn()));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(game.snapshot().redemptions.length,1);
    assert.equal(game.snapshot().vouchers[0].redeemedByType,first);
    assert.equal(game.snapshot().redemptions[0].actorType,first);
    assert.equal(game.snapshot().prizes[1].stock,99);
  }
});

test('Used state survives repository reload and blocks both entry points',async()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const repo=new LocalRepository('voucher-test',storage);repo.write(createSeed(now));
  const game=new GameService(repo,{clock:()=>now,random:()=>.5});
  const user=await game.login('0900000001'),{voucher}=await game.spin(user.id,'free');
  await game.useVoucher(user.id,voucher.code);
  const reloaded=new GameService(new LocalRepository('voucher-test',storage),{clock:()=>now});
  assert.equal(reloaded.snapshot().vouchers[0].redeemedByType,'customer');
  await assert.rejects(reloaded.useVoucher(user.id,voucher.code),/đã được sử dụng/);
  await assert.rejects(reloaded.redeem(voucher.code),/đã được sử dụng/);
  assert.equal(reloaded.snapshot().redemptions.length,1);
});

test('Previously used vouchers from version 0.1 stay used without new audit fields',async()=>{
  const {repo,game,user}=await setup();
  const {voucher}=await game.spin(user.id,'free');
  await repo.transaction(state=>{const v=state.vouchers[0];v.redeemedAt=now.toISOString();v.redeemedBy='Thu ngân cũ';state.redemptions.push({voucherId:v.id,at:v.redeemedAt,employee:v.redeemedBy,branch:v.branch});});
  const before=game.snapshot();
  await assert.rejects(game.useVoucher(user.id,voucher.code),/đã được sử dụng/);
  await assert.rejects(game.redeem(voucher.code),/đã được sử dụng/);
  assert.deepEqual(game.snapshot(),before);
});
