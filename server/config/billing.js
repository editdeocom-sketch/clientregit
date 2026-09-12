const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED', 'AUD', 'CAD', 'SGD', 'NZD', 'JPY', 'KRW', 'SAR', 'BRL', 'MXN'];

const PLAN_DEFINITIONS = [
  { slug: 'free', name: 'Free', recurring: false, storageBytes: 1e9, limits: { clients: 3, activeProjects: 10, tasks: 10, invoicesMonthly: 3, videoUploadsMonthly: 5 }, prices: {} },
  { slug: 'pro_monthly', name: 'Pro Monthly', recurring: true, storageBytes: 15e9, interval: 'monthly', prices: { INR: 599, USD: 7.99, GBP: 6.49, EUR: 7.49, AED: 29, AUD: 12.99, CAD: 10.99, SGD: 10.99, NZD: 13.99, JPY: 1200, KRW: 11000, SAR: 29, BRL: 39.90, MXN: 149 } },
  { slug: 'pro_quarterly', name: 'Pro Quarterly', recurring: true, storageBytes: 15e9, interval: 'quarterly', prices: { INR: 999, USD: 13.99, GBP: 10.99, EUR: 12.99, AED: 49, AUD: 21.99, CAD: 18.99, SGD: 18.99, NZD: 23.99, JPY: 2000, KRW: 18000, SAR: 49, BRL: 69.90, MXN: 249 } },
  { slug: 'pro_yearly', name: 'Pro Yearly', recurring: true, storageBytes: 15e9, interval: 'yearly', prices: { INR: 2999, USD: 39.99, GBP: 31.99, EUR: 34.99, AED: 149, AUD: 64.99, CAD: 54.99, SGD: 54.99, NZD: 69.99, JPY: 5900, KRW: 54000, SAR: 149, BRL: 199.90, MXN: 699 } },
];

const COUNTRY_CURRENCY = { IN: 'INR', US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', AE: 'AED', SA: 'SAR', AU: 'AUD', CA: 'CAD', SG: 'SGD', NZ: 'NZD', JP: 'JPY', KR: 'KRW', BR: 'BRL', MX: 'MXN' };

function getPlan(slug) { return PLAN_DEFINITIONS.find((plan) => plan.slug === slug) || PLAN_DEFINITIONS[0]; }
function getPrice(slug, currency) { const plan = getPlan(slug); return plan.prices[String(currency || '').toUpperCase()] ?? null; }
function isPro(plan) { return plan.slug !== 'free'; }

module.exports = { CURRENCIES, PLAN_DEFINITIONS, COUNTRY_CURRENCY, getPlan, getPrice, isPro };
