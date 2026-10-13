import { bharatStockProvider } from '../market-data/bharatstock.provider';
import { NormalizedQuote } from '../market-data/types';

export interface WatchlistStockItem {
  symbol: string;
  companyName: string;
  addedAt: string;
  quote?: NormalizedQuote;
}

// In-memory persistent fallback if Postgres is not connected
const inMemoryWatchlist = new Set<string>(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY']);

export class WatchlistService {
  async getWatchlist(): Promise<WatchlistStockItem[]> {
    const symbols = Array.from(inMemoryWatchlist);
    const items: WatchlistStockItem[] = [];

    for (const symbol of symbols) {
      try {
        const quote = await bharatStockProvider.getQuote(symbol);
        items.push({
          symbol,
          companyName: quote.companyName || symbol,
          addedAt: new Date().toISOString(),
          quote,
        });
      } catch {
        items.push({
          symbol,
          companyName: symbol,
          addedAt: new Date().toISOString(),
        });
      }
    }

    return items;
  }

  async addStock(symbol: string): Promise<boolean> {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return false;
    inMemoryWatchlist.add(clean);
    return true;
  }

  async removeStock(symbol: string): Promise<boolean> {
    const clean = symbol.trim().toUpperCase();
    return inMemoryWatchlist.delete(clean);
  }
}

export const watchlistService = new WatchlistService();
