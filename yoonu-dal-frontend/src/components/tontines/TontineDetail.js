import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ==========================================
// TONTINE DETAIL PREMIUM V2
// Glassmorphism + 100% Responsive
// Match TontinesList Premium Quality
// ==========================================

const TontineDetailPremium = ({ tontineId, onNavigate, toast }) => {
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    if (tontineId) {
      loadDetail();
    }
  }, [tontineId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/tontines/${tontineId}/`);
      setTontine(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.('Erreur chargement de la tontine');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    
    if (!contributeAmount) {
      toast?.showError('Entre un montant');
      return;
    }

    try {
      await API.post(`/tontines/${tontineId}/contribute/`, {
        amount: parseFloat(contributeAmount)
      });
      
      toast?.showSuccess('Contribution enregistrée !');
      setShowContributeModal(false);
      setContributeAmount('');
      loadDetail();
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError(error.response?.data?.error || 'Erreur contribution');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la tontine "${tontine?.name}" ?\n\nCette action est irréversible !`)) {
      return;
    }
    
    try {
      await API.delete(`/tontines/${tontineId}/`);
      toast?.showSuccess?.('Tontine supprimée avec succès !');
      onNavigate?.('tontines');
    } catch (error) {
      console.error('Erreur suppression:', error);
      const errorMsg = error.response?.data?.error || error.message;
      toast?.showError?.(`Erreur : ${errorMsg}`);
    }
  };

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
        textColor: 'text-blue-700'
      },
      active: {
        label: 'Active',
        icon: '🔥',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      },
      completed: {
        label: 'Terminée',
        icon: '✅',
        color: 'from-gray-500 to-slate-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700'
      }
    };
    return configs[status] || configs.planning;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-red-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/20 flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-200 p-8 sm:p-12 text-center max-w-md w-full">
          <div className="text-6xl sm:text-8xl mb-4">❌</div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Tontine introuvable</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Cette tontine n'existe pas ou vous n'y avez pas accès</p>
          <button
            onClick={() => onNavigate?.('tontines')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105"
          >
            ← Retour aux tontines
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tontine.status);
  const progress = tontine.max_participants > 0 
    ? (tontine.current_participants / tontine.max_participants) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/20 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
        
        {/* Back Button */}
        <button
          onClick={() => onNavigate?.('tontines')}
          className="mb-4 sm:mb-6 backdrop-blur-xl bg-white/60 px-4 py-2 rounded-xl border border-white/20 text-gray-700 hover:bg-white/80 transition-all flex items-center gap-2 text-sm sm:text-base"
        >
          <span>←</span>
          <span>Retour</span>
        </button>

        {/* Header PREMIUM */}
        <div className="mb-6 sm:mb-8 relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-green-500/30">
          {/* Effets de lumière */}
          <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl sm:text-5xl">🦁</span>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{tontine.name}</h1>
                </div>
                <p className="text-sm sm:text-base text-green-50 mb-2">{tontine.description || 'Pas de description'}</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusConfig.color} text-white shadow-lg`}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <span className="text-xs sm:text-sm text-green-50">Code: {tontine.invitation_code}</span>
                </div>
              </div>

              <div className="backdrop-blur-sm bg-white/20 rounded-2xl p-4 sm:p-6 border border-white/30 text-center">
                <p className="text-xs sm:text-sm text-green-50 mb-1">Contribution mensuelle</p>
                <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(tontine.monthly_contribution)}</p>
                <p className="text-xs text-green-50 mt-1">{formatCurrencyFull(tontine.monthly_contribution)}</p>
              </div>
            </div>

            {/* Progress Participants */}
            <div className="backdrop-blur-sm bg-white/20 rounded-2xl p-4 sm:p-6 border border-white/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm sm:text-base font-medium">👥 Participants</span>
                <span className="text-lg sm:text-xl font-bold">{tontine.current_participants}/{tontine.max_participants}</span>
              </div>
              
              <div className="w-full bg-white/30 rounded-full h-3 sm:h-4 shadow-inner overflow-hidden">
                <div
                  className="h-3 sm:h-4 rounded-full bg-white transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-green-50 mt-2">
                {tontine.available_spots > 0 
                  ? `${tontine.available_spots} place(s) disponible(s)`
                  : 'Tontine complète'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">💰 Montant total</p>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
              {formatCurrency(tontine.total_amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrencyFull(tontine.total_amount)}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">📅 Durée</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tontine.duration_months}</p>
            <p className="text-xs text-gray-500 mt-1">mois</p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">📊 Contributions reçues</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {formatCurrency(tontine.total_contributions_received || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">FCFA collectés</p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">🎯 Progression</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{tontine.progress_percentage?.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">complété</p>
          </div>
        </div>

        {/* Bouton Supprimer - visible seulement pour le créateur en phase planning */}
        {tontine.creator && tontine.status === 'planning' && (
          <div className="mb-6">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-xl font-semibold border-2 border-red-200 hover:from-red-100 hover:to-orange-100 hover:border-red-300 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-2xl">🗑️</span>
              <span>Supprimer cette tontine</span>
            </button>
            <div className="mt-3 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <p className="text-sm text-amber-800">
                <strong>Attention :</strong> La suppression est irréversible et possible uniquement si la tontine est en phase de planification et sans contributions.
              </p>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>👥</span>
              <span>Participants ({tontine.participants?.length || 0})</span>
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            {!tontine.participants || tontine.participants.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">👤</div>
                <p className="text-gray-600 text-sm sm:text-base">Aucun participant pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {tontine.participants.map((participant, index) => (
                  <div 
                    key={participant.id} 
                    className="backdrop-blur-sm bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {participant.user?.first_name} {participant.user?.last_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">@{participant.user?.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {participant.is_admin && (
                          <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full">
                            👑 Admin
                          </span>
                        )}
                        {participant.received_payout && (
                          <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                            ✅ Payé
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Total contributions</p>
                        <p className="text-sm sm:text-base font-bold text-green-600">
                          {formatCurrency(participant.total_contributions || 0)} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Position</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          #{participant.position || 'Non définie'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {tontine.status === 'active' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setShowContributeModal(true)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105"
            >
              💰 Faire une contribution
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(tontine.invitation_code);
                toast?.showSuccess('Code copié !');
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              📋 Copier le code
            </button>
          </div>
        )}
      </div>

      {/* Modal Contribute */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scaleIn border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
                💰 Contribuer
              </h2>
              <button
                onClick={() => setShowContributeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl sm:text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de la contribution
                </label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder={tontine.monthly_contribution}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Contribution mensuelle attendue : {formatCurrencyFull(tontine.monthly_contribution)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="w-full sm:flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105"
                >
                  Valider
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
      `}</style>
    </div>
  );
};

export default TontineDetailPremium;
