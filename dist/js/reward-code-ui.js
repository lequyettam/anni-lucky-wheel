import {parseRewardCodes,usesRewardCodes,formatCodeMessage,DEFAULT_CODE_MESSAGE,MAX_REWARD_CODES} from './reward-codes.js';
import {escapeHTML as e,icon} from './visuals.js';

export function rewardCodeMarkup(voucher){
  if(!voucher?.externalCode)return '';
  return `<section class="imported-voucher"><span class="imported-voucher-label">${icon('ticket')} MÃ VOUCHER NHẬN QUÀ</span><code>${e(voucher.externalCode)}</code>${voucher.externalMessage?`<p>${e(voucher.externalMessage)}</p>`:''}<button type="button" class="text-button" data-action="copy" data-value="${e(voucher.externalCode)}">${icon('copy')}Sao chép mã nhận quà</button></section>`;
}

export function rewardCodeEditor(prize,issued=0){
  const imported=usesRewardCodes(prize);
  return `<section class="reward-code-editor field full"><div class="reward-code-heading">${icon('ticket')}<div><h3>Mã voucher cấp khi trúng</h3><p>Mỗi phần quà gắn với một mã riêng từ danh sách của anh.</p></div></div><label for="f-codeMode">Cách cấp mã</label><select id="f-codeMode" name="codeMode"><option value="automatic" ${!imported?'selected':''}>Mã do hệ thống tạo</option><option value="imported" ${imported?'selected':''}>Dùng mã voucher nhập sẵn</option></select><div id="reward-code-fields" ${!imported?'hidden':''}><div class="reward-code-summary"><strong id="reward-code-count">${prize.voucherCodes?.length||0} mã chưa cấp</strong><span>${issued} mã đã cấp cho khách</span></div><label for="f-voucherCodes">Danh sách mã chưa cấp</label><textarea id="f-voucherCodes" name="voucherCodes" rows="5" spellcheck="false" maxlength="100000" placeholder="AU79j090, SI9806, Q0O808, SA92U0, GA9H00">${e((prize.voucherCodes||[]).join('\n'))}</textarea><small>Mỗi mã một dòng hoặc cách nhau bằng dấu phẩy/chấm phẩy. Giữ nguyên chữ hoa/thường; không thêm tiêu đề cột. Tối đa ${MAX_REWARD_CODES} mã chưa cấp.</small><div class="reward-code-file"><label for="reward-code-file">Thêm mã từ tệp TXT / CSV</label><input id="reward-code-file" type="file" accept=".txt,.csv,text/plain,text/csv"><small>Tệp UTF-8 tối đa 100 KB. Mã trong tệp được thêm vào danh sách ở trên.</small></div><p id="reward-code-error" class="inline-error" role="status"></p><p class="hint">Số quà còn lại tự tính từ số mã chưa cấp. Mã đã cấp không xuất hiện trong danh sách và không thể cấp lại, kể cả khi voucher hết hạn hoặc đã dùng.</p><label for="f-codeMessage">Lời hướng dẫn kèm mã (tùy chọn)</label><textarea id="f-codeMessage" name="codeMessage" rows="2" maxlength="500" placeholder="${e(DEFAULT_CODE_MESSAGE)}">${e(prize.codeMessage??'')}</textarea><small>Chèn <strong>#mã</strong> để thay bằng mã của khách. Để trống nếu chỉ muốn hiển thị mã.</small><div class="reward-code-preview"><span>XEM TRƯỚC LỜI NHẮN</span><p id="reward-code-preview"></p></div></div></section>`;
}

export function syncRewardCodeEditor(form){
  const imported=form.elements.codeMode.value==='imported',lose=form.elements.kind.value==='lose';
  form.elements.codeMode.disabled=lose;
  const active=imported&&!lose;
  form.querySelector('#reward-code-fields').hidden=!active;
  const stock=form.elements.stock;
  if(active&&!stock.readOnly)stock.dataset.manualStock=stock.value;
  if(!active&&stock.readOnly)stock.value=stock.dataset.manualStock??stock.value;
  stock.readOnly=active;stock.setAttribute('aria-readonly',String(active));
  form.querySelector('label[for="f-stock"]').textContent=active?'Số quà còn lại (theo mã)':'Số quà còn lại';
  if(!active)return;
  const error=form.querySelector('#reward-code-error');error.textContent='';
  try{
    const codes=parseRewardCodes(form.elements.voucherCodes.value);
    stock.value=String(codes.length);form.querySelector('#reward-code-count').textContent=`${codes.length} mã chưa cấp · ${codes.length} phần quà`;
    form.querySelector('#reward-code-preview').textContent=form.elements.codeMessage.value.trim()?formatCodeMessage(form.elements.codeMessage.value,codes[0]||'AU79j090'):'Không kèm lời nhắn. Khách vẫn nhận được mã voucher.';
  }catch(err){error.textContent=err.message;form.querySelector('#reward-code-count').textContent='Danh sách cần kiểm tra';}
}

export async function importRewardCodeFile(form,file,canEdit){
  if(!file)return;
  const error=form.querySelector('#reward-code-error');
  if(!/\.(txt|csv)$/i.test(file.name)||file.size>100*1024){error.textContent='Chọn tệp TXT hoặc CSV UTF-8 không quá 100 KB.';return;}
  const request=Symbol();form.codeImportRequest=request;form.dataset.codesLoading='true';error.textContent='Đang đọc danh sách mã…';
  try{
    const text=await file.text();
    if(!form.isConnected||form.codeImportRequest!==request||!canEdit())return;
    const incoming=parseRewardCodes(text),existing=parseRewardCodes(form.elements.voucherCodes.value);
    const combined=parseRewardCodes([...existing,...incoming]);
    form.elements.voucherCodes.value=combined.join('\n');syncRewardCodeEditor(form);
  }catch(err){if(form.isConnected&&form.codeImportRequest===request)error.textContent=err.message;}
  finally{if(form.codeImportRequest===request){delete form.dataset.codesLoading;form.querySelector('#reward-code-file').value='';}}
}
