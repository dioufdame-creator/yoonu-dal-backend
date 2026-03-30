import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';

const AICoachV3 = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Salut ! 👋 Je suis ton coach Yoonu Dal. Comment puis-je t'aider ?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Contexte utilisateur
  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadUserContext();
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen]);

  // Charger contexte complet utilisateur
  const loadUserContext = async () => {
    setLoading(true);
    try {
      const [
        scoreRes,
        metricsRes,
        envelopesRes,
        goalsRes,
        expensesRes
      ] = await Promise.all([
        API.get('/yoonu-score/').catch(() => null),
        API.get('/dashboard/metrics/').catch(() => null),
        API.get('/meta-envelopes/').catch(() => null),
        API.get('/goals/manage/').catch(() => null),
        API.get('/expenses/?limit=10').catch(() => null)
      ]);

      // Calculer jour du mois et jours restants
      const today = new Date();
      const dayOfMonth = today.getDate();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysRemaining = lastDay - dayOfMonth;
      const monthProgress = (dayOfMonth / lastDay) * 100;

      const context = {
        // Temporel
        current_date: today.toISOString().split('T')[0],
        day_of_month: dayOfMonth,
        days_remaining_in_month: daysRemaining,
        month_progress_percentage: Math.round(monthProgress),
        
        // Score
        yoonu_score: scoreRes?.data?.score || null,
        score_level: scoreRes?.data?.level || null,
        
        // Métriques
        monthly_income: metricsRes?.data?.monthly_income || 0,
        total_expenses: metricsRes?.data?.total_expenses || 0,
        budget_remaining: (metricsRes?.data?.monthly_income || 0) - (metricsRes?.data?.total_expenses || 0),
        
        // Enveloppes
        envelopes: (envelopesRes?.data || []).map(env => ({
          name: env.envelope_type || env.category,
          budget: env.monthly_budget || 0,
          spent: env.current_spent || 0,
          remaining: (env.monthly_budget || 0) - (env.current_spent || 0),
          percentage_used: env.monthly_budget > 0 ? Math.round((env.current_spent / env.monthly_budget) * 100) : 0
        })),
        
        // Objectifs
        goals: (goalsRes?.data?.goals || []).map(g => ({
          title: g.title,
          target: g.target_amount,
          current: g.current_amount,
          progress: g.progress_percentage,
          category: g.category,
          deadline: g.deadline
        })),
        
        // Dépenses récentes
        recent_expenses: (expensesRes?.data || []).slice(0, 5).map(e => ({
          amount: e.amount,
          category: e.category,
          date: e.date
        }))
      };

      setUserContext(context);
    } catch (error) {
      console.error('Erreur chargement contexte:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await API.post('/ai/coach/', {
        message: userMessage,
        context: userContext, // ✅ CONTEXTE COMPLET
        conversation_history: messages.slice(1, -5).map(m => ({ // Derniers 5 messages
          role: m.role,
          content: m.content
        }))
      });

      setMessages([...newMessages, {
        role: 'assistant',
        content: response.data.message,
        suggestions: response.data.suggestions || [],
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Erreur IA:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: "Désolé, j'ai un problème technique 😅 Réessaie dans un instant.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Suggestions rapides contextuelles
  const getQuickSuggestions = () => {
    if (!userContext) return [];
    
    const suggestions = [];
    
    // Basé sur le jour du mois
    if (userContext.day_of_month <= 5) {
      suggestions.push("📅 Comment optimiser mon budget ce mois-ci ?");
    } else if (userContext.days_remaining_in_month <= 5) {
      suggestions.push("🚨 Comment finir le mois sans dépassement ?");
    } else if (userContext.month_progress_percentage > 50) {
      suggestions.push("📊 Où j'en suis à mi-mois ?");
    }
    
    // Basé sur les enveloppes
    const overbudget = userContext.envelopes?.find(e => e.percentage_used > 90);
    if (overbudget) {
      suggestions.push(`⚠️ Mon enveloppe ${overbudget.name} déborde !`);
    }
    
    // Basé sur les objectifs
    if (userContext.goals?.length > 0) {
      suggestions.push("🎯 Comment accélérer mes objectifs ?");
    }
    
    return suggestions.slice(0, 3);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end sm:p-4">
      {/* Overlay mobile */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 sm:hidden"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Chat container */}
      <div className="relative w-full h-full sm:h-[600px] sm:w-96 bg-white sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header - COMPACT */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 sm:p-4 sm:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xl">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-sm">Coach Yoonu</h3>
              {userContext && (
                <p className="text-xs text-green-100">
                  J{userContext.day_of_month} • {userContext.days_remaining_in_month}j restants
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages - OPTIMISÉ MOBILE */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                
                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.suggestions.map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(sugg)}
                        className="block w-full text-left text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                      >
                        💡 {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions - COMPACT */}
        {messages.length === 1 && userContext && (
          <div className="px-3 pb-2 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">💬 Questions rapides :</p>
            <div className="space-y-1">
              {getQuickSuggestions().map((sugg, i) => (
                <button
                  key={i}
                  onClick={() => setInput(sugg)}
                  className="block w-full text-left text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg hover:border-green-300 transition-colors"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - COMPACT */}
        <div className="p-3 bg-white border-t border-gray-200 sm:rounded-b-2xl">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Pose ta question..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoachV3;
