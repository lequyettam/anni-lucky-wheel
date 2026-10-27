import test from 'node:test';
import assert from 'node:assert/strict';
import {GameService,MemoryRepository,createSeed} from '../dist/js/domain.js';
import {StaffService} from '../dist/js/staff.js';
import {ACCESS_MODULES,can,sessionActor,staffHome,routePermission,ALL_PERMISSIONS,editPermission,presetPermissions} from '../dist/js/access-policy.js';
import {defaultContent} from '../dist/js/content.js';
import {staffGate,staffEditForm,staffManager} from '../dist/js/staff-ui.js';

const now=new Date('2026-10-27T07:00:00Z'),pass='Test-only-123!';
async function fixture(){
  const repo=new MemoryRepository(createSeed(now));let session=null,time=now;
  const clock=()=>time,staff=new StaffService(repo,{clock,session:()=>session});
  const game=new GameService(repo,{clock,staffSession:()=>session,random:()=>.5});
  session=await staff.bootstrap({name:'Quản trị thử',username:'owner',password:pass});
  const adminToken=session,admin=staff.current();
  const viewer=await staff.save({name:'Nhân viên xem',username:'viewer',password:pass});
  const cashier=await staff.save({name:'Thu ngân thử',username:'cashier',password:pass,role:'cashier'});
  return {repo,staff,game,admin,viewer,cashier,adminToken,setSession:v=>session=v,setTime:v=>time=v,login:async u=>session=await staff.login(u,pass)};
}
test('First setup preserves legacy game data and concurrent attempts create exactly one owner',async()=>{
  const repo=new MemoryRepository(createSeed(now)),service=new StaffService(repo,{clock:()=>now}),before=repo.read();
  const input={name:'Quản trị',username:'owner',password:pass};
  const results=await Promise.allSettled([service.bootstrap(input),service.bootstrap(input)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(repo.read().staff.length,1);
  for(const key of Object.keys(before))assert.deepEqual(repo.read()[key],before[key]);
  assert.equal(service.needsSetup(),false);assert.equal(JSON.stringify(repo.read()).includes(pass),false);
});
test('Default accounts have exactly the promised scopes and unknown routes or permissions deny',async()=>{
  const f=await fixture();await f.login('viewer');
  for(const permission of ALL_PERMISSIONS)assert.equal(can(f.staff.current(),permission),permission==='vouchers.view');
  assert.equal(staffHome(f.staff.current()),'admin/vouchers');
  assert.equal(can(f.staff.current(),routePermission('admin/content')),false);
  assert.equal(can(f.staff.current(),routePermission('admin/unknown')),false);
  await f.login('cashier');
  for(const permission of ALL_PERMISSIONS)assert.equal(can(f.staff.current(),permission),['vouchers.view','vouchers.redeem'].includes(permission));
  assert.equal(can({role:'__proto__',active:true},'vouchers.view'),false);
  f.setSession(f.adminToken);assert.equal(can(f.staff.current(),'staff.manage'),true);
});
test('Anonymous, viewer and cashier writes cannot change campaign, branding, codes or prize stock',async()=>{
  const f=await fixture(),source=f.game.snapshot();
  for(const user of [null,'viewer','cashier']){
    if(user)await f.login(user);else f.setSession(null);
    const before=f.repo.read();
    for(const operation of [()=>f.game.savePrizes(source.prizes),()=>f.game.saveSettings(source.settings),()=>f.game.saveCode(source.codes[0]),()=>f.game.saveAppearance({theme:'halloween',decorations:true}),()=>f.game.saveContent(defaultContent(),0),()=>f.staff.resetDemo(),()=>f.staff.save({name:'Escalate',username:'badadmin',role:'admin',password:pass})])await assert.rejects(operation(),/quyền|Phiên/);
    assert.deepEqual(f.repo.read(),before);
    assert.throws(()=>f.staff.list(),/quyền|Phiên/);
  }
});
test('Voucher use derives staff identity from session, ignores a forged name and commits only once',async()=>{
  const f=await fixture(),user=await f.game.login('0900000001'),{voucher}=await f.game.spin(user.id,'free');
  await f.login('viewer');const before=f.repo.read();await assert.rejects(f.game.redeem(voucher.code),/quyền/);assert.deepEqual(f.repo.read(),before);
  await f.login('cashier');
  const results=await Promise.allSettled([f.game.redeem(voucher.code,'Giả mạo'),f.game.redeem(voucher.code)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const record=f.repo.read().redemptions[0];assert.equal(record.actorId,f.cashier.id);assert.equal(record.actorName,'Thu ngân thử');
  assert.equal(f.repo.read().vouchers[0].redeemedById,f.cashier.id);
  await assert.rejects(f.game.useVoucher(user.id,voucher.code),/đã được sử dụng/);
});
test('Custom module edits include view while account administration remains admin-only',async()=>{
  const f=await fixture();
  await f.staff.save({...f.viewer,permissions:['vouchers.view','themes.edit'],revision:f.viewer.sessionVersion});
  await f.login('viewer');assert.equal(can(f.staff.current(),'themes.view'),true);
  await f.game.saveAppearance({theme:'christmas',decorations:false});
  await assert.rejects(f.game.saveSettings(f.game.snapshot().settings),/quyền/);
  f.setSession(f.adminToken);const entry=f.staff.list().find(s=>s.id===f.viewer.id);
  await assert.rejects(f.staff.save({...entry,permissions:['vouchers.view','staff.manage'],revision:entry.sessionVersion}),/không hợp lệ/);
  await assert.rejects(f.staff.save({...entry,permissions:[],revision:entry.sessionVersion}),/ít nhất/);
});
test('Lock, password reset and role change revoke all affected sessions',async()=>{
  for(const patch of [{active:false},{password:'New-demo-password!'},{role:'viewer',permissions:['vouchers.view']}]){
    const f=await fixture(),token=await f.staff.login('cashier',pass),user=await f.game.login('0900000001'),{voucher}=await f.game.spin(user.id,'free');
    const other=new GameService(f.repo,{clock:()=>now,staffSession:()=>token});
    const update=f.staff.save({...f.cashier,...patch,revision:f.cashier.sessionVersion});await update;
    await assert.rejects(other.redeem(voucher.code),/Phiên/);assert.equal(f.repo.read().vouchers[0].redeemedAt,null);
    assert.equal(sessionActor(f.repo.read(),token,now),null);
  }
});
test('A queued voucher confirmation rechecks permissions after an earlier role revocation commits',async()=>{
  const f=await fixture(),token=await f.staff.login('cashier',pass);
  const user=await f.game.login('0900000001'),{voucher}=await f.game.spin(user.id,'free');
  const cashierGame=new GameService(f.repo,{clock:()=>now,staffSession:()=>token});
  const change=f.staff.save({...f.cashier,role:'viewer',permissions:['vouchers.view'],revision:f.cashier.sessionVersion});
  const confirmation=cashierGame.redeem(voucher.code);
  const results=await Promise.allSettled([change,confirmation]);
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
  assert.match(results[1].reason.message,/Phiên/);assert.equal(f.repo.read().redemptions.length,0);
});
test('Session expiry and logout are checked on each operation',async()=>{
  const f=await fixture();await f.login('cashier');const token=f.staff.session();
  f.setTime(new Date(+now+8*3600000));assert.equal(f.staff.current(),null);await assert.rejects(f.game.redeem('AC-ANY'),/Phiên/);
  f.setTime(now);assert.ok(f.staff.current());await f.staff.logout();assert.equal(sessionActor(f.repo.read(),token,now),null);
});
test('The final active admin cannot be locked or demoted; stale edits cannot overwrite changes',async()=>{
  const f=await fixture();
  for(const patch of [{active:false},{role:'viewer',permissions:['vouchers.view']}])await assert.rejects(f.staff.save({...f.admin,...patch,revision:f.admin.sessionVersion}),/ít nhất một quản trị/);
  await f.staff.save({...f.viewer,name:'Tên mới',revision:f.viewer.sessionVersion});
  await assert.rejects(f.staff.save({...f.viewer,name:'Tên cũ',revision:f.viewer.sessionVersion}),/đã được cập nhật/);
  await assert.rejects(f.staff.save({name:'Trùng tên',username:'VIEWER',password:pass}),/đã được sử dụng/);
});
test('Password change verifies current password, revokes sessions and does not leak secrets into audit',async()=>{
  const f=await fixture();await f.login('cashier');
  await assert.rejects(f.staff.changePassword('wrong','New-pass-123!'),/không đúng/);
  await f.staff.changePassword(pass,'New-pass-123!');assert.equal(f.staff.current(),null);
  await assert.rejects(f.staff.login('cashier',pass),/không đúng/);
  const token=await f.staff.login('cashier','New-pass-123!');assert.ok(token);
  f.setSession(f.adminToken);const list=f.staff.list();
  assert.equal('passwordHash' in list[0],false);assert.equal('passwordSalt' in list[0],false);
  for(const value of [pass,'New-pass-123!'])assert.equal(JSON.stringify(f.repo.read()).includes(value),false);
});
test('Repeated invalid logins throttle locally and an admin password reset clears the throttle',async()=>{
  const f=await fixture();for(let i=0;i<5;i++)await assert.rejects(f.staff.login('viewer','wrong'),/không đúng/);
  await assert.rejects(f.staff.login('viewer',pass),/5 phút/);
  await f.staff.save({...f.viewer,password:pass,revision:f.viewer.sessionVersion});await f.login('viewer');assert.ok(f.staff.current());
});
test('Reset game data keeps staff identities, permissions and audit; saved staff persists after reload',async()=>{
  const f=await fixture();await f.game.login('0900000001');await f.staff.resetDemo();
  assert.equal(f.repo.read().users.length,0);assert.equal(f.staff.list().length,3);assert.equal(f.repo.read().staffAudit.at(-1).action,'reset');
  const reloaded=new StaffService(new MemoryRepository(f.repo.read()),{clock:()=>now,session:()=>f.adminToken});assert.equal(reloaded.current().id,f.admin.id);
});
test('Staff rendering escapes user text and presets expose only supported levels',async()=>{
  const f=await fixture(),staff={...f.viewer,name:'<img src=x onerror=alert(1)>'};
  for(const html of [staffEditForm(staff),staffManager([staff],f.repo.read())])assert.equal(html.includes('<img src=x'),false);
  assert.match(staffGate(true),/Tạo quản trị viên/);assert.match(staffGate(false),/Đăng nhập nhân viên/);
  for(const m of ACCESS_MODULES)assert.equal(presetPermissions('admin').includes(editPermission(m.id)),!!m.edit);
});
