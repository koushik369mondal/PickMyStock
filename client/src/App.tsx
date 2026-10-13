import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { MethodologyPage } from './pages/MethodologyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'watchlist' | 'methodology' | 'stock'>('dashboard');
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE');

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol.toUpperCase());
    setCurrentTab('stock');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-neutral-800">
        {/* ChaiUI Hexagon Glow Backdrop */}
        <div className="chai-backdrop-glow" />

        {/* Sticky Header Navigation */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onSelectStock={handleSelectStock}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-[92%] 2xl:w-[94%] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onSelectStock={handleSelectStock}
              onNavigateToWatchlist={() => setCurrentTab('watchlist')}
            />
          )}

          {currentTab === 'stock' && (
            <StockDetailPage symbol={selectedStock} />
          )}

          {currentTab === 'watchlist' && (
            <WatchlistPage onSelectStock={handleSelectStock} />
          )}

          {currentTab === 'methodology' && <MethodologyPage />}
        </main>

        {/* ChaiUI Styled Footer */}
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
