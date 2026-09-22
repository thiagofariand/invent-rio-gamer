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

import { parseRoute } from '../src/app-core.js';
import { searchLocal } from '../src/search.js';

test('universe route preserves tab query for contextual retro filtering', () => {
  const route = parseRoute('#/universo/resident-evil?tab=retro');
  assert.equal(route.name, 'universe');
  assert.equal(route.params.slug, 'resident-evil');
  assert.equal(route.query.get('tab'), 'retro');
});

test('header search can surface curated merch without external API calls', () => {
  const results = searchLocal('artbook');
  assert.ok(results.some(item => item.type === 'merch'));
});
