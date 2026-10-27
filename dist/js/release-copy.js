/** Presentation compatibility for exact copy shipped before 0.8.
 * Never rewrite custom terms or persisted vouchers as part of a UI release.
 */
export const PRIZE_TERMS = Object.freeze({
  off10:'Giảm tối đa 20.000đ cho đơn từ 100.000đ. Không cộng dồn ưu đãi.',
  off20:'Giảm tối đa 30.000đ cho đơn từ 150.000đ. Không cộng dồn ưu đãi.',
  off30:'Giảm tối đa 50.000đ cho đơn từ 200.000đ. Không cộng dồn ưu đãi.',
  milk:'Một ly cà phê sữa size tiêu chuẩn tại cửa hàng. Không quy đổi tiền mặt.',
  grand:'Liên hệ nhân viên tại cửa hàng để được hướng dẫn điều kiện áp dụng.'
});
const legacyTerms = new Map([
  ['Quà mẫu: giảm tối đa 20.000đ cho đơn từ 100.000đ. Không cộng dồn ưu đãi.',PRIZE_TERMS.off10],
  ['Quà mẫu: giảm tối đa 30.000đ cho đơn từ 150.000đ. Không cộng dồn ưu đãi.',PRIZE_TERMS.off20],
  ['Quà mẫu: giảm tối đa 50.000đ cho đơn từ 200.000đ. Không cộng dồn ưu đãi.',PRIZE_TERMS.off30],
  ['Quà mẫu: một ly cà phê sữa size tiêu chuẩn tại cửa hàng. Không quy đổi tiền mặt.',PRIZE_TERMS.milk],
  ['Giải đặc biệt minh họa. Chưa áp dụng cho giao dịch thực tế.',PRIZE_TERMS.grand],
  ['Quà mẫu, chưa có giá trị sử dụng.','Áp dụng tại cửa hàng theo điều kiện của chương trình.']
]);
export const displayPrizeTerms = value => legacyTerms.get(value)??String(value??'');

export const LEGACY_CONTENT = Object.freeze({
  loginIntro:'Nhập số điện thoại để bắt đầu. Bản trải nghiệm chưa dùng OTP; bạn có thể dùng số mẫu bên dưới.',
  rulesIntro:'Thể lệ của chiến dịch đang được thiết lập trong bản trải nghiệm.',
  rulesLeadBody:'Nhận lượt quay, chạm vào vòng quay và lưu lại món quà của bạn. Mang voucher đến {brand} để trải nghiệm quy trình đổi quà.',
  rulesRecovery:'Số điện thoại được kiểm tra định dạng, chưa xác thực bằng OTP. Lưu mã khôi phục khi trúng quà lần đầu. Trong bản demo, ví chỉ tồn tại trong trình duyệt này; xóa dữ liệu trình duyệt sẽ xóa dữ liệu mẫu. Không nhập dữ liệu khách hàng thật. Phiên bản máy chủ mới hỗ trợ khôi phục trên thiết bị khác.'
});
export function upgradePresentationText(text,defaults){
  return Object.fromEntries(Object.entries(text).map(([key,value])=>[key,Object.hasOwn(LEGACY_CONTENT,key)&&value===LEGACY_CONTENT[key]?defaults[key]:value]));
}
