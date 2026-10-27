import {clone,token,digest,createSeed} from './domain.js';
import {ACCESS_MODULES,STAFF_ROLES,ALL_PERMISSIONS,presetPermissions,editPermission,sessionActor,requirePermission} from './access-policy.js';

const SESSION_MS=8*60*60*1000;
const publicStaff = ({passwordHash,passwordSalt,...staff}) => clone(staff);
const username = value => {
  const name=String(value||'').trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(name))throw new Error('Tên đăng nhập gồm 3–32 chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.');
  return name;
};
const password = value => {
  if(typeof value!=='string'||value.length<8||value.length>128||!value.trim())throw new Error('Mật khẩu cần từ 8 đến 128 ký tự.');
  return value;
};
// Salted digest only simulates credentials in a local demo. Not production password storage.
const credentials = async value => {const passwordSalt=token('',24);return {passwordSalt,passwordHash:await digest(passwordSalt+':'+password(value))};};
function normalized(data) {
  const name=String(data.name||'').trim(),role=data.role||'viewer';
  if(name.length<2||name.length>80)throw new Error('Tên nhân viên cần từ 2 đến 80 ký tự.');
  if(!Object.hasOwn(STAFF_ROLES,role))throw new Error('Nhóm quyền không hợp lệ.');
  const permissions=role==='admin'?presetPermissions(role):data.permissions??presetPermissions(role);
  if(!Array.isArray(permissions)||permissions.some(p=>!ALL_PERMISSIONS.includes(p)||(role!=='admin'&&['staff.manage','data.reset'].includes(p))))throw new Error('Danh sách quyền không hợp lệ.');
  const selected=new Set(permissions);
  for(const m of ACCESS_MODULES)if(selected.has(editPermission(m.id)))selected.add(m.id+'.view');
  if(!ACCESS_MODULES.some(m=>selected.has(m.id+'.view')))throw new Error('Cần cấp ít nhất một quyền xem.');
  return {name,username:username(data.username),role,permissions:[...selected],active:data.active!==false};
}
/** Local demonstration of staff accounts; never a server-side security boundary. */
export class StaffService {
  constructor(repository,{clock=()=>new Date(),session=()=>null}={}){this.repository=repository;this.clock=clock;this.session=session;}
  current(){const staff=sessionActor(this.repository.read(),this.session(),this.clock());return staff?publicStaff(staff):null;}
  needsSetup(){return !(this.repository.read().staff?.length);}
  require(permission,state=this.repository.read()){return requirePermission(state,this.session(),permission,this.clock());}
  #audit(state,actor,action,target,detail=''){
    (state.staffAudit??=[]).push({id:token('A'),at:this.clock().toISOString(),actorId:actor.id,actorName:actor.name,action,targetId:target.id,targetName:target.name,detail});
  }
  #session(state,staff){
    const now=this.clock(),value={token:token('SS-',32),staffId:staff.id,version:staff.sessionVersion,expiresAt:new Date(+now+SESSION_MS).toISOString()};
    state.staffSessions=(state.staffSessions||[]).filter(s=>+new Date(s.expiresAt)>+now);
    state.staffSessions.push(value);return value.token;
  }
  async bootstrap(data){
    const entry=normalized({...data,role:'admin',active:true}),secret=await credentials(data.password);
    return this.repository.transaction(state=>{
      if(state.staff?.length)throw new Error('Đã có quản trị viên. Vui lòng đăng nhập.');
      const staff={...entry,...secret,id:token('E'),sessionVersion:1,createdAt:this.clock().toISOString(),lastLoginAt:this.clock().toISOString()};
      state.staff=[staff];state.staffSessions=[];state.staffAudit=[];state.staffAttempts={};
      this.#audit(state,staff,'setup',staff);return this.#session(state,staff);
    });
  }
  async login(input,value){
    const login=username(input);
    if(typeof value!=='string'||value.length>128)throw new Error('Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');
    const result=await this.repository.transaction(async state=>{
      const now=this.clock();state.staffAttempts??={};
      const attempt=Object.hasOwn(state.staffAttempts,login)?state.staffAttempts[login]:{count:0,until:0};
      if(attempt.until>+now)return {error:'Đã nhập sai nhiều lần. Vui lòng thử lại sau 5 phút.'};
      const staff=state.staff?.find(s=>s.username===login);
      const hash=await digest((staff?.passwordSalt||'demo-invalid')+':'+value);
      if(!staff?.active||hash!==staff.passwordHash){
        const count=attempt.until?1:attempt.count+1;
        state.staffAttempts[login]={count,until:count>=5?+now+5*60*1000:0};
        return {error:'Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.'};
      }
      delete state.staffAttempts[login];staff.lastLoginAt=now.toISOString();
      return {token:this.#session(state,staff)};
    });
    if(result.error)throw new Error(result.error);return result.token;
  }
  async logout(){const current=this.session();return this.repository.transaction(state=>{state.staffSessions=(state.staffSessions||[]).filter(s=>s.token!==current);return true;});}
  list(){this.require('staff.manage');return (this.repository.read().staff||[]).map(publicStaff);}
  async save(data){
    this.require('staff.manage');const entry=normalized(data);
    const secret=!data.id||data.password?await credentials(data.password):null;
    return this.repository.transaction(state=>{
      const actor=this.require('staff.manage',state),existing=data.id?state.staff.find(s=>s.id===data.id):null;
      if(data.id&&!existing)throw new Error('Không tìm thấy tài khoản nhân viên.');
      if(existing&&data.revision!==existing.sessionVersion)throw new Error('Tài khoản đã được cập nhật. Hãy mở lại để chỉnh sửa.');
      if(state.staff.some(s=>s.username===entry.username&&s.id!==data.id))throw new Error('Tên đăng nhập này đã được sử dụng.');
      if(existing?.role==='admin'&&existing.active&&(!entry.active||entry.role!=='admin')&&!state.staff.some(s=>s.id!==existing.id&&s.role==='admin'&&s.active))throw new Error('Cần giữ ít nhất một quản trị viên đang hoạt động.');
      const saved={...existing,...entry,...secret,id:existing?.id||token('E'),sessionVersion:(existing?.sessionVersion||0)+1,createdAt:existing?.createdAt||this.clock().toISOString()};
      if(existing)state.staff[state.staff.indexOf(existing)]=saved;else state.staff.push(saved);
      // Revoke existing sessions whenever identity, permissions or password change.
      state.staffSessions=(state.staffSessions||[]).filter(s=>s.staffId!==saved.id);
      delete state.staffAttempts?.[saved.username];
      this.#audit(state,actor,existing?'update':'create',saved,STAFF_ROLES[saved.role]+(saved.active?' · Đang hoạt động':' · Đã khóa')+(secret&&existing?' · Đã đặt lại mật khẩu':''));
      return publicStaff(saved);
    });
  }
  async changePassword(oldPassword,newPassword){
    const actor=this.current();if(!actor)throw new Error('Vui lòng đăng nhập nhân viên.');
    const secret=await credentials(newPassword);
    return this.repository.transaction(async state=>{
      const staff=sessionActor(state,this.session(),this.clock());
      if(!staff)throw new Error('Phiên nhân viên đã kết thúc.');
      if(staff.passwordHash!==await digest(staff.passwordSalt+':'+String(oldPassword)))throw new Error('Mật khẩu hiện tại không đúng.');
      Object.assign(staff,secret);staff.sessionVersion++;
      state.staffSessions=state.staffSessions.filter(s=>s.staffId!==staff.id);
      this.#audit(state,staff,'password',staff);return true;
    });
  }
  async resetDemo(){
    return this.repository.transaction(state=>{
      const actor=this.require('data.reset',state);
      Object.assign(state,createSeed(this.clock()));this.#audit(state,actor,'reset',actor,'Khôi phục dữ liệu game mẫu; giữ tài khoản nhân viên.');return true;
    });
  }
}
