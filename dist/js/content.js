import {THEMES, getTheme} from './themes.js';

/** Editable presentation data. No prize, quota, redemption or account fields belong here. */
const item=(key,label,value,max=180,options={})=>Object.freeze({key,label,value,max,...options});
export const CONTENT_GROUPS=Object.freeze([
  {id:'general',label:'Trang chơi',icon:'wheel',fields:[
    item('gameTitle','Tên ứng dụng','Vòng quay may mắn',50),
    item('spinButton','Nhãn nút quay','QUAY NGAY',20),
    item('codeButton','Nhãn nút nhập mã','Nhập mã',18),
    item('heroNote','Dòng nhắn dưới phần giới thiệu','Cà phê ngon hơn khi có niềm vui đi cùng.',150),
    item('codeHint','Lời mời nhập mã','Có mã từ thu ngân? Nhập mã tại đây',150),
    item('rewardsEyebrow','Dòng dẫn khu quà tặng','Những điều dễ thương đang chờ',80),
    item('rewardsTitle','Tiêu đề khu quà tặng','Quà nhỏ, vui thật.',80),
    item('loginTitle','Lời chào khi đăng nhập','Chào bạn, {shortBrand} đây.',90),
    item('loginIntro','Giới thiệu đăng nhập','Nhập số điện thoại để bắt đầu. Bản trải nghiệm chưa dùng OTP; bạn có thể dùng số mẫu bên dưới.',300,{multiline:true}),
    item('codeTitle','Tiêu đề hộp nhập mã','Thêm lượt, thêm vui.',80),
    item('codeIntro','Hướng dẫn nhập mã','Nhập mã thu ngân cung cấp để nhận thêm lượt quay. Mỗi mã có giới hạn và thời hạn riêng.',300,{multiline:true})
  ]},
  {id:'wallet',label:'Ví quà',icon:'wallet',fields:[
    item('walletTitle','Tên trang ví quà','Quà của tôi',30),
    item('walletEyebrow','Dòng dẫn ví quà','Gửi bạn một chút ngọt ngào',80),
    item('walletGreeting','Lời chào khách đã đăng nhập','Xin chào {customer}. Những món quà đang chờ bạn ghé {shortBrand}.',240,{multiline:true}),
    item('walletLogin','Lời mời đăng nhập','Nhập số điện thoại để xem những món quà của bạn.',240,{multiline:true}),
    item('walletEmptyTitle','Tiêu đề ví chưa có quà','Một chiếc ví đang chờ quà',80),
    item('walletEmptyBody','Giới thiệu ví chưa có quà','Thử một vòng quay để nhận món quà đầu tiên từ {shortBrand}.',240,{multiline:true}),
    item('voucherUseIntro','Lời nhắc trước khi dùng voucher','Chỉ xác nhận sử dụng khi đổi quà tại quầy {brand}.',240,{multiline:true})
  ]},
  {id:'result',label:'Nhận thưởng',icon:'gift',fields:[
    item('winEyebrow','Dòng chúc mừng','MỘT MÓN QUÀ DÀNH RIÊNG CHO BẠN',90),
    item('winMessage','Thông báo đã lưu quà','Chúc mừng bạn! Voucher đã được lưu vào ví quà.',240,{multiline:true}),
    item('loseEyebrow','Dòng nhắn khi chưa trúng','MAY MẮN SẼ SỚM GHÉ THĂM',90),
    item('loseTitle','Tiêu đề khi chưa trúng','Hẹn bạn ở vòng quay sau.',90),
    item('walletButton','Nút mở ví quà','Xem quà của tôi',30),
    item('continueButton','Nút chơi tiếp','Tiếp tục khám phá',30)
  ]},
  {id:'rules',label:'Thể lệ',icon:'info',fields:[
    item('rulesNav','Tên mục thể lệ','Thể lệ',25),
    item('rulesEyebrow','Dòng dẫn trang thể lệ','Một chút thông tin trước khi chơi',80),
    item('rulesTitle','Tiêu đề trang thể lệ','Chơi vui, nhận quà dễ.',90),
    item('rulesIntro','Giới thiệu thể lệ','Thể lệ của chiến dịch đang được thiết lập trong bản trải nghiệm.',300,{multiline:true}),
    item('rulesLeadTitle','Tiêu đề khối giới thiệu','May mắn bắt đầu từ một lần ghé.',100),
    item('rulesLeadBody','Nội dung khối giới thiệu','Nhận lượt quay, chạm vào vòng quay và lưu lại món quà của bạn. Mang voucher đến {brand} để trải nghiệm quy trình đổi quà.',600,{multiline:true}),
    item('rulesTurns','Nhận lượt quay','Mỗi số điện thoại có {dailyFree} lượt miễn phí mỗi ngày, làm mới lúc 00:00 giờ Việt Nam và không cộng dồn. Mã từ thu ngân cấp thêm lượt theo giới hạn riêng; lượt có ngày hết hạn. Chọn nguồn lượt trước khi quay.',1000,{multiline:true}),
    item('rulesProbability','Kết quả & tỷ lệ','Kích thước các ô giúp dễ đọc; cơ hội trúng phụ thuộc tỷ lệ bên dưới. Khi quà hết, tỷ lệ được chia đều cho các ô còn hiệu lực có tỷ lệ gốc lớn hơn 1%, bao gồm ô không trúng. Tỷ lệ không đảm bảo số lần trúng trong một nhóm lượt cố định.',1000,{multiline:true}),
    item('rulesVoucher','Lưu & sử dụng voucher','Quà được lưu sau khi có kết quả. Mỗi voucher có mã riêng, thời hạn và điều kiện áp dụng; khách bấm “Sử dụng voucher” tại quầy hoặc nhờ nhân viên đánh dấu đã sử dụng. Sau khi xác nhận, voucher chuyển sang “Đã sử dụng” và không thể dùng lại. Việc sửa phần thưởng sau này không thay đổi voucher đã cấp.',1000,{multiline:true}),
    item('rulesRecovery','Mã khôi phục & dữ liệu','Số điện thoại được kiểm tra định dạng, chưa xác thực bằng OTP. Lưu mã khôi phục khi trúng quà lần đầu. Trong bản demo, ví chỉ tồn tại trong trình duyệt này; xóa dữ liệu trình duyệt sẽ xóa dữ liệu mẫu. Không nhập dữ liệu khách hàng thật. Phiên bản máy chủ mới hỗ trợ khôi phục trên thiết bị khác.',1000,{multiline:true})
  ]}
].map(group=>Object.freeze({...group,fields:Object.freeze(group.fields)})));
export const BRAND_FIELDS=Object.freeze([
  item('name','Tên thương hiệu','ANNI COFFEE',60,{optional:true}),
  item('shortName','Tên rút gọn (tùy chọn)','',24,{optional:true}),
  item('slogan','Khẩu hiệu ở chân trang','Cà phê chất lượng từ vùng Tây Nguyên',180,{optional:true})
]);
export const THEME_FIELDS=Object.freeze([
  item('occasion','Tên dịp lễ / dòng nhỏ trên đầu trang','',65),
  item('eyebrow','Dòng dẫn trên laptop','',100),
  item('headline','Tiêu đề chính trên laptop','',60),
  item('lead','Từ nối ở dòng thứ hai','',30,{optional:true}),
  item('emphasis','Dòng nhấn mạnh trên laptop','',70),
  item('mobileLead','Tiêu đề chính trên điện thoại','',40),
  item('mobileEmphasis','Dòng thứ hai trên điện thoại','',50),
  item('intro','Giới thiệu dòng một','',200,{multiline:true}),
  item('subline','Giới thiệu dòng hai','',200,{multiline:true}),
  item('message','Lời chúc lễ hội / nhãn cạnh vòng quay','',90)
]);
export const LOGO_MAX_BYTES=300*1024;
export const LOGO_VARIANTS=Object.freeze([
  Object.freeze({key:'logo',surface:'light',label:'Logo dùng trên nền sáng'}),
  Object.freeze({key:'logoDark',surface:'dark',label:'Logo dùng trên nền tối'})
]);
/** Select for the local surface; use the other uploaded variant when one is missing. */
export function brandLogo(brand,surface='light'){
  return surface==='dark'?(brand.logoDark||brand.logo||''):(brand.logo||brand.logoDark||'');
}
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const defaultThemeText=theme=>Object.fromEntries(THEME_FIELDS.map(({key})=>[key,theme[key].replaceAll('ANNI COFFEE','{brand}').replaceAll('ANNI','{shortBrand}') ]));
export function defaultContent(){
  return {brand:{...Object.fromEntries(BRAND_FIELDS.map(f=>[f.key,f.value])),logo:'',logoDark:''},text:Object.fromEntries(CONTENT_GROUPS.flatMap(g=>g.fields).map(f=>[f.key,f.value])),themes:Object.fromEntries(THEMES.map(t=>[t.id,defaultThemeText(t)]))};
}
export function validLogo(value){
  if(value==='')return true;
  if(typeof value!=='string'||value.length>LOGO_MAX_BYTES*4/3+50)return false;
  const match=value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match||match[2].length%4!==0)return false;
  return ({png:'iVBORw0KGgo',jpeg:'/9j/',webp:'UklGR'})[match[1]]&&match[2].startsWith(({png:'iVBORw0KGgo',jpeg:'/9j/',webp:'UklGR'})[match[1]]);
}
export function contentRevision(settings){return Number.isSafeInteger(settings?.contentRevision)?settings.contentRevision:0;}
export function getContent(settings){
  const defaults=defaultContent(),saved=settings?.content;
  const merge=(target,source,fields)=>{for(const f of fields)if(own(source,f.key)&&typeof source[f.key]==='string'&&source[f.key].length<=f.max&&(f.optional||source[f.key].trim()))target[f.key]=source[f.key];};
  merge(defaults.brand,saved?.brand,BRAND_FIELDS);
  for(const {key} of LOGO_VARIANTS)if(validLogo(saved?.brand?.[key]))defaults.brand[key]=saved.brand[key];
  defaults.brand.name=defaults.brand.name.trim();
  if(!defaults.brand.name&&!brandLogo(defaults.brand))defaults.brand.name=BRAND_FIELDS.find(f=>f.key==='name').value;
  merge(defaults.text,saved?.text,CONTENT_GROUPS.flatMap(g=>g.fields));
  for(const theme of THEMES)merge(defaults.themes[theme.id],saved?.themes?.[theme.id],THEME_FIELDS);
  return defaults;
}
export function validateContent(value){
  if(!value||typeof value!=='object')throw new Error('Nội dung không hợp lệ.');
  const checked=defaultContent();
  const check=(source,target,fields)=>{
    if(!source||typeof source!=='object'||Array.isArray(source))throw new Error('Nhóm nội dung không hợp lệ.');
    for(const f of fields){
      const v=source[f.key];
      if(typeof v!=='string'||(!f.optional&&!v.trim())||v.length>f.max)throw new Error(`${f.label}: ${f.optional?'tối đa':'cần nhập nội dung, tối đa'} ${f.max} ký tự.`);
      for(const token of v.matchAll(/\{([^{}]+)\}/g))if(!['brand','shortBrand','customer','dailyFree'].includes(token[1]))throw new Error(`Biến {${token[1]}} chưa được hỗ trợ.`);
      target[f.key]=v;
    }
  };
  check(value.brand,checked.brand,BRAND_FIELDS);
  checked.brand.name=checked.brand.name.trim();checked.brand.shortName=checked.brand.shortName.trim();
  for(const {key,label} of LOGO_VARIANTS){
    const logo=own(value.brand,key)?value.brand[key]:'';
    if(!validLogo(logo))throw new Error(`Logo phải là ảnh PNG, JPG hoặc WebP hợp lệ, tối đa 300 KB sau tối ưu (${label.toLowerCase()}).`);
    checked.brand[key]=logo;
  }
  if(!checked.brand.name&&!brandLogo(checked.brand))throw new Error('Nhập tên thương hiệu hoặc tải logo lên trước khi lưu.');
  check(value.text,checked.text,CONTENT_GROUPS.flatMap(g=>g.fields));
  for(const theme of THEMES)check(value.themes?.[theme.id],checked.themes[theme.id],THEME_FIELDS);
  return checked;
}
export function contentVariables(content,extra={}){
  const brand=content.brand;
  return {brand:brand.name||brand.shortName||'quán',shortBrand:brand.shortName||brand.name.replace(/\s+COFFEE$/i,'').trim()||'quán',customer:'bạn',dailyFree:1,...extra};
}
export function contentMessage(content,key,extra={}){
  let value=content.text[key];
  const originalLogin=CONTENT_GROUPS[0].fields.find(f=>f.key==='loginTitle').value;
  if(key==='loginTitle'&&!content.brand.name&&!content.brand.shortName&&value===originalLogin)value='Chào bạn, mời bạn ghé chơi.';
  return formatContent(value,contentVariables(content,extra));
}
/** One pass prevents text supplied in a name from becoming a second template. Escape at the HTML boundary. */
export function formatContent(value,variables){return String(value).replace(/\{(brand|shortBrand|customer|dailyFree)\}/g,(_,key)=>String(variables[key]??''));}
export function contentTheme(themeId,content){
  const theme=getTheme(themeId),variables=contentVariables(content);
  return {...theme,...Object.fromEntries(THEME_FIELDS.map(({key})=>[key,formatContent(content.themes[theme.id][key],variables)]))};
}
