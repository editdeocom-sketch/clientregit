const cache = new Map();
const CACHE_TIME = 60 * 60 * 1000;

async function getExchangeRate(currency) {
  const code = String(currency || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error('Invalid currency code');
  if (code === 'INR') return { base: 'INR', currency: code, rate: 1, source: 'base currency' };

  const cached = cache.get(code);
  if (cached && Date.now() - cached.time < CACHE_TIME) return cached.value;

  let rate;
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/INR`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Exchange service returned ${response.status}`);
    const data = await response.json();
    rate = Number(data.rates?.[code]);
  } catch (error) {
    throw new Error(`Unable to fetch live exchange rate: ${error.message}`);
  }
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`Exchange rate unavailable for ${code}`);

  const value = { base: 'INR', currency: code, rate, source: 'open.er-api.com', fetchedAt: new Date().toISOString() };
  cache.set(code, { time: Date.now(), value });
  return value;
}

module.exports = getExchangeRate;
