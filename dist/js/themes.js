/** Presentation presets only. Art and palettes never change the prize records. */
const original = {
  id:'anni', name:'ANNI nguyên bản', occasion:'Mỗi ngày tại ANNI', motif:'leaf', secondary:'cup',
  description:'Kem ấm, xanh lá và nét mộc quen thuộc của ANNI COFFEE.',
  eyebrow:'Một lời cảm ơn từ ANNI', headline:'Một vòng quay.', lead:'Thêm ', emphasis:'niềm vui.',
  mobileLead:'Chạm may mắn.', mobileEmphasis:'Nhận niềm vui.',
  intro:'Chạm một chút may mắn, nhận một món quà.', subline:'Để mỗi lần ghé ANNI đều thêm phần đặc biệt.',
  message:'Một niềm vui mới', palette:null, scene:null,
  swatches:['#294D40','#D5B886','#F7F3EA'], confetti:['#B79859','#315645','#D6A18A','#E9D5AD']
};
const festivals = [
  {id:'halloween',name:'Halloween',occasion:'Halloween · 31.10',motif:'pumpkin',secondary:'moon',
   description:'Phố cà phê đêm, trăng vàng và những trái bí ngô rực sáng.',
   headline:'HALLOWEEN',emphasis:'tại ANNI',eyebrow:'31.10 · Đêm hội bí ngô',
   intro:'Một vòng quay, một bất ngờ ngọt ngào.',subline:'Cà phê ấm. Đêm huyền bí. Những món quà đang đợi.',message:'Bất ngờ ngọt ngào',
   palette:['#38283F','#EABF7A','#826181','#914722','#C58C46','#F0DEC0'],
   swatches:['#231627','#EABF7A','#914722'],confetti:['#F4BE69','#A77BBB','#FCE4B7','#CF7B40']},
  {id:'christmas',name:'Giáng sinh',occasion:'Giáng sinh · 25.12',motif:'snowflake',secondary:'gift',
   description:'Phố thông xanh phủ tuyết, ánh đèn ấm và những hộp quà.',
   headline:'GIÁNG SINH',emphasis:'ấm cùng ANNI',eyebrow:'25.12 · Mùa trao yêu thương',
   intro:'Gói một mùa vui trong từng món quà.',subline:'Nhâm nhi cà phê ấm, chạm vào chút nhiệm màu.',message:'Món quà mùa Giáng sinh',
   palette:['#163F32','#E7D2A2','#A7BA9F','#95383D','#C39C53','#F1E8D3'],
   swatches:['#12352B','#95383D','#E7D2A2'],confetti:['#C9575E','#A7BA9F','#E3C784','#FFF0D1']},
  {id:'new-year',name:'Tết Dương lịch',occasion:'Chào năm mới · 01.01',motif:'firework',secondary:'spark',
   description:'Đêm xanh thẫm, pháo hoa ánh kim và một khởi đầu rạng rỡ.',
   headline:'CHÀO NĂM MỚI',emphasis:'đón may mắn',eyebrow:'01.01 · Khởi đầu rạng rỡ',
   intro:'Mở năm mới bằng một niềm vui nhỏ.',subline:'Cùng ANNI nâng ly cà phê, đón những điều tốt đẹp.',message:'Khởi đầu rạng rỡ',
   palette:['#182E4C','#E7CF97','#9AAFCB','#715939','#BA9347','#F0E5CC'],
   swatches:['#12233E','#D9B96F','#F0E5CC'],confetti:['#E0BF6F','#789CC9','#FFF0C4','#C18C4A']},
  {id:'lunar-new-year',name:'Tết Nguyên đán',occasion:'Tết cổ truyền Việt Nam',motif:'flower',secondary:'gift',
   description:'Mai vàng, đào hồng, bánh chưng và bao lì xì đón Tết Việt.',
   headline:'TẾT AN KHANG',emphasis:'lộc đến cùng ANNI',eyebrow:'Tết Nguyên đán · Xuân sum vầy',
   intro:'Khai xuân một vòng, đón lộc một năm.',subline:'Hương cà phê đầu năm, lời chúc bình an gửi bạn.',message:'Lộc xuân trao tay',
   palette:['#8A1924','#F4D591','#B55642','#31513C','#CD9A42','#F6E7C4'],
   swatches:['#841725','#F4D591','#31513C'],confetti:['#F2C65F','#F2A19A','#B62F3B','#F8E3A9']},
  {id:'reunification',name:'Ngày Thống nhất 30/4',occasion:'30.4 · Ngày Thống nhất',motif:'star',secondary:'spark',
   description:'Cờ đỏ sao vàng, cánh chim hòa bình và sắc sen ngày hội.',
   headline:'RẠNG RỠ 30/4',emphasis:'chung một niềm vui',eyebrow:'30.4 · Mừng ngày đất nước thống nhất',
   intro:'Cùng ANNI hòa chung niềm vui ngày hội.',subline:'Một ly cà phê, một khoảnh khắc bình yên đáng nhớ.',message:'Niềm vui ngày hội',
   palette:['#9F242A','#EAC763','#C57042','#624934','#CE9F50','#F1DFC1'],
   swatches:['#9F242A','#EAC763','#F1DFC1'],confetti:['#CA3C42','#EAC763','#F1DFC1','#EB9A60']},
  {id:'womens-day',name:'Quốc tế Phụ nữ 8/3',occasion:'08.03 · Quốc tế Phụ nữ',motif:'flower',secondary:'gift',
   description:'Vườn hoa hồng, dải lụa mềm và sắc vàng hồng tinh tế.',
   headline:'RẠNG RỠ 8/3',emphasis:'như chính bạn',eyebrow:'08.03 · Gửi một lời yêu thương',
   intro:'Một chút ngọt ngào dành riêng cho bạn.',subline:'Chúc bạn luôn được yêu thương, hôm nay và mỗi ngày.',message:'Gửi bạn ngàn yêu thương',
   palette:['#653143','#F0C5B7','#B97B8D','#846750','#D6A780','#F7E4D5'],
   swatches:['#653143','#E9B1A6','#F7E4D5'],confetti:['#E5A7B1','#C78F62','#F8DDC8','#BC6C86']},
  {id:'teachers-day',name:'Ngày Nhà giáo 20/11',occasion:'20.11 · Ngày Nhà giáo Việt Nam',motif:'book',secondary:'flower',
   description:'Góc sách xanh trầm, ánh đèn vàng và những đóa hoa tri ân.',
   headline:'TRI ÂN THẦY CÔ',emphasis:'người gieo ánh sáng',eyebrow:'20.11 · Ngày Nhà giáo Việt Nam',
   intro:'Gửi lời cảm ơn qua một món quà nhỏ.',subline:'Cùng ANNI trân trọng những người thắp sáng tri thức.',message:'Một món quà tri ân',
   palette:['#1F443B','#E8CE94','#9AAA8A','#795139','#BF9752','#F1E5C8'],
   swatches:['#1F443B','#BF9752','#F1E5C8'],confetti:['#B89450','#B8C6A4','#F4E2BC','#759B88']}
].map(theme=>({...theme,lead:'',mobileLead:theme.headline,mobileEmphasis:theme.emphasis,scene:`./assets/themes/${theme.id}.webp`}));
export const THEMES = Object.freeze([original,...festivals].map(theme=>Object.freeze({...theme,
  logoSurface:theme.scene?'dark':'light',
  palette:theme.palette?Object.freeze(theme.palette):null,
  swatches:Object.freeze(theme.swatches),confetti:Object.freeze(theme.confetti)
})));
export const isThemeId = id => THEMES.some(theme=>theme.id===id);
export const getTheme = id => THEMES.find(theme=>theme.id===id)||THEMES[0];
export function getAppearance(settings) {
  const appearance=settings?.appearance;
  return {theme:getTheme(appearance?.theme).id,decorations:typeof appearance?.decorations==='boolean'?appearance.decorations:true};
}
export function themedPrizes(prizes,themeId) {
  const palette=getTheme(themeId).palette;
  return prizes.map((prize,index)=>({...prize,color:palette?palette[index%palette.length]:prize.color}));
}
