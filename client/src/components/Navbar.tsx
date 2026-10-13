import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Bookmark, FileText, ChevronRight, Activity } from 'lucide-react';
import { StockProfile } from '../types';
import { api } from '../lib/api';

interface NavbarProps {
  currentTab: 'dashboard' | 'watchlist' | 'methodology' | 'stock';
  onSelectTab: (tab: 'dashboard' | 'watchlist' | 'methodology' | 'stock') => void;
  onSelectStock: (symbol: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onSelectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchStocks(searchQuery, 8);
        setSearchResults(results);
        setIsOpen(true);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickStock = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0a0a0a]/85 border-b border-orange-50/10">
      <div className="w-[92%] 2xl:w-[94%] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-orange-50/15 flex items-center justify-center font-bold text-white text-base">
              P<span className="text-orange-500 text-lg leading-none">.</span>
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-white font-['Onest']">
                PickMyStock
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-400 font-mono">
                NSE · BSE
              </span>
            </div>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-white bg-neutral-900 border border-orange-50/15'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('watchlist')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'watchlist'
                  ? 'text-white bg-neutral-900 border border-orange-50/15'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist
            </button>
            <button
              onClick={() => onSelectTab('methodology')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'methodology'
                  ? 'text-white bg-neutral-900 border border-orange-50/15'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Methodology
            </button>
          </nav>
        </div>

        {/* Search input with debounced dropdown */}
        <div className="flex-1 max-w-lg lg:max-w-xl xl:max-w-2xl relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company (e.g. RELIANCE, TCS, INFY)..."
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-900/90 border border-orange-50/15 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all font-sans"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-orange-50/15 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Indian Listed Equities
                  </div>
                  {searchResults.map((stock) => (
                    <button
                      key={`${stock.symbol}-${stock.exchange}`}
                      onClick={() => handlePickStock(stock.symbol)}
                      className="w-full px-3 py-2 text-left rounded-lg hover:bg-neutral-800/60 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white font-mono text-sm">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded border border-neutral-700 text-neutral-400">
                            {stock.exchange || 'NSE'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 truncate max-w-[280px]">
                          {stock.companyName}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-neutral-500">
                  No stocks found matching "{searchQuery}". Try a valid NSE or BSE ticker.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feed Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>EOD Feed Active</span>
        </div>
      </div>
    </header>
  );
};
