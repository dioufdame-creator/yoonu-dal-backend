import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import { UsageLimitIndicator } from '../subscription/SubscriptionComponents';

const AIChatWidgetV4 = ({ onNavigate, toast, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'conversations'

  // Conversation courante
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('');

  // Liste des conversations
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Salut ! 👋 Je suis Yoonu, ton coach financier. Je me souviens de nos conversations précédentes. Comment puis-je t'aider ?",
    actions: [],
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const [messageCount, setMessageCount] = useState(user?.profile?.ai_messages_count || 0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && view === 'chat' && inputRef.current) inputRef.current.focus(); }, [isOpen, view]);

  // Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
      setVoiceEnabled(true);
    }
    if ('speechSynthesis' in window) synthesisRef.current = window.speechSynthesis;
    return () => {
      recognitionRef.current?.stop();
      synthesisRef.current?.cancel();
    };
  }, []);

  // ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target) && window.innerWidth >= 640) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Charger les conversations
  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await API.get('/ai/conversations/');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Ouvrir une conversation existante
  const openConversation = async (conv) => {
    try {
      const res = await API.get(`/ai/conversations/${conv.id}/`);
      const savedMessages = res.data.messages.map(m => ({
        role: m.role,
        content: m.content,
        actions: m.actions || [],
        timestamp: new Date(m.created_at)
      }));
      if (savedMessages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: "Conversation vide — que veux-tu aborder ?",
          actions: [], timestamp: new Date()
        }]);
      } else {
        setMessages(savedMessages);
      }
      setConversationId(conv.id);
      setConversationTitle(conv.title);
      setView('chat');
    } catch (err) {
      toast?.showError?.('Impossible de charger la conversation');
    }
  };

  // Nouvelle conversation
  const startNewConversation = () => {
    setConversationId(null);
    setConversationTitle('');
    setMessages([{
      role: 'assistant',
      content: "Nouvelle conversation ! Sur quoi veux-tu qu'on travaille ensemble ?",
      actions: [], timestamp: new Date()
    }]);
    setView('chat');
  };

  // Supprimer une conversation
  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await API.delete(`/ai/conversations/${convId}/`);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) {
        startNewConversation();
      }
    } catch (err) {
      toast?.showError?.('Impossible de supprimer');
    }
  };

  const refreshMessageCount = async () => {
    if (user?.profile && !user.profile.is_premium) {
      try {
        const res = await API.get('/payments/subscription-status/');
        setMessageCount(res.data.ai_messages_count);
      } catch {}
    }
  };

  const speak = (text) => {
    if (!synthesisRef.current || !text) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => { synthesisRef.current?.cancel(); setIsSpeaking(false); };
  const startListening = () => { try { setIsListening(true); recognitionRef.current?.start(); } catch { setIsListening(false); } };
  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, {
      role: 'user', content: userMessage, actions: [], timestamp: new Date()
    }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await API.post('/ai/chat/v2/', {
        message: userMessage,
        conversation_id: conversationId || undefined,
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.message,
        actions: res.data.actions || [],
        timestamp: new Date()
      };
      setMessages([...newMessages, assistantMsg]);

      // Mettre à jour la conversation courante
      if (res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
        setConversationTitle(res.data.conversation_title || '');
      }

      await refreshMessageCount();
      if (autoSpeak) speak(res.data.message);

    } catch (error) {
      const isLimit = error.response?.status === 429;
      setMessages([...newMessages, {
        role: 'assistant',
        content: isLimit
          ? `🚫 ${error.response?.data?.error || 'Limite mensuelle atteinte'}`
          : "Désolé, j'ai un problème technique 😅 Réessaie dans un instant.",
        actions: [], timestamp: new Date()
      }]);
      await refreshMessageCount();
    } finally {
      setIsTyping(false);
    }
  };

  const executeAction = async (action) => {
    setExecutingAction(true);
    try {
      const res = await API.post('/ai/execute-action/', { action_type: action.type, data: action.data });
      setMessages(prev => [...prev, {
        role: 'assistant', content: `✅ ${res.data.message}`, actions: [], timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${error.response?.data?.error || 'Action impossible'}`,
        actions: [], timestamp: new Date()
      }]);
    } finally {
      setExecutingAction(false);
    }
  };

  const quickActions = [
    { text: "📊 Analyse mon mois", icon: "📊" },
    { text: "🔄 Compare avec le mois précédent", icon: "🔄" },
    { text: "➕ Ajoute une dépense", icon: "➕" },
    { text: "💡 Conseils pour économiser", icon: "💡" }
  ];

  // ── FAB ──────────────────────────────────────────────────────
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

  // ── FENÊTRE CHAT ─────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
      <div
        ref={chatRef}
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-screen sm:h-[680px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-200"
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between shadow-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-md">🤖</div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold">Yoonu IA</h3>
              <p className="text-xs opacity-90 truncate max-w-[160px]">
                {conversationTitle || 'Coach financier intelligent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Conversations */}
            <button
              onClick={() => { setView(view === 'conversations' ? 'chat' : 'conversations'); if (view !== 'conversations') loadConversations(); }}
              className={`p-2 rounded-lg transition-all ${view === 'conversations' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
              title="Historique conversations"
            >
              <span className="text-lg">📋</span>
            </button>
            {/* Voice */}
            {voiceEnabled && (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-lg transition-all ${autoSpeak ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <span className="text-lg">{autoSpeak ? '🔊' : '🔇'}</span>
              </button>
            )}
            {/* Close */}
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/30 rounded-lg p-2 transition-colors">
              <span className="text-xl font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* ── VUE CONVERSATIONS ── */}
        {view === 'conversations' && (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4">
              <button
                onClick={startNewConversation}
                className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-all mb-4 flex items-center justify-center gap-2"
              >
                <span>✏️</span> Nouvelle conversation
              </button>

              {loadingConversations ? (
                <div className="text-center text-gray-500 py-8">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Aucune conversation sauvegardée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={`p-3 rounded-xl border cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all group ${
                        conversationId === conv.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{conv.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {conv.message_count} message{conv.message_count > 1 ? 's' : ''} · {new Date(conv.updated_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(e, conv.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs p-1 rounded flex-shrink-0 transition-opacity"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VUE CHAT ── */}
        {view === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.role === 'assistant' && voiceEnabled && (
                        <button onClick={() => speak(msg.content)} className="mt-2 text-xs text-gray-400 hover:text-green-600 flex items-center gap-1">
                          <span>🔊</span><span>Écouter</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'assistant' && msg.actions?.length > 0 && (
                    <div className="flex justify-start mt-2">
                      <div className="max-w-[85%] space-y-2">
                        {msg.actions.map((action, ai) => (
                          <button
                            key={ai}
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
                      {[0, 0.1, 0.2].map((d, i) => (
                        <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isSpeaking && (
                <div className="flex justify-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-green-600 animate-pulse">🔊</span>
                    <span className="text-sm text-green-700 font-medium">Yoonu parle...</span>
                    <button onClick={stopSpeaking} className="ml-2 text-xs text-red-600 hover:text-red-700">Arrêter</button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-600 mb-2">💡 Suggestions :</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setInput(action.text); setTimeout(sendMessage, 100); }}
                      className="text-xs bg-gray-100 hover:bg-green-50 hover:border-green-500 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-all font-medium text-left"
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Limite messages */}
            {user?.profile && !user.profile.is_premium && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <UsageLimitIndicator
                  used={messageCount} limit={50}
                  label="messages ce mois"
                  onUpgrade={() => onNavigate('pricing')}
                />
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t-2 border-gray-200 flex-shrink-0">
              <div className="flex gap-2">
                {voiceEnabled && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isTyping || executingAction}
                    className={`px-4 py-3 rounded-xl font-bold transition-all ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-green-100 text-green-600 hover:bg-green-200'
                    } disabled:opacity-50`}
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
                {voiceEnabled ? '🎤 Parler • ' : ''}Entrée pour envoyer • ESC pour fermer
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AIChatWidgetV4;
