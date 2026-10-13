import { Router } from 'express';
import { stocksController } from '../controllers/stocks.controller';

const router = Router();

// Search stocks
router.get('/search', (req, res) => stocksController.search(req, res));

// Market overview (movers)
router.get('/overview', (req, res) => stocksController.getMarketOverview(req, res));

// Stock detail sub-resources
router.get('/:symbol/quote', (req, res) => stocksController.getQuote(req, res));
router.get('/:symbol/history', (req, res) => stocksController.getHistory(req, res));
router.get('/:symbol/fundamentals', (req, res) => stocksController.getFundamentals(req, res));
router.get('/:symbol/technicals', (req, res) => stocksController.getTechnicals(req, res));
router.get('/:symbol/recommendation', (req, res) => stocksController.getRecommendation(req, res));
router.get('/:symbol/news', (req, res) => stocksController.getNews(req, res));

export default router;
