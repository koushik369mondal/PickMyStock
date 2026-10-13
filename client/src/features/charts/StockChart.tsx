import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
import { PriceCandle } from '../../types';

interface StockChartProps {
  candles: PriceCandle[];
  symbol: string;
  activeRange: string;
  onRangeChange: (range: string) => void;
  isLoading?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  candles,
  symbol,
  activeRange,
  onRangeChange,
  isLoading,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Remove any previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 380,
      layout: {
        background: { color: 'transparent' },
        textColor: '#a3a3a3',
        fontFamily: "'Manrope', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: false,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    if (!candles || candles.length === 0) return;

    // Filter and sort unique daily candles
    const validCandles = [...candles]
      .filter((c) => c.tradeDate && c.close > 0)
      .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

    // Price series (Candlestick or Line)
    let mainSeries: ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>;
    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      const candleData: CandlestickData[] = validCandles.map((c) => ({
        time: c.tradeDate,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candlestickSeries.setData(candleData);
      mainSeries = candlestickSeries;
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#e5e5e5',
        lineWidth: 2,
      });
      const lineData: LineData[] = validCandles.map((c) => ({
        time: c.tradeDate,
        value: c.close,
      }));
      lineSeries.setData(lineData);
      mainSeries = lineSeries;
    }

    // Volume Series
    const volumeSeries = chart.addHistogramSeries({
      color: '#262626',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay on right scale with margin
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    const volumeData: HistogramData[] = validCandles.map((c) => ({
      time: c.tradeDate,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
    }));
    volumeSeries.setData(volumeData);

    // Optional SMA 20
    if (showSMA20 && validCandles.length >= 20) {
      const sma20Series = chart.addLineSeries({
        color: '#60a5fa',
        lineWidth: 1.5,
        title: 'SMA 20',
      });
      const sma20Data: LineData[] = [];
      let sum = 0;
      for (let i = 0; i < validCandles.length; i++) {
        sum += validCandles[i].close;
        if (i >= 20) sum -= validCandles[i - 20].close;
        if (i >= 19) {
          sma20Data.push({
            time: validCandles[i].tradeDate,
            value: Number((sum / 20).toFixed(2)),
          });
        }
      }
      sma20Series.setData(sma20Data);
    }

    // Optional SMA 50
    if (showSMA50 && validCandles.length >= 50) {
      const sma50Series = chart.addLineSeries({
        color: '#fbbf24',
        lineWidth: 1.5,
        title: 'SMA 50',
      });
      const sma50Data: LineData[] = [];
      let sum50 = 0;
      for (let i = 0; i < validCandles.length; i++) {
        sum50 += validCandles[i].close;
        if (i >= 50) sum50 -= validCandles[i - 50].close;
        if (i >= 49) {
          sma50Data.push({
            time: validCandles[i].tradeDate,
            value: Number((sum50 / 50).toFixed(2)),
          });
        }
      }
      sma50Series.setData(sma50Data);
    }

    chart.timeScale().fitContent();

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, chartType, showSMA20, showSMA50]);

  const ranges = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

  return (
    <div className="card-chai p-5 rounded-xl border border-orange-50/15 bg-black/10 backdrop-blur-sm">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white font-['Montserrat']">
            {symbol} Historical EOD Price
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-400 font-mono">
            NSE/BSE Close
          </span>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-2.5 py-1 rounded transition-colors font-mono cursor-pointer ${
                activeRange === r
                  ? 'bg-neutral-800 text-white font-medium border border-orange-50/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Chart Style & Overlays */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2 py-1 rounded cursor-pointer ${
                chartType === 'candlestick' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded cursor-pointer ${
                chartType === 'line' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
              }`}
            >
              Line
            </button>
          </div>

          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
              showSMA20
                ? 'border-blue-400/50 text-blue-300 bg-blue-950/20'
                : 'border-neutral-800 text-neutral-500'
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
              showSMA50
                ? 'border-amber-400/50 text-amber-300 bg-amber-950/20'
                : 'border-neutral-800 text-neutral-500'
            }`}
          >
            SMA 50
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative min-h-[380px] w-full">
        {isLoading && (
          <div className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-sm text-neutral-400 font-mono">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              Loading verified market candles...
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-[380px]" />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Prices are official exchange end-of-day closing prices with split and bonus adjustments.</span>
        <span>Green/Red bars reflect trading volume.</span>
      </div>
    </div>
  );
};
