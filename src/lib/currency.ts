// Multi-currency support with real-time conversion rates
import { PRICING_CONFIG } from './usage-limits';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  region: string;
}

export const CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    region: 'US'
  },
  LKR: {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    flag: '🇱🇰',
    region: 'LK'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    region: 'IN'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    region: 'EU'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    region: 'GB'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    region: 'CA'
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    region: 'AU'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    region: 'JP'
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    region: 'SG'
  },
  MYR: {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    flag: '🇲🇾',
    region: 'MY'
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    flag: '🇹🇭',
    region: 'TH'
  },
  PHP: {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    flag: '🇵🇭',
    region: 'PH'
  },
  IDR: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    flag: '🇮🇩',
    region: 'ID'
  },
  VND: {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    flag: '🇻🇳',
    region: 'VN'
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: 'Rs',
    flag: '🇵🇰',
    region: 'PK'
  },
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    flag: '🇧🇩',
    region: 'BD'
  },
  NPR: {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: 'Rs',
    flag: '🇳🇵',
    region: 'NP'
  },
  MVR: {
    code: 'MVR',
    name: 'Maldivian Rufiyaa',
    symbol: 'Rf',
    flag: '🇲🇻',
    region: 'MV'
  }
};

// Fallback exchange rates (updated daily via API)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  LKR: 325.50,
  INR: 83.25,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149.50,
  SGD: 1.35,
  MYR: 4.68,
  THB: 35.85,
  PHP: 55.75,
  IDR: 15650.0,
  VND: 24500.0,
  PKR: 280.25,
  BDT: 109.50,
  NPR: 133.25,
  MVR: 15.40
};

export class CurrencyConverter {
  private static rates: Record<string, number> = FALLBACK_RATES;
  private static lastUpdate: number = 0;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async getExchangeRates(): Promise<Record<string, number>> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (now - this.lastUpdate < this.CACHE_DURATION && Object.keys(this.rates).length > 1) {
      return this.rates;
    }

    try {
      // Try to fetch real-time rates from a free API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        this.rates = data.rates;
        this.lastUpdate = now;
        return this.rates;
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using fallback:', error);
    }

    // Use fallback rates
    this.rates = FALLBACK_RATES;
    this.lastUpdate = now;
    return this.rates;
  }

  static async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = await this.getExchangeRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  static formatPrice(amount: number, currency: string): string {
    const currencyInfo = CURRENCIES[currency];
    if (!currencyInfo) return `${currency} ${amount.toFixed(2)}`;

    // Format based on currency
    switch (currency) {
      case 'JPY':
      case 'KRW':
        return `${currencyInfo.symbol}${Math.round(amount)}`;
      case 'LKR':
      case 'INR':
      case 'PKR':
      case 'BDT':
      case 'NPR':
        return `${currencyInfo.symbol} ${Math.round(amount).toLocaleString()}`;
      case 'IDR':
      case 'VND':
        return `${currencyInfo.symbol} ${Math.round(amount).toLocaleString()}`;
      default:
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
    }
  }

  static detectUserCurrency(): string {
    if (typeof window === 'undefined') return 'USD';
    
    try {
      // Try to detect from browser locale
      const locale = navigator.language || navigator.languages?.[0] || 'en-US';
      const region = locale.split('-')[1]?.toUpperCase();
      
      // Map regions to currencies
      const regionToCurrency: Record<string, string> = {
        'LK': 'LKR',
        'IN': 'INR',
        'US': 'USD',
        'GB': 'GBP',
        'CA': 'CAD',
        'AU': 'AUD',
        'JP': 'JPY',
        'SG': 'SGD',
        'MY': 'MYR',
        'TH': 'THB',
        'PH': 'PHP',
        'ID': 'IDR',
        'VN': 'VND',
        'PK': 'PKR',
        'BD': 'BDT',
        'NP': 'NPR',
        'MV': 'MVR'
      };
      
      return regionToCurrency[region] || 'USD';
    } catch (error) {
      return 'USD';
    }
  }
}

// Pricing with currency conversion
export interface PricingWithCurrency {
  plan: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  monthlyPriceFormatted: string;
  yearlyPriceFormatted: string;
  savings: number;
  savingsFormatted: string;
}

export async function getPricingInCurrency(plan: string, currency: string): Promise<PricingWithCurrency> {
  const config = PRICING_CONFIG[plan];
  if (!config) throw new Error(`Plan ${plan} not found`);

  try {
    const monthlyPrice = await CurrencyConverter.convert(config.monthlyPrice, 'USD', currency);
    const yearlyPrice = await CurrencyConverter.convert(config.yearlyPrice, 'USD', currency);
    
    const savings = (config.monthlyPrice * 12) - config.yearlyPrice;
    const savingsInCurrency = await CurrencyConverter.convert(savings, 'USD', currency);

    return {
      plan,
      monthlyPrice: monthlyPrice || config.monthlyPrice,
      yearlyPrice: yearlyPrice || config.yearlyPrice,
      currency,
      monthlyPriceFormatted: CurrencyConverter.formatPrice(monthlyPrice || config.monthlyPrice, currency),
      yearlyPriceFormatted: CurrencyConverter.formatPrice(yearlyPrice || config.yearlyPrice, currency),
      savings: savingsInCurrency || savings,
      savingsFormatted: CurrencyConverter.formatPrice(savingsInCurrency || savings, currency)
    };
  } catch (error) {
    console.warn('Currency conversion failed, using fallback rates:', error);
    
    // Fallback to basic conversion rates
    const fallbackRates: Record<string, number> = {
      'USD': 1,
      'LKR': 320,
      'EUR': 0.92,
      'GBP': 0.79,
      'INR': 83.3,
    };
    
    const rate = fallbackRates[currency] || 1;
    const monthlyPrice = config.monthlyPrice * rate;
    const yearlyPrice = config.yearlyPrice * rate;
    const savings = (config.monthlyPrice * 12) - config.yearlyPrice;
    const savingsInCurrency = savings * rate;

    return {
      plan,
      monthlyPrice,
      yearlyPrice,
      currency,
      monthlyPriceFormatted: CurrencyConverter.formatPrice(monthlyPrice, currency),
      yearlyPriceFormatted: CurrencyConverter.formatPrice(yearlyPrice, currency),
      savings: savingsInCurrency,
      savingsFormatted: CurrencyConverter.formatPrice(savingsInCurrency, currency)
    };
  }
}
