import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

interface AiChatPanelProps {
  symbol: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: string;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ symbol }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: `Hello, I am PickMyStock's financial research analyst for **${symbol}**. You can ask me about valuation, balance sheet health, recent revenue growth, or specific risk factors. All answers are grounded in verified regulatory filings and price action.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Why is this stock favorable for the long term?',
    'What are the biggest risks to monitor?',
    'How has revenue changed over the last four quarters?',
    'Is the valuation reasonable compared with peers?',
    'Explain the technical indicators in simple language.',
    'What evidence could invalidate the current thesis?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: MessageItem = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.chat(textToSend, symbol);
      const assistantMsg: MessageItem = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: response.message,
        toolsUsed: response.toolsUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `Error obtaining research response: ${err.message || 'Please check connection to PickMyStock API.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-chai rounded-xl border border-orange-50/15 bg-black/10 backdrop-blur-sm flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-orange-50/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-orange-50/15 flex items-center justify-center text-white">
            <Bot className="w-4 h-4 text-orange-200" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white font-['Montserrat']">
              AI Stock Research Assistant
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Researching {symbol} with read-only market tools
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-neutral-800 text-neutral-400 font-mono">
          <Sparkles className="w-3 h-3 text-amber-300" />
          Grounded Analysis
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-b border-neutral-900 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] text-neutral-500 font-mono uppercase whitespace-nowrap mr-1">
          Ask:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 whitespace-nowrap transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-neutral-800 text-white rounded-tr-none border border-neutral-700'
                  : 'bg-neutral-900/80 text-neutral-200 rounded-tl-none border border-orange-50/10'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Verified Tools Citation */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <Wrench className="w-3 h-3 text-neutral-500" />
                  <span>Tools executed:</span>
                  <span className="text-neutral-300">{msg.toolsUsed.join(', ')}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-200" />
            <span>Consulting market data and calculating verified evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-orange-50/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${symbol}'s valuation, risks, margins, or growth...`}
          className="flex-1 bg-neutral-900/90 border border-orange-50/15 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 font-sans"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="btn-asym-solid px-4 py-2 bg-white text-black text-xs font-semibold hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Ask</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
