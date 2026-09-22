import test from 'node:test';
import assert from 'node:assert/strict';
import { getContextCount, getGameSeed } from '../catalog-data.js';
import { classifyMarketplaceTitle, cleanMarketplaceTitle } from '../lib/marketplace.js';

test('Resident Evil OG and remake are distinct catalog records', () => {
  const og=getGameSeed('resident-evil-2-1998'); const remake=getGameSeed('resident-evil-2-2019');
  assert.equal(og.lineage,'original'); assert.equal(og.retro,true); assert.equal(remake.lineage,'remake'); assert.equal(remake.retro,false);
});

test('retro counter is contextual, not franchise-wide', () => {
  const all=getContextCount('resident-evil','multi'); const retro=getContextCount('resident-evil','retro');
  assert.ok(all>retro); assert.equal(retro,5);
});

test('marketplace classifier keeps merch out of game offers', () => {
  assert.equal(classifyMarketplaceTitle('Luminária 3D Resident Evil'), 'merch');
  assert.equal(classifyMarketplaceTitle('Jogo Resident Evil 4 PS5 mídia física'), 'game');
});

test('marketplace title cleaner is deterministic and bounded', () => {
  assert.equal(cleanMarketplaceTitle('  Zelda |  Item   Especial  '), 'Zelda · Item Especial');
});
