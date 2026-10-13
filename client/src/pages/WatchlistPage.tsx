import React, { useEffect, useState } from 'react';
import { Bookmark, Trash2, ArrowUpRight, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';
import { StockQuote } from '../types';

interface WatchlistPageProps {
  onSelectStock: (symbol: string) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({ onSelectStock }) => {
  const [watchlistItems, setWatchlistItems] = useState<
    Array<{ symbol: string; companyName: string; quote?: StockQuote }>
  >([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  async function loadWatchlist() {
    setIsLoading(true);
    try {
      const items = await api.getWatchlist();
      setWatchlistItems(items);
    } catch (err) {
      console.warn('Watchlist load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSymbol.trim().toUpperCase();
    if (!clean || isAdding) return;

    setIsAdding(true);
    try {
      await api.addToWatchlist(clean);
      setNewSymbol('');
      await loadWatchlist();
    } catch (err) {
      console.warn('Add error:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeFromWatchlist(symbol);
      setWatchlistItems((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (err) {
      console.warn('Remove error:', err);
    }
  };

  return (
    <div className="space-y-6 py-6 text-left w-full">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-orange-50/10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
            <Bookmark className="w-3.5 h-3.5 text-amber-300" />
            <span>Saved Portfolio Signals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-['Montserrat']">
            Your Research Watchlist
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Monitor verified prices and active decision-support signals
          </p>
        </div>

        {/* Add Ticker Input */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add ticker (e.g. INFY)"
            className="bg-neutral-900 border border-orange-50/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 uppercase font-mono focus:outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={!newSymbol.trim() || isAdding}
            className="btn-asym-solid px-3.5 py-1.5 bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Watchlist Items Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card-chai p-4 rounded-xl border border-orange-50/15 bg-neutral-900/40 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : watchlistItems.length > 0 ? (
        <div className="space-y-2.5">
          {watchlistItems.map((item) => {
            const q = item.quote;
            const isPos = q ? q.change >= 0 : true;

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectStock(item.symbol)}
                className="card-chai p-4 rounded-xl border border-orange-50/15 bg-black/10 hover:border-orange-50/30 transition-all flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold font-mono text-white text-sm">
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white font-mono group-hover:text-amber-100 transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded border border-neutral-700 text-neutral-400 font-mono">
                        {q?.exchange || 'NSE'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md xl:max-w-xl">
                      {q?.companyName || item.companyName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {q && (
                    <div className="text-right">
                      <div className="text-sm font-semibold font-mono text-white">
                        ₹{q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-xs font-mono font-medium flex items-center justify-end gap-1 ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPos ? '+' : ''}
                          {q.changePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleRemove(item.symbol, e)}
                      className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-chai p-12 rounded-xl border border-orange-50/15 text-center">
          <Bookmark className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white font-['Montserrat']">
            Your Watchlist is Empty
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Add stocks using the input above or bookmark them directly from any stock research page.
          </p>
        </div>
      )}
    </div>
  );
};
