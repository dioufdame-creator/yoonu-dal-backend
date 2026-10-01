// src/utils/currency.js
//
// Formatage centralisé des montants selon la devise choisie par
// l'utilisateur (profile.currency, code ISO 4217). Affichage uniquement :
// aucune conversion de valeur n'est faite, seul le symbole/format change.

// Liste ISO 4217 — code: { symbol, label, locale }
// `locale` sert à Intl.NumberFormat pour les séparateurs de milliers/décimales.
export const CURRENCIES = {
  XOF: { symbol: 'FCFA', label: 'Franc CFA (UEMOA)', locale: 'fr-FR', decimals: 0 },
  XAF: { symbol: 'FCFA', label: 'Franc CFA (CEMAC)', locale: 'fr-FR', decimals: 0 },
  EUR: { symbol: '€', label: 'Euro', locale: 'fr-FR', decimals: 2 },
  USD: { symbol: '$', label: 'Dollar américain', locale: 'en-US', decimals: 2 },
  GBP: { symbol: '£', label: 'Livre sterling', locale: 'en-GB', decimals: 2 },
  MAD: { symbol: 'MAD', label: 'Dirham marocain', locale: 'fr-FR', decimals: 2 },
  CAD: { symbol: 'CA$', label: 'Dollar canadien', locale: 'en-CA', decimals: 2 },
  CHF: { symbol: 'CHF', label: 'Franc suisse', locale: 'fr-CH', decimals: 2 },
  NGN: { symbol: '₦', label: 'Naira nigérian', locale: 'en-NG', decimals: 2 },
  GHS: { symbol: 'GH₵', label: 'Cedi ghanéen', locale: 'en-GH', decimals: 2 },
  CNY: { symbol: '¥', label: 'Yuan chinois', locale: 'zh-CN', decimals: 2 },
  JPY: { symbol: '¥', label: 'Yen japonais', locale: 'ja-JP', decimals: 0 },
  AED: { symbol: 'AED', label: 'Dirham des Émirats', locale: 'en-AE', decimals: 2 },
  INR: { symbol: '₹', label: 'Roupie indienne', locale: 'en-IN', decimals: 2 },
};

export const DEFAULT_CURRENCY = 'XOF';

export const getCurrencyInfo = (code) => CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];

/**
 * Formate un montant selon la devise donnée.
 * @param {number} amount
 * @param {string} currencyCode - code ISO 4217 (ex: 'XOF', 'EUR', 'USD')
 * @param {object} options - { withSymbol: bool (default true) }
 */
export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY, options = {}) => {
  const { withSymbol = true } = options;
  const info = getCurrencyInfo(currencyCode);
  const value = Number(amount) || 0;

  const formatted = new Intl.NumberFormat(info.locale, {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(value);

  if (!withSymbol) return formatted;

  // FCFA et quelques devises se placent après le montant (convention locale),
  // les autres symboles usuels (€, $, £...) peuvent se placer avant ou après
  // selon la locale ; on garde ici la convention la plus lisible pour chaque cas.
  const symbolBefore = ['USD', 'GBP', 'CAD', 'CNY', 'JPY', 'INR'];
  if (symbolBefore.includes(currencyCode)) {
    return `${info.symbol}${formatted}`;
  }
  return `${formatted} ${info.symbol}`;
};

/**
 * Liste triée pour un <select> de choix de devise.
 */
export const getCurrencyOptions = () =>
  Object.entries(CURRENCIES)
    .map(([code, info]) => ({ code, label: `${info.label} (${info.symbol})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
