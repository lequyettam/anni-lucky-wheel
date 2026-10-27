import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultContent,getContent} from '../dist/js/content.js';
import {displayPrizeTerms,LEGACY_CONTENT,PRIZE_TERMS} from '../dist/js/release-copy.js';

test('Old shipped content upgrades for display without changing saved branding or history',()=>{
  const content=defaultContent();
  content.brand.name='Thương hiệu riêng';
  content.themes.halloween.headline='Đêm hội của quán';
  Object.assign(content.text,LEGACY_CONTENT);
  const settings={content,contentRevision:7,appearance:{theme:'halloween'},contentPrevious:{content:structuredClone(content)}};
  const before=structuredClone(settings),shown=getContent(settings);
  for(const key of Object.keys(LEGACY_CONTENT))assert.equal(shown.text[key],defaultContent().text[key]);
  assert.deepEqual(shown.brand,content.brand);
  assert.deepEqual(shown.themes,content.themes);
  assert.deepEqual(settings,before);
});

test('Custom copy and prize conditions are preserved even when containing old wording',()=>{
  const content=defaultContent();
  content.text.loginIntro='Khách trải nghiệm hương vị mới tại quán.';
  content.text.rulesRecovery=LEGACY_CONTENT.rulesRecovery+' Nội dung chủ quán đã chỉnh sửa.';
  assert.deepEqual(getContent({content}).text,content.text);
  const custom='Mẫu bánh theo ngày. Áp dụng khi mua 2 ly.';
  assert.equal(displayPrizeTerms(custom),custom);
  assert.equal(displayPrizeTerms('Quà mẫu: điều kiện riêng của cửa hàng.'),'Quà mẫu: điều kiện riêng của cửa hàng.');
});

test('Legacy voucher display keeps monetary restrictions and never rewrites issued records',()=>{
  const voucher={status:'used',usedAt:'2026-10-27T06:00:00Z',prize:{id:'off30',terms:'Quà mẫu: giảm tối đa 50.000đ cho đơn từ 200.000đ. Không cộng dồn ưu đãi.'}};
  const before=structuredClone(voucher);
  assert.equal(displayPrizeTerms(voucher.prize.terms),PRIZE_TERMS.off30);
  assert.deepEqual(voucher,before);
  assert.equal(displayPrizeTerms(undefined),'');
});
