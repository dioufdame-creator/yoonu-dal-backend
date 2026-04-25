import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineAdminPanel = ({ tontine, participants, onUpdate, toast }) => {
  const [manualOrder, setManualOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('order');
  const [pendingContributions, setPendingContributions] = useState([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const isManual = tontine?.payout_mode === 'manual' || !tontine?.payout_mode;
  const isRandom = tontine?.payout_mode === 'random';

  useEffect(() => {
    if (participants && participants.length > 0) {
      const sorted = [...participants].sort((a, b) =>
        (a.payout_position || a.position) - (b.payout_position || b.position)
      );
      setManualOrder(sorted);
    }
  }, [participants]);

  useEffect(() => {
    if (activeTab === 'contributions') {
      loadPendingContributions();
    }
  }, [activeTab]);

  const loadPendingContributions = async () => {
    setLoadingContributions(true);
    try {
      const response = await API.get(`/tontines/${tontine.id}/contributions/pending/`);
      setPendingContributions(response.data.pending_contributions || []);
    } catch (error) {
      console.error('Erreur chargement contributions:', error);
      toast?.showError?.('Erreur chargement des contributions');
    } finally {
      setLoadingContributions(false);
    }
  };

  const handleValidate = async (contributionId) => {
    try {
      await API.post(`/tontine-contributions/${contributionId}/validate/`, {
        action: 'confirm'
      });
      toast?.showSuccess?.('✅ Contribution validée !');
      loadPendingContributions();
      onUpdate?.();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la validation';
      toast?.showError?.(errorMsg);
    }
  };

  const handleReject = async (contributionId) => {
    try {
      await API.post(`/tontine-contributions/${contributionId}/validate/`, {
        action: 'reject',
        reason: rejectReason
      });
      toast?.showSuccess?.('Contribution rejetée');
      setRejectingId(null);
      setRejectReason('');
      loadPendingContributions();
      onUpdate?.();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors du rejet';
      toast?.showError?.(errorMsg);
    }
  };

  const handleRandomDraw = async () => {
    if (!window.confirm('🎲 Lancer le tirage du mois ?\n\nUn participant sera désigné aléatoirement parmi ceux n\'ayant pas encore reçu les fonds.')) {
      return;
    }
    setLoading(true);
    try {
      const response = await API.post(`/tontines/${tontine.id}/manage-order/`, {
        action: 'random'
      });
      const winner = response.data.winner;
      toast?.showSuccess?.(`🎲 Tirage effectué ! ${winner?.name} recevra les fonds ce mois.`);
      onUpdate?.();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors du tirage';
      toast?.showError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualOrderSave = async () => {
    if (!window.confirm('💾 Sauvegarder cet ordre ?\n\nTous les participants verront le nouvel ordre de paiement.')) {
      return;
    }
    const order = manualOrder.map(p => p.id);
    setLoading(true);
    try {
      await API.post(`/tontines/${tontine.id}/manage-order/`, {
        action: 'manual',
        order
      });
      toast?.showSuccess?.('✅ Ordre sauvegardé avec succès !');
      onUpdate?.();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast?.showError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const newOrder = [...manualOrder];
    const draggedParticipant = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(index, 0, draggedParticipant);
    setManualOrder(newOrder);
    setDraggedItem(index);
  };

  const handleDragEnd = () => setDraggedItem(null);

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...manualOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setManualOrder(newOrder);
  };

  const moveDown = (index) => {
    if (index === manualOrder.length - 1) return;
    const newOrder = [...manualOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setManualOrder(newOrder);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' F';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl">👑</span>
        <h3 className="text-2xl font-bold text-gray-900">Panneau administrateur</h3>
      </div>

      {/* Badge mode */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
        isRandom
          ? 'bg-purple-100 text-purple-800 border border-purple-300'
          : 'bg-blue-100 text-blue-800 border border-blue-300'
      }`}>
        <span>{isRandom ? '🎲' : '📝'}</span>
        <span>Mode : {isRandom ? 'Tirage aléatoire mensuel' : 'Ordre manuel'}</span>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-5 bg-white/50 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'order'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {isRandom ? '🎲 Tirage' : '📋 Ordre'}
        </button>
        <button
          onClick={() => setActiveTab('contributions')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'contributions'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>✅ Contributions</span>
          {pendingContributions.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingContributions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── ONGLET ORDRE / TIRAGE ── */}
      {activeTab === 'order' && (
        <div className="space-y-4">
          <div className="bg-white/70 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>En tant qu'administrateur</strong>, vous pouvez :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              {isRandom && <li>• Lancer le tirage mensuel (une seule fois par mois)</li>}
              {isManual && <li>• Réorganiser manuellement l'ordre des participants</li>}
              <li>• Valider les contributions depuis l'onglet "Contributions"</li>
            </ul>
          </div>

          {/* MODE ALÉATOIRE */}
          {isRandom && (
            <div>
              {tontine.current_payout_month > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-sm text-green-800">
                  ✅ Tirage du mois <strong>{tontine.current_payout_month}</strong> déjà effectué.
                  Le prochain tirage sera disponible le mois suivant.
                </div>
              )}
              <button
                onClick={handleRandomDraw}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="text-xl">🎲</span>
                <span>{loading ? 'Tirage en cours...' : 'Lancer le tirage du mois'}</span>
              </button>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Tire au sort parmi les participants n'ayant pas encore reçu les fonds
              </p>
            </div>
          )}

          {/* MODE MANUEL */}
          {isManual && (
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">Ordre de réception</p>
                <p className="text-xs text-gray-500">Glisser-déposer ou utiliser les flèches</p>
              </div>

              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {manualOrder.map((participant, index) => (
                  <div
                    key={participant.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 bg-gray-50 rounded-lg border-2 ${
                      draggedItem === index ? 'border-blue-500 opacity-50' : 'border-gray-200'
                    } cursor-move hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveUp(index)} disabled={index === 0}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
                          <button onClick={() => moveDown(index)} disabled={index === manualOrder.length - 1}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
                        </div>
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {participant.user?.first_name
                              ? `${participant.user.first_name} ${participant.user.last_name || ''}`
                              : participant.user?.username || 'Participant'}
                          </div>
                          <div className="text-xs text-gray-500">Mois {index + 1}</div>
                        </div>
                      </div>
                      <div className="text-2xl cursor-grab active:cursor-grabbing">⋮⋮</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleManualOrderSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder cet ordre'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET CONTRIBUTIONS EN ATTENTE ── */}
      {activeTab === 'contributions' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-700 font-medium">
              {pendingContributions.length > 0
                ? `${pendingContributions.length} contribution(s) en attente`
                : 'Contributions à valider ou rejeter'}
            </p>
            <button
              onClick={loadPendingContributions}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              🔄 Actualiser
            </button>
          </div>

          {loadingContributions ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse h-24 bg-white/60 rounded-xl"></div>
              ))}
            </div>
          ) : pendingContributions.length === 0 ? (
            <div className="text-center py-10 bg-white/60 rounded-xl">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-gray-600 font-medium">Aucune contribution en attente</p>
              <p className="text-xs text-gray-500 mt-1">Toutes les contributions ont été traitées</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingContributions.map((contribution) => (
                <div key={contribution.id} className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm">

                  {/* Header contribution */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                        💰
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{contribution.participant_name}</p>
                        <p className="text-xs text-gray-500">@{contribution.participant_username}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(contribution.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(contribution.date)}</p>
                    </div>
                  </div>

                  {/* Détails paiement */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-3 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Méthode :</span>
                      <span className="font-medium capitalize">{contribution.payment_method || 'Non précisé'}</span>
                    </div>
                    {contribution.transaction_reference && (
                      <div className="flex justify-between">
                        <span>Référence :</span>
                        <span className="font-mono font-medium">{contribution.transaction_reference}</span>
                      </div>
                    )}
                    {contribution.notes && (
                      <div className="flex justify-between">
                        <span>Note :</span>
                        <span className="font-medium">{contribution.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Formulaire rejet */}
                  {rejectingId === contribution.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Raison du rejet (optionnel)..."
                        rows="2"
                        className="w-full px-3 py-2 text-sm border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleReject(contribution.id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                        >
                          ❌ Confirmer le rejet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectingId(contribution.id)}
                        className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
                      >
                        ❌ Rejeter
                      </button>
                      <button
                        onClick={() => handleValidate(contribution.id)}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all"
                      >
                        ✅ Valider
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TontineAdminPanel;
