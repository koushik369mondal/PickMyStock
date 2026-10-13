import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50),
  limit: z.coerce.number().min(1).max(50).default(15),
});

export const SymbolParamSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(25),
});

export const HistoryQuerySchema = z.object({
  range: z.enum(['1D', '1W', '1M', '3M', '1Y', '5Y', 'ALL']).default('1Y'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const FundamentalsQuerySchema = z.object({
  periodType: z.enum(['quarterly', 'annual']).default('quarterly'),
});

export const ChatRequestSchema = z.object({
  query: z.string().min(1, 'Query message cannot be empty').max(1000),
  symbol: z.string().max(25).default('RELIANCE'),
});

export const WatchlistAddSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(25),
});
