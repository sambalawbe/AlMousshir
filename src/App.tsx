import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Moon, Sparkles, BookOpen, User, Info, Loader2, RefreshCcw, Mic, MicOff, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { interpretDream } from './services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const STORAGE_KEY = 'al_mousshir_history';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    } else {
      // Default welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: "Bienvenue. Je suis Al-Mousshir, votre guide dans l'univers mystique des songes selon les enseignements d'Ibn Sirine. Racontez-moi votre rêve, et nous chercherons ensemble sa signification cachée."
        }
      ]);
    }
  }, []);

  // Save history on changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition already started or not supported");
      }
    }
  };

  const speak = (text: string, messageId: string) => {
    if (isSpeaking === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onend = () => setIsSpeaking(null);
    setIsSpeaking(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // startChat context: history must alternate user/model.
      // We skip the 'welcome' message which is purely for UI and starts with 'model'.
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role as "user" | "model",
          parts: [m.content]
        }));

      const interpretation = await interpretDream(input, history);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: interpretation || "La sagesse d'Ibn Sirine m'échappe un instant. Pourriez-vous reformuler votre songe ?"
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "Une perturbation dans le voile onirique m'empêche de répondre. Vérifiez votre connexion ou la clé API."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const welcome = messages.find(m => m.id === 'welcome') || {
      id: 'welcome',
      role: 'model',
      content: "Bienvenue. Je suis Al-Mousshir, votre guide dans l'univers mystique des songes selon les enseignements d'Ibn Sirine. Racontez-moi votre rêve, et nous chercherons ensemble sa signification cachée."
    };
    const resetMessages = [welcome as Message];
    setMessages(resetMessages);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="relative h-screen w-full flex flex-col font-sans overflow-hidden">
      {/* Background Elements */}
      <div className="atmospheric-bg" />
      <div className="atmosphere-blob-1" />
      <div className="atmosphere-blob-2" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 glass z-10 border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Emplacement du Logo: Remplacez src="/logo.png" par le chemin de votre image */}
          <div className="relative group/logo">
            <img 
              src="/logo.png" 
              alt="Logo Al-Mousshir" 
              className="w-10 h-10 object-contain hidden border border-white/10 rounded-lg p-1 bg-white/5 group-hover/logo:border-gold/30 transition-all"
              id="app-logo"
              onLoad={(e) => e.currentTarget.classList.remove('hidden')}
              onError={(e) => e.currentTarget.classList.add('hidden')}
            />
            <div className="p-2 bg-gold/20 rounded-xl" id="logo-icon-fallback">
              <Moon className="w-6 h-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-white/90">Al-Mousshir</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Interprétation d'Ibn Sirine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            title="Effacer la conversation"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <div className="flex items-center gap-2 text-white/80">
            <BookOpen className="w-5 h-5 text-gold/80" />
            <span className="hidden sm:inline text-sm font-medium">Sagesse Classique</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((m, index) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex items-start gap-4",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "mt-1 p-2 rounded-full ring-1 ring-white/10 shadow-lg",
                  m.role === 'user' ? "bg-accent" : "bg-primary"
                )}>
                  {m.role === 'user' ? <User className="w-5 h-5 text-white/80" /> : <Sparkles className="w-5 h-5 text-gold" />}
                </div>
                
                <div className={cn(
                  "relative max-w-[85%] px-6 py-4 rounded-3xl glass shadow-xl group/msg",
                  m.role === 'user' ? "rounded-tr-none text-white/90 border-accent/30" : "rounded-tl-none border-white/5"
                )}>
                  <div className="markdown-body">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  {m.role === 'model' && (
                    <button 
                      onClick={() => speak(m.content, m.id)}
                      className={cn(
                        "absolute -bottom-6 left-2 p-1.5 rounded-full glass border-white/10 opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-gold/20 hover:text-gold",
                        isSpeaking === m.id && "opacity-100 text-gold bg-gold/20"
                      )}
                      title="Écouter l'interprétation"
                    >
                      <Volume2 className={cn("w-3.5 h-3.5", isSpeaking === m.id && "animate-pulse")} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4"
            >
              <div className="p-2 rounded-full bg-primary ring-1 ring-white/10 shadow-lg">
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
              </div>
              <div className="glass px-6 py-4 rounded-3xl rounded-tl-none border-white/5">
                <div className="flex gap-1">
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                  />
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                  />
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 sm:p-6 z-10">
        <div className="max-w-3xl mx-auto relative group">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 p-1 pl-4 rounded-3xl glass border border-white/10 group-focus-within:border-gold/30 transition-all shadow-2xl overflow-hidden"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "J'écoute..." : "Décrivez votre rêve..."}
              className={cn(
                "flex-1 bg-transparent border-none outline-none py-4 text-white placeholder:text-white/30 text-base transition-all",
                isListening && "placeholder:text-gold animate-pulse"
              )}
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "p-3 rounded-2xl transition-all mr-1",
                isListening ? "bg-red-500 text-white animate-pulse" : "text-white/40 hover:text-gold hover:bg-white/5"
              )}
              title="Parler"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-4 bg-gold hover:bg-gold/80 disabled:opacity-50 disabled:hover:bg-gold rounded-2xl transition-all shadow-lg text-white"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-3 flex items-center justify-center gap-4 text-white/30 text-[11px] font-medium tracking-wide uppercase">
            <div className="flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              <span>Base de connaissances : Ibn Sirine</span>
            </div>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-gold/40" />
              <span>Propulsé par Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Info (Optional reference to the book) */}
      <div className="fixed bottom-6 right-6 hidden md:block group">
        <div className="glass p-3 rounded-full hover:bg-gold/20 transition-all cursor-help border-white/5 opacity-40 group-hover:opacity-100">
          <BookOpen className="w-5 h-5 text-white/60 group-hover:text-gold transition-colors" />
        </div>
        <div className="absolute bottom-full right-0 mb-4 w-64 glass p-4 rounded-2xl border-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none scale-90 group-hover:scale-100 origin-bottom-right">
          <h4 className="font-serif font-bold text-sm text-gold mb-1">À propos de la source</h4>
          <p className="text-xs text-white/60 leading-relaxed">
            Interprétations basées sur l'ouvrage classique attribué à Muhammad Ibn Sirine (VIIIe siècle). 
            La sagesse onirique traditionnelle pour éclairer votre subconscient.
          </p>
        </div>
      </div>
    </div>
  );
}
