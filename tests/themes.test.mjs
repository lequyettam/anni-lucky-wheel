import {GameService} from './support.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRepository, createSeed} from '../dist/js/domain.js';
import {LocalRepository} from '../dist/js/storage.js';
import {THEMES, getAppearance, themedPrizes} from '../dist/js/themes.js';

const now=new Date('2026-10-26T05:00:00Z');

test('Old configurations and unknown presets fall back without rewriting saved data',()=>{
  const seed=createSeed(now);delete seed.settings.appearance;const before=structuredClone(seed);
  assert.deepEqual(getAppearance(seed.settings),{theme:'anni',decorations:true});
  assert.deepEqual(seed,before);
  assert.deepEqual(getAppearance({appearance:{theme:'missing',decorations:false}}),{theme:'anni',decorations:false});
});

test('Applying and reloading a theme preserves quotas, awards, redemptions and prize colors',async()=>{
  const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const repo=new LocalRepository('theme-test',storage);repo.write(createSeed(now));
  const game=new GameService(repo,{clock:()=>now,random:()=>.5});
  const user=await game.login('0900000001');await game.activateCode(user.id,'ANNI2026');
  const {voucher}=await game.spin(user.id,'earned');await game.useVoucher(user.id,voucher.code);
  const before=game.snapshot();
  for(const theme of THEMES){
    await game.saveAppearance({theme:theme.id,decorations:false});
    const reloaded=new GameService(new LocalRepository('theme-test',storage)).snapshot();
    assert.deepEqual(reloaded,{...before,settings:{...before.settings,appearance:{theme:theme.id,decorations:false}}});
  }
});

test('Invalid appearance writes reject atomically',async()=>{
  const game=new GameService(new MemoryRepository(createSeed(now)));const before=game.snapshot();
  for(const input of [null,{}, {theme:'unknown',decorations:true},{theme:'halloween',decorations:'false'}]){
    await assert.rejects(game.saveAppearance(input),/chủ đề hợp lệ/);assert.deepEqual(game.snapshot(),before);
  }
});

test('Saving campaign settings from an older screen does not undo the chosen appearance',async()=>{
  const game=new GameService(new MemoryRepository(createSeed(now)));const stale=game.snapshot().settings;
  await Promise.all([game.saveAppearance({theme:'christmas',decorations:true}),game.saveSettings({...stale,dailyFree:3})]);
  assert.equal(game.snapshot().settings.dailyFree,3);
  assert.deepEqual(game.snapshot().settings.appearance,{theme:'christmas',decorations:true});
});

test('Theme rendering preserves outcome order and business fields for 2 to 12 wheel segments',()=>{
  for(const count of [2,6,12]){
    const seed=createSeed(now).prizes;
    const prizes=Array.from({length:count},(_,i)=>({...seed[i%seed.length],id:'prize-'+i,color:'#123456'}));
    const before=structuredClone(prizes);
    for(const theme of THEMES){
      const display=themedPrizes(prizes,theme.id);
      assert.equal(display.length,count);
      display.forEach((prize,i)=>assert.deepEqual({...prize,color:prizes[i].color},prizes[i]));
      assert.deepEqual(prizes,before);
    }
    assert.deepEqual(themedPrizes(prizes,'anni'),before);
  }
});
