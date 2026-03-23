// VERSION V3.1 - SANS DONNÉES FICTIVES
// Corrections:
// 1. Historique: vraie API call au lieu de mockHistory
// 2. Auto-allocation: vraie API call au lieu de toast fictif
// 3. Contribution: enregistrée dans historique via API

import React, { useState, useEffect } from 'react';
import API from '../../services/api';

// ... (CATEGORIES et MILESTONES identiques à V3) ...

const GoalsPagePremiumV3_1 = ({ toast, onNavigate }) => {
  // ... (tous les states identiques) ...
  const [goals, setGoals] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalHistory, setGoalHistory] = useState([]);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeType, setContributeType] = useState('add');
  const [contributeNote, setContributeNote] = useState('');
  const [autoAllocations, setAutoAllocations] = useState({});
  
  // Modals states...
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAutoAllocModal, setShowAutoAllocModal] = useState(false);

  // ✅ FIX 1: VRAI CHARGEMENT HISTORIQUE
  const loadGoalHistory = async (goalId) => {
    try {
      const response = await API.get(`/goals/${goalId}/contributions/`);
      setGoalHistory(response.data.contributions || []);
    } catch (error) {
      console.error('Erreur historique:', error);
      // Si l'endpoint n'existe pas encore, historique vide
      setGoalHistory([]);
      if (error.response?.status !== 404) {
        toast?.showError('Erreur chargement historique');
      }
    }
  };

  // ✅ FIX 2: CONTRIBUTION AVEC HISTORIQUE
  const handleContribute = async (e) => {
    e.preventDefault();
    
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      toast?.showError('Entre un montant valide');
      return;
    }

    try {
      const amount = parseFloat(contributeAmount);

      // ✅ MÉTHODE 1: Via endpoint contributions (RECOMMANDÉ)
      await API.post(`/goals/${selectedGoal.id}/contributions/`, {
        amount: amount,
        type: contributeType,
        source: 'Manuel',
        note: contributeNote
      });

      toast?.showSuccess(
        contributeType === 'add' 
          ? `${amount.toLocaleString()} FCFA ajoutés !` 
          : `${amount.toLocaleString()} FCFA retirés`
      );
      
      setShowContributeModal(false);
      setContributeAmount('');
      setContributeNote('');
      setSelectedGoal(null);
      loadGoals();
      
    } catch (error) {
      console.error('Erreur:', error);
      
      // ❌ FALLBACK: Si endpoint contributions n'existe pas, méthode ancienne
      if (error.response?.status === 404) {
        try {
          const amount = parseFloat(contributeAmount);
          let newAmount;
          
          if (contributeType === 'add') {
            newAmount = selectedGoal.current_amount + amount;
          } else {
            newAmount = Math.max(0, selectedGoal.current_amount - amount);
          }

          await API.put(`/goals/manage/?goal_id=${selectedGoal.id}`, {
            ...selectedGoal,
            current_amount: newAmount
          });

          toast?.showSuccess('Contribution enregistrée (sans historique)');
          setShowContributeModal(false);
          setContributeAmount('');
          setContributeNote('');
          setSelectedGoal(null);
          loadGoals();
        } catch (fallbackError) {
          toast?.showError('Erreur contribution');
        }
      } else {
        toast?.showError('Erreur contribution');
      }
    }
  };

  // ✅ FIX 3: VRAI ENREGISTREMENT AUTO-ALLOCATION
  const handleSaveAutoAllocation = async () => {
    try {
      // Construire la liste des allocations
      const allocations = Object.entries(autoAllocations)
        .filter(([envelopeId, percentage]) => percentage && parseFloat(percentage) > 0)
        .map(([envelopeId, percentage]) => {
          const envelope = envelopes.find(e => e.id === parseInt(envelopeId));
          return {
            envelope_id: parseInt(envelopeId),
            envelope_name: envelope?.display_name || 'Enveloppe',
            percentage: parseFloat(percentage)
          };
        });

      if (allocations.length === 0) {
        toast?.showError('Configure au moins une allocation');
        return;
      }

      // ✅ Appel API réel
      await API.post(`/goals/${selectedGoal.id}/auto-allocation/`, {
        allocations: allocations
      });

      toast?.showSuccess(`Auto-allocation configurée ! ${allocations.length} enveloppe(s)`);
      setShowAutoAllocModal(false);
      setAutoAllocations({});
      
    } catch (error) {
      console.error('Erreur auto-allocation:', error);
      
      // ❌ FALLBACK: Si endpoint n'existe pas
      if (error.response?.status === 404) {
        toast?.showWarning('Fonctionnalité en développement');
        setShowAutoAllocModal(false);
      } else {
        toast?.showError('Erreur configuration auto-allocation');
      }
    }
  };

  // ... (reste du code identique: render, modals, etc.) ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 pb-20">
      {/* ... Interface identique à V3 ... */}
      
      {/* Modal Auto-Allocation CORRIGÉ */}
      {showAutoAllocModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔄 Allocation automatique</h2>
              <button onClick={() => setShowAutoAllocModal(false)} className="text-2xl">✕</button>
            </div>

            <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm font-bold">Objectif: {selectedGoal.title}</p>
              <p className="text-xs text-gray-600 mt-1">Configure l'épargne automatique depuis tes enveloppes</p>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm">Depuis quelle enveloppe?</p>
              
              {envelopes.filter(e => e.envelope_type === 'projets').map(envelope => (
                <div key={envelope.id} className="p-3 border-2 border-gray-200 rounded-xl hover:border-purple-400 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{envelope.display_name}</span>
                    <span className="text-sm text-gray-600">{(envelope.current_balance || 0).toLocaleString()} FCFA</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="% à allouer"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      value={autoAllocations[envelope.id] || ''}
                      onChange={(e) => setAutoAllocations({...autoAllocations, [envelope.id]: e.target.value})}
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              ))}

              {/* ✅ BOUTON CORRIGÉ avec vraie API */}
              <button
                onClick={handleSaveAutoAllocation}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold mt-4 hover:shadow-2xl transition-all"
              >
                Activer auto-allocation
              </button>

              <p className="text-xs text-center text-gray-500 mt-2">
                💡 L'argent sera transféré automatiquement chaque mois
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPagePremiumV3_1;
