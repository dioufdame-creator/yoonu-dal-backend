import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineAdminPanel = ({ tontine, participants, onUpdate, toast }) => {
  const [manualOrder, setManualOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Initialiser l'ordre manuel avec l'ordre actuel
    if (participants && participants.length > 0) {
      const sorted = [...participants].sort((a, b) => 
        (a.payout_position || a.position) - (b.payout_position || b.position)
      );
      setManualOrder(sorted);
    }
  }, [participants]);

  const handleRandomOrder = async () => {
    if (!window.confirm('⚠️ Générer un ordre aléatoire ?\n\nL\'ordre actuel sera perdu et tous les participants verront le changement.')) {
      return;
    }
    
    setLoading(true);
    try {
      await API.post(`/tontines/${tontine.id}/manage-order/`, {
        action: 'random'
      });
      
      toast?.showSuccess?.('🎲 Ordre défini par tirage au sort !') || alert('Ordre défini par tirage au sort !');
      onUpdate?.();
    } catch (error) {
      console.error('Erreur tirage au sort:', error);
      toast?.showError?.('Erreur lors du tirage au sort') || alert('Erreur');
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

  // Drag & Drop handlers
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

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

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
      
      <div className="bg-white/70 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-700 mb-2">
          <strong>En tant qu'administrateur</strong>, vous pouvez :
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• Définir l'ordre de paiement par tirage au sort</li>
          <li>• Réorganiser manuellement l'ordre des participants</li>
          <li>• Valider les contributions des membres</li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* Tirage au sort */}
        <div>
          <button
            onClick={handleRandomOrder}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="text-xl">🎲</span>
            <span>{loading ? 'Génération...' : 'Tirage au sort automatique'}</span>
          </button>
          <p className="text-xs text-gray-600 mt-1 text-center">
            Génère un ordre aléatoire pour tous les participants
          </p>
        </div>

        {/* Ordre manuel */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900">Ordre manuel</p>
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
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === manualOrder.length - 1}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                      >
                        ▼
                      </button>
                    </div>
                    
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-gray-900">
                        {participant.user?.username || participant.user?.first_name || 'Participant'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mois {index + 1} - Position de paiement
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-2xl cursor-grab active:cursor-grabbing">
                    ⋮⋮
                  </div>
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
      </div>
    </div>
  );
};

export default TontineAdminPanel;
