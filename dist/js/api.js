const randomKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');

/** Same-origin HTTP adapter. No database credential, RNG or writable game state in the browser. */
export class ApiRepository {
  constructor(base='/api',fetcher=globalThis.fetch.bind(globalThis)) {
    if(!/^\/api\/?$/.test(base))throw new Error('API phải cùng tên miền với ứng dụng.');
    this.base=base.replace(/\/$/,'');this.fetcher=fetcher;this.remote=true;this.state=null;this.csrf='';this.queue=Promise.resolve();
  }
  read(){if(!this.state)throw new Error('Chưa tải được dữ liệu máy chủ.');return structuredClone(this.state);}
  request(action,data){
    const run=async()=>{
      let response;
      try{response=await this.fetcher(`${this.base}/${action}`,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(data===undefined?{}:{'Content-Type':'application/json','X-CSRF-TOKEN':this.csrf})},...(data===undefined?{}:{body:JSON.stringify(data)})});}
      catch{throw new Error('Chưa nhận được phản hồi máy chủ. Kiểm tra mạng rồi thử lại; yêu cầu quay sẽ được đối chiếu để tránh trừ lượt hai lần.');}
      let body;try{body=await response.json();}catch{throw new Error('Máy chủ trả phản hồi chưa hợp lệ. Vui lòng thử lại sau.');}
      if(!response.ok){const message=body.errors?Object.values(body.errors).flat().join(' '):body.message;const error=new Error(response.status===419?'Phiên thao tác đã đổi. Tải lại trang rồi thử lại.':message||'Không thực hiện được thao tác.');error.status=response.status;throw error;}
      if(body.state)this.state=body.state;if(body.csrfToken)this.csrf=body.csrfToken;return body.result;
    };
    const result=this.queue.then(run);this.queue=result.catch(()=>{});return result;
  }
  async refresh(){await this.request('state');return this.read();}
}

export class ApiGameService {
  constructor(repository,storage=globalThis.sessionStorage){this.repository=repository;this.storage=storage;}
  snapshot(){return this.repository.read();}
  balance(){return this.snapshot().balance;}
  async login(phone,recovery=''){
    const pendingKey='anni-api-enrollment';let pending;
    if(!recovery.trim()){
      try{pending=JSON.parse(this.storage.getItem(pendingKey)||'null');}catch{}
      if(!pending||pending.phone!==phone){pending={phone,key:randomKey()};this.storage.setItem(pendingKey,JSON.stringify(pending));}
    }
    const result=await this.repository.request('customer-login',{phone,recovery,...(pending?{enrollmentKey:pending.key}:{})});
    if(result.recoveryCode)this.storage.setItem('anni-pending-recovery-'+result.user.id,result.recoveryCode);
    this.storage.removeItem(pendingKey);
    return result.user;
  }
  async logout(){return this.repository.request('customer-logout',{});}
  async once(action,body){
    const customer=this.snapshot().customer?.id;if(!customer)throw new Error('Vui lòng đăng nhập ví quà.');
    const key=`anni-api-pending-${customer}-${action}`;
    let pending;try{pending=JSON.parse(this.storage.getItem(key)||'null');}catch{}
    if(pending&&JSON.stringify(pending.body)!==JSON.stringify(body))throw new Error('Có yêu cầu trước chưa được đối chiếu. Hãy thử lại đúng nguồn lượt hoặc mã trước đó để nhận kết quả.');
    if(!pending){pending={body,requestId:randomKey()};this.storage.setItem(key,JSON.stringify(pending));}
    try{const result=await this.repository.request(action,{...pending.body,requestId:pending.requestId});this.storage.removeItem(key);return result;}
    catch(error){if(error.status>=400&&error.status<500&&error.status!==429)this.storage.removeItem(key);throw error;}
  }
  spin(userId,source){return this.once('spin',{source});}
  activateCode(userId,code){return this.once('activate',{code:code.trim().toUpperCase()});}
  saveName(userId,name){return this.repository.request('customer-name',{name});}
  useVoucher(userId,code){return this.repository.request('use-voucher',{code});}
  redeem(code){return this.repository.request('redeem',{code});}
  savePrizes(prizes,revision){return this.repository.request('prizes',{prizes,revision});}
  saveSettings(settings){return this.repository.request('settings',settings);}
  saveAppearance(appearance){return this.repository.request('appearance',appearance);}
  saveContent(content,revision){return this.repository.request('content',{content,revision});}
  saveCode(code){return this.repository.request('code',code);}
}

export class ApiStaffService {
  constructor(repository){this.repository=repository;}
  current(){return this.repository.read().actor;}
  needsSetup(){return false;}
  require(permission){const actor=this.current();if(!actor||!actor.permissions.includes(permission))throw new Error('Tài khoản không có quyền thực hiện thao tác này.');return actor;}
  list(){this.require('staff.manage');return this.repository.read().staff;}
  async login(username,password){await this.repository.request('staff-login',{username,password});return 'server-session';}
  logout(){return this.repository.request('staff-logout',{});}
  save(data){return this.repository.request('staff-save',data);}
  changePassword(currentPassword,password){return this.repository.request('staff-password',{currentPassword,password});}
  bootstrap(){throw new Error('Quản trị viên đầu tiên được khởi tạo bằng lệnh trên máy chủ.');}
}
