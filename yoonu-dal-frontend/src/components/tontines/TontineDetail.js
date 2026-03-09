import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const TontineDetailV2 = ({ tontineId, onNavigate, toast }) => {
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tontineId) loadDetail();
  }, [tontineId]);

  const loadDetail = async () => {
    try {
      const response = await API.get(`/tontines/${tontineId}/`);
      setTontine(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast?.showError?.('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold mb-4">Tontine introuvable</h3>
          <button
            onClick={() => onNavigate?.('tontines')}
            className="bg-orange-600 text-white px-6 py-2 rounded-xl"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  const progress = (tontine.current_participants / tontine.max_participants) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <button
          onClick={() => onNavigate?.('tontines')}
          className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <span>←</span><span>Retour</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 mb-6 text-white shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">🦁</span>
                <h1 className="text-3xl font-bold">{tontine.name}</h1>
              </div>
              <p className="text-orange-100">Code: {tontine.invitation_code}</p>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold">{formatCurrency(tontine.monthly_contribution)}</div>
              <div className="text-sm text-orange-100">Par mois</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Participants {tontine.current_participants}/{tontine.max_participants}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex gap-3">
            {tontine.status === 'planning' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tontine.invitation_code);
                  toast?.showSuccess?.('Code copié !');
                }}
                className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-semibold"
              >
                📤 Copier code
              </button>
            )}
            <button className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-semibold">
              ⚙️ Paramètres
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Participants */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">👥 Participants ({tontine.current_participants})</h2>

            <div className="space-y-3">
              {tontine.participants?.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {p.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.name || 'Participant'}</div>
                    <div className="text-xs text-gray-500">
                      {p.is_admin ? '👑 Admin' : 'Membre'}
                    </div>
                  </div>
                  {p.has_paid && <span className="text-green-600">✓</span>}
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👤</div>
                  <p>Aucun participant</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4">📊 Statistiques</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-green-700 mb-1">Total</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(tontine.total_amount || 0)}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-700 mb-1">Prochaine</div>
                  <div className="text-lg font-bold text-blue-700">
                    {tontine.next_payment_date || 'À définir'}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-purple-700 mb-1">Cycles</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {tontine.cycles_remaining || 0}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-sm text-amber-700 mb-1">Prochain</div>
                  <div className="text-lg font-bold text-amber-700">
                    {tontine.next_recipient || 'À définir'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4">📅 Historique</h2>
              
              <div className="space-y-4">
                {tontine.history?.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span>{event.icon || '📌'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm text-gray-600">{event.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{event.date}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>Aucun historique</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {tontine.status === 'active' && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex gap-4">
              <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold">
                💰 Payer
              </button>
              <button className="flex-1 bg-gray-100 px-6 py-3 rounded-xl font-semibold">
                📊 Analyse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TontineDetailV2;