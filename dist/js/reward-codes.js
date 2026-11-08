/** Imported redemption codes. Preserve spelling; compare identifiers without case. */
export const MAX_REWARD_CODES = 1000;
export const DEFAULT_CODE_MESSAGE = 'Vui lòng sử dụng mã Voucher #mã tại quầy hoặc app mua hàng';
export const rewardCodeKey = value => String(value??'').trim().toUpperCase();
export const usesRewardCodes = prize => prize.codeMode === 'imported';
export const prizeRevision = state => Number.isSafeInteger(state.prizesRevision) ? state.prizesRevision : 0;

export function parseRewardCodes(input) {
  if(typeof input!=='string'&& !Array.isArray(input))throw new Error('Danh sách mã voucher không hợp lệ.');
  const parts=Array.isArray(input)?input:input.replace(/^\uFEFF/,'').split(/[,;\r\n\t]+/);
  const codes=[],seen=new Set();
  for(const part of parts){
    if(typeof part!=='string')throw new Error('Mỗi mã voucher phải là chuỗi ký tự.');
    const code=part.trim().replace(/^["'“”]|["'“”]$/g,'').trim();
    if(!code)continue;
    if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(code))throw new Error(`Mã thứ ${codes.length+1} không hợp lệ. Dùng 1–64 chữ không dấu, số hoặc dấu . _ -, không có khoảng trắng.`);
    const key=rewardCodeKey(code);
    if(seen.has(key))throw new Error(`Mã ${code} bị trùng trong danh sách (không phân biệt chữ hoa/thường).`);
    seen.add(key);codes.push(code);
    if(codes.length>MAX_REWARD_CODES)throw new Error(`Mỗi loại quà chứa tối đa ${MAX_REWARD_CODES} mã chưa cấp.`);
  }
  return codes;
}

export function validateRewardCodePools(prizes, issued=[]) {
  const occupied=new Set(issued.flatMap(v=>[v.code,v.externalCode]).filter(Boolean).map(rewardCodeKey));
  const pending=new Set();
  for(const p of prizes){
    if(p.codeMode!==undefined&&!['automatic','imported'].includes(p.codeMode))throw new Error('Cách cấp mã voucher không hợp lệ.');
    if(!usesRewardCodes(p)){
      if(p.voucherCodes?.length)throw new Error('Danh sách mã cần bật chế độ dùng mã nhập sẵn.');
      continue;
    }
    if(p.kind==='lose')throw new Error('Ô May mắn lần sau không thể cấp mã voucher.');
    if(!Array.isArray(p.voucherCodes))throw new Error('Thiếu danh sách mã voucher.');
    const codes=parseRewardCodes(p.voucherCodes);
    if(codes.length!==p.voucherCodes.length||codes.some((c,i)=>c!==p.voucherCodes[i]))throw new Error('Danh sách mã chưa được chuẩn hóa. Hãy nhập lại danh sách.');
    if(p.stock!==codes.length)throw new Error(`Số quà của “${p.name}” phải bằng số mã chưa cấp (${codes.length}).`);
    if(typeof p.codeMessage!=='string'||p.codeMessage.length>500)throw new Error('Lời hướng dẫn tối đa 500 ký tự.');
    for(const code of codes){
      const key=rewardCodeKey(code);
      if(occupied.has(key))throw new Error(`Mã ${code} đã được cấp cho khách hoặc trùng mã voucher đang có. Không thể nhập lại.`);
      if(pending.has(key))throw new Error(`Mã ${code} bị trùng giữa các phần thưởng.`);
      pending.add(key);
    }
  }
}

export const formatCodeMessage = (template,code) => String(template??'').replace(/#mã|\{code\}/gi,()=>code);
export const matchesVoucherCode = (voucher,input) => {
  const key=rewardCodeKey(input);
  return !!key&&(rewardCodeKey(voucher.code)===key||!!voucher.externalCode&&rewardCodeKey(voucher.externalCode)===key);
};
export function prizeForAward(prize){
  const {voucherCodes,codeMessage,codeMode,...snapshot}=prize;
  return structuredClone(snapshot);
}
