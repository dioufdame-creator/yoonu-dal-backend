import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineAdminPanel = ({ tontine, participants, onUpdate, toast }) => {
  const [manualOrder, setManualOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

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

  // ── TIRAGE ALÉATOIRE ──────────────────────────────────────────────
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
      toast?.showSuccess?.(`🎲 Tirage effectué ! ${winner?.name} recevra les fonds ce mois.`) ||
        alert(`Tirage effectué ! ${winner?.name} recevra les fonds ce mois.`);
      onUpdate?.();
    } catch (error) {
      console.error('Erreur tirage:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors du tirage';
      toast?.showError?.(errorMsg) || alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── ORDRE MANUEL ─────────────────────────────────────────────────
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

      toast?.showSuccess?.('✅ Ordre sauvegardé avec succès !') || alert('Ordre sauvegardé !');
      onUpdate?.();
    } catch (error) {
      console.error('Erreur sauvegarde ordre:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast?.showError?.(errorMsg) || alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── DRAG & DROP ───────────────────────────────────────────────────
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

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl p-6 mb-6 shadow-lg">
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

      <div className="bg-white/70 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-700 mb-2">
          <strong>En tant qu'administrateur</strong>, vous pouvez :
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          {isRandom && <li>• Lancer le tirage mensuel (une seule fois par mois)</li>}
          {isManual && <li>• Réorganiser manuellement l'ordre des participants</li>}
          <li>• Valider les contributions des membres</li>
        </ul>
      </div>

      <div className="space-y-4">

        {/* ── MODE ALÉATOIRE ── */}
        {isRandom && (
          <div>
            {/* Info mois en cours */}
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

        {/* ── MODE MANUEL ── */}
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
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                        >▲</button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === manualOrder.length - 1}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                        >▼</button>
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
    </div>
  );
};

export default TontineAdminPanel;
