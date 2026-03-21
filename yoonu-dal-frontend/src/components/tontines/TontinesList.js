import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// TONTINES LIST PREMIUM V3.1
// Formulaire complet + Glassmorphism + 100% Responsive
// Mini-charts custom (sans Recharts pour éviter warnings)
// ==========================================

const TontinesListPremium = ({ onNavigate, toast }) => {
  // États UI
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editingTontine, setEditingTontine] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  // Formulaire
  const emptyForm = () => ({
    name: '',
    description: '',
    total_amount: '',
    monthly_contribution: '',
    max_participants: '',
    duration_months: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    loadTontines();
  }, []);

  const loadTontines = async () => {
    setLoading(true);
    try {
      const response = await API.get('/tontines/');
      setTontines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast?.showError?.('Erreur chargement tontines');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculées
  const stats = {
    total: tontines.length,
    active: tontines.filter(t => t.status === 'active').length,
    planning: tontines.filter(t => t.status === 'planning').length,
    completed: tontines.filter(t => t.status === 'completed').length,
    totalContribution: tontines
      .filter(t => t.status === 'active' || t.status === 'planning')
      .reduce((sum, t) => sum + (t.monthly_contribution || 0), 0),
    totalAmount: tontines.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  };

  // Filtrage
  const filteredTontines = tontines.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.invitation_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Helpers
  const formatCurrency = (value) => {
    const num = Math.abs(value || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
  };

  const getStatusConfig = (status) => {
    const configs = {
      planning: {
        label: 'En préparation',
        icon: '📋',
        color: 'from-blue-500 to-indigo-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      active: {
        label: 'Active',
        icon: '🔥',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      completed: {
        label: 'Terminée',
        icon: '✅',
        color: 'from-gray-500 to-slate-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200'
      }
    };
    return configs[status] || configs.planning;
  };

  // Actions
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.total_amount || !form.monthly_contribution || !form.max_participants || !form.duration_months) {
      toast?.showError('Remplis tous les champs obligatoires');
      return;
    }

    try {
      const payload = {
        name: form.name,
        description: form.description,
        total_amount: parseFloat(form.total_amount),
        monthly_contribution: parseFloat(form.monthly_contribution),
        max_participants: parseInt(form.max_participants),
        duration_months: parseInt(form.duration_months),
        start_date: form.start_date
      };

      if (editingTontine) {
        await API.patch(`/tontines/${editingTontine.id}/`, payload);
        toast?.showSuccess('Tontine modifiée avec succès');
      } else {
        await API.post('/tontines/', payload);
        toast?.showSuccess('Tontine créée avec succès');
      }

      setShowCreateModal(false);
      setEditingTontine(null);
      setForm(emptyForm());
      loadTontines();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleJoinTontine = async (e) => {
    e.preventDefault();
    
    if (!joinCode) {
      toast?.showError('Entre le code d\'invitation');
      return;
    }

    try {
      await API.post('/tontines/join/', { invitation_code: joinCode });
      toast?.showSuccess('Tu as rejoint la tontine !');
      setShowJoinModal(false);
      setJoinCode('');
      loadTontines();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Code invalide ou tontine complète');
    }
  };

  const handleEdit = (tontine) => {
    setEditingTontine(tontine);
    setForm({
      name: tontine.name,
      description: tontine.description || '',
      total_amount: tontine.total_amount,
      monthly_contribution: tontine.monthly_contribution,
      max_participants: tontine.max_participants,
      duration_months: tontine.duration_months || 12,
      start_date: tontine.start_date || new Date().toISOString().split('T')[0]
    });
    setShowCreateModal(true);
  };

  const handleActivate = async (tontineId) => {
    try {
      await API.post(`/tontines/${tontineId}/activate/`);
      toast?.showSuccess('Tontine activée !');
      loadTontines();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Erreur activation');
    }
  };

  const generateMockHistory = (amount) => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const variance = Math.random() * 0.2 - 0.1;
      const value = amount * (0.5 + i * 0.08) * (1 + variance);
      history.push({ day: 7 - i, value: Math.max(0, value) });
    }
    return history;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-red-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Chargement de vos tontines...</p>
          <div className="flex gap-1 justify-center mt-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Header PREMIUM avec Glassmorphism */}
        <div className="mb-6 sm:mb-8 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-900 via-red-900 to-amber-900 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl">🦁</span>
                <span>Mes Tontines</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                Épargne collective et solidaire
              </p>
            </div>
            
            {/* Action Buttons RESPONSIVE */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => { setEditingTontine(null); setForm(emptyForm()); setShowCreateModal(true); }}
                className="flex-1 sm:flex-none group relative bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-xl sm:text-2xl group-hover:rotate-180 transition-transform duration-500">➕</span>
                <span className="hidden xs:inline">Nouvelle tontine</span>
                <span className="xs:hidden">Créer</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></span>
              </button>
              
              <button
                onClick={() => setShowJoinModal(true)}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🔗</span>
                <span className="hidden sm:inline">Rejoindre</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards PREMIUM */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-900 to-red-900 bg-clip-text text-transparent">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-0.5">Tontines</div>
          </div>

          <div className="backdrop-blur-xl bg-green-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-green-200/50">
            <div className="text-xs sm:text-sm text-green-600 mb-1 flex items-center gap-1">
              <span>🔥</span> Actives
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-700">{stats.active}</div>
            <div className="text-xs text-green-600 mt-0.5">En cours</div>
          </div>

          <div className="backdrop-blur-xl bg-blue-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-blue-200/50">
            <div className="text-xs sm:text-sm text-blue-600 mb-1 flex items-center gap-1">
              <span>📋</span> Planning
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.planning}</div>
            <div className="text-xs text-blue-600 mt-0.5">À venir</div>
          </div>

          <div className="backdrop-blur-xl bg-gray-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200/50">
            <div className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center gap-1">
              <span>✅</span> Terminées
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-700">{stats.completed}</div>
            <div className="text-xs text-gray-600 mt-0.5">Complétées</div>
          </div>

          <div className="col-span-2 backdrop-blur-xl bg-gradient-to-br from-orange-500 via-red-600 to-amber-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl shadow-orange-500/30 text-white relative overflow-hidden">
            <div className="hidden sm:block absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="text-xs sm:text-sm text-orange-100 mb-1 flex items-center gap-1">
                <span>💰</span> Total engagé
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">{formatCurrency(stats.totalAmount)}</div>
              <div className="text-xs text-orange-100">{formatCurrencyFull(stats.totalAmount)}</div>
            </div>
          </div>
        </div>

        {/* Filters & Search PREMIUM */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une tontine..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm bg-white/90 transition-all"
                />
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl">🔍</span>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {[
                { value: 'all', label: 'Toutes', icon: '🔥' },
                { value: 'planning', label: 'Planning', icon: '📋' },
                { value: 'active', label: 'Actives', icon: '✅' },
                { value: 'completed', label: 'Terminées', icon: '🏁' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                    filter === f.value
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.icon} <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tontines List PREMIUM */}
        {filteredTontines.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-6xl sm:text-8xl mb-4 animate-bounce">🦁</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-900 to-red-900 bg-clip-text text-transparent mb-3">
              {tontines.length === 0 ? 'Aucune tontine' : 'Aucun résultat'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {tontines.length === 0 
                ? 'Crée ta première tontine ou rejoins-en une avec un code'
                : 'Essaie de modifier tes filtres de recherche'}
            </p>
            {tontines.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => { setEditingTontine(null); setForm(emptyForm()); setShowCreateModal(true); }}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all"
                >
                  Créer une tontine
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all"
                >
                  Rejoindre avec code
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredTontines.map((tontine) => {
              const statusConfig = getStatusConfig(tontine.status);
              const isExpanded = expandedId === tontine.id;
              const progress = tontine.max_participants > 0 
                ? (tontine.current_participants / tontine.max_participants) * 100 
                : 0;
              const history = generateMockHistory(tontine.total_amount || 0);

              return (
                <div 
                  key={tontine.id} 
                  className="group backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 sm:transform sm:hover:scale-105"
                >
                  {/* Header */}
                  <div className={`${statusConfig.bgColor} p-4 sm:p-6 border-b-2 ${statusConfig.borderColor} relative overflow-hidden`}>
                    <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">{tontine.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{tontine.description || 'Pas de description'}</p>
                        </div>
                        
                        <span className={`ml-3 flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusConfig.color} text-white shadow-lg`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </div>

                      {/* Mini Trend Indicator - Plus simple et stable */}
                      <div className="hidden xs:block mb-3">
                        <div className="flex items-end gap-0.5 h-12 sm:h-16 opacity-50 group-hover:opacity-100 transition-opacity">
                          {history.map((item, i) => {
                            const maxValue = Math.max(...history.map(h => h.value));
                            const heightPercent = (item.value / maxValue) * 100;
                            return (
                              <div 
                                key={i} 
                                className="flex-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-t transition-all duration-300 hover:opacity-80"
                                style={{ height: `${heightPercent}%` }}
                              ></div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="backdrop-blur-sm bg-white/90 rounded-xl p-3 shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Montant total</p>
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-900 to-red-900 bg-clip-text text-transparent">
                            {formatCurrency(tontine.total_amount)}
                          </p>
                          <p className="text-xs text-gray-500">{formatCurrencyFull(tontine.total_amount)}</p>
                        </div>
                        
                        <div className="backdrop-blur-sm bg-white/90 rounded-xl p-3 shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Contribution</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {formatCurrency(tontine.monthly_contribution)}
                          </p>
                          <p className="text-xs text-gray-500">/mois</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-6">
                    {/* Participants Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-600">
                          👥 Participants
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {tontine.current_participants}/{tontine.max_participants}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5 shadow-inner overflow-hidden">
                        <div
                          className="h-2 sm:h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 relative overflow-hidden"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {tontine.available_spots > 0 
                          ? `${tontine.available_spots} place(s) disponible(s)`
                          : 'Complet'}
                      </p>
                    </div>

                    {/* Code invitation */}
                    <div className="backdrop-blur-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-orange-200 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Code d'invitation</p>
                          <p className="text-lg sm:text-xl font-mono font-bold text-orange-700">{tontine.invitation_code}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tontine.invitation_code);
                            toast?.showSuccess('Code copié !');
                          }}
                          className="bg-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-orange-700 hover:bg-orange-100 transition-all shadow-sm"
                        >
                          📋 Copier
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tontine.id)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{isExpanded ? '▲' : '▼'}</span>
                      <span>{isExpanded ? 'Masquer' : 'Plus d\'actions'}</span>
                    </button>

                    {/* Expanded Actions */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 animate-fadeIn">
                        <button
                          onClick={() => onNavigate?.('tontine-detail', { id: tontine.id })}
                          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base hover:shadow-lg transition-all transform hover:scale-105"
                        >
                          👁️ Voir détails
                        </button>
                        
                        {tontine.status === 'planning' && (
                          <>
                            <button
                              onClick={() => handleEdit(tontine)}
                              className="w-full bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base hover:shadow-lg transition-all transform hover:scale-105"
                            >
                              ✏️ Modifier
                            </button>
                            
                            {tontine.current_participants >= 2 && (
                              <button
                                onClick={() => handleActivate(tontine.id)}
                                className="w-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base hover:shadow-lg transition-all transform hover:scale-105"
                              >
                                🔥 Activer la tontine
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create/Edit PREMIUM */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto py-8">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-8 animate-scaleIn my-auto max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-900 to-red-900 bg-clip-text text-transparent">
                {editingTontine ? '✏️ Modifier la tontine' : '➕ Nouvelle tontine'}
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setEditingTontine(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la tontine *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Ex: Tontine famille 2026"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Objectif de cette tontine..."
                    rows="3"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant total *</label>
                  <input
                    type="number"
                    value={form.total_amount}
                    onChange={(e) => setForm({...form, total_amount: e.target.value})}
                    placeholder="500000"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contribution mensuelle *</label>
                  <input
                    type="number"
                    value={form.monthly_contribution}
                    onChange={(e) => setForm({...form, monthly_contribution: e.target.value})}
                    placeholder="50000"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre max participants *</label>
                  <input
                    type="number"
                    value={form.max_participants}
                    onChange={(e) => setForm({...form, max_participants: e.target.value})}
                    placeholder="10"
                    min="2"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée (mois) *</label>
                  <input
                    type="number"
                    value={form.duration_months}
                    onChange={(e) => setForm({...form, duration_months: e.target.value})}
                    placeholder="12"
                    min="1"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({...form, start_date: e.target.value})}
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="backdrop-blur-sm bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Astuce :</p>
                    <p>Assure-toi que le montant total divisé par le nombre de participants corresponde à la contribution mensuelle × durée.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingTontine(null); }}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105"
                >
                  {editingTontine ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Join PREMIUM */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scaleIn border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                🔗 Rejoindre une tontine
              </h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinTontine} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code d'invitation</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="w-full px-4 py-3 text-base sm:text-lg font-mono border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center uppercase"
                  required
                />
              </div>

              <div className="backdrop-blur-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📋</span>
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Note :</p>
                    <p>Demande le code d'invitation au créateur de la tontine.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-full sm:flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                >
                  Rejoindre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 475px) {
          .xs\:inline { display: inline; }
          .xs\:hidden { display: none; }
          .xs\:block { display: block; }
        }
      `}</style>
    </div>
  );
};

export default TontinesListPremium;
