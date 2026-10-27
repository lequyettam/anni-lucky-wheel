import {THEMES} from './themes.js';
import {BRAND_FIELDS,CONTENT_GROUPS,THEME_FIELDS,defaultContent,getContent,contentRevision,contentVariables,formatContent,contentTheme,LOGO_MAX_BYTES} from './content.js';
import {escapeHTML as e,icon,WheelRenderer,dateTimeLabel} from './visuals.js';

export function brandMarkup(content,place='header'){
  const brand=content.brand,label=place==='hub'?(brand.shortName||brand.name):brand.name;
  const parts=label.match(/^(.+?)\s+(COFFEE)$/i),main=parts?parts[1]:label,sub=parts?parts[2]:'';
  const words=`<span class="brand-words ${place==='header'?'wordmark':''} ${main.length>12?'long-brand':''}"><strong>${e(main)}</strong>${sub?`<small>${e(sub)}</small>`:''}</span>`;
  if(place==='hub')return brand.logo?`<img class="hub-logo" src="${e(brand.logo)}" alt="${e(brand.name)}">`:words;
  return `${brand.logo?`<img class="brand-logo" src="${e(brand.logo)}" alt="">`:place==='header'?`<span class="brand-mark">${e(Array.from(main)[0]?.toLocaleLowerCase('vi')||'a')}</span>`:''}${words}`;
}
export class ContentEditor {
  constructor(settings){
    this.draft=getContent(settings);this.base=JSON.stringify(this.draft);this.revision=contentRevision(settings);
    this.section='brand';this.themeId=settings.appearance?.theme||'anni';this.uploading=false;this.uploadToken=0;
  }
  get dirty(){return JSON.stringify(this.draft)!==this.base;}
  get fields(){return this.section==='brand'?BRAND_FIELDS:this.section==='theme'?THEME_FIELDS:CONTENT_GROUPS.find(g=>g.id===this.section).fields;}
  get target(){return this.section==='brand'?this.draft.brand:this.section==='theme'?this.draft.themes[this.themeId]:this.draft.text;}
  get defaults(){const d=defaultContent();return this.section==='brand'?d.brand:this.section==='theme'?d.themes[this.themeId]:d.text;}
  setField(key,value){if(this.fields.some(f=>f.key===key))this.target[key]=value;}
  resetField(key){if(this.fields.some(f=>f.key===key))this.target[key]=this.defaults[key];}
  resetSection(){for(const f of this.fields)this.resetField(f.key);if(this.section==='brand')this.draft.brand.logo='';this.uploadToken++;this.uploading=false;}
  resetAll(){this.draft=defaultContent();this.uploadToken++;this.uploading=false;}
  previous(settings){this.draft=getContent({content:settings.contentPrevious.content});this.uploadToken++;this.uploading=false;}
  text(key,extra={}){return e(formatContent(this.draft.text[key],contentVariables(this.draft,{customer:'Khách trải nghiệm',...extra})));}
  render(settings,prizes){
    const groups=[{id:'brand',label:'Thương hiệu',icon:'store'},{id:'theme',label:'Lời chào theo theme',icon:'spark'},...CONTENT_GROUPS];
    const selected=groups.find(g=>g.id===this.section),previous=settings.contentPrevious;
    return `<form data-form="content" novalidate>
      <div class="content-intro"><p>Chỉnh sửa và xem trước ở bên phải. Chỉ bấm <strong>Lưu nội dung</strong> khi anh muốn áp dụng.</p><span class="badge gold" id="content-state">${this.dirty?'Bản nháp chưa lưu':'Đang dùng bản đã lưu'}</span></div>
      <div class="content-tabs" role="group" aria-label="Nhóm nội dung">${groups.map(g=>`<button type="button" data-action="content-section" data-value="${g.id}" aria-pressed="${g.id===this.section}" class="${g.id===this.section?'selected':''}">${icon(g.icon)}${g.label}</button>`).join('')}</div>
      <div class="content-workspace"><section class="panel content-fields"><div class="panel-title"><h2>${icon(selected.icon)}${selected.label}</h2><button type="button" class="text-button" data-action="content-reset-section">${icon('refresh')}Về gốc nhóm này</button></div>
      ${this.section==='theme'?`<div class="field"><label for="content-theme">Chủ đề cần sửa lời chào</label><select id="content-theme">${THEMES.map(t=>`<option value="${t.id}" ${t.id===this.themeId?'selected':''}>${e(t.name)}</option>`).join('')}</select><small>Nội dung được lưu riêng cho từng theme. Chọn ở đây chỉ đổi bản xem trước.</small></div>`:''}
      ${this.section==='brand'?`<div class="logo-editor"><div class="logo-sample">${this.draft.brand.logo?`<img src="${e(this.draft.brand.logo)}" alt="Logo trong bản nháp">`:icon('store')}</div><div><label for="content-logo">Logo thương hiệu</label><input id="content-logo" type="file" accept="image/png,image/jpeg,image/webp"><p>PNG, JPG, WebP · tối đa 2 MB. Ảnh được thu gọn, giữ tỷ lệ và nền trong suốt.</p><button type="button" class="text-button" data-action="content-remove-logo">${icon('refresh')}Dùng biểu trưng chữ</button><p id="logo-upload-status" role="status"></p></div></div><p class="hint">Tên rút gọn dùng ở tâm vòng quay và lời chào. Để trống để dùng tên thương hiệu; các lời chào có biến sẽ tự cập nhật.</p>`:''}
      ${this.fields.map(f=>`<div class="field content-field"><div class="content-field-label"><label for="content-${f.key}">${e(f.label)}</label><button type="button" class="text-button" data-action="content-reset-field" data-value="${f.key}" aria-label="Khôi phục ${e(f.label)}">Về gốc</button></div>${f.multiline?`<textarea id="content-${f.key}" data-content-field="${f.key}" maxlength="${f.max}" rows="${f.max>500?5:3}">${e(this.target[f.key])}</textarea>`:`<input id="content-${f.key}" data-content-field="${f.key}" value="${e(this.target[f.key])}" maxlength="${f.max}" ${f.optional?'':'required'}>`}<small><span data-content-count="${f.key}">${this.target[f.key].length}</span>/${f.max} ký tự${f.optional?' · Có thể để trống':''}</small></div>`).join('')}
      ${this.section!=='brand'?`<div class="content-variables">${icon('info')}<span>Biến tự thay: <code>{brand}</code> tên thương hiệu, <code>{shortBrand}</code> tên rút gọn, <code>{customer}</code> tên khách, <code>{dailyFree}</code> lượt miễn phí/ngày. Nội dung lưu dưới dạng chữ, không cần mã HTML.</span></div>`:''}
      ${this.section==='rules'?'<p class="hint">Bảng tỷ lệ thực tế vẫn lấy từ cấu hình chiến dịch. Khi chỉnh thể lệ, hãy giữ nội dung phù hợp với cơ chế đang áp dụng.</p>':''}
      </section><aside class="content-preview-panel"><div class="theme-preview-label"><span>${icon('phone')} Xem trước nội dung</span><span class="badge gold">Minh họa</span></div><div id="content-preview">${this.preview(prizes,settings)}</div><p class="hint">Bản xem trước không cấp lượt hoặc voucher. <a href="#play">Mở trang khách đang dùng →</a></p><div class="content-recovery"><strong>${icon('refresh')} Khôi phục nội dung</strong><p>${previous?'Có bản lưu trước'+(previous.savedAt?' · '+dateTimeLabel(previous.savedAt):' · Nội dung gốc'):'Bản lưu trước sẽ xuất hiện sau lần chỉnh sửa đầu tiên.'}</p><button type="button" class="btn small secondary" data-action="content-previous" ${previous?'':'disabled'}>Lấy bản lưu trước</button><button type="button" class="text-button" data-action="content-reset-all">Đưa tất cả nội dung về gốc</button><small>Các lựa chọn này đưa nội dung vào bản nháp để anh kiểm tra trước khi lưu.</small></div></aside></div>
      <div class="content-save-bar"><div><strong id="content-save-status">${this.dirty?'Có thay đổi chưa lưu':'Nội dung đang được sử dụng'}</strong><p id="content-conflict" ${this.revision===contentRevision(settings)?'hidden':''}>Có thay đổi từ tab khác. Tải bản đang dùng để tiếp tục.</p><small>Chỉ lưu nội dung và thương hiệu; quà, tỷ lệ và ví khách giữ nguyên.</small></div><div class="form-actions"><button type="button" class="btn secondary" data-action="content-discard">Tải bản đang dùng</button><button class="btn" type="submit" data-content-save ${this.dirty?'':'disabled'}>${icon('check')}Lưu nội dung</button></div></div><p class="inline-error" data-error role="alert"></p>
    </form>`;
  }
  preview(prizes,settings){
    const theme=contentTheme(this.themeId,this.draft),brand=this.draft.brand;
    if(['brand','theme','general'].includes(this.section))return `<div class="theme-preview content-phone ${theme.scene?'festival-preview':''}" data-theme="${theme.id}">${theme.scene&&settings.appearance?.decorations!==false?`<div class="festival-scene" aria-hidden="true"><img src="${e(theme.scene)}" alt=""></div>`:''}<div class="theme-preview-brand"><span class="preview-identity">${brandMarkup(this.draft,'mini')}</span><span>${e(theme.occasion)}</span></div><div class="theme-preview-content"><p class="theme-preview-title serif">${e(theme.mobileLead)}<br><em>${e(theme.mobileEmphasis)}</em></p><div class="wheel-wrap"><span class="wheel-pointer"></span><canvas id="content-preview-wheel" aria-label="Vòng quay minh họa" role="img"></canvas><div class="wheel-hub">${brandMarkup(this.draft,'hub')}</div></div><p class="theme-preview-message">${e(theme.message)}</p></div><div class="theme-preview-cta">${icon('wheel')} ${this.text('spinButton')} · 1 LƯỢT ${icon('arrow')}</div></div><div class="content-preview-copy"><strong>${this.text('gameTitle')}</strong><p>${e(theme.intro)}</p><p>${this.text('heroNote')}</p><small>${e(brand.name)}${brand.slogan?' · '+e(brand.slogan):''}</small></div>`;
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
