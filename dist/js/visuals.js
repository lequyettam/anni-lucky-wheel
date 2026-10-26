export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  arrow:'M5 12h14m-6-6 6 6-6 6', chevron:'m9 5 7 7-7 7', close:'m6 6 12 12M6 18 18 6', check:'m5 12 4 4L19 6', plus:'M12 5v14M5 12h14',
  cup:'M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 0 1 0 6h-2M8 2v3m4-3v3m4-3v3',
  gift:'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
  ticket:'M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm12 0v2m0 3v2m0 3v2',
  spark:'m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z',
  leaf:'M20 3C10 1 2 7 5 15s17 5 15-12ZM5 20 16 8',
  wheel:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 3v18M3 12h18M6 6l12 12M6 18 18 6',
  wallet:'M20 7H5a3 3 0 0 1 0-6h13v6M4 4v15a2 2 0 0 0 2 2h14V7m-4 5h5v5h-5v-5Z',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  sound:'M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute:'M11 4 6 8H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6',
  info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v.1',
  user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  lock:'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4m-4 4v3',
  grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  chart:'M4 3v18h17M9 16v-5m5 5V6m5 10V9',
  settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
  download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  edit:'m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  copy:'M8 8h13v13H8zM16 8V3H3v13h5',
  phone:'M7 2 3 4c-1 8 7 16 15 17l3-4-5-4-3 3-5-5 3-3-4-6Z',
  store:'M3 10h18l-2-7H5l-2 7Zm2 0v11h14V10M9 21v-7h6v7',
  logout:'M9 3H3v18h6M8 12h13m-5-5 5 5-5 5',
  refresh:'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5'
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.gift}"/></svg>`;
export const dateLabel = iso => new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(iso));
export const dateTimeLabel = iso => new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(iso));
export const percentLabel = weight => (weight / 100).toLocaleString('vi-VN',{maximumFractionDigits:2}) + '%';
export class WheelRenderer {
  constructor(canvas) { this.canvas = canvas; this.rotation = 0; }
  draw(prizes) {
    const size = 1000, c = this.canvas.getContext('2d');
    this.canvas.width = size; this.canvas.height = size;
    c.clearRect(0,0,size,size); const center = size/2, radius = 480, slice = Math.PI*2/prizes.length;
    prizes.forEach((prize, index) => {
      const start = -Math.PI/2+index*slice, mid = start+slice/2;
      c.beginPath();c.moveTo(center,center);c.arc(center,center,radius,start,start+slice);c.closePath(); c.fillStyle=prize.color;c.fill();c.strokeStyle='#F9F2E5';c.lineWidth=3;c.stroke();
      c.save(); c.translate(center+Math.cos(mid)*radius*.7,center+Math.sin(mid)*radius*.7); c.rotate(mid+Math.PI/2);
      const rgb = prize.color.match(/[a-f0-9]{2}/gi)?.map(v=>parseInt(v,16)) || [255,255,255];
      const isDark = rgb[0]*.299 + rgb[1]*.587 + rgb[2]*.114 < 130;
      c.fillStyle=isDark?'#FCF4E5':'#302C24'; c.font='600 34px Arial, sans-serif';c.textAlign='center'; c.textBaseline='middle';
      let lines = [prize.short]; if (prize.short.length>15) { const words=prize.short.split(' ');const half=Math.ceil(words.length/2);lines=[words.slice(0,half).join(' '),words.slice(half).join(' ')]; }
      lines.forEach((line,j)=>c.fillText(line,0,(j-(lines.length-1)/2)*39,270));
      c.globalAlpha=.6;c.font='24px Georgia, serif'; c.fillText(prize.kind==='lose'?'✧':prize.kind==='drink'?'☕':'✦',0,64);c.restore();
    });
    for(let i=0;i<48;i++){const a=i*Math.PI*2/48;c.beginPath();c.arc(center+Math.cos(a)*491,center+Math.sin(a)*491,3,0,Math.PI*2);c.fillStyle='#B69A68';c.fill();}
  }
  async spin(index,count,reduced=false) {
    const target = (360-(index+.5)*360/count)%360;
    this.rotation += 360*6 + (target-this.rotation%360+360)%360;
    const duration = reduced ? 550 : 5200;
    this.canvas.style.transition=`transform ${duration}ms cubic-bezier(.12,.62,.12,1)`;
    this.canvas.style.transform=`rotate(${this.rotation}deg)`;
    await new Promise(resolve=>setTimeout(resolve,duration+80));
  }
}
export class SoundController {
  constructor() { this.enabled = localStorage.getItem('anni-sound') !== 'off'; this.context=null;this.timer=null; }
  activate() { try { this.context ||= new (window.AudioContext || window.webkitAudioContext)(); if(this.context.state==='suspended') this.context.resume(); } catch {} }
  tone(frequency,duration=.035,gain=.06,delay=0) {
    if(!this.enabled || !this.context) return;
    const time=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();o.frequency.value=frequency;o.type='sine';g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.connect(g);g.connect(this.context.destination);o.start(time);o.stop(time+duration);
  }
  spin(duration) { const start=performance.now();const tick=()=>{const elapsed=performance.now()-start;if(elapsed>=duration)return;this.tone(720,.025,.025);this.timer=setTimeout(tick,45+Math.pow(elapsed/duration,2)*240);};tick(); }
  win() { [523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.3,.05,i*.12)); }
  toggle(){this.enabled=!this.enabled;localStorage.setItem('anni-sound',this.enabled?'on':'off');return this.enabled;}
}
export function confetti() {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer=document.createElement('div');layer.className='confetti';layer.setAttribute('aria-hidden','true');
  for(let i=0;i<70;i++){const e=document.createElement('i');e.style.cssText=`--x:${Math.random()*100}vw;--delay:${Math.random()*.65}s;--drift:${Math.random()*220-110}px;--rotate:${Math.random()*720}deg;background:${['#B79859','#315645','#D6A18A','#E9D5AD'][i%4]}`;layer.append(e);}
  document.body.append(layer);setTimeout(()=>layer.remove(),4500);
}
