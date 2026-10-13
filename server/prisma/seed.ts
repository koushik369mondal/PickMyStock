/**
 * PickMyStock Development Seed Dataset
 *
 * IMPORTANT NOTICE:
 * This is a clearly labeled offline seed dataset for LOCAL UI DEVELOPMENT AND TEST PURPOSES ONLY.
 * Seed records are marked with `isSeed: true` and are NEVER presented as live or current market data.
 */

export const SEED_STOCKS = [
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Limited',
    sector: 'Oil Gas & Consumable Fuels',
    industry: 'Petroleum Products',
    exchange: 'NSE',
    marketCapRank: 1,
    faceValue: 10,
    price: 1166.7,
    prevClose: 1158.9,
    change: 7.8,
    changePct: 0.67,
    tradeDate: '2026-10-13',
    peRatio: 20.99,
    pbRatio: 1.44,
    roe: 8.82,
    roce: 8.86,
    dividendYield: 0.52,
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Limited',
    sector: 'Information Technology',
    industry: 'IT Services & Consulting',
    exchange: 'NSE',
    marketCapRank: 2,
    faceValue: 1,
    price: 3980.5,
    prevClose: 3955.0,
    change: 25.5,
    changePct: 0.64,
    tradeDate: '2026-10-13',
    peRatio: 29.4,
    pbRatio: 13.8,
    roe: 48.5,
    roce: 59.2,
    dividendYield: 1.35,
  },
  {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Limited',
    sector: 'Financial Services',
    industry: 'Private Commercial Banks',
    exchange: 'NSE',
    marketCapRank: 3,
    faceValue: 1,
    price: 1680.2,
    prevClose: 1672.4,
    change: 7.8,
    changePct: 0.47,
    tradeDate: '2026-10-13',
    peRatio: 18.2,
    pbRatio: 2.65,
    roe: 15.8,
    roce: 16.4,
    dividendYield: 1.15,
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Limited',
    sector: 'Information Technology',
    industry: 'IT Services & Consulting',
    exchange: 'NSE',
    marketCapRank: 4,
    faceValue: 5,
    price: 1845.0,
    prevClose: 1832.0,
    change: 13.0,
    changePct: 0.71,
    tradeDate: '2026-10-13',
    peRatio: 27.6,
    pbRatio: 8.9,
    roe: 32.4,
    roce: 41.2,
    dividendYield: 2.1,
  },
  {
    symbol: 'ITC',
    companyName: 'ITC Limited',
    sector: 'Fast Moving Consumer Goods',
    industry: 'Diversified FMCG',
    exchange: 'NSE',
    marketCapRank: 7,
    faceValue: 1,
    price: 495.8,
    prevClose: 492.5,
    change: 3.3,
    changePct: 0.67,
    tradeDate: '2026-10-13',
    peRatio: 28.1,
    pbRatio: 8.2,
    roe: 28.5,
    roce: 36.8,
    dividendYield: 2.75,
  },
];

export async function seedDatabase() {
  console.log('[Seed] Development dataset loaded with 5 benchmark Indian stocks.');
  console.log('[Seed] This dataset is intended for offline UI scaffolding only.');
}

if (require.main === module) {
  seedDatabase().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
