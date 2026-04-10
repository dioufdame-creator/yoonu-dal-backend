import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import TontineTimeline from './TontineTimeline';
import TontineActivityFeed from './TontineActivityFeed';
import TontineAdminPanel from './TontineAdminPanel';

const TontineDetail = ({ tontineId, onNavigate, toast, user }) => {
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
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' FCFA';
  };

  const getStatusConfig = (status) => {
    const configs = {
      planning: { label: 'En préparation', emoji: '📋', color: 'blue' },
      active: { label: 'Active', emoji: '🔥', color: 'green' },
      completed: { label: 'Terminée', emoji: '✅', color: 'gray' },
      cancelled: { label: 'Annulée', emoji: '❌', color: 'red' }
    };
    return configs[status] || configs.planning;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tontine introuvable</h2>
          <p className="text-gray-600 mb-6">Cette tontine n'existe pas ou vous n'y avez pas accès</p>
          <button
            onClick={() => onNavigate?.('tontines')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
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
  
  // Vérifier si l'utilisateur est admin
  const currentUserParticipant = tontine.participants?.find(p => p.user?.id === user?.id);
  const isAdmin = currentUserParticipant?.is_admin || tontine.creator === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header blanc épuré */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate?.('tontines')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Retour</span>
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-700' :
              statusConfig.color === 'green' ? 'bg-green-100 text-green-700' :
              statusConfig.color === 'gray' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              {statusConfig.emoji} {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Titre et description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tontine.name}</h1>
              <p className="text-gray-600">{tontine.description || 'Pas de description'}</p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm text-gray-500 mb-1">Code d'invitation</p>
              <p className="text-2xl font-mono font-bold text-green-600">{tontine.invitation_code}</p>
            </div>
          </div>

          {/* Stats en ligne */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">💰 Contribution mensuelle</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(tontine.monthly_contribution)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">👥 Participants</p>
              <p className="text-lg font-bold text-gray-900">{tontine.current_participants}/{tontine.max_participants}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">📅 Durée</p>
              <p className="text-lg font-bold text-gray-900">{tontine.duration_months} mois</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">🎯 Total objectif</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(tontine.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Progression des participants</h2>
            <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {tontine.available_spots > 0 
              ? `${tontine.available_spots} place(s) disponible(s)`
              : 'Tontine complète'}
          </p>
        </div>

        {/* ✅ NOUVEAU : Panneau Admin (si admin uniquement) */}
        {isAdmin && (
          <TontineAdminPanel 
            tontine={tontine}
            participants={tontine.participants || []}
            onUpdate={loadDetail}
            toast={toast}
          />
        )}

        {/* ✅ NOUVEAU : Timeline de paiement */}
        <TontineTimeline 
          tontineId={tontine.id}
          isAdmin={isAdmin}
          onUpdate={loadDetail}
        />

        {/* ✅ NOUVEAU : Fil d'activité */}
        <TontineActivityFeed 
          tontineId={tontine.id}
        />

        {/* Bouton Supprimer (si créateur + planning) */}
        {tontine.creator && tontine.status === 'planning' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Zone de danger</h3>
                <p className="text-sm text-red-700 mb-3">
                  La suppression est irréversible et possible uniquement en phase de planification sans contributions.
                </p>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  🗑️ Supprimer cette tontine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des participants */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              👥 Participants ({tontine.participants?.length || 0})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {!tontine.participants || tontine.participants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-gray-600">Aucun participant pour le moment</p>
              </div>
            ) : (
              tontine.participants.map((participant, index) => (
                <div key={participant.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {participant.user?.first_name} {participant.user?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">@{participant.user?.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {participant.is_admin && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          👑 Admin
                        </span>
                      )}
                      {participant.received_payout && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full ml-2">
                          ✅ Payé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bouton Contribuer */}
        {tontine.status === 'active' && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
            <div className="max-w-6xl mx-auto">
              <button
                onClick={() => setShowContributeModal(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-[1.02]"
              >
                💰 Contribuer à cette tontine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Contribution */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">💰 Nouvelle contribution</h3>
            
            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false);
                    setContributeAmount('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TontineDetail;
