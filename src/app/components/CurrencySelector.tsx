"use client";

import { useState, useEffect } from 'react';
import { CURRENCIES, CurrencyConverter } from '@/lib/currency';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

export default function CurrencySelector({ 
  selectedCurrency, 
  onCurrencyChange, 
  className = "" 
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect user currency on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detected = CurrencyConverter.detectUserCurrency();
      if (detected !== selectedCurrency) {
        onCurrencyChange(detected);
      }
    }
  }, []);

  const handleCurrencyChange = async (currency: string) => {
    if (currency === selectedCurrency) return;
    
    setIsLoading(true);
    try {
      // Update exchange rates when currency changes
      await CurrencyConverter.getExchangeRates();
      onCurrencyChange(currency);
    } catch (error) {
      console.error('Error updating currency:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const selectedCurrencyInfo = CURRENCIES[selectedCurrency] || CURRENCIES.USD;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 text-white text-sm font-medium min-w-[180px] justify-between backdrop-blur-sm shadow-lg hover:shadow-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedCurrencyInfo.flag}</span>
          <span>{selectedCurrencyInfo.code}</span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto min-w-[200px]">
          <div className="p-4">
            <div className="text-sm text-gray-300 px-3 py-3 border-b border-white/10 mb-4 font-medium text-center">
              Select Currency
            </div>
            {Object.entries(CURRENCIES).map(([code, currency]) => (
              <button
                key={code}
                onClick={() => handleCurrencyChange(code)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 text-left ${
                  code === selectedCurrency
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <span className="text-xl">{currency.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{currency.code}</div>
                  <div className="text-xs text-gray-400">{currency.name}</div>
                </div>
                {code === selectedCurrency && (
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
