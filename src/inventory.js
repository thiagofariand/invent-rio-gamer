const KEY = 'inventario-gamer:v2:inventory';

export function readInventory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function getGameState(slug) {
  return readInventory()[slug] || { status:null, alert:false };
}

export function setGameStatus(slug, status) {
  const all = readInventory();
  const current = all[slug] || { status:null, alert:false };
  all[slug] = { ...current, status: current.status === status ? null : status };
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[slug];
}

export function toggleAlert(slug) {
  const all = readInventory();
  const current = all[slug] || { status:null, alert:false };
  all[slug] = { ...current, alert: !current.alert };
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[slug];
}
