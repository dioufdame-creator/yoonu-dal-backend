import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { UsageLimitIndicator } from '../subscription/SubscriptionComponents';

// ==========================================
// AI CHAT WIDGET V3 - VOICE ENABLED
// Speech-to-Text + Text-to-Speech
// Avec limite messages Freemium + Refresh compteur
// ==========================================

const AIChatWidgetV3 = ({ onNavigate, toast, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Salut ! 👋 Je suis Yoonu, ton coach financier intelligent. Comment puis-je t'aider aujourd'hui ?",
      actions: [],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  // ✅ NOUVEAU : State pour le compteur de messages
  const [messageCount, setMessageCount] = useState(user?.profile?.ai_messages_count || 0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast?.showError?.('Microphone non autorisé');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setVoiceEnabled(true);
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && 
          !chatRef.current.contains(event.target) && 
          window.innerWidth >= 640) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Voice Input
  const startListening = () => {
    if (!recognitionRef.current) {
      toast?.showError?.('Reconnaissance vocale non supportée');
      return;
    }

    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text to Speech
  const speak = (text) => {
    if (!synthesisRef.current || !text) return;

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    };

    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // ✅✅✅ MODIFIÉ : Rafraîchir le compteur depuis le backend ✅✅✅
  const refreshMessageCount = async () => {
    if (user && user.profile && !user.profile.is_premium) {
      try {
        const response = await API.get('/payments/subscription-status/');
        const newCount = response.data.ai_messages_count;
        
        setMessageCount(newCount);
        
        // Mettre à jour localStorage
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            ai_messages_count: newCount
          }
        };
        localStorage.setItem('yoonu_dal_user', JSON.stringify(updatedUser));
        
        console.log('✅ Compteur messages rafraîchi:', newCount);
      } catch (err) {
        console.warn('⚠️ Impossible de rafraîchir le compteur:', err);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, { 
      role: 'user', 
      content: userMessage, 
      actions: [],
      timestamp: new Date()
    }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await API.post('/ai/chat/', {
        message: userMessage,
        conversation_history: messages.slice(1).map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        actions: response.data.actions || [],
        timestamp: new Date()
      };

      setMessages([...newMessages, assistantMessage]);

      // ✅ NOUVEAU : Rafraîchir le compteur après chaque message
      await refreshMessageCount();

      // Auto-speak response if enabled
      if (autoSpeak && synthesisRef.current) {
        speak(response.data.message);
      }
    } catch (error) {
      console.error('Erreur IA:', error);
      
      // ✅ Gérer erreur limite atteinte
      if (error.response?.status === 429) {
        const errorData = error.response?.data;
        setMessages([...newMessages, {
          role: 'assistant',
          content: `🚫 ${errorData?.error || 'Limite mensuelle atteinte'}`,
          actions: [],
          timestamp: new Date()
        }]);
        
        // Rafraîchir le compteur même en cas d'erreur
        await refreshMessageCount();
      } else {
        setMessages([...newMessages, {
          role: 'assistant',
          content: "Désolé, j'ai un problème technique 😅 Réessaie dans un instant.",
          actions: [],
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };
  // ✅✅✅ FIN MODIFICATION ✅✅✅

  const executeAction = async (action) => {
    setExecutingAction(true);
    
    try {
      const response = await API.post('/ai/execute-action/', {
        action_type: action.type,
        data: action.data
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ ${response.data.message}`,
        actions: [],
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Erreur action:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${error.response?.data?.error || 'Action impossible'}`,
        actions: [],
        timestamp: new Date()
      }]);
    } finally {
      setExecutingAction(false);
    }
  };

  const quickActions = [
    { text: "💰 Combien j'ai dépensé ce mois ?", icon: "💰" },
    { text: "➕ Ajoute une dépense", icon: "➕" },
    { text: "📊 Analyse mon budget", icon: "📊" },
    { text: "💡 Des conseils financiers", icon: "💡" }
  ];

  const handleQuickAction = (action) => {
    setInput(action.text);
    setTimeout(() => sendMessage(), 100);
  };

  // FAB Button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 rounded-full shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 transition-all duration-300 flex items-center gap-3"
        >
          <span className="text-3xl">💬</span>
          <span className="font-bold hidden md:inline">Yoonu IA</span>
        </button>
      </div>
    );
  }

  // Chat Window
  return (
    <>
      {/* Overlay mobile */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Chat Window */}
      <div 
        ref={chatRef}
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-screen sm:h-[650px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-200"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-md">
                🤖
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg">Yoonu IA</h3>
              <p className="text-xs opacity-90">Coach financier intelligent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Voice Settings */}
            {voiceEnabled && (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-lg transition-all ${
                  autoSpeak ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={autoSpeak ? "Audio activé" : "Audio désactivé"}
              >
                <span className="text-xl">{autoSpeak ? '🔊' : '🔇'}</span>
              </button>
            )}

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/30 rounded-lg p-2 transition-colors"
              title="Fermer (ESC)"
            >
              <span className="text-2xl font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {/* Speak button for assistant messages */}
                  {msg.role === 'assistant' && voiceEnabled && (
                    <button
                      onClick={() => speak(msg.content)}
                      className="mt-2 text-xs text-gray-500 hover:text-green-600 flex items-center gap-1"
                    >
                      <span>🔊</span>
                      <span>Écouter</span>
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <div className="flex justify-start mt-2">
                  <div className="max-w-[85%] space-y-2">
                    {msg.actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => executeAction(action)}
                        disabled={executingAction}
                        className="w-full text-left px-4 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all transform hover:scale-105 shadow-sm"
                      >
                        ⚡ {action.label || 'Exécuter'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-none px-5 py-3 shadow-sm border border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {isSpeaking && (
            <div className="flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-green-600 animate-pulse">🔊</span>
                <span className="text-sm text-green-700 font-medium">Yoonu parle...</span>
                <button
                  onClick={stopSpeaking}
                  className="ml-2 text-xs text-red-600 hover:text-red-700"
                >
                  Arrêter
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-3">💡 Suggestions :</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs bg-gray-100 hover:bg-green-50 hover:border-green-500 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all font-medium text-left"
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Limite messages pour Freemium */}
        {user && user.profile && !user.profile.is_premium && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <UsageLimitIndicator
              used={messageCount}
              limit={50}
              label="messages ce mois"
              onUpgrade={() => onNavigate('pricing')}
            />
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t-2 border-gray-200">
          <div className="flex gap-2">
            {/* Voice Input Button */}
            {voiceEnabled && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isTyping || executingAction}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? "Arrêter l'écoute" : "Parler"}
              >
                🎤
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={isListening ? "🎤 J'écoute..." : "Écris ton message..."}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              disabled={isTyping || executingAction || isListening}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || executingAction}
              className={`px-5 py-3 rounded-xl font-bold text-lg transition-all ${
                input.trim() && !isTyping && !executingAction
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {voiceEnabled ? '🎤 Clique pour parler • ' : ''}Entrée pour envoyer • ESC pour fermer
          </p>
        </div>
      </div>
    </>
  );
};

export default AIChatWidgetV3;
