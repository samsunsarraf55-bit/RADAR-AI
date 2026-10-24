import React, { useState, useRef, useEffect } from 'react';
import { SourcesMap, ChatMessage } from '../types/market';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  RefreshCw,
  Lightbulb,
  Trash2,
} from 'lucide-react';

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesMap;
  initialPrompt?: string;
}

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  sources,
  initialPrompt = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Selamlar, ben **RADAR AI Finans Danışmanı**. Samsun ve serbest piyasa Kapalıçarşı altın, döviz kurları, makas aralıkları ve kuyumculuk alım-satım stratejileri konusunda 6 firmanın anlık verileriyle size rehberlik etmek için buradayım. Bugün hangi varlığı değerlendirmek istersiniz?',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Build condensed snapshot string to ground Gemini in live data
  const buildCurrentSnapshot = () => {
    return Object.entries(sources)
      .map(([_, s]) => {
        const has = s.data?.find((d) => d.code === 'ALTIN_HAS');
        const ceyrek = s.data?.find((d) => d.code === 'CEYREK_YENI');
        const usd = s.data?.find((d) => d.code === 'USDTRY');
        const eur = s.data?.find((d) => d.code === 'EURTRY');
        return `${s.sourceName}: Has Altın Alış/Satış: ${has?.buy || '-'}/${has?.sell || '-'} ₺ | Çeyrek: ${ceyrek?.buy || '-'}/${ceyrek?.sell || '-'} ₺ | USD: ${usd?.buy || '-'}/${usd?.sell || '-'} ₺ | EUR: ${eur?.buy || '-'}/${eur?.sell || '-'} ₺`;
      })
      .join('\n');
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          currentSnapshot: buildCurrentSnapshot(),
        }),
      });

      if (!response.ok) {
        throw new Error('Danışman yanıt veremedi.');
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: data.reply || 'Yanıt alınamadı.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          content:
            'Üzgünüm, şu anda veri bağlantısında bir gecikme yaşandı. Lütfen biraz sonra tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_fresh',
        role: 'model',
        content:
          'Sohbet geçmişi temizlendi. Güncel kuyumcu ve döviz kurlarımızla ilgili dilediğiniz soruyu sorabilirsiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const suggestions = [
    'Bugün altın bozdurmak için en avantajlı firma hangisi?',
    'Has altın ile 22 ayar bilezik arasındaki işçilik farkı nedir?',
    'Dolar ve Euro için en dar makas aralığını hangi firma sunuyor?',
    'Mevcut kurlara göre arbitraj fırsatı var mı?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">RADAR AI Finans Danışmanı</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">6 firma verisiyle entegre sarraf danışmanlığı</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Geçmişi Temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-2">
                    {m.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      isUser ? 'text-slate-800 text-right' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
              <Bot className="w-4 h-4 text-amber-400 animate-spin" />
              <span>RADAR AI piyasaları analiz ediyor...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Quick Chips */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex items-center space-x-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 px-3 py-1 rounded-full whitespace-nowrap transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Altın, döviz, makas aralıkları veya firma hakkında danışın..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl transition shadow-md font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
