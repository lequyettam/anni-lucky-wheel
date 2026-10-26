/** Presentation presets only. Never write these colors back to prize records. */
export const THEMES = Object.freeze([
  {
    id:'anni', name:'ANNI nguyên bản', occasion:'Mỗi ngày tại ANNI', motif:'leaf', secondary:'cup',
    description:'Kem ấm, xanh lá và nét mộc quen thuộc của ANNI COFFEE.',
    eyebrow:'Một lời cảm ơn từ ANNI', headline:'Một vòng quay.', lead:'Thêm ', emphasis:'niềm vui.',
    mobileLead:'Chạm may mắn.', mobileEmphasis:'Nhận niềm vui.',
    intro:'Chạm một chút may mắn, nhận một món quà.', subline:'Để mỗi lần ghé ANNI đều thêm phần đặc biệt.',
    message:'Một niềm vui mới', palette:null,
    swatches:['#294D40','#D5B886','#F7F3EA'], confetti:['#B79859','#315645','#D6A18A','#E9D5AD']
  },
  {
    id:'halloween', name:'Halloween', occasion:'Halloween · 31.10', motif:'pumpkin', secondary:'moon',
    description:'Cam bí ngô, tím trầm và những điều bất ngờ dễ thương.',
    eyebrow:'Một mùa bí ẩn, nhiều niềm vui', headline:'Quay chút bí ẩn.', lead:'Nhận ', emphasis:'niềm vui.',
    mobileLead:'Quay chút bí ẩn.', mobileEmphasis:'Nhận quà vui.',
    intro:'Một vòng quay, một bất ngờ ngọt ngào.', subline:'Ghé ANNI, nhâm nhi cà phê và đón mùa Halloween.',
    message:'Bất ngờ ngọt ngào', palette:['#453348','#F1C791','#D6BDCF','#AB512C','#E4A561','#EFE1CA'],
    swatches:['#AB512C','#453348','#F1C791'], confetti:['#CB7838','#6A4B71','#E7BD74','#F3DDC3']
  },
  {
    id:'christmas', name:'Giáng sinh', occasion:'Giáng sinh · 25.12', motif:'snowflake', secondary:'gift',
    description:'Xanh thông, đỏ trầm và sắc kem của một mùa lễ ấm áp.',
    eyebrow:'Trao ấm áp, nhận niềm vui', headline:'Giáng sinh ấm.', lead:'Thêm ', emphasis:'quà xinh.',
    mobileLead:'Giáng sinh ấm.', mobileEmphasis:'Thêm quà xinh.',
    intro:'Một ly cà phê ấm, một món quà nhỏ.', subline:'Cùng ANNI lưu lại những khoảnh khắc mùa lễ hội.',
    message:'Gói một mùa vui', palette:['#244D40','#E8D4AF','#AEC4B1','#953D41','#CBA86A','#EDE8DA'],
    swatches:['#244D40','#953D41','#E8D4AF'], confetti:['#953D41','#35654E','#D0AF6C','#F0E7D3']
  },
  {
    id:'new-year', name:'Tết Dương lịch', occasion:'Chào năm mới · 01.01', motif:'firework', secondary:'spark',
    description:'Xanh đêm, vàng champagne và ánh pháo hoa đón năm mới.',
    eyebrow:'Chào năm mới cùng ANNI', headline:'Khởi đầu mới.', lead:'Đón ', emphasis:'may mắn.',
    mobileLead:'Khởi đầu mới.', mobileEmphasis:'May mắn tới.',
    intro:'Mở một năm mới bằng một niềm vui nhỏ.', subline:'Cùng ANNI nâng ly cà phê, đón những điều tốt đẹp.',
    message:'Khởi đầu rạng rỡ', palette:['#293D59','#E6CD98','#A9B8C9','#786242','#C4A45E','#E7E5DC'],
    swatches:['#293D59','#C4A45E','#E6CD98'], confetti:['#C4A45E','#344D71','#E8D8B4','#96AFC7']
  }
].map(theme => Object.freeze({...theme,
  palette:theme.palette?Object.freeze(theme.palette):null,
  swatches:Object.freeze(theme.swatches), confetti:Object.freeze(theme.confetti)
})));

export const isThemeId = id => THEMES.some(theme => theme.id === id);
export const getTheme = id => THEMES.find(theme => theme.id === id) || THEMES[0];
export function getAppearance(settings) {
  const appearance=settings?.appearance;
  return {theme:getTheme(appearance?.theme).id, decorations:typeof appearance?.decorations==='boolean'?appearance.decorations:true};
}
export function themedPrizes(prizes, themeId) {
  const palette=getTheme(themeId).palette;
  return prizes.map((prize,index)=>({...prize,color:palette?palette[index%palette.length]:prize.color}));
}
