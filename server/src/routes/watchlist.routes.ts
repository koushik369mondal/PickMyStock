import { Router, Request, Response } from 'express';
import { watchlistService } from '../services/storage/watchlist.service';
import { WatchlistAddSchema, SymbolParamSchema } from '../schemas/stock.schemas';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await watchlistService.getWatchlist();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { symbol } = WatchlistAddSchema.parse(req.body);
    await watchlistService.addStock(symbol);
    const items = await watchlistService.getWatchlist();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = SymbolParamSchema.parse(req.params);
    await watchlistService.removeStock(symbol);
    const items = await watchlistService.getWatchlist();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
