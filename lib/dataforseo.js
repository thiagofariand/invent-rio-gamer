export function dataForSeoConfigured() { return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD); }
export function dataForSeoSearchEnabled() { return process.env.DATAFORSEO_SEARCH_ENABLED === '1'; }

export async function dataForSeoShoppingSearch(keyword) {
  if (!dataForSeoConfigured()) { const e = new Error('DataForSEO not configured'); e.status = 503; throw e; }
  if (!dataForSeoSearchEnabled()) { const e = new Error('DataForSEO paid search is disabled'); e.status = 503; throw e; }
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const response = await fetch('https://api.dataforseo.com/v3/serp/google/shopping/live/advanced', {
    method:'POST', headers:{ Authorization:`Basic ${auth}`, 'Content-Type':'application/json' },
    body:JSON.stringify([{ keyword:String(keyword).slice(0,120), location_code:2076, language_code:'pt', depth:10 }])
  });
  if (!response.ok) { const e = new Error(`DataForSEO failed (${response.status})`); e.status = response.status; throw e; }
  return response.json();
}
