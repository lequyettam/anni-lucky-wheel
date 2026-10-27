import {PRIZE_TERMS} from './release-copy.js';
import {requirePermission} from './access-policy.js';
import {isThemeId} from './themes.js';
import {getContent, validateContent, contentRevision} from './content.js';
/** Business rules. No DOM or browser storage dependencies. Percentages use basis points. */
export class RuleError extends Error {}
export const clone = value => structuredClone(value);
export const vnDay = date => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(date));
export function normalizePhone(input) {
  const phone = String(input).trim().replace(/[\s.()-]/g, '').replace(/^\+84/, '0').replace(/^84(?=[35789]\d{8}$)/, '0');
  if (!/^0[35789]\d{8}$/.test(phone)) throw new RuleError('Nhập số di động Việt Nam gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
  return phone;
}
export function integer(value, label, min = 0, max = 1000000) {
  const number = Number(value);
  if (value === '' || !Number.isInteger(number) || number < min || number > max) throw new RuleError(`${label} phải là số nguyên từ ${min} đến ${max}.`);
  return number;
}
export function basisPoints(value) {
  const number = Number(value), scaled = number * 100;
  if (value === '' || !Number.isFinite(number) || number < 0 || number > 100 || Math.abs(scaled - Math.round(scaled)) > 1e-7) throw new RuleError('Tỷ lệ phải từ 0 đến 100%, tối đa 2 số thập phân.');
  return Math.round(scaled);
}
export function token(prefix = '', length = 16) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return prefix + Array.from(bytes, value => alphabet[value % alphabet.length]).join('');
}
export const randomUnit = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
// Standards-based SHA-256 fallback for local HTTP previews without SubtleCrypto.
// Production authentication belongs on the server; this demo hash is not an access-control boundary.
export function sha256(bytes) {
  const rotr = (n,b) => (n >>> b) | (n << (32-b));
  const k=[],h=[];for(let n=2;k.length<64;n++){let prime=true;for(let d=2;d*d<=n;d++)if(n%d===0){prime=false;break;}if(prime){if(h.length<8)h.push((Math.sqrt(n)%1*4294967296)|0);k.push((Math.cbrt(n)%1*4294967296)|0);}}
  const length=Math.ceil((bytes.length+9)/64)*64,data=new Uint8Array(length);data.set(bytes);data[bytes.length]=128;const view=new DataView(data.buffer);view.setUint32(length-4,bytes.length*8);const w=new Int32Array(64);
  for(let offset=0;offset<length;offset+=64){for(let i=0;i<16;i++)w[i]=view.getInt32(offset+i*4);for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=((rotr(x,7)^rotr(x,18)^(x>>>3))+w[i-16]+(rotr(y,17)^rotr(y,19)^(y>>>10))+w[i-7])|0;}let[a,b,c,d,e,f,g,z]=h;for(let i=0;i<64;i++){const t1=(z+(rotr(e,6)^rotr(e,11)^rotr(e,25))+((e&f)^(~e&g))+k[i]+w[i])|0,t2=((rotr(a,2)^rotr(a,13)^rotr(a,22))+((a&b)^(a&c)^(b&c)))|0;z=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}[a,b,c,d,e,f,g,z].forEach((v,i)=>h[i]=(h[i]+v)|0);}
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  if (!crypto.subtle) return sha256(bytes);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
}
export function validatePrizes(prizes) {
  if (prizes.length < 2 || prizes.length > 12) throw new RuleError('Vòng quay cần từ 2 đến 12 ô để dễ đọc trên điện thoại.');
  if (new Set(prizes.map(p => p.id)).size !== prizes.length) throw new RuleError('Mã phần thưởng bị trùng.');
  for (const prize of prizes) {
    if (!prize.name.trim() || !prize.short.trim()) throw new RuleError('Mỗi ô cần tên phần thưởng và tên ngắn trên vòng quay.');
    if (!['lose','drink','percent','amount'].includes(prize.kind)) throw new RuleError('Loại phần thưởng không hợp lệ.');
    if (!/^#[a-f0-9]{6}$/i.test(prize.color)) throw new RuleError('Màu phần thưởng không hợp lệ.');
    integer(prize.weight, 'Tỷ lệ', 0, 10000);
    if (prize.kind !== 'lose') integer(prize.stock, 'Số quà còn lại');
    integer(prize.days, 'Hạn dùng voucher', 1, 365);
    if (prize.image && !/^data:image\/(png|jpeg|webp);base64,/.test(prize.image)) throw new RuleError('Ảnh cần có định dạng PNG, JPG hoặc WebP.');
  }
  const sum = prizes.reduce((n, p) => n + p.weight, 0);
  if (sum !== 10000) throw new RuleError(`Tổng tỷ lệ hiện là ${(sum / 100).toLocaleString('vi-VN')}%. Cần đúng 100% để lưu.`);
}
export class ProbabilityPolicy {
  static weights(prizes, mode = 'weighted') {
    const live = p => p.kind === 'lose' || p.stock > 0;
    if (mode === 'uniform') {
      const count = prizes.filter(p => live(p) && p.weight > 0).length;
      if (!count) throw new RuleError('Hết kết quả có thể quay. Chiến dịch đang tạm dừng.');
      return prizes.map(p => ({...p, effective:live(p) && p.weight > 0 ? 10000 / count : 0}));
    }
    const missing = prizes.filter(p => !live(p)).reduce((n, p) => n + p.weight, 0);
    const eligible = prizes.filter(p => live(p) && p.weight > 100);
    if (missing > 0 && eligible.length === 0) throw new RuleError('Không còn ô có tỷ lệ gốc lớn hơn 1% để phân bổ. Vui lòng điều chỉnh chiến dịch.');
    return prizes.map(p => ({...p, effective:!live(p) ? 0 : p.weight + (p.weight > 100 ? missing / (eligible.length || 1) : 0)}));
  }
  static pick(prizes, mode, random = randomUnit) {
    const weights = this.weights(prizes, mode), unit = random();
    if (!(unit >= 0 && unit < 1)) throw new RuleError('Nguồn ngẫu nhiên không hợp lệ.');
    let cursor = unit * 10000;
    for (const prize of weights) { cursor -= prize.effective; if (cursor < 0 && prize.effective > 0) return prize; }
    return weights.filter(p => p.effective > 0).at(-1);
  }
}
export function createSeed(now = new Date()) {
  const days = n => new Date(+new Date(now) + n * 86400000).toISOString();
  return {
    version:1,
    settings:{title:'Vòng quay may mắn', dailyFree:1, active:true, mode:'weighted', start:'', end:'', branch:'ANNI COFFEE', codeHint:'ANNI2026', appearance:{theme:'anni',decorations:true}},
    prizes:[
      {id:'luck', name:'Chúc bạn may mắn lần sau', short:'Hẹn lần sau', kind:'lose', weight:4000, stock:null, days:7, color:'#294D40', icon:'leaf', terms:'Một chút hồi hộp, một niềm vui nhỏ. Hẹn bạn ở lượt quay tiếp theo!', image:''},
      {id:'off10', name:'Voucher giảm 10%', short:'Giảm 10%', kind:'percent', weight:2500, stock:100, days:7, color:'#F1DFC1', icon:'ticket', terms:PRIZE_TERMS.off10, image:''},
      {id:'off20', name:'Voucher giảm 20%', short:'Giảm 20%', kind:'percent', weight:1500, stock:50, days:7, color:'#A4B4A0', icon:'ticket', terms:PRIZE_TERMS.off20, image:''},
      {id:'off30', name:'Voucher giảm 30%', short:'Giảm 30%', kind:'percent', weight:1000, stock:20, days:7, color:'#7B4936', icon:'gift', terms:PRIZE_TERMS.off30, image:''},
      {id:'milk', name:'Một ly cà phê sữa', short:'Cà phê sữa', kind:'drink', weight:900, stock:20, days:7, color:'#D5B886', icon:'cup', terms:PRIZE_TERMS.milk, image:''},
      {id:'grand', name:'Voucher giảm 5.000.000đ', short:'5.000.000đ', kind:'amount', weight:100, stock:1, days:30, color:'#DADDD0', icon:'spark', terms:PRIZE_TERMS.grand, image:''}
    ],
    codes:[{id:'code-anni', code:'ANNI2026', turns:2, maxUses:100, perPhone:1, period:'all', creditDays:7, starts:days(-1), ends:days(30), active:true, branch:'ANNI COFFEE', uses:[]}],
    users:[], credits:[], spins:[], vouchers:[], redemptions:[]
  };
}
/** Port: read() and transaction(fn). Replace the local adapter with an API-backed adapter later. */
export class MemoryRepository {
  constructor(state = createSeed()) { this.state = clone(state); this.queue = Promise.resolve(); }
  read() { return clone(this.state); }
  transaction(fn) {
    const operation = this.queue.then(async () => { const next = clone(this.state); const result = await fn(next); this.state = next; return clone(result); });
    this.queue = operation.catch(() => {}); return operation;
  }
}
export class GameService {
  constructor(repository, {clock = () => new Date(), random = randomUnit, staffSession = () => null} = {}) { this.repository = repository; this.clock = clock; this.random = random; this.staffSession = staffSession; }
  snapshot() { return this.repository.read(); }
  async login(input, recovery = '') {
    const phone = normalizePhone(input), recoveryHash = recovery ? await digest(recovery.trim().toUpperCase()) : '';
    return this.repository.transaction(state => {
      let user = state.users.find(u => u.phone === phone);
      if (user?.recoveryHash && user.recoveryHash !== recoveryHash) throw new RuleError('Số điện thoại này đã có ví quà. Vui lòng nhập đúng mã khôi phục.');
      if (!user) { user = {id:token('U', 12), phone, name:'', recoveryHash:null, createdAt:this.clock().toISOString()}; state.users.push(user); }
      return user;
    });
  }
  balance(userId, state = this.snapshot()) {
    const now = this.clock();
    return {free:Math.max(0, state.settings.dailyFree - state.spins.filter(s => s.userId === userId && s.source === 'free' && s.day === vnDay(now)).length),
      earned:state.credits.filter(c => c.userId === userId && +new Date(c.expiresAt) > +now).reduce((n, c) => n + c.remaining, 0)};
  }
  async activateCode(userId, input) {
    const codeText = input.trim().toUpperCase();
    return this.repository.transaction(state => {
      const now = this.clock();
      if (!state.users.some(u => u.id === userId)) throw new RuleError('Vui lòng nhập số điện thoại trước.');
      const code = state.codes.find(c => c.code === codeText);
      if (!code || !code.active) throw new RuleError('Mã không tồn tại hoặc đã tạm khóa.');
      if (+new Date(code.starts) > +now) throw new RuleError('Mã chưa đến thời gian sử dụng.');
      if (+new Date(code.ends) <= +now) throw new RuleError('Mã đã hết hạn.');
      if (code.uses.length >= code.maxUses) throw new RuleError('Mã đã đạt giới hạn kích hoạt.');
      const used = code.uses.filter(u => u.userId === userId && (code.period === 'all' || u.day === vnDay(now))).length;
      if (used >= code.perPhone) throw new RuleError('Số điện thoại này đã dùng hết số lần được phép của mã.');
      code.uses.push({userId, day:vnDay(now), at:now.toISOString()});
      const credit = {id:token('L'), userId, code:code.code, remaining:code.turns, expiresAt:new Date(+now + code.creditDays * 86400000).toISOString()};
      state.credits.push(credit); return credit;
    });
  }
  async spin(userId, source, requestId = token('REQ')) {
    const recoveryCode = token('ANNI-', 20), recoveryHash = await digest(recoveryCode);
    return this.repository.transaction(state => {
      const previous = state.spins.find(s => s.userId === userId && s.requestId === requestId);
      if (previous) return {spin:previous, voucher:state.vouchers.find(v => v.spinId === previous.id) || null, recoveryCode:null};
      const now = this.clock(), user = state.users.find(u => u.id === userId);
      if (!user) throw new RuleError('Vui lòng nhập số điện thoại trước khi quay.');
      const cfg = state.settings;
      if (!cfg.active || (cfg.start && +new Date(cfg.start) > +now) || (cfg.end && +new Date(cfg.end) <= +now)) throw new RuleError('Chiến dịch hiện chưa mở. Hẹn bạn quay lại sau!');
      if (!['free','earned'].includes(source)) throw new RuleError('Nguồn lượt quay không hợp lệ.');
      const balance = this.balance(userId, state);
      if (balance[source] <= 0) throw new RuleError(source === 'free' ? 'Bạn đã dùng hết lượt miễn phí hôm nay. Hãy nhập mã từ thu ngân để nhận thêm lượt.' : 'Bạn chưa có lượt từ hóa đơn còn hiệu lực.');
      const prize = ProbabilityPolicy.pick(state.prizes, cfg.mode, this.random);
      if (!prize) throw new RuleError('Chưa có phần thưởng có thể quay.');
      if (source === 'earned') state.credits.filter(c => c.userId === userId && c.remaining > 0 && +new Date(c.expiresAt) > +now).sort((a,b) => a.expiresAt.localeCompare(b.expiresAt))[0].remaining--;
      const spin = {id:token('S'), requestId, userId, phone:user.phone, source, day:vnDay(now), at:now.toISOString(), prize:clone(prize)};
      state.spins.push(spin);
      let voucher = null, newRecovery = null;
      if (prize.kind !== 'lose') {
        state.prizes.find(p => p.id === prize.id).stock--;
        let code; do { code = token('AC-', 10); } while (state.vouchers.some(v => v.code === code));
        voucher = {id:token('V'), code, userId, spinId:spin.id, prize:clone(prize), branch:cfg.branch, at:now.toISOString(), expiresAt:new Date(+now + prize.days * 86400000).toISOString(), redeemedAt:null, redeemedBy:null};
        state.vouchers.push(voucher);
        if (!user.recoveryHash) { user.recoveryHash = recoveryHash; newRecovery = recoveryCode; }
      }
      return {spin, voucher, recoveryCode:newRecovery};
    });
  }
  async saveName(userId, input) {
    const name = input.trim(); if (name.length < 2 || name.length > 80) throw new RuleError('Tên cần từ 2 đến 80 ký tự.');
    return this.repository.transaction(state => { const user = state.users.find(u => u.id === userId); if (!user) throw new RuleError('Không tìm thấy tài khoản.'); user.name = name; return user; });
  }
  async redeem(input) {
    return this.#redeemVoucher(input, {type:'staff'});
  }
  async useVoucher(userId, input) {
    return this.#redeemVoucher(input, {type:'customer', userId});
  }
  // Both entry points commit the same one-way transition and audit record atomically.
  // In production the server must derive the actor from an authenticated session.
  async #redeemVoucher(input, actor) {
    return this.repository.transaction(state => {
      const now = this.clock();
      const staff = actor.type === 'staff' ? requirePermission(state,this.staffSession(),'vouchers.redeem',now) : null;
      const customer = actor.type === 'customer' ? state.users.find(u => u.id === actor.userId) : null;
      if (actor.type === 'customer' && !customer) throw new RuleError('Vui lòng đăng nhập để sử dụng voucher.');
      const voucher = state.vouchers.find(v => v.code === String(input ?? '').trim().toUpperCase());
      if (!voucher) throw new RuleError('Không tìm thấy voucher.');
      if (customer && voucher.userId !== customer.id) throw new RuleError('Bạn chỉ có thể sử dụng voucher trong ví của mình.');
      if (voucher.redeemedAt) throw new RuleError('Voucher đã được sử dụng.');
      if (+new Date(voucher.expiresAt) <= +now) throw new RuleError('Voucher đã hết hạn.');
      const name = customer ? (customer.name || 'Khách hàng') : staff.name;
      if (!name) throw new RuleError('Vui lòng xác định nhân viên xác nhận voucher.');
      voucher.redeemedAt = now.toISOString();
      voucher.redeemedBy = name;
      voucher.redeemedByType = actor.type;
      voucher.redeemedById = customer?.id || staff?.id || null;
      state.redemptions.push({voucherId:voucher.id, at:voucher.redeemedAt, actorType:actor.type,
        actorId:voucher.redeemedById, actorName:name, employee:customer ? null : name, branch:voucher.branch});
      return voucher;
    });
  }
  async savePrizes(prizes) { validatePrizes(prizes); return this.repository.transaction(state => {requirePermission(state,this.staffSession(),'prizes.edit',this.clock());state.prizes = clone(prizes); return true;}); }
  async saveAppearance(appearance) {
    if(!appearance || !isThemeId(appearance.theme) || typeof appearance.decorations!=='boolean') throw new RuleError('Vui lòng chọn một chủ đề hợp lệ.');
    const saved={theme:appearance.theme,decorations:appearance.decorations};
    return this.repository.transaction(state=>{requirePermission(state,this.staffSession(),'themes.edit',this.clock());state.settings.appearance=saved;return saved;});
  }
  async saveSettings(settings) {
    const dailyFree = integer(settings.dailyFree, 'Lượt miễn phí', 0, 100);
    if (!['weighted','uniform'].includes(settings.mode)) throw new RuleError('Chế độ chọn kết quả không hợp lệ.');
    if (settings.start && settings.end && +new Date(settings.start) >= +new Date(settings.end)) throw new RuleError('Thời gian kết thúc phải sau thời gian bắt đầu.');
    if (!settings.title.trim() || !settings.branch.trim()) throw new RuleError('Vui lòng nhập tên chiến dịch và cửa hàng.');
    const updates={...settings};
    for(const key of ['appearance','content','contentPrevious','contentRevision','contentUpdatedAt'])delete updates[key];
    return this.repository.transaction(state => {requirePermission(state,this.staffSession(),'settings.edit',this.clock());state.settings = {...state.settings, ...updates, dailyFree}; return true;});
  }
  async saveContent(content, expectedRevision) {
    const checked=validateContent(content);
    return this.repository.transaction(state=>{
      requirePermission(state,this.staffSession(),'content.edit',this.clock());
      const revision=contentRevision(state.settings);
      if(expectedRevision!==revision)throw new RuleError('Nội dung đã được sửa ở tab khác. Hãy tải bản đang dùng trước khi lưu lại.');
      const previous=getContent(state.settings);
      if(JSON.stringify(previous)===JSON.stringify(checked))return revision;
      state.settings.contentPrevious={content:previous,savedAt:state.settings.contentUpdatedAt||null};
      state.settings.content=checked;
      state.settings.contentRevision=revision+1;
      state.settings.contentUpdatedAt=this.clock().toISOString();
      return revision+1;
    });
  }
  async saveCode(data) {
    const entry = {...data, code:data.code.trim().toUpperCase()};
    if (!/^[A-Z0-9-]{4,24}$/.test(entry.code)) throw new RuleError('Mã gồm 4–24 chữ cái không dấu, số hoặc dấu gạch ngang.');
    for (const [key,label,max] of [['turns','Lượt mỗi lần',100],['maxUses','Giới hạn toàn mã',100000],['perPhone','Giới hạn mỗi số điện thoại',100],['creditDays','Hạn dùng lượt',365]]) entry[key] = integer(entry[key], label, 1, max);
    if (!Number.isFinite(+new Date(entry.starts)) || !Number.isFinite(+new Date(entry.ends)) || +new Date(entry.starts) >= +new Date(entry.ends)) throw new RuleError('Chọn khoảng thời gian áp dụng hợp lệ.');
    if (!['all','day'].includes(entry.period)) throw new RuleError('Chu kỳ giới hạn không hợp lệ.');
    return this.repository.transaction(state => {
      requirePermission(state,this.staffSession(),'codes.edit',this.clock());
      if (state.codes.some(c => c.code === entry.code && c.id !== entry.id)) throw new RuleError('Mã này đã tồn tại.');
      const index = state.codes.findIndex(c => c.id === entry.id), uses = index >= 0 ? state.codes[index].uses : [];
      if (index >= 0 && uses.length && state.codes[index].code !== entry.code) throw new RuleError('Mã đã có người sử dụng. Hãy tạo mã mới để đổi tên.');
      const saved = {...entry, id:entry.id || token('C'), uses};
      if (index >= 0) state.codes[index] = saved; else state.codes.push(saved); return saved;
    });
  }
}
