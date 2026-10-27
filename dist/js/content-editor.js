import {THEMES} from './themes.js';
import {BRAND_FIELDS,CONTENT_GROUPS,THEME_FIELDS,defaultContent,getContent,contentRevision,contentVariables,formatContent,contentMessage,contentTheme,LOGO_MAX_BYTES,LOGO_VARIANTS,brandLogo} from './content.js';
import {escapeHTML as e,icon,WheelRenderer,dateTimeLabel} from './visuals.js';

export function brandMarkup(content,place='header',surface='light'){
  surface=surface==='dark'?'dark':'light';
  const brand=content.brand,logo=brandLogo(brand,surface),label=place==='hub'?(brand.shortName||brand.name):brand.name;
  const parts=label.match(/^(.+?)\s+(COFFEE)$/i),main=parts?parts[1]:label,sub=parts?parts[2]:'';
  const words=main?`<span class="brand-words ${place==='header'?'wordmark':''} ${logo?'with-logo':''} ${main.length>12?'long-brand':''}"><strong>${e(main)}</strong>${sub?`<small>${e(sub)}</small>`:''}</span>`:'';
  if(place==='hub')return logo?`<img class="hub-logo" data-logo-surface="${surface}" src="${e(logo)}" alt="${e(brand.name||brand.shortName||'Logo thương hiệu')}">`:words;
  return `${logo?`<img class="brand-logo ${main?'':'is-solo'}" data-logo-surface="${surface}" src="${e(logo)}" alt="${main?'':e(brand.shortName||'Logo thương hiệu')}">`:place==='header'?`<span class="brand-mark">${e(Array.from(main)[0]?.toLocaleLowerCase('vi')||'a')}</span>`:''}${words}`;
}
export class ContentEditor {
  constructor(settings){
    this.draft=getContent(settings);this.base=JSON.stringify(this.draft);this.revision=contentRevision(settings);
    this.section='brand';this.themeId=settings.appearance?.theme||'anni';this.uploadTokens={logo:0,logoDark:0};this.pendingLogos=new Set();
  }
  get uploading(){return this.pendingLogos.size>0;}
  beginLogoUpload(key){if(!LOGO_VARIANTS.some(v=>v.key===key))throw new Error('Phiên bản logo không hợp lệ.');this.pendingLogos.add(key);return ++this.uploadTokens[key];}
  isLogoUploadCurrent(key,request){return this.uploadTokens[key]===request;}
  finishLogoUpload(key,request){if(this.isLogoUploadCurrent(key,request))this.pendingLogos.delete(key);}
  cancelLogoUploads(key){for(const v of LOGO_VARIANTS)if(!key||v.key===key){this.uploadTokens[v.key]++;this.pendingLogos.delete(v.key);}}
  removeLogo(key){if(LOGO_VARIANTS.some(v=>v.key===key)){this.cancelLogoUploads(key);this.draft.brand[key]='';}}
  get dirty(){return JSON.stringify(this.draft)!==this.base;}
  get fields(){return this.section==='brand'?BRAND_FIELDS:this.section==='theme'?THEME_FIELDS:CONTENT_GROUPS.find(g=>g.id===this.section).fields;}
  get target(){return this.section==='brand'?this.draft.brand:this.section==='theme'?this.draft.themes[this.themeId]:this.draft.text;}
  get defaults(){const d=defaultContent();return this.section==='brand'?d.brand:this.section==='theme'?d.themes[this.themeId]:d.text;}
  setField(key,value){if(this.fields.some(f=>f.key===key))this.target[key]=value;}
  resetField(key){if(this.fields.some(f=>f.key===key))this.target[key]=this.defaults[key];}
  resetSection(){for(const f of this.fields)this.resetField(f.key);if(this.section==='brand')for(const {key} of LOGO_VARIANTS)this.draft.brand[key]='';this.cancelLogoUploads();}
  resetAll(){this.draft=defaultContent();this.cancelLogoUploads();}
  previous(settings){this.draft=getContent({content:settings.contentPrevious.content});this.cancelLogoUploads();}
  text(key,extra={}){return e(contentMessage(this.draft,key,{customer:'Khách trải nghiệm',...extra}));}
  render(settings,prizes){
    const groups=[{id:'brand',label:'Thương hiệu',icon:'store'},{id:'theme',label:'Lời chào theo theme',icon:'spark'},...CONTENT_GROUPS];
    const selected=groups.find(g=>g.id===this.section),previous=settings.contentPrevious;
    return `<form data-form="content" novalidate>
      <div class="content-intro"><p>Chỉnh sửa và xem trước ở bên phải. Chỉ bấm <strong>Lưu nội dung</strong> khi anh muốn áp dụng.</p><span class="badge gold" id="content-state">${this.dirty?'Bản nháp chưa lưu':'Đang dùng bản đã lưu'}</span></div>
      <div class="content-tabs" role="group" aria-label="Nhóm nội dung">${groups.map(g=>`<button type="button" data-action="content-section" data-value="${g.id}" aria-pressed="${g.id===this.section}" class="${g.id===this.section?'selected':''}">${icon(g.icon)}${g.label}</button>`).join('')}</div>
      <div class="content-workspace"><section class="panel content-fields"><div class="panel-title"><h2>${icon(selected.icon)}${selected.label}</h2><button type="button" class="text-button" data-action="content-reset-section">${icon('refresh')}Về gốc nhóm này</button></div>
      ${this.section==='theme'?`<div class="field"><label for="content-theme">Chủ đề cần sửa lời chào</label><select id="content-theme">${THEMES.map(t=>`<option value="${t.id}" ${t.id===this.themeId?'selected':''}>${e(t.name)}</option>`).join('')}</select><small>Nội dung được lưu riêng cho từng theme. Chọn ở đây chỉ đổi bản xem trước.</small></div>`:''}
      ${this.section==='brand'?this.logoEditor():''}
      ${this.fields.map(f=>`<div class="field content-field"><div class="content-field-label"><label for="content-${f.key}">${e(f.label)}</label><button type="button" class="text-button" data-action="content-reset-field" data-value="${f.key}" aria-label="Khôi phục ${e(f.label)}">Về gốc</button></div>${f.multiline?`<textarea id="content-${f.key}" data-content-field="${f.key}" maxlength="${f.max}" rows="${f.max>500?5:3}">${e(this.target[f.key])}</textarea>`:`<input id="content-${f.key}" data-content-field="${f.key}" value="${e(this.target[f.key])}" maxlength="${f.max}" ${f.key==='name'?!brandLogo(this.draft.brand)?'required':'':f.optional?'':'required'} ${f.key==='name'?'aria-describedby="content-name-help"':''}>`}<small ${f.key==='name'?'id="content-name-help"':''}><span data-content-count="${f.key}">${this.target[f.key].length}</span>/${f.max} ký tự${f.key==='name'?brandLogo(this.draft.brand)?' · Có thể để trống vì đã có logo':' · Bắt buộc khi chưa có logo':f.optional?' · Có thể để trống':''}</small></div>`).join('')}
      ${this.section!=='brand'?`<div class="content-variables">${icon('info')}<span>Biến tự thay: <code>{brand}</code> tên thương hiệu, <code>{shortBrand}</code> tên rút gọn, <code>{customer}</code> tên khách, <code>{dailyFree}</code> lượt miễn phí/ngày. Nội dung lưu dưới dạng chữ, không cần mã HTML.</span></div>`:''}
      ${this.section==='rules'?'<p class="hint">Bảng tỷ lệ thực tế vẫn lấy từ cấu hình chiến dịch. Khi chỉnh thể lệ, hãy giữ nội dung phù hợp với cơ chế đang áp dụng.</p>':''}
      </section><aside class="content-preview-panel"><div class="theme-preview-label"><span>${icon('phone')} Xem trước nội dung</span><span class="badge gold">Minh họa</span></div><div id="content-preview">${this.preview(prizes,settings)}</div><p class="hint">Bản xem trước không cấp lượt hoặc voucher. <a href="#play">Mở trang khách đang dùng →</a></p><div class="content-recovery"><strong>${icon('refresh')} Khôi phục nội dung</strong><p>${previous?'Có bản lưu trước'+(previous.savedAt?' · '+dateTimeLabel(previous.savedAt):' · Nội dung gốc'):'Bản lưu trước sẽ xuất hiện sau lần chỉnh sửa đầu tiên.'}</p><button type="button" class="btn small secondary" data-action="content-previous" ${previous?'':'disabled'}>Lấy bản lưu trước</button><button type="button" class="text-button" data-action="content-reset-all">Đưa tất cả nội dung về gốc</button><small>Các lựa chọn này đưa nội dung vào bản nháp để anh kiểm tra trước khi lưu.</small></div></aside></div>
      <div class="content-save-bar"><div><strong id="content-save-status">${this.dirty?'Có thay đổi chưa lưu':'Nội dung đang được sử dụng'}</strong><p id="content-conflict" ${this.revision===contentRevision(settings)?'hidden':''}>Có thay đổi từ tab khác. Tải bản đang dùng để tiếp tục.</p><small>Chỉ lưu nội dung và thương hiệu; quà, tỷ lệ và ví khách giữ nguyên.</small></div><div class="form-actions"><button type="button" class="btn secondary" data-action="content-discard">Tải bản đang dùng</button><button class="btn" type="submit" data-content-save ${this.dirty&&!this.uploading?'':'disabled'}>${icon('check')}Lưu nội dung</button></div></div><p class="inline-error" data-error role="alert"></p>
    </form>`;
  }
  logoEditor(){
    const brand=this.draft.brand;
    return `<div class="logo-variants">${LOGO_VARIANTS.map(({key,surface,label})=>{
      const own=brand[key],image=brandLogo(brand,surface),busy=this.pendingLogos.has(key);
      return `<section class="logo-variant"><label for="content-${key}">${label}</label><div class="logo-variant-sample" data-logo-surface="${surface}">${image?`<img src="${e(image)}" alt="Xem trước ${label.toLowerCase()}">`:`${icon('store')}<span>Chưa có logo</span>`}</div><span class="logo-variant-state">${own?'Đã tải phiên bản riêng':image?'Dùng chung phiên bản '+(surface==='light'?'nền tối':'nền sáng'):'Chưa tải ảnh'}</span><input id="content-${key}" data-logo-variant="${key}" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" class="text-button" data-action="content-remove-logo" data-value="${key}" ${own||busy?'':'disabled'} aria-label="Xóa ${label.toLowerCase()}">${icon('refresh')}Xóa phiên bản này</button><p id="logo-upload-status-${key}" class="logo-upload-status" role="status">${busy?'Đang xử lý logo…':''}</p></section>`;
    }).join('')}</div><p class="hint logo-format-hint">PNG, JPG, WebP · tối đa 2 MB mỗi ảnh. Ưu tiên PNG hoặc WebP nền trong suốt. Ảnh được thu gọn và giữ nguyên màu.</p><p class="hint logo-selection-hint">Hệ thống tự chọn theo nền tại từng vị trí. Chỉ tải một phiên bản? Ảnh đó sẽ dùng cho cả nền sáng và nền tối. Logo đã có được giữ ở ô nền sáng.</p><p class="hint">Có ít nhất một logo: anh có thể để trống tên để chỉ hiển thị logo. Tên rút gọn vẫn dùng trong lời chào; nếu cả hai tên đều trống, các biến tên dùng “quán”. Khi xóa hết logo, cần nhập lại tên thương hiệu.</p>`;
  }
  preview(prizes,settings){
    const theme=contentTheme(this.themeId,this.draft),brand=this.draft.brand;
    if(['brand','theme','general'].includes(this.section))return `<div class="theme-preview content-phone ${theme.scene?'festival-preview':''}" data-theme="${theme.id}">${theme.scene&&settings.appearance?.decorations!==false?`<div class="festival-scene" aria-hidden="true"><img src="${e(theme.scene)}" alt=""></div>`:''}<div class="theme-preview-brand"><span class="preview-identity">${brandMarkup(this.draft,'mini',theme.logoSurface)}</span><span>${e(theme.occasion)}</span></div><div class="theme-preview-content"><p class="theme-preview-title serif">${e(theme.mobileLead)}<br><em>${e(theme.mobileEmphasis)}</em></p><div class="wheel-wrap"><span class="wheel-pointer"></span><canvas id="content-preview-wheel" aria-label="Vòng quay minh họa" role="img"></canvas><div class="wheel-hub">${brandMarkup(this.draft,'hub')}</div></div><p class="theme-preview-message">${e(theme.message)}</p></div><div class="theme-preview-cta">${icon('wheel')} ${this.text('spinButton')} · 1 LƯỢT ${icon('arrow')}</div></div><div class="content-preview-copy"><strong>${this.text('gameTitle')}</strong><p>${e(theme.intro)}</p><p>${this.text('heroNote')}</p><small>${[brand.name,brand.slogan].filter(Boolean).map(e).join(' · ')}</small></div>`;
    if(this.section==='wallet')return `<div class="content-preview-card"><span class="preview-identity">${brandMarkup(this.draft,'mini')}</span><small>${this.text('walletEyebrow')}</small><h2 class="serif">${this.text('walletTitle')}</h2><p>${this.text('walletGreeting')}</p><div class="content-sample-ticket">${icon('gift')}<strong>${this.text('walletEmptyTitle')}</strong><p>${this.text('walletEmptyBody')}</p></div><p>${this.text('voucherUseIntro')}</p></div>`;
    if(this.section==='result'){const prize=prizes.find(p=>p.kind!=='lose');return `<div class="content-preview-card content-result-preview" data-theme="${theme.id}"><span class="preview-identity">${brandMarkup(this.draft,'mini')}</span><div class="content-sample-ticket">${icon('gift')}<small>${this.text('winEyebrow')}</small><h2 class="serif">${e(prize?.name||'Phần thưởng mẫu')}</h2><p>${this.text('winMessage')}</p><span class="theme-preview-cta">${this.text('walletButton')}</span></div><small>${this.text('loseEyebrow')}</small><h3 class="serif">${this.text('loseTitle')}</h3><span class="text-button">${this.text('continueButton')} →</span></div>`;}
    return `<div class="content-preview-card"><small>${this.text('rulesEyebrow')}</small><h2 class="serif">${this.text('rulesTitle')}</h2><p>${this.text('rulesIntro')}</p><h3>${this.text('rulesLeadTitle')}</h3><p>${this.text('rulesLeadBody')}</p>${[['01 · Nhận lượt quay','rulesTurns'],['02 · Kết quả & tỷ lệ','rulesProbability'],['03 · Lưu & sử dụng voucher','rulesVoucher'],['04 · Mã khôi phục & dữ liệu','rulesRecovery']].map(([title,key])=>`<h4>${title}</h4><p>${this.text(key,{dailyFree:settings.dailyFree})}</p>`).join('')}</div>`;
  }
  sync(prizes,settings){
    const preview=document.getElementById('content-preview');if(!preview)return;
    preview.innerHTML=this.preview(prizes,settings);this.draw(prizes);
    document.getElementById('content-state').textContent=this.dirty?'Bản nháp chưa lưu':'Đang dùng bản đã lưu';
    document.getElementById('content-save-status').textContent=this.uploading?'Đang xử lý logo…':this.dirty?'Có thay đổi chưa lưu':'Nội dung đang được sử dụng';
    document.querySelector('[data-content-save]').disabled=!this.dirty||this.uploading;
  }
  draw(prizes){const canvas=document.getElementById('content-preview-wheel');if(canvas){const theme=contentTheme(this.themeId,this.draft);new WheelRenderer(canvas).draw(prizes.map((p,i)=>({...p,color:theme.palette?theme.palette[i%theme.palette.length]:p.color})));}}
  async readLogo(file){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024)throw new Error('Chọn ảnh PNG, JPG hoặc WebP không quá 2 MB.');
    const url=URL.createObjectURL(file),img=new Image();
    try{
      img.src=url;await img.decode();
      if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>20000000)throw new Error('Ảnh quá lớn. Hãy chọn logo dưới 20 triệu điểm ảnh.');
      const scale=Math.min(1,512/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/webp',.9);
      if(data.length>LOGO_MAX_BYTES*4/3+50)throw new Error('Logo sau tối ưu vẫn lớn. Vui lòng chọn ảnh đơn giản hơn.');
      return data;
    }catch(error){if(error.name==='EncodingError')throw new Error('Không đọc được ảnh. Hãy chọn tệp ảnh hợp lệ.');throw error;}
    finally{URL.revokeObjectURL(url);}
  }
}
